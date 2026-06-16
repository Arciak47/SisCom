"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  Users,
  Search,
  Shield,
  Mail,
  Trash2,
  KeyRound,
  Eye,
  User2,
  ArrowLeft,
  Pencil,
  Plus,
  ShieldCheck,
  Phone,
  IdCard,
  CalendarDays,
  Building2,
  BadgeCheck,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  SlidersHorizontal,
  X,
  AlertCircle
} from "lucide-react";

export default function UsuariosSistema() {
  const router = useRouter();

  // Data States
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombreAdmin, setNombreAdmin] = useState("...");

  // Filtering States
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Pagination States
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  // Modals States
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [modalRegistro, setModalRegistro] = useState(false);

  // Form States for creation
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formRegistro, setFormRegistro] = useState({
    correo: "",
    clave: "",
    confirmarClave: "",
    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    fechaNacimiento: "",
    ficha: "",
    rol: "",
    cargo: "",
    departamento: "",
    fechaIngreso: ""
  });
  const [registroLoading, setRegistroLoading] = useState(false);

  // 1. Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.rol?.toLowerCase() === "administrador") {
              setNombreAdmin(`${data.nombres || ""} ${data.apellidos || ""}`);
              cargarUsuarios();
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      router.push("/login");
    });
    return () => unsubscribe();
  }, []);

  // Auto-open modal if URL query parameter ?crear=true is set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("crear") === "true") {
        setModalRegistro(true);
      }
    }
  }, []);

  // 2. Fetch Users
  async function cargarUsuarios() {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = [];
      querySnapshot.forEach((docu) => {
        lista.push({
          id: docu.id,
          ...docu.data()
        });
      });
      setUsuarios(lista);
      setUsuariosFiltrados(lista);
    } catch (error) {
      console.error(error);
      alert("❌ Error al cargar usuarios");
    }
    setLoading(false);
  }

  // 3. Filter Logic
  useEffect(() => {
    let filtrados = [...usuarios];

    // Text search
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (user) =>
          `${user.nombres || ""} ${user.apellidos || ""} ${user.correo || ""} ${user.ficha || ""}`
            .toLowerCase()
            .includes(b)
      );
    }

    // Rol filter
    if (filtroRol !== "todos") {
      filtrados = filtrados.filter((user) => String(user.rol).toLowerCase() === filtroRol.toLowerCase());
    }

    // Status filter
    if (filtroStatus !== "todos") {
      filtrados = filtrados.filter((user) => String(user.status).toLowerCase() === filtroStatus.toLowerCase());
    }

    setUsuariosFiltrados(filtrados);
    setPagina(1); // reset to first page
  }, [busqueda, filtroRol, filtroStatus, usuarios]);

  // 4. Pagination
  const totalPaginas = Math.ceil(usuariosFiltrados.length / itemsPorPagina);
  const indUltimo = pagina * itemsPorPagina;
  const indPrimer = indUltimo - itemsPorPagina;
  const paginaActual = usuariosFiltrados.slice(indPrimer, indUltimo);

  // 5. Change Status Action
  async function cambiarStatus(id, statusActual) {
    try {
      const nuevoStatus = statusActual === "activo" ? "inactivo" : "activo";
      await updateDoc(doc(db, "usuarios", id), {
        status: nuevoStatus
      });

      // Audit log
      const userObj = usuarios.find((u) => u.id === id);
      await addDoc(collection(db, "auditoria"), {
        accion: "Cambio de Estado de Usuario",
        descripcion: `Se cambió el estado del usuario ${userObj?.nombres} ${userObj?.apellidos} (Ficha: ${userObj?.ficha}) de ${statusActual} a ${nuevoStatus}.`,
        usuarioAfectado: id,
        realizadoPor: `Administrador (${nombreAdmin})`,
        fecha: serverTimestamp()
      });

      const actualizados = usuarios.map((u) => (u.id === id ? { ...u, status: nuevoStatus } : u));
      setUsuarios(actualizados);
      alert(`✅ Estado actualizado a ${nuevoStatus.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      alert("❌ Error al actualizar estado");
    }
  }

  // 6. Save Edit Action
  async function guardarEdicion() {
    if (!usuarioAEditar) return;
    const { id, nombres, apellidos, ficha, telefono, cargo, departamento, fechaIngreso } = usuarioAEditar;
    if (!nombres || !apellidos || !ficha) {
      alert("⚠️ Completa los campos obligatorios (Nombres, Apellidos, Ficha)");
      return;
    }
    try {
      await updateDoc(doc(db, "usuarios", id), {
        nombres,
        apellidos,
        ficha,
        telefono: telefono || "",
        cargo: cargo || "",
        departamento: departamento || "",
        fechaIngreso: fechaIngreso || ""
      });

      await addDoc(collection(db, "auditoria"), {
        accion: "Edición de Usuario",
        descripcion: `Se editó la información del usuario ${nombres} ${apellidos} (Ficha: ${ficha}).`,
        usuarioAfectado: id,
        realizadoPor: `Administrador (${nombreAdmin})`,
        fecha: serverTimestamp()
      });

      const actualizados = usuarios.map((u) =>
        u.id === id ? { ...u, nombres, apellidos, ficha, telefono, cargo, departamento, fechaIngreso } : u
      );
      setUsuarios(actualizados);
      setUsuarioAEditar(null);
      alert("✅ Usuario actualizado correctamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error al actualizar usuario: " + error.message);
    }
  }

  // 7. Delete Action
  async function confirmarEliminacion() {
    if (!usuarioAEliminar) return;
    const { id, nombre, ficha } = usuarioAEliminar;
    try {
      const res = await fetch("/api/admin/eliminar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: id,
          nombreCompleto: nombre,
          ficha: ficha,
          eliminadoPor: `Administrador (${nombreAdmin})`
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Error al eliminar usuario");
      }

      const nuevosUsuarios = usuarios.filter((u) => u.id !== id);
      setUsuarios(nuevosUsuarios);
      setUsuarioAEliminar(null);
      alert("✅ Usuario eliminado correctamente");
    } catch (error) {
      console.error(error);
      alert(`❌ ${error.message || "Error al eliminar usuario"}`);
    }
  }

  // 8. Register Form Handlers & Validations
  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormRegistro({
      ...formRegistro,
      [name]: value
    });
  }

  function validarClave(clave) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{6,}$/;
    return regex.test(clave);
  }

  async function handleRegisterUser(e) {
    e.preventDefault();
    const f = formRegistro;

    if (
      !f.correo || !f.clave || !f.confirmarClave || !f.nombres ||
      !f.apellidos || !f.cedula || !f.ficha || !f.rol
    ) {
      alert("⚠️ Complete todos los campos obligatorios (*)");
      return;
    }

    // Client-side validations for duplicates
    const correoDuplicado = usuarios.some((u) => u.correo?.trim().toLowerCase() === f.correo.trim().toLowerCase());
    if (correoDuplicado) {
      alert("❌ El correo ingresado ya existe en el sistema.");
      return;
    }

    const cedulaDuplicada = usuarios.some((u) => String(u.cedula).trim() === String(f.cedula).trim());
    if (cedulaDuplicada) {
      alert("❌ La cédula de identidad ya se encuentra registrada.");
      return;
    }

    const fichaDuplicada = usuarios.some((u) => String(u.ficha).trim() === String(f.ficha).trim());
    if (fichaDuplicada) {
      alert("❌ El número de ficha ya se encuentra registrado.");
      return;
    }

    // Validate Password
    if (!validarClave(f.clave)) {
      alert("❌ La contraseña debe contener letras, números y mínimo 6 caracteres.");
      return;
    }

    if (f.clave !== f.confirmarClave) {
      alert("❌ Las contraseñas no coinciden.");
      return;
    }

    setRegistroLoading(true);
    try {
      const res = await fetch("/api/admin/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          correo: f.correo,
          clave: f.clave,
          nombres: f.nombres,
          apellidos: f.apellidos,
          cedula: f.cedula,
          telefono: f.telefono || "",
          fechaNacimiento: f.fechaNacimiento || "",
          ficha: f.ficha,
          rol: f.rol,
          cargo: f.cargo || "",
          departamento: f.departamento || "",
          fechaIngreso: f.fechaIngreso || "",
          creadoPor: `Administrador (${nombreAdmin})`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      alert("✅ Usuario creado exitosamente");
      setModalRegistro(false);
      // Reset form
      setFormRegistro({
        correo: "",
        clave: "",
        confirmarClave: "",
        nombres: "",
        apellidos: "",
        cedula: "",
        telefono: "",
        fechaNacimiento: "",
        ficha: "",
        rol: "",
        cargo: "",
        departamento: "",
        fechaIngreso: ""
      });
      cargarUsuarios(); // reload list
    } catch (err) {
      alert(`❌ Error al crear usuario: ${err.message}`);
    }
    setRegistroLoading(false);
  }

  return (
    <div className="us-wrap">
      {/* HEADER */}
      <div className="us-topbar">
        <div>
          <button className="us-back-btn" onClick={() => router.push("/administrador")}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="us-title">Usuarios del Sistema</h1>
          <p className="us-sub">Administra las cuentas de usuario, sus roles y accesos oficiales.</p>
        </div>
        <button className="us-btn primary" onClick={() => setModalRegistro(true)}>
          <Plus size={16} /> Registrar Usuario
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="us-stats">
        <div className="us-stat-card">
          <div className="us-stat-icon red">
            <Users size={22} />
          </div>
          <div>
            <span className="us-stat-lbl">Total Registrados</span>
            <strong className="us-stat-val">{usuarios.length}</strong>
          </div>
        </div>
        <div className="us-stat-card">
          <div className="us-stat-icon green">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="us-stat-lbl">Usuarios Activos</span>
            <strong className="us-stat-val">{usuarios.filter((u) => u.status === "activo").length}</strong>
          </div>
        </div>
        <div className="us-stat-card">
          <div className="us-stat-icon blue">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <span className="us-stat-lbl">Resultados Búsqueda</span>
            <strong className="us-stat-val">{usuariosFiltrados.length}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="us-filters-card">
        <div className="us-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por ficha, nombre, correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="us-filter-selectors">
          <div className="us-select-group">
            <label>Filtrar por Rol:</label>
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="todos">Todos los Roles</option>
              <option value="administrador">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="supervisor">Supervisor</option>
              <option value="recursos humanos">Recursos Humanos</option>
            </select>
          </div>

          <div className="us-select-group">
            <label>Filtrar por Status:</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos los Estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="us-table-card">
        {loading ? (
          <div className="us-status-msg">
            <div className="us-spinner" />
            <p>Cargando personal de la base de datos...</p>
          </div>
        ) : paginaActual.length === 0 ? (
          <div className="us-status-msg empty">
            <AlertCircle size={42} />
            <h3>No se encontraron usuarios</h3>
            <p>No existen registros que coincidan con los filtros y búsqueda aplicados.</p>
          </div>
        ) : (
          <>
            <div className="us-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ficha</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>Correo Electrónico</th>
                    <th>Rol de Acceso</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.ficha || "-"}</strong></td>
                      <td>{user.nombres || "-"}</td>
                      <td>{user.apellidos || "-"}</td>
                      <td>
                        <div className="us-cell-info">
                          <Mail size={14} style={{ opacity: 0.6 }} />
                          <span>{user.correo || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="us-cell-info font-bold">
                          <Shield size={14} style={{ opacity: 0.7, color: "#2563eb" }} />
                          <span className="capitalize">{user.rol || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className={`us-status-badge ${user.status === "activo" ? "activo" : "inactivo"}`}
                          onClick={() => cambiarStatus(user.id, user.status)}
                          title="Haz clic para cambiar estado"
                        >
                          <span className="us-status-dot" />
                          {user.status === "activo" ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td>
                        <div className="us-actions">
                          <button className="us-act-btn view" onClick={() => setUsuarioSeleccionado(user)} title="Ver detalles completos">
                            <Eye size={14} /> Detalles
                          </button>
                          <button className="us-act-btn edit" onClick={() => setUsuarioAEditar({ ...user })} title="Editar información">
                            <Pencil size={14} /> Editar
                          </button>
                          <button className="us-act-btn password" onClick={() => router.push(`/administrador/cambiar-password?id=${user.id}`)} title="Restablecer contraseña">
                            <KeyRound size={14} /> Clave
                          </button>
                          <button className="us-act-btn delete" onClick={() => setUsuarioAEliminar({ id: user.id, nombre: `${user.nombres || ""} ${user.apellidos || ""}`, ficha: user.ficha || "-" })} title="Eliminar usuario">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTROL PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="us-pagination">
                <button className="us-pag-btn" onClick={() => setPagina((p) => Math.max(p - 1, 1))} disabled={pagina === 1}>
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="us-pag-info">
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button className="us-pag-btn" onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: REGISTRAR USUARIO (INLINE) */}
      {modalRegistro && (
        <div className="us-modal-overlay">
          <div className="us-modal">
            <div className="us-modal-hdr">
              <div className="us-modal-title-box">
                <UserPlus size={22} className="text-red" />
                <div>
                  <h2>Registrar Nuevo Usuario</h2>
                  <p>Crea una cuenta oficial con rol asignado en SisCOM.</p>
                </div>
              </div>
              <button className="us-close-btn" onClick={() => setModalRegistro(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterUser}>
              <div className="us-modal-body">
                {/* Credenciales de Acceso */}
                <h3 className="us-form-section-title"><ShieldCheck size={16} /> Credenciales de Acceso</h3>
                <div className="us-form-grid">
                  <div className="us-form-group">
                    <label>Correo Institucional *</label>
                    <div className="us-input-icon-box">
                      <Mail size={16} className="us-input-icon" />
                      <input
                        type="email"
                        required
                        name="correo"
                        placeholder="usuario@invecem.com"
                        value={formRegistro.correo}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="us-form-group">
                    <label>Rol de Usuario *</label>
                    <select required name="rol" value={formRegistro.rol} onChange={handleFormChange}>
                      <option value="">Seleccionar Rol</option>
                      <option value="administrador">Administrador</option>
                      <option value="gerente">Gerente</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="recursos humanos">Recursos Humanos</option>
                    </select>
                  </div>

                  <div className="us-form-group">
                    <label>Contraseña *</label>
                    <div className="us-input-icon-box password">
                      <Lock size={16} className="us-input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        name="clave"
                        placeholder="Mín. 6 caracteres (letras/números)"
                        value={formRegistro.clave}
                        onChange={handleFormChange}
                      />
                      <button type="button" className="us-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="us-form-group">
                    <label>Confirmar Contraseña *</label>
                    <div className="us-input-icon-box password">
                      <Lock size={16} className="us-input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        name="confirmarClave"
                        placeholder="Repita la contraseña"
                        value={formRegistro.confirmarClave}
                        onChange={handleFormChange}
                      />
                      <button type="button" className="us-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Información Personal */}
                <h3 className="us-form-section-title"><User2 size={16} /> Información Personal</h3>
                <div className="us-form-grid">
                  <div className="us-form-group">
                    <label>Nombres *</label>
                    <input
                      type="text"
                      required
                      name="nombres"
                      placeholder="Ej. Juan Alberto"
                      value={formRegistro.nombres}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="us-form-group">
                    <label>Apellidos *</label>
                    <input
                      type="text"
                      required
                      name="apellidos"
                      placeholder="Ej. Mendoza Silva"
                      value={formRegistro.apellidos}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="us-form-group">
                    <label>Cédula de Identidad *</label>
                    <div className="us-input-icon-box">
                      <IdCard size={16} className="us-input-icon" />
                      <input
                        type="text"
                        required
                        name="cedula"
                        placeholder="Ej. V-25123456"
                        value={formRegistro.cedula}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="us-form-group">
                    <label>Teléfono</label>
                    <div className="us-input-icon-box">
                      <Phone size={16} className="us-input-icon" />
                      <input
                        type="text"
                        name="telefono"
                        placeholder="Ej. 0412-1234567"
                        value={formRegistro.telefono}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="us-form-group">
                    <label>Fecha de Nacimiento</label>
                    <div className="us-input-icon-box">
                      <CalendarDays size={16} className="us-input-icon" />
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={formRegistro.fechaNacimiento}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Ficha Laboral */}
                <h3 className="us-form-section-title"><Building2 size={16} /> Ficha Laboral</h3>
                <div className="us-form-grid">
                  <div className="us-form-group">
                    <label>N° de Ficha Oficial *</label>
                    <div className="us-input-icon-box">
                      <BadgeCheck size={16} className="us-input-icon" />
                      <input
                        type="text"
                        required
                        name="ficha"
                        placeholder="Ej. 884433"
                        value={formRegistro.ficha}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="us-form-group">
                    <label>Cargo asignado</label>
                    <input
                      type="text"
                      name="cargo"
                      placeholder="Ej. Analista de Planta"
                      value={formRegistro.cargo}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="us-form-group">
                    <label>Departamento</label>
                    <input
                      type="text"
                      name="departamento"
                      placeholder="Ej. Distribución y Logística"
                      value={formRegistro.departamento}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="us-form-group">
                    <label>Fecha de Ingreso</label>
                    <input
                      type="date"
                      name="fechaIngreso"
                      value={formRegistro.fechaIngreso}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>

              <div className="us-modal-ftr">
                <button type="button" className="us-btn secondary" onClick={() => setModalRegistro(false)}>
                  Cancelar
                </button>
                <button type="submit" className="us-btn primary" disabled={registroLoading}>
                  {registroLoading ? "Registrando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER USUARIO */}
      {usuarioSeleccionado && (
        <div className="us-modal-overlay">
          <div className="us-modal">
            <div className="us-modal-hdr">
              <div className="us-modal-title-box">
                <div className="us-avatar-circle">
                  <User2 size={24} />
                </div>
                <div>
                  <h2>Detalles Completos del Usuario</h2>
                  <p>Ficha de personal y estado de accesos en el sistema.</p>
                </div>
              </div>
              <button className="us-close-btn" onClick={() => setUsuarioSeleccionado(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="us-modal-body bg-light">
              <div className="us-details-grid">
                <div className="us-detail-item">
                  <span>Correo Institucional</span>
                  <strong>{usuarioSeleccionado.correo || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Rol asignado</span>
                  <strong className="capitalize">{usuarioSeleccionado.rol || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Estado actual</span>
                  <strong className="capitalize">{usuarioSeleccionado.status || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Nombres</span>
                  <strong>{usuarioSeleccionado.nombres || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Apellidos</span>
                  <strong>{usuarioSeleccionado.apellidos || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Cédula</span>
                  <strong>{usuarioSeleccionado.cedula || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Teléfono</span>
                  <strong>{usuarioSeleccionado.telefono || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Fecha de Nacimiento</span>
                  <strong>{usuarioSeleccionado.fechaNacimiento || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Número de Ficha</span>
                  <strong>{usuarioSeleccionado.ficha || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Cargo</span>
                  <strong>{usuarioSeleccionado.cargo || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Departamento</span>
                  <strong>{usuarioSeleccionado.departamento || "-"}</strong>
                </div>
                <div className="us-detail-item">
                  <span>Fecha de Ingreso</span>
                  <strong>{usuarioSeleccionado.fechaIngreso || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="us-modal-ftr">
              <button className="us-btn secondary" onClick={() => setUsuarioSeleccionado(null)}>
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUARIO */}
      {usuarioAEditar && (
        <div className="us-modal-overlay">
          <div className="us-modal">
            <div className="us-modal-hdr">
              <div className="us-modal-title-box">
                <Pencil size={20} className="text-red" />
                <div>
                  <h2>Editar Datos de Usuario</h2>
                  <p>Actualiza la ficha laboral del usuario seleccionado.</p>
                </div>
              </div>
              <button className="us-close-btn" onClick={() => setUsuarioAEditar(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="us-modal-body">
              <div className="us-form-grid">
                <div className="us-form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    required
                    value={usuarioAEditar.nombres || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, nombres: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={usuarioAEditar.apellidos || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, apellidos: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>N° de Ficha *</label>
                  <input
                    type="text"
                    required
                    value={usuarioAEditar.ficha || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, ficha: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={usuarioAEditar.telefono || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, telefono: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>Cargo</label>
                  <input
                    type="text"
                    value={usuarioAEditar.cargo || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, cargo: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>Departamento</label>
                  <input
                    type="text"
                    value={usuarioAEditar.departamento || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, departamento: e.target.value })}
                  />
                </div>

                <div className="us-form-group">
                  <label>Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={usuarioAEditar.fechaIngreso || ""}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, fechaIngreso: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="us-modal-ftr">
              <button className="us-btn secondary" onClick={() => setUsuarioAEditar(null)}>
                Cancelar
              </button>
              <button className="us-btn primary" onClick={guardarEdicion}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR USUARIO */}
      {usuarioAEliminar && (
        <div className="us-modal-overlay">
          <div className="us-modal danger">
            <div className="us-modal-hdr">
              <h2>¿Eliminar Cuenta de Usuario?</h2>
              <button className="us-close-btn" onClick={() => setUsuarioAEliminar(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="us-modal-body text-center">
              <AlertCircle size={48} className="us-danger-icon" />
              <p>¿Está seguro de que desea eliminar permanentemente al usuario?</p>
              <div className="us-danger-info-box">
                <span><strong>Nombres:</strong> {usuarioAEliminar.nombre}</span>
                <span><strong>Ficha:</strong> {usuarioAEliminar.ficha}</span>
              </div>
              <p className="us-subtext">Esta acción también lo dará de baja en el servicio de autenticación.</p>
            </div>

            <div className="us-modal-ftr">
              <button className="us-btn secondary" onClick={() => setUsuarioAEliminar(null)}>
                Cancelar
              </button>
              <button className="us-btn danger" onClick={confirmarEliminacion}>
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .us-wrap {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 30px;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* TOPBAR */
        .us-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .us-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-bottom: 8px;
        }

        .us-back-btn:hover {
          color: #dc2626;
        }

        .us-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 0;
        }

        .us-sub {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        /* BUTTONS */
        .us-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          font-family: var(--font-outfit), sans-serif;
        }

        .us-btn.primary {
          background: #dc2626;
          color: white;
        }

        .us-btn.primary:hover {
          background: #b91c1c;
        }

        .us-btn.secondary {
          background: white;
          border-color: #e2e8f0;
          color: #475569;
        }

        .us-btn.secondary:hover {
          background: #f8fafc;
        }

        .us-btn.danger {
          background: #ef4444;
          color: white;
        }

        .us-btn.danger:hover {
          background: #dc2626;
        }

        /* STATS */
        .us-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .us-stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }

        .us-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .us-stat-icon.red { background: #fee2e2; color: #dc2626; }
        .us-stat-icon.green { background: #dcfce7; color: #16a34a; }
        .us-stat-icon.blue { background: #dbeafe; color: #2563eb; }

        .us-stat-lbl {
          display: block;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .us-stat-val {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
        }

        /* FILTERS CARD */
        .us-filters-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }

        .us-search-box {
          flex: 1;
          min-width: 260px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 8px;
          color: #64748b;
        }

        .us-search-box input {
          flex: 1;
          border: none;
          outline: none;
          height: 100%;
          font-size: 14px;
          color: #0f172a;
          background: none;
        }

        .us-filter-selectors {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .us-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .us-select-group label {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
        }

        .us-select-group select {
          height: 40px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 600;
          background: white;
          outline: none;
        }

        /* TABLE */
        .us-table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }

        .us-status-msg {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .us-status-msg.empty { color: #94a3b8; }
        .us-status-msg h3 { margin: 0; font-size: 16px; font-weight: 800; color: #475569; }
        .us-status-msg p { margin: 0; font-size: 13px; }

        .us-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f1f5f9;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .us-table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        th { background: #f8fafc; padding: 14px 18px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 11px; }
        td { padding: 12px 18px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        tr:hover td { background: #f8fafc; }

        .us-cell-info { display: flex; align-items: center; gap: 6px; }
        .us-cell-info.font-bold { font-weight: 700; color: #0f172a; }

        .us-status-badge {
          border: none;
          padding: 5px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .us-status-badge.activo { background: #dcfce7; color: #16a34a; }
        .us-status-badge.inactivo { background: #fee2e2; color: #ef4444; }
        .us-status-badge:hover { transform: scale(1.05); }
        .us-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

        .us-actions { display: flex; gap: 4px; justify-content: center; }

        .us-act-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 6px;
          border: none;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }

        .us-act-btn.view { background: #fef08a; color: #854d0e; }
        .us-act-btn.view:hover { background: #fde047; }
        .us-act-btn.edit { background: #dcfce7; color: #16a34a; }
        .us-act-btn.edit:hover { background: #bbf7d0; }
        .us-act-btn.password { background: #dbeafe; color: #2563eb; }
        .us-act-btn.password:hover { background: #bfdbfe; }
        .us-act-btn.delete { background: #fee2e2; color: #ef4444; padding: 6px 8px; }
        .us-act-btn.delete:hover { background: #fecaca; }

        /* PAGINATION */
        .us-pagination {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .us-pag-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .us-pag-btn:hover:not(:disabled) { background: #f1f5f9; }
        .us-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .us-pag-info { font-size: 13px; color: #64748b; }

        /* MODALS */
        .us-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .us-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .us-modal form {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
          min-height: 0;
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .us-modal.danger { max-width: 460px; }

        .us-modal-hdr {
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .us-modal-title-box { display: flex; align-items: center; gap: 12px; }
        .us-modal-title-box h2 { margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; font-family: var(--font-rajdhani), sans-serif; }
        .us-modal-title-box p { margin: 2px 0 0 0; font-size: 12px; color: #64748b; }

        .us-close-btn {
          background: none; border: none; cursor: pointer; color: #94a3b8;
          padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .us-close-btn:hover { background: #f1f5f9; color: #475569; }

        .us-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .us-modal-body.bg-light { background: #f8fafc; }
        .us-form-section-title {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #dc2626;
          text-transform: uppercase; margin: 0 0 16px 0;
          padding-bottom: 6px; border-bottom: 1px solid #fee2e2;
        }
        .us-form-section-title:not(:first-of-type) { margin-top: 24px; }

        .us-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .us-form-group { display: flex; flex-direction: column; gap: 6px; }
        .us-form-group label { font-size: 12px; font-weight: 700; color: #475569; }
        .us-form-group input, .us-form-group select {
          height: 42px; border-radius: 8px; border: 1px solid #cbd5e1;
          padding: 0 12px; font-size: 13px; outline: none; transition: border-color 0.2s;
          background: white;
        }
        .us-form-group input:focus, .us-form-group select:focus { border-color: #dc2626; }

        .us-input-icon-box { position: relative; display: flex; align-items: center; }
        .us-input-icon { position: absolute; left: 12px; color: #64748b; }
        .us-input-icon-box input { padding-left: 38px; width: 100%; }
        .us-input-icon-box.password input { padding-right: 40px; }

        .us-eye-btn {
          position: absolute; right: 10px; background: none; border: none;
          color: #94a3b8; cursor: pointer; display: flex; align-items: center;
        }
        .us-eye-btn:hover { color: #475569; }

        .us-modal-ftr {
          padding: 16px 24px; background: #f8fafc;
          border-top: 1px solid #e2e8f0; display: flex;
          justify-content: flex-end; gap: 12px; flex-shrink: 0;
        }

        /* DETAILS SPECIFICS */
        .us-avatar-circle {
          width: 40px; height: 40px; border-radius: 50%;
          background: #fee2e2; color: #dc2626;
          display: flex; align-items: center; justify-content: center;
        }

        .us-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .us-detail-item {
          background: white; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0;
        }

        .us-detail-item span { display: block; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
        .us-detail-item strong { display: block; font-size: 14px; color: #0f172a; word-break: break-all; }

        /* DANGER BODY */
        .us-danger-icon { color: #ef4444; margin-bottom: 14px; }
        .us-danger-info-box {
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 12px; margin: 16px 0; display: flex; flex-direction: column; gap: 4px; text-align: left;
        }
        .us-danger-info-box span { font-size: 13px; color: #334155; }
        .us-subtext { font-size: 12px; color: #64748b; }
      `}</style>
    </div>
  );
}