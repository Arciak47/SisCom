"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  orderBy,
  where
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Search,
  User2,
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  ClipboardCheck,
  Coffee,
  Soup,
  Moon,
  Clock3,
  CalendarDays,
  ShieldCheck,
  Users,
  CheckCircle2,
  FileBadge2,
  IdCard,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle
} from "lucide-react";

export default function RegistrarAsistenciaPage() {
  const [ficha, setFicha] = useState("");
  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nombreSupervisor, setNombreSupervisor] = useState("");
  const [horaActual, setHoraActual] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  // Today's logs state
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [asistenciasFiltradas, setAsistenciasFiltradas] = useState([]);
  const [busquedaRegistro, setBusquedaRegistro] = useState("");
  const [filtroComida, setFiltroComida] = useState("todas");
  const [paginaReg, setPaginaReg] = useState(1);
  const itemsPorPaginaReg = 5;

  // 🔥 FECHA Y HORA REAL-TIME
  useEffect(() => {
    function actualizarHora() {
      const ahora = new Date();
      setHoraActual(
        ahora.toLocaleTimeString("es-VE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      );
      setFechaActual(
        ahora.toLocaleDateString("es-VE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        })
      );
    }
    actualizarHora();
    const intervalo = setInterval(actualizarHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // 🔥 CARGAR SUPERVISOR
  useEffect(() => {
    async function cargarSupervisor() {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "usuarios", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setNombreSupervisor(`${data.nombres || ""} ${data.apellidos || ""}`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    cargarSupervisor();
  }, []);

  // 🔥 HORARIOS ESTRICTOS DE COMIDA
  // Desayuno (6:00am - 9:00am)
  // Almuerzo (11:00am - 2:00pm)
  // Cena (5:00pm - 8:00pm)
  function obtenerComidaDisponible() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const horaDecimal = hora + minutos / 60;

    if (horaDecimal >= 6.0 && horaDecimal <= 9.0) {
      return "desayuno";
    }
    if (horaDecimal >= 11.0 && horaDecimal <= 14.0) {
      return "almuerzo";
    }
    if (horaDecimal >= 17.0 && horaDecimal <= 20.0) {
      return "cena";
    }
    return null;
  }

  const comidaDisponible = obtenerComidaDisponible();
  const [comidaSeleccionada, setComidaSeleccionada] = useState("");

  useEffect(() => {
    if (comidaDisponible) {
      setComidaSeleccionada(comidaDisponible);
    } else {
      setComidaSeleccionada("");
    }
  }, [comidaDisponible]);

  // 🔥 CARGAR ASISTENCIAS DE HOY
  async function cargarAsistenciasHoy() {
    try {
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "asistencias"),
        where("fechaRegistro", ">=", inicioHoy),
        orderBy("fechaRegistro", "desc")
      );
      const snap = await getDocs(q);

      const lista = snap.docs.map(docu => {
        const d = docu.data();
        const fechaObj = d.fechaRegistro ? d.fechaRegistro.toDate() : new Date();
        return {
          id: docu.id,
          ...d,
          fechaObj,
          fechaTexto: fechaObj.toLocaleDateString("es-VE"),
          fechaHoraTexto: fechaObj.toLocaleString("es-VE"),
          fechaYMD: fechaObj.toISOString().split("T")[0]
        };
      });

      setAsistenciasHoy(lista);
      setAsistenciasFiltradas(lista);
    } catch (error) {
      console.error("Error al cargar asistencias de hoy:", error);
    }
  }

  useEffect(() => {
    cargarAsistenciasHoy();
  }, []);

  // Filtros de asistencias locales
  useEffect(() => {
    let res = [...asistenciasHoy];

    if (filtroComida !== "todas") {
      res = res.filter(item => item.tipoComida === filtroComida);
    }

    if (busquedaRegistro.trim()) {
      const b = busquedaRegistro.toLowerCase();
      res = res.filter(item =>
        `${item.nombres || ""} ${item.apellidos || ""} ${item.ficha || ""} ${item.cedula || ""}`
          .toLowerCase()
          .includes(b)
      );
    }

    setAsistenciasFiltradas(res);
    setPaginaReg(1);
  }, [busquedaRegistro, filtroComida, asistenciasHoy]);

  // 🔥 BUSCAR TRABAJADOR EN LAS NOMINAS
  async function buscarTrabajador() {
    if (!comidaDisponible) {
      alert("❌ Registro deshabilitado: Fuera del horario estricto del comedor.");
      return;
    }

    if (!ficha) {
      alert("⚠️ Ingrese el número de ficha o cédula");
      return;
    }

    try {
      setLoading(true);
      const tiposNomina = ["fijos", "contratistas", "inces", "pasantes", "visitantes"];
      let encontrado = null;

      const cleanedSearch = ficha.trim().toLowerCase();
      const hasVPrefix = cleanedSearch.startsWith("v-");
      const searchWithV = hasVPrefix ? cleanedSearch : `v-${cleanedSearch}`;
      const searchWithoutV = hasVPrefix ? cleanedSearch.replace("v-", "") : cleanedSearch;

      for (const tipo of tiposNomina) {
        const ref = doc(db, "nominas", tipo);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const datos = snap.data().datos || [];
          const trabajadorEncontrado = datos.find(item => {
            const rowFicha = String(item["Numero de ficha"] || "").trim().toLowerCase();
            const rowCedula = String(item["Cedula"] || "").trim().toLowerCase();
            return (
              (rowFicha && rowFicha === cleanedSearch) ||
              (rowCedula && (rowCedula === searchWithV || rowCedula === searchWithoutV))
            );
          });

          if (trabajadorEncontrado) {
            let defaultCargo = "-";
            if (tipo === "pasantes") defaultCargo = "Pasante";
            else if (tipo === "visitantes") defaultCargo = "Visitante";
            else if (tipo === "inces") defaultCargo = "Estudiante INCES";

            encontrado = {
              ficha: trabajadorEncontrado["Numero de ficha"] || "-",
              nombres: trabajadorEncontrado["Nombres"] || "-",
              apellidos: trabajadorEncontrado["Apellidos"] || "-",
              cedula: trabajadorEncontrado["Cedula"] || "-",
              cargo: trabajadorEncontrado["Cargo"] || defaultCargo,
              departamento:
                trabajadorEncontrado["Area Asignada"] ||
                trabajadorEncontrado["Departamento"] ||
                trabajadorEncontrado["Area"] ||
                trabajadorEncontrado["Empresa"] ||
                "-",
              supervisor:
                trabajadorEncontrado["Jefe o Supervisor inmediato"] ||
                trabajadorEncontrado["Supervisor"] ||
                "-",
              tipoNomina: tipo
            };
            break;
          }
        }
      }

      if (!encontrado) {
        alert("❌ Trabajador no encontrado en el sistema");
        setTrabajador(null);
      } else {
        setTrabajador(encontrado);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error al buscar trabajador");
    }
    setLoading(false);
  }

  // 🔥 REGISTRAR ASISTENCIA
  async function registrarAsistencia() {
    if (!comidaDisponible) {
      alert("❌ Registro bloqueado: Fuera de los horarios habilitados");
      return;
    }

    if (!trabajador) {
      alert("⚠️ Debe buscar un trabajador primero");
      return;
    }

    try {
      // Verificar duplicados para la comida actual en el día de hoy
      const hoyStr = new Date().toDateString();
      let yaRegistrado = false;

      // Hacemos query optimizada en Firestore
      const q = query(
        collection(db, "asistencias"),
        where("ficha", "==", trabajador.ficha),
        where("tipoComida", "==", comidaSeleccionada)
      );
      const asistenciasSnap = await getDocs(q);
      
      asistenciasSnap.forEach(docu => {
        const data = docu.data();
        if (data.fechaRegistro) {
          const fecha = data.fechaRegistro.toDate().toDateString();
          if (fecha === hoyStr) {
            yaRegistrado = true;
          }
        }
      });

      if (yaRegistrado) {
        alert(`❌ Ya se registró ${comidaSeleccionada} para este trabajador el día de hoy.`);
        return;
      }

      await addDoc(collection(db, "asistencias"), {
        nombres: trabajador.nombres,
        apellidos: trabajador.apellidos,
        ficha: trabajador.ficha,
        cedula: trabajador.cedula,
        cargo: trabajador.cargo,
        departamento: trabajador.departamento,
        supervisor: trabajador.supervisor,
        tipoNomina: trabajador.tipoNomina,
        tipoComida: comidaSeleccionada,
        supervisorRegistro: nombreSupervisor || "Supervisor",
        fechaRegistro: serverTimestamp(),
        estado: "registrado"
      });

      alert(`✅ ${comidaSeleccionada.toUpperCase()} registrado correctamente`);
      setFicha("");
      setTrabajador(null);
      await cargarAsistenciasHoy(); // update list
    } catch (error) {
      console.error(error);
      alert("❌ Error al registrar asistencia");
    }
  }

  // Descargas
  function exportarExcelHoy() {
    if (asistenciasFiltradas.length === 0) {
      alert("No hay registros hoy para exportar");
      return;
    }
    const dataExcel = asistenciasFiltradas.map((item, idx) => ({
      "#": idx + 1,
      "Fecha y Hora": item.fechaHoraTexto,
      "Ficha": item.ficha || "-",
      "Cédula": item.cedula || "-",
      "Trabajador": `${item.nombres || ""} ${item.apellidos || ""}`,
      "Cargo": item.cargo || "-",
      "Departamento": item.departamento || "-",
      "Nómina": item.tipoNomina || "-",
      "Comida": item.tipoComida || "-",
      "Supervisor": item.supervisorRegistro || "-"
    }));
    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias Hoy");
    XLSX.writeFile(wb, `Asistencias_Supervisor_Hoy_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function exportarPDFHoy() {
    if (asistenciasFiltradas.length === 0) {
      alert("No hay registros hoy para exportar");
      return;
    }
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });
    pdf.setFontSize(16);
    pdf.text(`Asistencias del Día de Hoy (Supervisor)`, 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Generado: ${new Date().toLocaleString()}`, 14, 21);

    const headers = [["#", "Fecha y Hora", "Ficha", "Cédula", "Trabajador", "Cargo", "Dpto", "Nómina", "Comida"]];
    const body = asistenciasFiltradas.map((item, idx) => [
      idx + 1,
      item.fechaHoraTexto,
      item.ficha || "-",
      item.cedula || "-",
      `${item.nombres || ""} ${item.apellidos || ""}`,
      item.cargo || "-",
      item.departamento || "-",
      item.tipoNomina || "-",
      item.tipoComida?.toUpperCase() || "-"
    ]);

    autoTable(pdf, {
      startY: 26,
      head: headers,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] }
    });
    pdf.save(`Asistencias_Hoy_${new Date().toISOString().split("T")[0]}.pdf`);
  }

  // Paginación de asistencias de hoy
  const totalPaginasReg = Math.ceil(asistenciasFiltradas.length / itemsPorPaginaReg);
  const indUltimoReg = paginaReg * itemsPorPaginaReg;
  const indPrimerReg = indUltimoReg - itemsPorPaginaReg;
  const asistenciasPaginaActual = asistenciasFiltradas.slice(indPrimerReg, indUltimoReg);

  const cambiarPaginaReg = (nuevaP) => {
    if (nuevaP >= 1 && nuevaP <= totalPaginasReg) {
      setPaginaReg(nuevaP);
    }
  };

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div className="titleBox">
          <h1>Registro de Asistencia</h1>
          <p>Sistema de control de comedor SisCOM</p>
        </div>

        <div className="timeBox">
          <Clock3 size={24} className="text-[#dc2626]" />
          <div>
            <strong>{horaActual}</strong>
            <p>{fechaActual}</p>
          </div>
        </div>
      </div>

      {/* ESTADO DE HORARIOS REGLAMENTADOS */}
      {comidaDisponible ? (
        <div className="foodStatus">
          <ShieldCheck size={22} />
          <span>
            Horario Habilitado: Registro de{" "}
            <strong>{comidaDisponible.toUpperCase()}</strong> habilitado correctamente.
          </span>
        </div>
      ) : (
        <div className="foodStatus error">
          <AlertTriangle size={22} />
          <span>
            Fuera de Horario Permitido: El registro está bloqueado en este momento (Desayuno: 6-9am, Almuerzo: 11-2pm, Cena: 5-8pm).
          </span>
        </div>
      )}

      {/* CARD DE CONTROL */}
      <div className="card">
        {/* BUSQUEDA */}
        <div className="searchSection">
          <div className="inputGroup">
            <label>Ficha o Cédula de Identidad</label>
            <div className="inputBox">
              <BadgeCheck size={18} className="icon" />
              <input
                type="text"
                placeholder="Ingrese el número de ficha o la cédula para buscar"
                value={ficha}
                onChange={(e) => setFicha(e.target.value)}
                disabled={!comidaDisponible}
                onKeyDown={(e) => e.key === "Enter" && buscarTrabajador()}
              />
            </div>
          </div>

          <button
            className="searchBtn"
            onClick={buscarTrabajador}
            disabled={loading || !comidaDisponible}
          >
            <Search size={18} />
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {/* DETALLE TRABAJADOR Y SELECCIÓN DE COMIDA */}
        {trabajador && (
          <div className="trabajadorCard">
            <div className="perfilHeader">
              <div className="perfilCircle">
                <User2 size={42} />
              </div>
              <div>
                <h2>
                  {trabajador.nombres} {trabajador.apellidos}
                </h2>
                <p>Trabajador verificado en la Nómina</p>
              </div>
            </div>

            <div className="grid">
              <div className="infoCard">
                <span>
                  <BadgeCheck size={14} /> Ficha
                </span>
                <strong>{trabajador.ficha}</strong>
              </div>

              <div className="infoCard">
                <span>
                  <IdCard size={14} /> Cédula
                </span>
                <strong>{trabajador.cedula}</strong>
              </div>

              <div className="infoCard">
                <span>
                  <BriefcaseBusiness size={14} /> Cargo
                </span>
                <strong>{trabajador.cargo}</strong>
              </div>

              <div className="infoCard">
                <span>
                  <Building2 size={14} /> Área/Dpto
                </span>
                <strong>{trabajador.departamento}</strong>
              </div>

              <div className="infoCard">
                <span>
                  <Users size={14} /> Supervisor
                </span>
                <strong>{trabajador.supervisor}</strong>
              </div>

              <div className="infoCard">
                <span>
                  <FileBadge2 size={14} /> Nómina
                </span>
                <strong className="capitalize">{trabajador.tipoNomina}</strong>
              </div>
            </div>

            {/* SELECCIÓN DE COMIDA */}
            <div className="foodBox">
              <label>Comida a registrar</label>
              <div className="foodGrid">
                <button
                  type="button"
                  onClick={() => setComidaSeleccionada("desayuno")}
                  className={comidaSeleccionada === "desayuno" ? "foodBtn active" : "foodBtn"}
                  disabled={comidaDisponible !== "desayuno"}
                >
                  <Coffee size={18} /> Desayuno
                </button>

                <button
                  type="button"
                  onClick={() => setComidaSeleccionada("almuerzo")}
                  className={comidaSeleccionada === "almuerzo" ? "foodBtn active" : "foodBtn"}
                  disabled={comidaDisponible !== "almuerzo"}
                >
                  <Soup size={18} /> Almuerzo
                </button>

                <button
                  type="button"
                  onClick={() => setComidaSeleccionada("cena")}
                  className={comidaSeleccionada === "cena" ? "foodBtn active" : "foodBtn"}
                  disabled={comidaDisponible !== "cena"}
                >
                  <Moon size={18} /> Cena
                </button>
              </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <button className="saveBtn" onClick={registrarAsistencia}>
              <ClipboardCheck size={20} /> Registrar Asistencia
            </button>

            <div className="successInfo">
              <CheckCircle2 size={18} />
              Se validarán duplicados para esta fecha y tipo de comida.
            </div>
          </div>
        )}
      </div>

      {/* ================= TABLA DE REGISTROS DE HOY ================= */}
      <div className="tableCard">
        <div className="tableHeader">
          <div>
            <h2>Registros de Asistencia Realizados Hoy</h2>
            <p>Historial rápido de hoy del comedor</p>
          </div>
          <div className="tableActions">
            <div className="searchBox">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, ficha..."
                value={busquedaRegistro}
                onChange={(e) => setBusquedaRegistro(e.target.value)}
              />
            </div>
            <select
              value={filtroComida}
              onChange={(e) => setFiltroComida(e.target.value)}
              className="comidaSelect"
            >
              <option value="todas">Todas las comidas</option>
              <option value="desayuno">Desayuno</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
            <button className="downloadBtn excel" onClick={exportarExcelHoy}>
              <Download size={16} /> Excel
            </button>
            <button className="downloadBtn pdf" onClick={exportarPDFHoy}>
              <Download size={16} /> PDF
            </button>
          </div>
        </div>

        {asistenciasPaginaActual.length === 0 ? (
          <p className="noDataMsg">No hay registros de asistencia realizados hoy con los filtros aplicados.</p>
        ) : (
          <>
            <div className="tableContainer">
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Ficha</th>
                    <th>Cédula</th>
                    <th>Trabajador</th>
                    <th>Área / Dpto</th>
                    <th>Nómina</th>
                    <th>Comida</th>
                  </tr>
                </thead>
                <tbody>
                  {asistenciasPaginaActual.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fechaHoraTexto.split(" ")[1]}</td>
                      <td><strong>{item.ficha || "-"}</strong></td>
                      <td>{item.cedula || "-"}</td>
                      <td>{`${item.nombres || ""} ${item.apellidos || ""}`}</td>
                      <td>{item.departamento || "-"}</td>
                      <td>
                        <span className="nominaBadge">{item.tipoNomina}</span>
                      </td>
                      <td>
                        <span className={`comidaBadge ${item.tipoComida === "desayuno" ? "des" : item.tipoComida === "almuerzo" ? "alm" : "cen"}`}>
                          {item.tipoComida}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTROL PAGINACIÓN */}
            {totalPaginasReg > 1 && (
              <div className="pagination">
                <button className="pageBtn" onClick={() => cambiarPaginaReg(paginaReg - 1)} disabled={paginaReg === 1}>
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="pageIndicator">
                  Página <strong>{paginaReg}</strong> de <strong>{totalPaginasReg}</strong>
                </span>
                <button className="pageBtn" onClick={() => cambiarPaginaReg(paginaReg + 1)} disabled={paginaReg === totalPaginasReg}>
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .titleBox {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 22px 26px;
          border-left: 6px solid #ef4444;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.04);
        }

        .titleBox h1 {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          font-family: var(--font-rajdhani), sans-serif;
        }

        .titleBox p {
          margin-top: 5px;
          color: #475569;
        }

        .timeBox {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 18px 22px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.04);
          color: #0f172a;
        }

        .timeBox strong {
          font-size: 18px;
        }

        .timeBox p {
          font-size: 13px;
          color: #475569;
          text-transform: capitalize;
          margin: 0;
        }

        .foodStatus {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 16px 18px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
        }

        .foodStatus.error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.25);
          color: #ef4444;
        }

        .card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 30px;
          border-radius: 26px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.03);
          color: #334155;
        }

        .searchSection {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .inputGroup {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .inputBox {
          position: relative;
        }

        .icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        input {
          width: 100%;
          height: 58px;
          border-radius: 15px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding-left: 45px;
          font-size: 15px;
          outline: none;
          background: rgba(255, 255, 255, 0.9);
          color: #0f172a;
        }

        input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        input:disabled {
          background: rgba(241, 245, 249, 0.8);
          color: #94a3b8;
          cursor: not-allowed;
        }

        .searchBtn {
          height: 58px;
          border: none;
          padding: 0 25px;
          border-radius: 15px;
          background: #3b82f6;
          color: white;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .searchBtn:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .searchBtn:disabled {
          background: rgba(59, 130, 246, 0.2);
          color: #94a3b8;
          cursor: not-allowed;
        }

        .trabajadorCard {
          margin-top: 30px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 24px;
          padding: 28px;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .perfilHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .perfilCircle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .perfilHeader h2 {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          font-family: 'Rajdhani', sans-serif;
        }

        .perfilHeader p {
          color: #475569;
          margin-top: 5px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .infoCard {
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          transition: 0.2s;
        }

        .infoCard:hover {
          transform: translateY(-2px);
          border-color: rgba(148, 163, 184, 0.3);
        }

        .infoCard span {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #475569;
          margin-bottom: 8px;
        }

        .infoCard strong {
          color: #0f172a;
          font-size: 15px;
        }

        .capitalize {
          text-transform: capitalize;
        }

        .foodBox {
          margin-top: 10px;
        }

        .foodGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .foodBtn {
          height: 60px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          color: #475569;
          transition: all 0.2s;
        }

        .foodBtn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .foodBtn.active {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }

        .saveBtn {
          margin-top: 30px;
          width: 100%;
          height: 60px;
          border: none;
          border-radius: 18px;
          background: #10b981;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
        }

        .saveBtn:hover {
          background: #059669;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .successInfo {
          margin-top: 18px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 14px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        /* HISTORIAL TABLE CARD */
        .tableCard {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 30px;
          border-radius: 26px;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          gap: 20px;
          color: #334155;
        }

        .tableHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .tableHeader h2 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          font-family: var(--font-rajdhani), sans-serif;
        }

        .tableHeader p {
          margin: 3px 0 0 0;
          font-size: 13px;
          color: #475569;
        }

        .tableActions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .tableActions .searchBox {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 8px 12px;
          border-radius: 8px;
          color: #475569;
        }

        .tableActions .searchBox input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #0f172a;
        }

        .comidaSelect {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          background: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          color: #0f172a;
          outline: none;
        }

        .comidaSelect option {
          background: #ffffff;
          color: #0f172a;
        }

        .downloadBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .downloadBtn.excel {
          background: #10b981;
        }

        .downloadBtn.excel:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .downloadBtn.pdf {
          background: #ef4444;
        }

        .downloadBtn.pdf:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .downloadBtn:hover {
          transform: translateY(-1px);
        }

        .noDataMsg {
          text-align: center;
          color: #475569;
          font-size: 14px;
          padding: 20px;
        }

        .tableContainer {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          font-size: 13px;
          text-align: left;
        }

        th {
          background: rgba(241, 245, 249, 0.8);
          font-weight: 700;
          color: #475569;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }

        tr:hover {
          background: rgba(241, 245, 249, 0.4);
        }

        .nominaBadge {
          background: rgba(15, 23, 42, 0.05);
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .comidaBadge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .comidaBadge.des { background: rgba(217, 119, 6, 0.1); color: #f59e0b; }
        .comidaBadge.alm { background: rgba(234, 88, 12, 0.1); color: #ef4444; }
        .comidaBadge.cen { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(148, 163, 184, 0.15);
        }

        .pageBtn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.15);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pageBtn:hover:not(:disabled) {
          background: rgba(241, 245, 249, 0.8);
          color: #0f172a;
        }

        .pageBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pageIndicator {
          font-size: 13px;
          color: #475569;
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .searchSection {
            flex-direction: column;
            align-items: stretch;
          }

          .tableHeader {
            flex-direction: column;
            align-items: stretch;
          }

          .tableActions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}