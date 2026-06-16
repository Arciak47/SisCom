"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";
import { exportarExcel, exportarPDF } from "../../lib/exportHelpers";
import {
  Users,
  Search,
  Upload,
  Download,
  Trash2,
  Plus,
  Pencil,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Layers,
  ArrowLeft
} from "lucide-react";

const CATEGORY_SCHEMAS = {
  fijos: [
    { key: "Numero de ficha", label: "Ficha", type: "text", required: true },
    { key: "Nombres", label: "Nombres", type: "text", required: true },
    { key: "Apellidos", label: "Apellidos", type: "text", required: true },
    { key: "Edad", label: "Edad", type: "number", required: true },
    { key: "Cedula", label: "Cédula", type: "text", required: true },
    { key: "Cargo", label: "Cargo", type: "text", required: true },
    { key: "Jefe o Supervisor inmediato", label: "Jefe o Supervisor Inmediato", type: "text", required: true }
  ],
  contratistas: [
    { key: "Numero de ficha", label: "Ficha", type: "text", required: true },
    { key: "Nombres", label: "Nombres", type: "text", required: true },
    { key: "Apellidos", label: "Apellidos", type: "text", required: true },
    { key: "Edad", label: "Edad", type: "number", required: true },
    { key: "Cedula", label: "Cédula", type: "text", required: true },
    { key: "Cargo", label: "Cargo", type: "text", required: true },
    { key: "Empresa", label: "Empresa", type: "text", required: true },
    { key: "Jefe o Supervisor inmediato", label: "Jefe o Supervisor Inmediato", type: "text", required: true }
  ],
  inces: [
    { key: "Nombres", label: "Nombres", type: "text", required: true },
    { key: "Apellidos", label: "Apellidos", type: "text", required: true },
    { key: "Numero de ficha", label: "Ficha", type: "text", required: true },
    { key: "Edad", label: "Edad", type: "number", required: true },
    { key: "Cedula", label: "Cédula", type: "text", required: true },
    { key: "Supervisor", label: "Supervisor", type: "text", required: true }
  ],
  pasantes: [
    { key: "Numero de ficha", label: "Ficha", type: "text", required: false },
    { key: "Nombres", label: "Nombres", type: "text", required: true },
    { key: "Apellidos", label: "Apellidos", type: "text", required: true },
    { key: "Cedula", label: "Cédula", type: "text", required: true },
    { key: "Edad", label: "Edad", type: "number", required: true },
    { key: "Supervisor", label: "Supervisor", type: "text", required: true },
    { key: "Area Asignada", label: "Área Asignada", type: "text", required: true }
  ],
  visitantes: [
    { key: "Numero de ficha", label: "Ficha", type: "text", required: false },
    { key: "Nombres", label: "Nombres", type: "text", required: true },
    { key: "Apellidos", label: "Apellidos", type: "text", required: true },
    { key: "Cedula", label: "Cédula", type: "text", required: true },
    { key: "Edad", label: "Edad", type: "number", required: true },
    { key: "Supervisor", label: "Supervisor", type: "text", required: true }
  ]
};

export default function GerenteNominaPage() {
  const router = useRouter();

  // Active Category State
  const [categoria, setCategoria] = useState("fijos"); // fijos | contratistas | inces | pasantes | visitantes

  // Data States
  const [nominasData, setNominasData] = useState({
    fijos: [],
    contratistas: [],
    inces: [],
    pasantes: [],
    visitantes: []
  });
  const [loading, setLoading] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState("...");

  // Search & Pagination States
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 15;

  // Modals States
  const [modalManual, setModalManual] = useState(false);
  const [modalVaciar, setModalVaciar] = useState(false);
  const [confirmarVaciadoTexto, setConfirmarVaciadoTexto] = useState("");

  // Edit / Form States
  const [editIndex, setEditIndex] = useState(null); // null for new, number for edit index
  const [formData, setFormData] = useState({});

  // Excel Upload States
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [modoCarga, setModoCarga] = useState("reemplazar"); // reemplazar | anexar

  // 1. Auth Guard & User Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.rol?.toLowerCase() === "gerente") {
              setNombreUsuario(`${data.nombres || ""} ${data.apellidos || ""}`);
              cargarNominas();
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

  // 2. Load all categories from Firestore
  async function cargarNominas() {
    setLoading(true);
    try {
      const categorias = ["fijos", "contratistas", "inces", "pasantes", "visitantes"];
      const objData = {};

      await Promise.all(
        categorias.map(async (cat) => {
          const ref = doc(db, "nominas", cat);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            objData[cat] = snap.data().datos || [];
          } else {
            objData[cat] = [];
          }
        })
      );

      setNominasData(objData);
    } catch (e) {
      console.error("Error al cargar nóminas:", e);
      alert("❌ Error al cargar los registros de nómina.");
    }
    setLoading(false);
  }

  // Helper to log audit events
  async function registrarAuditoria(accion, descripcion) {
    try {
      await addDoc(doc(db, "auditoria", `${Date.now()}`), {
        accion,
        descripcion,
        realizadoPor: `Gerente (${nombreUsuario})`,
        fecha: serverTimestamp()
      });
    } catch (e) {
      console.error("Error al registrar auditoría:", e);
    }
  }

  // 3. Save Active Category Data to Firebase
  async function guardarCategoriaFirebase(cat, datosActualizados) {
    try {
      const ref = doc(db, "nominas", cat);
      await setDoc(ref, { datos: datosActualizados });
      setNominasData((prev) => ({
        ...prev,
        [cat]: datosActualizados
      }));
    } catch (e) {
      console.error("Error al guardar en Firebase:", e);
      throw e;
    }
  }

  // 4. Excel File Upload Handler
  async function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargandoArchivo(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);

        if (json.length === 0) {
          alert("⚠️ El archivo Excel está vacío.");
          setCargandoArchivo(false);
          return;
        }

        const schema = CATEGORY_SCHEMAS[categoria];

        // Standardize headers dynamically
        const mapeado = json.map((row) => {
          const getVal = (patterns) => {
            const key = Object.keys(row).find((k) =>
              patterns.some((p) => k.toLowerCase().includes(p.toLowerCase()))
            );
            return key ? String(row[key]).trim() : "";
          };

          const newRow = {};
          schema.forEach(col => {
            let patterns = [col.label.toLowerCase(), col.key.toLowerCase()];
            if (col.key === "Numero de ficha") patterns.push("ficha", "nro ficha", "codigo", "código");
            if (col.key === "Cedula") patterns.push("ci", "identificación", "id", "cédula");
            if (col.key === "Jefe o Supervisor inmediato") patterns.push("jefe", "jefe inmediato", "supervisor inmediato");
            if (col.key === "Area Asignada") patterns.push("área", "area", "departamento", "dpto", "area asignada");
            if (col.key === "Empresa") patterns.push("empresa", "compañía", "contratista");
            newRow[col.key] = getVal(patterns);
          });

          // Auto-generate Numero de ficha for pasantes and visitantes in excel upload
          const cleanCedulaNum = (c) => String(c || "").replace(/\D/g, "");
          if (categoria === "pasantes") {
            const cleanC = cleanCedulaNum(newRow["Cedula"]);
            newRow["Numero de ficha"] = cleanC.slice(-4);
          } else if (categoria === "visitantes") {
            newRow["Numero de ficha"] = newRow["Cedula"];
          }

          return newRow;
        });

        // Filter valid entries
        const validos = mapeado.filter((r) => {
          const hasName = r["Nombres"] && r["Apellidos"];
          const hasFichaIfRequired = schema.some(col => col.key === "Numero de ficha" && col.required) ? r["Numero de ficha"] : true;
          const hasCedulaIfRequired = schema.some(col => col.key === "Cedula") ? r["Cedula"] : true;
          return hasName && hasFichaIfRequired && hasCedulaIfRequired;
        });

        if (validos.length === 0) {
          alert("❌ No se encontraron filas válidas con datos requeridos en el Excel.");
          setCargandoArchivo(false);
          return;
        }

        let datosFinales = [];
        if (modoCarga === "reemplazar") {
          datosFinales = validos;
        } else {
          // Merge avoiding duplicated Ficha/Cedula
          const actuales = [...nominasData[categoria]];
          const hasFicha = schema.some(col => col.key === "Numero de ficha");

          validos.forEach((nuevo) => {
            let index = -1;
            if (hasFicha) {
              index = actuales.findIndex(
                (act) => String(act["Numero de ficha"]).trim() === String(nuevo["Numero de ficha"]).trim()
              );
            } else {
              index = actuales.findIndex(
                (act) => String(act["Cedula"]).trim() === String(nuevo["Cedula"]).trim()
              );
            }

            if (index !== -1) {
              actuales[index] = nuevo;
            } else {
              actuales.push(nuevo);
            }
          });
          datosFinales = actuales;
        }

        await guardarCategoriaFirebase(categoria, datosFinales);
        await registrarAuditoria(
          "Carga de Nómina Excel",
          `Cargado archivo Excel en categoría '${categoria.toUpperCase()}' (${validos.length} registros en modo ${modoCarga}).`
        );

        alert(`✅ Nómina de ${categoria.toUpperCase()} cargada con éxito. Total registros: ${datosFinales.length}`);
      } catch (err) {
        console.error(err);
        alert("❌ Error al procesar el archivo Excel. Asegúrese de que tenga columnas correctas.");
      }
      setCargandoArchivo(false);
      e.target.value = "";
    };

    reader.readAsBinaryString(file);
  }

  // 5. CRUD: Save Manual Record (Insert or Update)
  async function handleSaveManual(e) {
    e.preventDefault();
    const schema = CATEGORY_SCHEMAS[categoria];
    const listado = [...nominasData[categoria]];

    // Validate required fields
    for (const col of schema) {
      if (col.required && !formData[col.key]) {
        alert(`⚠️ El campo '${col.label}' es obligatorio.`);
        return;
      }
    }

    const hasFicha = schema.some(col => col.key === "Numero de ficha");
    const hasCedula = schema.some(col => col.key === "Cedula");
    const cleanCedulaNum = (c) => String(c || "").replace(/\D/g, "");
    
    let ficha = formData["Numero de ficha"];
    if (categoria === "pasantes") {
      ficha = cleanCedulaNum(formData["Cedula"]).slice(-4);
    } else if (categoria === "visitantes") {
      ficha = formData["Cedula"];
    }
    const cedula = formData["Cedula"];

    if (editIndex === null) {
      if (hasFicha && ficha) {
        const existeFicha = listado.some((item) => String(item["Numero de ficha"]).trim() === String(ficha).trim());
        if (existeFicha) {
          alert("❌ El número de ficha ya se encuentra registrado en esta categoría.");
          return;
        }
      }
      if (hasCedula && cedula) {
        const existeCedula = listado.some((item) => String(item["Cedula"]).trim() === String(cedula).trim());
        if (existeCedula) {
          alert("❌ El número de cédula ya se encuentra registrado en esta categoría.");
          return;
        }
      }
    } else {
      if (hasFicha && ficha) {
        const existeFicha = listado.some(
          (item, idx) => idx !== editIndex && String(item["Numero de ficha"]).trim() === String(ficha).trim()
        );
        if (existeFicha) {
          alert("❌ El número de ficha ya está registrado en otro trabajador.");
          return;
        }
      }
      if (hasCedula && cedula) {
        const existeCedula = listado.some(
          (item, idx) => idx !== editIndex && String(item["Cedula"]).trim() === String(cedula).trim()
        );
        if (existeCedula) {
          alert("❌ El número de cédula ya está registrado en otro trabajador.");
          return;
        }
      }
    }

    const nuevoRegistro = {};
    schema.forEach(col => {
      nuevoRegistro[col.key] = formData[col.key] || "";
    });
    if (categoria === "pasantes" || categoria === "visitantes") {
      nuevoRegistro["Numero de ficha"] = ficha;
    }

    let labelIdent = "";
    if (nuevoRegistro["Numero de ficha"]) labelIdent = `(Ficha: ${nuevoRegistro["Numero de ficha"]})`;
    else if (nuevoRegistro["Cedula"]) labelIdent = `(Cédula: ${nuevoRegistro["Cedula"]})`;

    let datosActualizados = [];
    if (editIndex === null) {
      datosActualizados = [...listado, nuevoRegistro];
      await registrarAuditoria(
        "Registro Manual de Nómina",
        `Agregado trabajador ${nuevoRegistro.Nombres} ${nuevoRegistro.Apellidos} ${labelIdent} a la nómina de ${categoria.toUpperCase()}.`
      );
    } else {
      datosActualizados = listado.map((item, idx) => (idx === editIndex ? nuevoRegistro : item));
      await registrarAuditoria(
        "Edición de Nómina",
        `Editado trabajador ${nuevoRegistro.Nombres} ${nuevoRegistro.Apellidos} ${labelIdent} de la nómina de ${categoria.toUpperCase()}.`
      );
    }

    try {
      await guardarCategoriaFirebase(categoria, datosActualizados);
      alert(editIndex === null ? "✅ Registro guardado con éxito" : "✅ Registro actualizado con éxito");
      setModalManual(false);
      setFormData({});
      setEditIndex(null);
    } catch (err) {
      alert("❌ Error al guardar el registro.");
    }
  }

  // 6. CRUD: Edit Click
  function iniciarEdicion(item, index) {
    setEditIndex(index);
    const editData = {};
    CATEGORY_SCHEMAS[categoria].forEach(col => {
      editData[col.key] = item[col.key] || "";
    });
    setFormData(editData);
    setModalManual(true);
  }

  // 7. CRUD: Delete Single
  async function eliminarFila(index) {
    const listado = [...nominasData[categoria]];
    const afectado = listado[index];

    if (!confirm(`¿Estás seguro de eliminar a ${afectado["Nombres"]} ${afectado["Apellidos"]} de la nómina?`)) {
      return;
    }

    const datosActualizados = listado.filter((_, idx) => idx !== index);
    
    let labelIdent = "";
    if (afectado["Numero de ficha"]) labelIdent = `(Ficha: ${afectado["Numero de ficha"]})`;
    else if (afectado["Cedula"]) labelIdent = `(Cédula: ${afectado["Cedula"]})`;

    try {
      await guardarCategoriaFirebase(categoria, datosActualizados);
      await registrarAuditoria(
        "Eliminación de Nómina",
        `Eliminado trabajador ${afectado["Nombres"]} ${afectado["Apellidos"]} ${labelIdent} de la nómina de ${categoria.toUpperCase()}.`
      );
      alert("✅ Registro eliminado correctamente.");
    } catch (e) {
      alert("❌ Error al eliminar el registro.");
    }
  }

  // 8. CRUD: Empty Active Category
  async function vaciarCategoria() {
    if (confirmarVaciadoTexto !== "ELIMINAR") {
      alert("⚠️ Debe escribir 'ELIMINAR' para confirmar.");
      return;
    }

    try {
      await guardarCategoriaFirebase(categoria, []);
      await registrarAuditoria(
        "Vaciado de Nómina",
        `Se eliminaron todos los registros de la nómina de ${categoria.toUpperCase()}.`
      );
      alert("✅ Nómina vaciada correctamente.");
      setModalVaciar(false);
      setConfirmarVaciadoTexto("");
    } catch (e) {
      alert("❌ Error al vaciar la nómina.");
    }
  }

  // 9. Exports
  function exportarCategoriaExcel() {
    const listado = dataFiltrada;
    if (listado.length === 0) {
      alert("No hay registros filtrados para exportar.");
      return;
    }

    const columnas = CATEGORY_SCHEMAS[categoria].map(col => ({
      label: col.label,
      key: col.key
    }));

    exportarExcel(columnas, listado, `Nomina_${categoria.toUpperCase()}`);
  }

  // Helper or PDF
  function exportarCategoriaPDF() {
    const listado = dataFiltrada;
    if (listado.length === 0) {
      alert("No hay registros filtrados para exportar.");
      return;
    }

    const columnas = CATEGORY_SCHEMAS[categoria].map(col => ({
      label: col.label,
      key: col.key
    }));

    exportarPDF(`Nómina General de Personal: ${categoria.toUpperCase()}`, columnas, listado, `Nomina_${categoria.toUpperCase()}`);
  }

  // 10. Filter & Search Logic
  const dataCategoria = nominasData[categoria] || [];
  const dataFiltrada = dataCategoria.filter((item) => {
    const b = busqueda.toLowerCase().trim();
    if (!b) return true;
    return CATEGORY_SCHEMAS[categoria].some(col => 
      String(item[col.key] || "").toLowerCase().includes(b)
    );
  });

  // 11. Pagination Logic
  const totalPaginas = Math.ceil(dataFiltrada.length / itemsPorPagina);
  const indUltimo = pagina * itemsPorPagina;
  const indPrimer = indUltimo - itemsPorPagina;
  const paginaActual = dataFiltrada.slice(indPrimer, indUltimo);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, categoria]);

  const totalGeneral = Object.values(nominasData).reduce((acc, arr) => acc + arr.length, 0);

  const stats = [
    { label: "Total General", val: totalGeneral, icon: <Users size={20} />, color: "#3b82f6" },
    { label: "Total en esta categoría", val: dataCategoria.length, icon: <Layers size={20} />, color: "#ef4444" },
    { label: "Filtrados", val: dataFiltrada.length, icon: <TrendingUp size={20} />, color: "#10b981" }
  ];

  return (
    <div className="nm-wrap">
      {/* HEADER */}
      <div className="nm-topbar">
        <div>
          <button className="nm-back-btn" onClick={() => router.push("/gerente")}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="nm-title">Gestión General de Nóminas</h1>
          <p className="nm-sub">Carga de archivos Excel y mantenimiento de los listados oficiales.</p>
        </div>
        <div className="nm-actions">
          <button className="nm-btn primary" onClick={() => { 
            setEditIndex(null); 
            const initialData = {};
            CATEGORY_SCHEMAS[categoria].forEach(col => { initialData[col.key] = ""; });
            setFormData(initialData); 
            setModalManual(true); 
          }}>
            <Plus size={16} /> Agregar Trabajador
          </button>
          <button className="nm-btn danger" onClick={() => setModalVaciar(true)} disabled={dataCategoria.length === 0}>
            <Trash2 size={16} /> Vaciar Categoría
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="nm-stats">
        {stats.map((s, idx) => (
          <div className="nm-stat-card" key={idx}>
            <div className="nm-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <span className="nm-stat-lbl">{s.label}</span>
              <strong className="nm-stat-val">{s.val}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORY TABS */}
      <div className="nm-tabs">
        {[
          { key: "fijos", label: "Trabajadores Fijos" },
          { key: "contratistas", label: "Contratistas" },
          { key: "inces", label: "Estudiantes INCES" },
          { key: "pasantes", label: "Pasantes" },
          { key: "visitantes", label: "Visitantes" }
        ].map((t) => (
          <button
            key={t.key}
            className={`nm-tab ${categoria === t.key ? "active" : ""}`}
            onClick={() => setCategoria(t.key)}
          >
            {t.label}
            <span className="nm-tab-count">{(nominasData[t.key] || []).length}</span>
          </button>
        ))}
      </div>

      {/* FILE UPLOAD ZONE */}
      <div className="nm-upload-zone">
        <div className="nm-upload-info">
          <FileSpreadsheet size={32} className="nm-xls-icon" />
          <div>
            <h3>Cargar Nómina en formato Excel ({categoria.toUpperCase()})</h3>
            <p>
              Sube un archivo .xlsx o .xls. Se requiere que contenga las columnas:{" "}
              <strong>
                {CATEGORY_SCHEMAS[categoria].map((col, i) => (
                  <span key={col.key}>{col.label}{i < CATEGORY_SCHEMAS[categoria].length - 1 ? ", " : ""}</span>
                ))}
              </strong>
            </p>
          </div>
        </div>

        <div className="nm-upload-controls">
          <div className="nm-select-group">
            <label>Método de Carga:</label>
            <select value={modoCarga} onChange={(e) => setModoCarga(e.target.value)}>
              <option value="reemplazar">Reemplazar nómina actual</option>
              <option value="anexar">Anexar y actualizar registros</option>
            </select>
          </div>

          <label className={`nm-upload-btn ${cargandoArchivo ? "disabled" : ""}`}>
            <Upload size={16} />
            {cargandoArchivo ? "Procesando..." : "Seleccionar Archivo"}
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              disabled={cargandoArchivo}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* FILTER & DOWNLOADS */}
      <div className="nm-table-controls">
        <div className="nm-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar en la nómina filtrada..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="nm-clear-btn" onClick={() => setBusqueda("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="nm-export-btns">
          <button className="nm-btn-exp excel" onClick={exportarCategoriaExcel}>
            <Download size={15} /> Excel
          </button>
          <button className="nm-btn-exp pdf" onClick={exportarCategoriaPDF}>
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="nm-table-wrapper">
        {loading ? (
          <div className="nm-status-msg">
            <div className="nm-spinner" />
            <p>Cargando información del servidor...</p>
          </div>
        ) : paginaActual.length === 0 ? (
          <div className="nm-status-msg empty">
            <AlertCircle size={40} />
            <h3>No se encontraron registros</h3>
            <p>La lista está vacía o ningún registro coincide con su búsqueda.</p>
          </div>
        ) : (
          <>
            <div className="nm-table-container">
              <table>
                <thead>
                  <tr>
                    {CATEGORY_SCHEMAS[categoria].map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((item, idx) => {
                    const globalIdx = indPrimer + idx;
                    return (
                      <tr key={globalIdx}>
                        {CATEGORY_SCHEMAS[categoria].map(col => {
                          const val = item[col.key] || "-";
                          if (col.key === "Numero de ficha") {
                            return <td key={col.key}><strong>{val}</strong></td>;
                          }
                          if (col.key === "Cargo") {
                            return (
                              <td key={col.key}>
                                <div className="nm-cell-icon">
                                  <Briefcase size={12} style={{ opacity: 0.6 }} />
                                  <span>{val}</span>
                                </div>
                              </td>
                            );
                          }
                          return <td key={col.key}>{val}</td>;
                        })}
                        <td>
                          <div className="nm-row-actions">
                            <button className="nm-act-btn edit" onClick={() => iniciarEdicion(item, globalIdx)} title="Editar registro">
                              <Pencil size={14} />
                            </button>
                            <button className="nm-act-btn delete" onClick={() => eliminarFila(globalIdx)} title="Eliminar registro">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPaginas > 1 && (
              <div className="nm-pagination">
                <button className="nm-pag-btn" onClick={() => setPagina((p) => Math.max(p - 1, 1))} disabled={pagina === 1}>
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="nm-pag-info">
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button className="nm-pag-btn" onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: MANUAL CREATION / EDITING */}
      {modalManual && (
        <div className="nm-modal-overlay">
          <div className="nm-modal">
            <div className="nm-modal-hdr">
              <h2>{editIndex === null ? "Agregar Trabajador" : "Editar Trabajador"}</h2>
              <button className="nm-close-btn" onClick={() => setModalManual(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveManual}>
              <div className="nm-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {CATEGORY_SCHEMAS[categoria].filter(col => {
                  if ((categoria === "pasantes" || categoria === "visitantes") && col.key === "Numero de ficha") {
                    return false;
                  }
                  return true;
                }).map((col) => (
                  <div className={`nm-form-group ${col.key === "Supervisor" || col.key === "Jefe o Supervisor inmediato" ? "span-2" : ""}`} key={col.key}>
                    <label>{col.label} {col.required ? "*" : ""}</label>
                    <input
                      type={col.type}
                      required={col.required}
                      value={formData[col.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      placeholder={`Ej. Ingrese ${col.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div className="nm-modal-ftr">
                <button type="button" className="nm-btn secondary" onClick={() => setModalManual(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nm-btn primary">
                  {editIndex === null ? "Crear Registro" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOUBLE CONFIRMATION TO CLEAR CATEGORY */}
      {modalVaciar && (
        <div className="nm-modal-overlay">
          <div className="nm-modal danger-modal">
            <div className="nm-modal-hdr text-red">
              <h2>¿Eliminar toda la nómina de {categoria.toUpperCase()}?</h2>
              <button className="nm-close-btn" onClick={() => setModalVaciar(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="nm-danger-body">
              <AlertCircle size={40} className="nm-danger-icon" />
              <p>
                Esta acción eliminará de forma irreversible **TODOS** los ({dataCategoria.length}) registros de la nómina de
                **{categoria.toUpperCase()}**.
              </p>
              <p className="nm-subtext">
                Para confirmar esta acción de alto riesgo, escriba la palabra **ELIMINAR** a continuación:
              </p>

              <input
                type="text"
                className="nm-confirm-input"
                placeholder="Escriba ELIMINAR"
                value={confirmarVaciadoTexto}
                onChange={(e) => setConfirmarVaciadoTexto(e.target.value)}
              />
            </div>

            <div className="nm-modal-ftr text-right">
              <button className="nm-btn secondary" onClick={() => setModalVaciar(false)}>
                Cancelar
              </button>
              <button className="nm-btn danger" onClick={vaciarCategoria} disabled={confirmarVaciadoTexto !== "ELIMINAR"}>
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .nm-wrap {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 30px;
          max-width: 100%;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* TOPBAR */
        .nm-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .nm-back-btn {
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
          transition: color 0.2s;
        }

        .nm-back-btn:hover {
          color: #dc2626;
        }

        .nm-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 0 0 2px 0;
        }

        .nm-sub {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .nm-actions {
          display: flex;
          gap: 10px;
        }

        /* BUTTONS */
        .nm-btn {
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

        .nm-btn.primary {
          background: #dc2626;
          color: white;
        }

        .nm-btn.primary:hover {
          background: #b91c1c;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        .nm-btn.secondary {
          background: white;
          border-color: #e2e8f0;
          color: #475569;
        }

        .nm-btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .nm-btn.danger {
          background: #ef4444;
          color: white;
        }

        .nm-btn.danger:hover:not(:disabled) {
          background: #dc2626;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .nm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* STATS */
        .nm-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .nm-stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        }

        .nm-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nm-stat-lbl {
          display: block;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .nm-stat-val {
          display: block;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
        }

        /* TABS */
        .nm-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 2px;
        }

        .nm-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border: none;
          background: none;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: color 0.2s;
        }

        .nm-tab:hover {
          color: #0f172a;
        }

        .nm-tab.active {
          color: #dc2626;
        }

        .nm-tab.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: #dc2626;
          border-radius: 3px 3px 0 0;
        }

        .nm-tab-count {
          font-size: 11px;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 800;
        }

        .nm-tab.active .nm-tab-count {
          background: #fee2e2;
          color: #dc2626;
        }

        /* UPLOAD ZONE */
        .nm-upload-zone {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px dashed #cbd5e1;
          border-radius: 20px;
          padding: 22px 26px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .nm-upload-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nm-xls-icon {
          color: #10b981;
        }

        .nm-upload-info h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .nm-upload-info p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .nm-upload-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .nm-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nm-select-group label {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
        }

        .nm-select-group select {
          height: 42px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: white;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }

        .nm-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 20px;
          border-radius: 10px;
          background: #10b981;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .nm-upload-btn:hover:not(.disabled) {
          background: #059669;
        }

        .nm-upload-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* TABLE CONTROLS */
        .nm-table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .nm-search-box {
          flex: 1;
          min-width: 280px;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: white;
          display: flex;
          align-items: center;
          padding: 0 16px;
          color: #64748b;
          position: relative;
        }

        .nm-search-box input {
          flex: 1;
          border: none;
          outline: none;
          background: none;
          height: 100%;
          padding-left: 8px;
          font-size: 14px;
          color: #0f172a;
        }

        .nm-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .nm-clear-btn:hover {
          color: #475569;
        }

        .nm-export-btns {
          display: flex;
          gap: 8px;
        }

        .nm-btn-exp {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .nm-btn-exp.excel {
          background: #fee2e2;
          color: #dc2626;
        }

        .nm-btn-exp.excel:hover {
          background: #fecaca;
        }

        .nm-btn-exp.pdf {
          background: #f1f5f9;
          color: #475569;
          border-color: #e2e8f0;
        }

        .nm-btn-exp.pdf:hover {
          background: #e2e8f0;
        }

        /* TABLE WRAPPER */
        .nm-table-wrapper {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.01);
        }

        .nm-status-msg {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .nm-status-msg.empty {
          color: #94a3b8;
        }

        .nm-status-msg.empty h3 {
          margin: 0;
          color: #475569;
          font-size: 16px;
          font-weight: 800;
        }

        .nm-status-msg.empty p {
          margin: 0;
          font-size: 13px;
        }

        .nm-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f1f5f9;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .nm-table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }

        th {
          background: #f8fafc;
          padding: 14px 18px;
          font-weight: 700;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        td {
          padding: 12px 18px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        tr:hover td {
          background: #f8fafc;
        }

        .nm-cell-icon {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nm-row-actions {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .nm-act-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .nm-act-btn.edit {
          background: #f1f5f9;
          color: #475569;
        }

        .nm-act-btn.edit:hover {
          background: #cbd5e1;
          color: #0f172a;
        }

        .nm-act-btn.delete {
          background: #fee2e2;
          color: #ef4444;
        }

        .nm-act-btn.delete:hover {
          background: #fecaca;
          color: #dc2626;
        }

        /* PAGINATION */
        .nm-pagination {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .nm-pag-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nm-pag-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .nm-pag-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nm-pag-info {
          font-size: 13px;
          color: #64748b;
        }

        /* MODALS */
        .nm-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .nm-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .nm-modal-hdr {
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nm-modal-hdr h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
        }

        .nm-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .nm-close-btn:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .nm-form-grid {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .nm-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nm-form-group.span-2 {
          grid-column: span 2;
        }

        .nm-form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }

        .nm-form-group input {
          height: 44px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 0 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .nm-form-group input:focus {
          border-color: #dc2626;
        }

        .nm-modal-ftr {
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        /* DANGER MODAL */
        .nm-modal.danger-modal {
          max-width: 480px;
        }

        .nm-modal-hdr.text-red h2 {
          color: #ef4444;
        }

        .nm-danger-body {
          padding: 24px;
          text-align: center;
        }

        .nm-danger-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .nm-danger-body p {
          font-size: 14px;
          color: #334155;
          line-height: 1.5;
          margin: 0 0 12px 0;
        }

        .nm-danger-body .nm-subtext {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 14px;
        }

        .nm-confirm-input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 2px solid #ef4444;
          text-align: center;
          font-weight: 700;
          font-size: 14px;
          outline: none;
          letter-spacing: 1px;
        }

        .nm-confirm-input:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .text-right {
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
