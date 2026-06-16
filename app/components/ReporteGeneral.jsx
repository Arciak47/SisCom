"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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
  PieChart
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

export default function ReporteGeneral({ tipo, rol }) {
  const router = useRouter();

  // Filtros
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );

  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [nominaFiltro, setNominaFiltro] = useState("todos");

  // Estadísticas agrupadas
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

  const [totalesNomina, setTotalesNomina] = useState({
    contratistas: 0,
    fijos: 0,
    inces: 0,
    pasantes: 0,
    visitantes: 0
  });
  const [loadingNomina, setLoadingNomina] = useState(true);

  useEffect(() => {
    async function loadNominaTotals() {
      setLoadingNomina(true);
      try {
        const [cSnap, fSnap, iSnap, pSnap, vSnap] = await Promise.all([
          getDoc(doc(db, "nominas", "contratistas")),
          getDoc(doc(db, "nominas", "fijos")),
          getDoc(doc(db, "nominas", "inces")),
          getDoc(doc(db, "nominas", "pasantes")),
          getDoc(doc(db, "nominas", "visitantes"))
        ]);

        setTotalesNomina({
          contratistas: cSnap.exists() ? (cSnap.data().datos || []).length : 0,
          fijos:        fSnap.exists() ? (fSnap.data().datos || []).length : 0,
          inces:        iSnap.exists() ? (iSnap.data().datos || []).length : 0,
          pasantes:     pSnap.exists() ? (pSnap.data().datos || []).length : 0,
          visitantes:   vSnap.exists() ? (vSnap.data().datos || []).length : 0,
        });
      } catch (e) {
        console.error("Error al cargar totales de nomina en ReporteGeneral:", e);
      }
      setLoadingNomina(false);
    }
    loadNominaTotals();
  }, []);

  const totalTrabajadoresNomina = Object.values(totalesNomina).reduce((a, b) => a + b, 0);

  const nominalChartData = {
    labels: ["Contratistas", "Trab. Fijos", "Est. INCES", "Pasantes", "Visitantes"],
    datasets: [{
      data: [totalesNomina.contratistas, totalesNomina.fijos, totalesNomina.inces, totalesNomina.pasantes, totalesNomina.visitantes],
      backgroundColor: ["#e53e3e", "#3182ce", "#319795", "#dd6b20", "#805ad5"],
      borderWidth: 3,
      borderColor: "#ffffff",
      hoverOffset: 12
    }]
  };

  const nominalChartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } }
    },
    cutout: "65%",
    responsive: true,
    maintainAspectRatio: false
  };

  const nominalCats = [
    { label: "Contratistas",   val: totalesNomina.contratistas, color: "#e53e3e" },
    { label: "Trab. Fijos",    val: totalesNomina.fijos,         color: "#3182ce" },
    { label: "Est. INCES",     val: totalesNomina.inces,         color: "#319795" },
    { label: "Pasantes",       val: totalesNomina.pasantes,      color: "#dd6b20" },
    { label: "Visitantes",     val: totalesNomina.visitantes,    color: "#805ad5" },
  ];

  // Cargar asistencias
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      try {
        let q = collection(db, "asistencias");
        const conditions = [];

        if (tipo === "diario" && fechaSeleccionada) {
          conditions.push(where("fechaRegistro", ">=", new Date(fechaSeleccionada + "T00:00:00")));
          conditions.push(where("fechaRegistro", "<=", new Date(fechaSeleccionada + "T23:59:59")));
        } else if (tipo === "semanal") {
          const haceUnaSemana = new Date();
          haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
          haceUnaSemana.setHours(0, 0, 0, 0);
          conditions.push(where("fechaRegistro", ">=", haceUnaSemana));
        } else if (tipo === "mensual" && mesSeleccionado) {
          const [year, month] = mesSeleccionado.split("-").map(Number);
          conditions.push(where("fechaRegistro", ">=", new Date(year, month - 1, 1, 0, 0, 0)));
          conditions.push(where("fechaRegistro", "<=", new Date(year, month, 0, 23, 59, 59)));
        } else if (tipo === "anual" && typeof anioSeleccionado === "number") {
          conditions.push(where("fechaRegistro", ">=", new Date(anioSeleccionado, 0, 1, 0, 0, 0)));
          conditions.push(where("fechaRegistro", "<=", new Date(anioSeleccionado, 11, 31, 23, 59, 59)));
        }

        const qFinal = query(q, ...conditions, orderBy("fechaRegistro", "desc"));
        const snap = await getDocs(qFinal);
        
        const lista = snap.docs.map(docu => {
          const d = docu.data();
          let fechaObj = new Date();
          if (d.fechaRegistro) {
            if (typeof d.fechaRegistro.toDate === "function") {
              fechaObj = d.fechaRegistro.toDate();
            } else {
              fechaObj = new Date(d.fechaRegistro);
            }
          }
          if (isNaN(fechaObj.getTime())) {
            fechaObj = new Date();
          }
          return {
            id: docu.id,
            ...d,
            fechaObj,
            fechaTexto: fechaObj.toLocaleDateString("es-VE"),
            fechaHoraTexto: fechaObj.toLocaleString("es-VE"),
            fechaYMD: fechaObj.toISOString().split("T")[0],
            mesYM: fechaObj.toISOString().substring(0, 7)
          };
        });

        setRegistros(lista);
        setRegistrosFiltrados(lista);
        calcularEstadisticas(lista);

      } catch (error) {
        console.error("Error al cargar asistencias del comedor:", error);
      }
      setLoading(false);
    }
    cargarDatos();
  }, [tipo, fechaSeleccionada, mesSeleccionado, anioSeleccionado]);

  // Aplicar filtros de búsqueda y categoría de nómina
  useEffect(() => {
    let res = registros.filter(item =>
      `${item.nombres || ""} ${item.apellidos || ""} ${item.ficha || ""} ${item.cedula || ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );

    if (nominaFiltro !== "todos") {
      res = res.filter(item => item.tipoNomina?.toLowerCase() === nominaFiltro);
    }

    setRegistrosFiltrados(res);
    calcularEstadisticas(res);
  }, [busqueda, nominaFiltro, registros]);

  // Calcular estadísticas para las tarjetas y gráficos
  function calcularEstadisticas(items) {
    let des = 0, alm = 0, cen = 0;
    let fij = 0, con = 0, inc = 0, pas = 0, vis = 0;

    items.forEach(item => {
      // Por comida
      if (item.tipoComida === "desayuno") des++;
      else if (item.tipoComida === "almuerzo") alm++;
      else if (item.tipoComida === "cena") cen++;

      // Por nómina
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

  // Exportar a Excel
  function exportarExcel() {
    if (registrosFiltrados.length === 0) {
      alert("No hay registros para exportar");
      return;
    }

    const dataExcel = registrosFiltrados.map((item, index) => ({
      "#": index + 1,
      "Fecha y Hora": item.fechaHoraTexto,
      "Ficha": item.ficha || "-",
      "Cédula": item.cedula || "-",
      "Trabajador": `${item.nombres || ""} ${item.apellidos || ""}`,
      "Cargo": item.cargo || "-",
      "Departamento": item.departamento || "-",
      "Nómina": item.tipoNomina || "-",
      "Comida": item.tipoComida || "-",
      "Supervisor Registro": item.supervisorRegistro || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
    XLSX.writeFile(wb, `Reporte_Comedor_${tipo}_${new Date().toISOString().split("T")[0]}.xlsx`);
    alert("✅ Excel exportado correctamente");
  }

  // Exportar a PDF
  function exportarPDF() {
    if (registrosFiltrados.length === 0) {
      alert("No hay registros para exportar");
      return;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    pdf.setFontSize(16);
    pdf.text(`Reporte de Uso del Comedor - Planta INVECEM`, 14, 15);
    pdf.setFontSize(11);
    pdf.text(`Tipo de Reporte: ${tipo.toUpperCase()}`, 14, 21);
    pdf.text(`Generado el: ${new Date().toLocaleString()}`, 14, 26);
    pdf.text(`Total Asistencias: ${registrosFiltrados.length}`, 14, 31);

    const headers = [
      ["#", "Fecha y Hora", "Ficha", "Cedula", "Trabajador", "Cargo", "Dpto", "Nómina", "Comida"]
    ];

    const body = registrosFiltrados.map((item, index) => [
      index + 1,
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
      startY: 36,
      head: headers,
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [227, 30, 36] } // Rojo corporativo
    });

    pdf.save(`Reporte_Comedor_${tipo}_${new Date().toISOString().split("T")[0]}.pdf`);
    alert("✅ PDF exportado correctamente");
  }

  // Gráfica de comidas
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

  // Gráfica de nóminas
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
        <h1>Reporte {tipo === "diario" ? "Diario" : tipo === "semanal" ? "Semanal" : tipo === "mensual" ? "Mensual" : "Anual"}</h1>
      </div>

      {/* CONTROLES DE FILTRO */}
      <div className="filterCard">
        <div className="filtersGrid">
          {tipo === "diario" && (
            <div className="filterGroup">
              <label>Seleccionar Fecha</label>
              <div className="inputWithIcon">
                <Calendar size={16} />
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                />
              </div>
            </div>
          )}

          {tipo === "mensual" && (
            <div className="filterGroup">
              <label>Seleccionar Mes</label>
              <div className="inputWithIcon">
                <Calendar size={16} />
                <input
                  type="month"
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                />
              </div>
            </div>
          )}

          {tipo === "anual" && (
            <div className="filterGroup">
              <label>Seleccionar Año</label>
              <div className="inputWithIcon">
                <Calendar size={16} />
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#1e293b" }}
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                  <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                </select>
              </div>
            </div>
          )}

          <div className="filterGroup">
            <label>Filtrar por Nómina</label>
            <div className="inputWithIcon">
              <Filter size={16} />
              <select
                value={nominaFiltro}
                onChange={(e) => setNominaFiltro(e.target.value)}
              >
                <option value="todos">Todas las categorías</option>
                <option value="fijos">Trabajadores Fijos</option>
                <option value="contratistas">Contratistas</option>
                <option value="inces">Estudiantes INCES</option>
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

        {/* BOTONES DE DESCARGA */}
        <div className="downloadsRow">
          <button className="downloadBtn excel" onClick={exportarExcel}>
            <Download size={16} /> Exportar Excel
          </button>
          <button className="downloadBtn pdf" onClick={exportarPDF}>
            <Download size={16} /> Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Cargando reporte...</p>
      ) : registrosFiltrados.length === 0 ? (
        <div className="emptyState">
          <Users size={40} style={{ color: "#94a3b8" }} />
          <h3>No hay registros de asistencias</h3>
          <p>No se encontraron datos para los filtros e intervalos seleccionados.</p>
        </div>
      ) : (
        <>
          {/* TARJETAS RESUMEN */}
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
              <h3>Participación por Nómina</h3>
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

          {/* GRÁFICA DE DISTRIBUCIÓN DE TRABAJADORES (MISMA QUE DASHBOARD) */}
          <section className="pg-chart-section">
            <div className="pg-chart-header">
              <PieChart size={18} />
              <h2>Distribución de Nómina por Categoría (Total Registrado)</h2>
            </div>
            <div className="pg-chart-body">
              <div className="pg-pie">
                <div className="chartWrapper">
                  <Pie data={nominalChartData} options={nominalChartOptions} />
                </div>
                <div className="pg-pie-center">
                  <span className="pg-pie-total">{loadingNomina ? "..." : totalTrabajadoresNomina}</span>
                  <span className="pg-pie-label">Total</span>
                </div>
              </div>
              <div className="pg-legend">
                {nominalCats.map(({ label, val, color }) => (
                  <div className="pg-leg-item" key={label}>
                    <span className="pg-dot" style={{ background: color }} />
                    <div className="pg-leg-text">
                      <span className="pg-leg-name">{label}</span>
                      <span className="pg-leg-val" style={{ color }}>{val}</span>
                    </div>
                    <div className="pg-leg-bar-wrap">
                      <div className="pg-leg-bar" style={{ width: totalTrabajadoresNomina > 0 ? `${(val / totalTrabajadoresNomina) * 100}%` : "0%", background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TABLA DE DETALLES */}
          <div className="tableCard">
            <h3>Detalle de Registros</h3>
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
                  {registrosFiltrados.map((item) => (
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
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

        .pg-chart-section {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
          margin-top: 25px;
          margin-bottom: 25px;
        }

        .pg-chart-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: #4a5568;
        }

        .pg-chart-header h2 {
          font-size: 16px;
          font-weight: 800;
          color: #1a202c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 0;
        }

        .pg-chart-body {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .pg-pie {
          position: relative;
          width: 220px;
          height: 220px;
          flex-shrink: 0;
        }

        .pg-pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        .pg-pie-total {
          display: block;
          font-size: 32px;
          font-weight: 850;
          color: #1a202c;
          font-family: var(--font-rajdhani), sans-serif;
          line-height: 1;
        }

        .pg-pie-label {
          font-size: 10px;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .pg-legend {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 240px;
        }

        .pg-leg-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pg-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pg-leg-text {
          width: 150px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .pg-leg-name {
          font-size: 13.5px;
          color: #4a5568;
          font-weight: 600;
        }

        .pg-leg-val {
          font-size: 14px;
          font-weight: 800;
        }

        .pg-leg-bar-wrap {
          flex: 1;
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }

        .pg-leg-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
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
