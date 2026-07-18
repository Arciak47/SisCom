"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { exportarExcel, exportarPDF } from "../../lib/exportHelpers";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  ArcElement
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { 
  Download, 
  Search, 
  ArrowLeft, 
  Calendar, 
  Coffee, 
  Soup, 
  Moon, 
  Users, 
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

export default function AdminEstadisticas() {
  const router = useRouter();

  // Set default filter range: desde = first day of current month, hasta = today
  const primerDiaDefault = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const hoyDefault = new Date().toISOString().split("T")[0];

  const [desdeFecha, setDesdeFecha] = useState(primerDiaDefault);
  const [hastaFecha, setHastaFecha] = useState(hoyDefault);

  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [nominaFiltro, setNominaFiltro] = useState("todos");

  // Pagination state
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Stats
  const [stats, setStats] = useState({
    desayunos: 0,
    almuerzos: 0,
    cenas: 0,
    fijos: 0,
    contratistas: 0,
    inces: 0,
    pasantes: 0,
    visitantes: 0
  });

  // Query Firestore with the selected date range
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      try {
        let q = collection(db, "asistencias");
        const conditions = [];

        if (desdeFecha) {
          conditions.push(where("fechaRegistro", ">=", new Date(desdeFecha + "T00:00:00")));
        }
        if (hastaFecha) {
          conditions.push(where("fechaRegistro", "<=", new Date(hastaFecha + "T23:59:59")));
        }

        const qFinal = query(q, ...conditions, orderBy("fechaRegistro", "desc"));
        const snap = await getDocs(qFinal);
        
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

        setRegistros(lista);
      } catch (error) {
        console.error("Error al cargar asistencias para estadísticas:", error);
      }
      setLoading(false);
    }
    cargarDatos();
  }, [desdeFecha, hastaFecha]);

  // Filter logic
  useEffect(() => {
    let filtrados = [...registros];

    // Filter by Date Range
    if (desdeFecha) {
      filtrados = filtrados.filter(item => item.fechaYMD >= desdeFecha);
    }
    if (hastaFecha) {
      filtrados = filtrados.filter(item => item.fechaYMD <= hastaFecha);
    }

    // Filter by Nomina
    if (nominaFiltro !== "todos") {
      filtrados = filtrados.filter(item => item.tipoNomina?.toLowerCase() === nominaFiltro);
    }

    // Search bar
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(item =>
        `${item.nombres || ""} ${item.apellidos || ""} ${item.ficha || ""} ${item.cedula || ""}`
          .toLowerCase()
          .includes(b)
      );
    }

    setRegistrosFiltrados(filtrados);
    setPaginaActual(1); // Reset to page 1 on filter
    calcularEstadisticas(filtrados);
  }, [desdeFecha, hastaFecha, nominaFiltro, busqueda, registros]);

  // Stats Calculator
  function calcularEstadisticas(items) {
    let des = 0, alm = 0, cen = 0;
    let fij = 0, con = 0, inc = 0, pas = 0, vis = 0;

    items.forEach(item => {
      if (item.tipoComida === "desayuno") des++;
      else if (item.tipoComida === "almuerzo") alm++;
      else if (item.tipoComida === "cena") cen++;

      const nom = item.tipoNomina?.toLowerCase();
      if (nom === "fijos" || nom === "fijo") fij++;
      else if (nom === "contratistas" || nom === "contratista") con++;
      else if (nom === "inces") inc++;
      else if (nom === "pasantes" || nom === "pasante") pas++;
      else if (nom === "visitantes" || nom === "visitante") vis++;
    });

    setStats({
      desayunos: des,
      almuerzos: alm,
      cenas: cen,
      fijos: fij,
      contratistas: con,
      inces: inc,
      pasantes: pas,
      visitantes: vis
    });
  }

  // Exports
  function handleExportarExcel() {
    if (registrosFiltrados.length === 0) {
      alert("No hay registros para exportar");
      return;
    }

    const columnas = [
      { key: "index", label: "#" },
      { key: "fechaHoraTexto", label: "Fecha y Hora" },
      { key: "ficha", label: "Ficha" },
      { key: "cedula", label: "Cédula" },
      { key: "trabajador", label: "Trabajador" },
      { key: "cargo", label: "Cargo" },
      { key: "departamento", label: "Departamento" },
      { key: "tipoNomina", label: "Nómina" },
      { key: "tipoComida", label: "Comida" },
      { key: "supervisorRegistro", label: "Supervisor Registro" }
    ];

    const filas = registrosFiltrados.map((item, index) => ({
      index: index + 1,
      fechaHoraTexto: item.fechaHoraTexto,
      ficha: item.ficha || "-",
      cedula: item.cedula || "-",
      trabajador: `${item.nombres || ""} ${item.apellidos || ""}`,
      cargo: item.cargo || "-",
      departamento: item.departamento || "-",
      tipoNomina: item.tipoNomina || "-",
      tipoComida: item.tipoComida || "-",
      supervisorRegistro: item.supervisorRegistro || "-"
    }));

    exportarExcel(columnas, filas, `Estadisticas_Comedor_Admin_${desdeFecha}_a_${hastaFecha}`);
    alert("✅ Excel exportado correctamente");
  }

  function handleExportarPDF() {
    if (registrosFiltrados.length === 0) {
      alert("No hay registros para exportar");
      return;
    }

    const columnas = [
      { key: "index", label: "#" },
      { key: "fechaHoraTexto", label: "Fecha y Hora" },
      { key: "ficha", label: "Ficha" },
      { key: "cedula", label: "Cédula" },
      { key: "trabajador", label: "Trabajador" },
      { key: "cargo", label: "Cargo" },
      { key: "departamento", label: "Dpto" },
      { key: "tipoNomina", label: "Nómina" },
      { key: "tipoComida", label: "Comida" }
    ];

    const filas = registrosFiltrados.map((item, index) => ({
      index: index + 1,
      fechaHoraTexto: item.fechaHoraTexto,
      ficha: item.ficha || "-",
      cedula: item.cedula || "-",
      trabajador: `${item.nombres || ""} ${item.apellidos || ""}`,
      cargo: item.cargo || "-",
      departamento: item.departamento || "-",
      tipoNomina: item.tipoNomina || "-",
      tipoComida: item.tipoComida?.toUpperCase() || "-"
    }));

    exportarPDF(`Reporte de Uso del Comedor - Rango: ${desdeFecha || "Inicio"} al ${hastaFecha || "Fin"}`, columnas, filas, `Estadisticas_Comedor_Admin_${desdeFecha}_a_${hastaFecha}`);
    alert("✅ PDF exportado correctamente");
  }

  // Pagination Logic
  const totalPaginas = Math.ceil(registrosFiltrados.length / itemsPorPagina);
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const registrosPaginaActual = registrosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Chart Data
  const comidaChartData = {
    labels: ["Desayuno", "Almuerzo", "Cena"],
    datasets: [
      {
        label: "Cantidad",
        data: [stats.desayunos, stats.almuerzos, stats.cenas],
        backgroundColor: ["#f59e0b", "#ea580c", "#3b82f6"],
        borderWidth: 1
      }
    ]
  };

  const nominaChartData = {
    labels: ["Fijos", "Contratistas", "INCES", "Pasantes", "Visitantes"],
    datasets: [
      {
        label: "Cantidad",
        data: [
          stats.fijos,
          stats.contratistas,
          stats.inces,
          stats.pasantes,
          stats.visitantes
        ],
        backgroundColor: ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="container">
      {/* HEADER */}
      <div className="topBar">
        <button className="volverBtn" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>Estadísticas Generales</h1>
      </div>

      {/* FILTROS CARD */}
      <div className="filterCard">
        <div className="filtersGrid">
          <div className="filterGroup">
            <label>Desde Fecha</label>
            <div className="inputWithIcon">
              <Calendar size={16} />
              <input
                type="date"
                value={desdeFecha}
                onChange={(e) => setDesdeFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="filterGroup">
            <label>Hasta Fecha</label>
            <div className="inputWithIcon">
              <Calendar size={16} />
              <input
                type="date"
                value={hastaFecha}
                onChange={(e) => setHastaFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="filterGroup">
            <label>Nómina</label>
            <div className="inputWithIcon">
              <Filter size={16} />
              <select
                value={nominaFiltro}
                onChange={(e) => setNominaFiltro(e.target.value)}
              >
                <option value="todos">Todas las categorías</option>
                <option value="fijos">Fijos</option>
                <option value="contratistas">Contratistas</option>
                <option value="inces">INCES</option>
                <option value="pasantes">Pasantes</option>
                <option value="visitantes">Visitantes</option>
              </select>
            </div>
          </div>

          <div className="filterGroup search">
            <label>Buscar Trabajador</label>
            <div className="inputWithIcon">
              <Search size={16} />
              <input
                type="text"
                placeholder="Nombre, ficha, cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* EXPORTS */}
        <div className="downloadsRow">
          <button className="downloadBtn pdf" onClick={handleExportarPDF}>
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Cargando datos estadísticos...</p>
      ) : registrosFiltrados.length === 0 ? (
        <div className="emptyState">
          <Users size={40} style={{ color: "#94a3b8" }} />
          <h3>No hay asistencias registradas</h3>
          <p>No se encontraron datos para los filtros e intervalos de fecha seleccionados.</p>
        </div>
      ) : (
        <>
          {/* CARDS RESUMEN */}
          <div className="statsRow">
            <div className="statCard colorDesayuno">
              <Coffee size={24} />
              <div>
                <h3>{stats.desayunos}</h3>
                <p>Desayunos</p>
              </div>
            </div>
            <div className="statCard colorAlmuerzo">
              <Soup size={24} />
              <div>
                <h3>{stats.almuerzos}</h3>
                <p>Almuerzos</p>
              </div>
            </div>
            <div className="statCard colorCena">
              <Moon size={24} />
              <div>
                <h3>{stats.cenas}</h3>
                <p>Cenas</p>
              </div>
            </div>
            <div className="statCard colorTotal">
              <Users size={24} />
              <div>
                <h3>{registrosFiltrados.length}</h3>
                <p>Total Asistencias</p>
              </div>
            </div>
          </div>

          {/* GRÁFICOS */}
          <div className="chartsGrid">
            <div className="chartBox">
              <h3>Distribución de Comidas</h3>
              <div className="chartWrapper">
                <Pie data={comidaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="chartBox">
              <h3>Participación por Categoría</h3>
              <div className="chartWrapper">
                <Bar 
                  data={nominaChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </div>
          </div>

          {/* TABLA HISTÓRICA CON PAGINACIÓN */}
          <div className="tableCard">
            <h3>Historial de Asistencia Filtrado</h3>
            <div className="tableContainer">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Ficha</th>
                    <th>Cédula</th>
                    <th>Trabajador</th>
                    <th>Cargo</th>
                    <th>Departamento</th>
                    <th>Nómina</th>
                    <th>Comida</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPaginaActual.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fechaHoraTexto}</td>
                      <td><strong>{item.ficha || "-"}</strong></td>
                      <td>{item.cedula || "-"}</td>
                      <td>{`${item.nombres || ""} ${item.apellidos || ""}`}</td>
                      <td>{item.cargo || "-"}</td>
                      <td>{item.departamento || "-"}</td>
                      <td>
                        <span className="nominaBadge">{item.tipoNomina || "-"}</span>
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

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="pageBtn"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="pageIndicator">
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button 
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="pageBtn"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 25px;
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .topBar {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .topBar h1 {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .volverBtn {
          border: none;
          background: white;
          padding: 10px 18px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          transition: all 0.2s;
        }

        .volverBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.12);
        }

        .filterCard {
          background: white;
          padding: 25px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .filtersGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .filterGroup {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filterGroup label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .inputWithIcon {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          border-radius: 10px;
          color: #64748b;
        }

        .inputWithIcon input,
        .inputWithIcon select {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #1e293b;
          width: 100%;
        }

        .downloadsRow {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .downloadBtn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.25s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .downloadBtn.excel {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .downloadBtn.pdf {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .downloadBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.2);
        }

        .statsRow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .statCard {
          background: white;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }

        .statCard h3 {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
        }

        .statCard p {
          font-size: 13px;
          color: #64748b;
          margin: 3px 0 0 0;
        }

        .colorDesayuno { border-left: 5px solid #f59e0b; color: #d97706; }
        .colorAlmuerzo { border-left: 5px solid #ea580c; color: #c2410c; }
        .colorCena { border-left: 5px solid #3b82f6; color: #1d4ed8; }
        .colorTotal { border-left: 5px solid #10b981; color: #047857; }

        .chartsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .chartBox {
          background: white;
          padding: 25px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .chartBox h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .chartWrapper {
          position: relative;
          height: 230px;
          width: 100%;
        }

        .tableCard {
          background: white;
          padding: 25px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .tableCard h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .tableContainer {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th, td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }

        th {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
        }

        tr:hover {
          background: #f8fafc;
        }

        .nominaBadge {
          background: #f1f5f9;
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
          display: inline-block;
        }

        .comidaBadge.des { background: #fef3c7; color: #d97706; }
        .comidaBadge.alm { background: #ffedd5; color: #ea580c; }
        .comidaBadge.cen { background: #dbeafe; color: #2563eb; }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .pageBtn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pageBtn:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .pageBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pageIndicator {
          font-size: 14px;
          color: #64748b;
        }

        .loading, .emptyState {
          background: white;
          padding: 40px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
          text-align: center;
        }

        .emptyState {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .emptyState h3 {
          margin: 8px 0 0 0;
          font-size: 16px;
          color: #1e293b;
        }

        .emptyState p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        @media (max-width: 640px) {
          .topBar {
            flex-direction: column;
            align-items: flex-start;
          }
          .downloadsRow {
            justify-content: stretch;
          }
          .downloadBtn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
