"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { exportarExcel, exportarPDF } from "../../lib/exportHelpers";
import {
  ClipboardList,
  Search,
  ArrowLeft,
  Calendar,
  User,
  Info,
  Download,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  AlertCircle
} from "lucide-react";

export default function AuditoriaPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [logsFiltrados, setLogsFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombreAdmin, setNombreAdmin] = useState("...");

  // Filter States
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("todos");

  // Pagination States
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 15;

  // Verify authorization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.rol?.toLowerCase() === "administrador") {
              setNombreAdmin(`${data.nombres || ""} ${data.apellidos || ""}`);
              cargarAuditoria();
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

  async function cargarAuditoria() {
    setLoading(true);
    try {
      const q = query(collection(db, "auditoria"), orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.fecha ? data.fecha.toDate() : new Date();
        return {
          id: doc.id,
          ...data,
          dateObj,
          fechaFormateada: dateObj.toLocaleString("es-VE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })
        };
      });
      setLogs(lista);
      setLogsFiltrados(lista);
    } catch (error) {
      console.error("Error al cargar auditoría:", error);
      alert("❌ Error al cargar los registros de auditoría");
    }
    setLoading(false);
  }

  // Filter Handlers
  useEffect(() => {
    let filtrados = [...logs];

    // Text search
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (log) =>
          String(log.accion || "").toLowerCase().includes(b) ||
          String(log.descripcion || "").toLowerCase().includes(b) ||
          String(log.realizadoPor || "").toLowerCase().includes(b)
      );
    }

    // Action type filter
    if (filtroAccion !== "todos") {
      filtrados = filtrados.filter((log) => {
        const acc = String(log.accion || "").toLowerCase();
        if (filtroAccion === "creacion") return acc.includes("creac");
        if (filtroAccion === "edicion") return acc.includes("edic");
        if (filtroAccion === "eliminacion") return acc.includes("elimin");
        if (filtroAccion === "estado") return acc.includes("estado") || acc.includes("status");
        if (filtroAccion === "otros") return !acc.includes("creac") && !acc.includes("edic") && !acc.includes("elimin") && !acc.includes("estado") && !acc.includes("status");
        return true;
      });
    }

    // Date range filter
    if (fechaDesde) {
      const limiteDesde = new Date(fechaDesde + "T00:00:00");
      filtrados = filtrados.filter((log) => log.dateObj >= limiteDesde);
    }

    if (fechaHasta) {
      const limiteHasta = new Date(fechaHasta + "T23:59:59");
      filtrados = filtrados.filter((log) => log.dateObj <= limiteHasta);
    }

    setLogsFiltrados(filtrados);
    setPagina(1); // reset to first page
  }, [busqueda, filtroAccion, fechaDesde, fechaHasta, logs]);

  // Pagination Logic
  const totalPaginas = Math.ceil(logsFiltrados.length / itemsPorPagina);
  const indUltimo = pagina * itemsPorPagina;
  const indPrimer = indUltimo - itemsPorPagina;
  const paginaActual = logsFiltrados.slice(indPrimer, indUltimo);

  // Exports Handlers
  function exportarAuditoriaExcel() {
    if (logsFiltrados.length === 0) {
      alert("No hay registros filtrados para exportar.");
      return;
    }

    const columnas = [
      { label: "Fecha y Hora", key: "fechaFormateada" },
      { label: "Acción", key: "accion" },
      { label: "Descripción", key: "descripcion" },
      { label: "Realizado Por", key: "realizadoPor" }
    ];

    exportarExcel(columnas, logsFiltrados, "Auditoria_Sistema");
  }

  function exportarAuditoriaPDF() {
    if (logsFiltrados.length === 0) {
      alert("No hay registros filtrados para exportar.");
      return;
    }

    const columnas = [
      { label: "Fecha y Hora", key: "fechaFormateada" },
      { label: "Acción", key: "accion" },
      { label: "Descripción", key: "descripcion" },
      { label: "Realizado Por", key: "realizadoPor" }
    ];

    exportarPDF("Historial de Auditoría del Sistema", columnas, logsFiltrados, "Auditoria_Sistema");
  }

  return (
    <div className="au-wrap">
      {/* HEADER */}
      <div className="au-topbar">
        <div>
          <button className="au-back-btn" onClick={() => router.push("/administrador")}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="au-title">Auditoría del Sistema</h1>
          <p className="au-sub">Monitorea los accesos, registros y modificaciones de datos del personal.</p>
        </div>
        <div className="au-actions">
          <button className="au-btn-exp pdf" onClick={exportarAuditoriaPDF}>
            <Download size={15} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="au-filters-card">
        <div className="au-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por palabra clave, acción o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="au-clear-btn" onClick={() => setBusqueda("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="au-filter-selectors">
          <div className="au-select-group">
            <label>Tipo de Acción:</label>
            <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)}>
              <option value="todos">Todas las Acciones</option>
              <option value="creacion">Creaciones</option>
              <option value="edicion">Ediciones</option>
              <option value="eliminacion">Eliminaciones</option>
              <option value="estado">Cambios de Estado</option>
              <option value="otros">Otras acciones</option>
            </select>
          </div>

          <div className="au-select-group">
            <label>Desde:</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>

          <div className="au-select-group">
            <label>Hasta:</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>

          {(fechaDesde || fechaHasta || filtroAccion !== "todos") && (
            <button
              className="au-reset-btn"
              onClick={() => {
                setFechaDesde("");
                setFechaHasta("");
                setFiltroAccion("todos");
              }}
              title="Limpiar filtros"
            >
              Resetear
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="au-table-card">
        {loading ? (
          <div className="au-status-msg">
            <div className="au-spinner" />
            <p>Cargando registros históricos de auditoría...</p>
          </div>
        ) : paginaActual.length === 0 ? (
          <div className="au-status-msg empty">
            <AlertCircle size={42} />
            <h3>No se encontraron movimientos</h3>
            <p>No existen registros que coincidan con la búsqueda o el rango de fechas seleccionado.</p>
          </div>
        ) : (
          <>
            <div className="au-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Acción del Sistema</th>
                    <th>Detalles / Descripción</th>
                    <th>Realizado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((log) => {
                    const acc = String(log.accion || "").toLowerCase();
                    let badgeClass = "badge-blue";
                    if (acc.includes("elimin")) badgeClass = "badge-red";
                    else if (acc.includes("creac")) badgeClass = "badge-green";
                    else if (acc.includes("estado") || acc.includes("status")) badgeClass = "badge-yellow";

                    return (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div className="au-cell-info">
                            <Calendar size={14} style={{ opacity: 0.6 }} />
                            <strong>{log.fechaFormateada}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`au-badge ${badgeClass}`}>
                            {log.accion || "Acción"}
                          </span>
                        </td>
                        <td>
                          <div className="au-cell-info text-left">
                            <Info size={14} style={{ opacity: 0.6, flexShrink: 0, marginTop: "2px" }} />
                            <span>{log.descripcion || "-"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="au-cell-info font-bold">
                            <User size={14} style={{ opacity: 0.7 }} />
                            <span>{log.realizadoPor || "-"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CONTROL PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="au-pagination">
                <button className="au-pag-btn" onClick={() => setPagina((p) => Math.max(p - 1, 1))} disabled={pagina === 1}>
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="au-pag-info">
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button className="au-pag-btn" onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))} disabled={pagina === totalPaginas}>
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .au-wrap {
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
        .au-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }

        .au-back-btn {
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

        .au-back-btn:hover {
          color: #dc2626;
        }

        .au-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 0;
        }

        .au-sub {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .au-actions {
          display: flex;
          gap: 8px;
        }

        .au-btn-exp {
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
          font-family: var(--font-outfit), sans-serif;
        }

        .au-btn-exp.excel {
          background: #fee2e2;
          color: #dc2626;
        }

        .au-btn-exp.excel:hover {
          background: #fecaca;
        }

        .au-btn-exp.pdf {
          background: #f1f5f9;
          color: #475569;
          border-color: #e2e8f0;
        }

        .au-btn-exp.pdf:hover {
          background: #e2e8f0;
        }

        /* FILTERS */
        .au-filters-card {
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

        .au-search-box {
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
          position: relative;
        }

        .au-search-box input {
          flex: 1;
          border: none;
          outline: none;
          height: 100%;
          font-size: 14px;
          color: #0f172a;
          background: none;
        }

        .au-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .au-filter-selectors {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }

        .au-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .au-select-group label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .au-select-group select,
        .au-select-group input {
          height: 40px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 600;
          background: white;
          outline: none;
          color: #334155;
        }

        .au-reset-btn {
          height: 40px;
          padding: 0 14px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .au-reset-btn:hover { background: #e2e8f0; }

        /* TABLE */
        .au-table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }

        .au-status-msg {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .au-status-msg.empty { color: #94a3b8; }
        .au-status-msg h3 { margin: 0; font-size: 16px; font-weight: 800; color: #475569; }
        .au-status-msg p { margin: 0; font-size: 13px; }

        .au-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f1f5f9;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .au-table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        th { background: #f8fafc; padding: 14px 18px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 11px; }
        td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        tr:hover td { background: #f8fafc; }

        .au-cell-info { display: flex; align-items: center; gap: 8px; color: #334155; }
        .au-cell-info.font-bold { font-weight: 700; color: #0f172a; }
        .au-cell-info.text-left { text-align: left; align-items: flex-start; }

        .au-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-blue { background: #dbeafe; color: #2563eb; }
        .badge-green { background: #dcfce7; color: #16a34a; }
        .badge-red { background: #fee2e2; color: #ef4444; }
        .badge-yellow { background: #fef9c3; color: #ca8a04; }

        /* PAGINATION */
        .au-pagination {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .au-pag-btn {
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

        .au-pag-btn:hover:not(:disabled) { background: #f1f5f9; }
        .au-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .au-pag-info { font-size: 13px; color: #64748b; }
      `}</style>
    </div>
  );
}
