"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  Calendar, 
  Coffee, 
  Soup, 
  Moon, 
  ClipboardCheck,
  FileText,
  Users,
  ChevronRight,
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

export default function SupervisorPage() {
  const router = useRouter();
  const [nombreSupervisor, setNombreSupervisor] = useState("...");

  // Stats states
  const [desayunosHoy, setDesayunosHoy] = useState(0);
  const [almuerzosHoy, setAlmuerzosHoy] = useState(0);
  const [cenasHoy, setCenasHoy] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statsHoy, setStatsHoy] = useState({
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

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("hoy");
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Load Supervisor Name and Payroll Totals
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          // Fetch name
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const d = snap.data();
            setNombreSupervisor(`${d.nombres || ""} ${d.apellidos || ""}`);
          }

          // Fetch nominas totals
          const [cSnap, fSnap, iSnap, pSnap, vSnap] = await Promise.all([
            getDoc(doc(db, "nominas", "contratistas")),
            getDoc(doc(db, "nominas", "fijos")),
            getDoc(doc(db, "nominas", "inces")),
            getDoc(doc(db, "nominas", "pasantes")),
            getDoc(doc(db, "nominas", "visitantes"))
          ]);

          const nominal = {
            contratistas: cSnap.exists() ? (cSnap.data().datos || []).length : 0,
            fijos:        fSnap.exists() ? (fSnap.data().datos || []).length : 0,
            inces:        iSnap.exists() ? (iSnap.data().datos || []).length : 0,
            pasantes:     pSnap.exists() ? (pSnap.data().datos || []).length : 0,
            visitantes:   vSnap.exists() ? (vSnap.data().datos || []).length : 0,
          };
          setTotalesNomina(nominal);
        } catch (e) {
          console.error("Error loading supervisor dashboard totals:", e);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch stats reactively based on periodoSeleccionado
  useEffect(() => {
    async function fetchPeriodStats() {
      setLoadingCharts(true);
      try {
        const hoy = new Date();
        let inicio = new Date();
        inicio.setHours(0, 0, 0, 0);

        if (periodoSeleccionado === "semana") {
          inicio.setDate(hoy.getDate() - 7);
        } else if (periodoSeleccionado === "mes") {
          inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        } else if (periodoSeleccionado === "ano") {
          inicio = new Date(hoy.getFullYear(), 0, 1);
        }

        const qAsis = query(
          collection(db, "asistencias"),
          where("fechaRegistro", ">=", inicio),
          orderBy("fechaRegistro", "desc")
        );
        const asis = await getDocs(qAsis);
        let des = 0, alm = 0, cen = 0;
        let fij = 0, con = 0, inc = 0, pas = 0, vis = 0;

        asis.forEach((d) => {
          const r = d.data();
          if (r.tipoComida === "desayuno") des++;
          if (r.tipoComida === "almuerzo") alm++;
          if (r.tipoComida === "cena")     cen++;

          const nom = r.tipoNomina?.toLowerCase();
          if (nom === "fijos" || nom === "fijo") fij++;
          else if (nom === "contratistas" || nom === "contratista") con++;
          else if (nom === "inces") inc++;
          else if (nom === "pasantes" || nom === "pasante") pas++;
          else if (nom === "visitantes" || nom === "visitante") vis++;
        });

        setDesayunosHoy(des);
        setAlmuerzosHoy(alm);
        setCenasHoy(cen);
        setStatsHoy({
          fijos: fij,
          contratistas: con,
          inces: inc,
          pasantes: pas,
          visitantes: vis
        });
      } catch (e) {
        console.error("Error fetching period stats for supervisor:", e);
      }
      setLoadingCharts(false);
    }

    if (nombreSupervisor !== "...") {
      fetchPeriodStats();
    }
  }, [periodoSeleccionado, nombreSupervisor]);

  const totalTrabajadores = Object.values(totalesNomina).reduce((a, b) => a + b, 0);

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

  const comidaChartData = {
    labels: ["Desayuno", "Almuerzo", "Cena"],
    datasets: [
      {
        data: [desayunosHoy, almuerzosHoy, cenasHoy],
        backgroundColor: ["#f59e0b", "#ea580c", "#3b82f6"],
        borderWidth: 1
      }
    ]
  };

  const asistenciasNominaChartData = {
    labels: ["Fijos", "Contratistas", "INCES", "Pasantes", "Visitantes"],
    datasets: [
      {
        label: "Cantidad",
        data: [
          statsHoy.fijos,
          statsHoy.contratistas,
          statsHoy.inces,
          statsHoy.pasantes,
          statsHoy.visitantes
        ],
        backgroundColor: ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="pg-container">
      {/* WELCOME BANNER */}
      <div className="welcome-banner">
        <div className="welcome-info">
          <div className="welcome-icon-box">
            <Users size={20} />
          </div>
          <div>
            <h1 className="welcome-title">Bienvenido, <span className="supervisor-name">{nombreSupervisor}</span></h1>
            <p className="welcome-subtitle">Supervisor de Comedor · Consola de Control de Asistencias y Comidas</p>
          </div>
        </div>
        <div className="welcome-date">
          <Calendar size={14} />
          <span>{new Date().toLocaleDateString("es-VE", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* PERIOD SELECTOR ROW */}
      <div className="quickFiltersRow">
        <button 
          className={`quickFilterBtn ${periodoSeleccionado === "hoy" ? "active" : ""}`} 
          onClick={() => setPeriodoSeleccionado("hoy")}
        >
          Hoy
        </button>
        <button 
          className={`quickFilterBtn ${periodoSeleccionado === "semana" ? "active" : ""}`} 
          onClick={() => setPeriodoSeleccionado("semana")}
        >
          Semana
        </button>
        <button 
          className={`quickFilterBtn ${periodoSeleccionado === "mes" ? "active" : ""}`} 
          onClick={() => setPeriodoSeleccionado("mes")}
        >
          Mes
        </button>
        <button 
          className={`quickFilterBtn ${periodoSeleccionado === "ano" ? "active" : ""}`} 
          onClick={() => setPeriodoSeleccionado("ano")}
        >
          Año
        </button>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="metrics-row">
        <div className="metric-card card-desayuno">
          <div className="metric-icon-box box-desayuno">
            <Coffee size={24} />
          </div>
          <div className="metric-content">
            <h3>{loading || loadingCharts ? "..." : desayunosHoy}</h3>
            <p>Desayunos ({periodoSeleccionado === "hoy" ? "Hoy" : periodoSeleccionado === "semana" ? "Semana" : periodoSeleccionado === "mes" ? "Mes" : "Año"})</p>
          </div>
        </div>

        <div className="metric-card card-almuerzo">
          <div className="metric-icon-box box-almuerzo">
            <Soup size={24} />
          </div>
          <div className="metric-content">
            <h3>{loading || loadingCharts ? "..." : almuerzosHoy}</h3>
            <p>Almuerzos ({periodoSeleccionado === "hoy" ? "Hoy" : periodoSeleccionado === "semana" ? "Semana" : periodoSeleccionado === "mes" ? "Mes" : "Año"})</p>
          </div>
        </div>

        <div className="metric-card card-cena">
          <div className="metric-icon-box box-cena">
            <Moon size={24} />
          </div>
          <div className="metric-content">
            <h3>{loading || loadingCharts ? "..." : cenasHoy}</h3>
            <p>Cenas ({periodoSeleccionado === "hoy" ? "Hoy" : periodoSeleccionado === "semana" ? "Semana" : periodoSeleccionado === "mes" ? "Mes" : "Año"})</p>
          </div>
        </div>
      </div>

      {/* REGISTRAR ASISTENCIA OPTION */}
      <section className="registrar-section">
        <div 
          className="registrar-main-card"
          onClick={() => router.push("/supervisor/registrar")}
        >
          <div className="registrar-card-content">
            <div className="registrar-icon-container">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h3>Registrar Nueva Asistencia</h3>
              <p>Haga clic aquí para ingresar rápidamente al sistema de control y registro de asistencia (Ficha / Cédula).</p>
            </div>
          </div>
          <div className="registrar-arrow">Registrar Asistencia →</div>
        </div>
      </section>

      {/* REPORT OPTIONS GRID (SAME AS GERENTE STYLE) */}
      <section className="reports-section">
        <h2 className="section-title">Generar Reportes de Asistencia</h2>
        <div className="reports-grid">
          {[
            { label: "Reporte Diario", desc: "Asistencia de hoy", route: "/supervisor/reportes/diario", color: "#3182ce", icon: <FileText size={20} /> },
            { label: "Reporte Semanal", desc: "Últimos 7 días", route: "/supervisor/reportes/semanal", color: "#319795", icon: <FileText size={20} /> },
            { label: "Reporte Mensual", desc: "Por mes específico", route: "/supervisor/reportes/mensual", color: "#dd6b20", icon: <FileText size={20} /> },
            { label: "Reporte Anual", desc: "Por año de registro", route: "/supervisor/reportes/anual", color: "#805ad5", icon: <FileText size={20} /> }
          ].map((op) => (
            <div 
              className="report-option-card" 
              key={op.label}
              onClick={() => router.push(op.route)}
            >
              <div 
                className="report-icon-box" 
                style={{ background: op.color + "12", color: op.color, border: `1px solid ${op.color}22` }}
              >
                {op.icon}
              </div>
              <div className="report-info">
                <h4>{op.label}</h4>
                <p>{op.desc}</p>
              </div>
              <ChevronRight size={16} className="report-arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN DE GRÁFICAS DE ASISTENCIAS */}
      <div className="chartsGrid" style={{ marginBottom: "24px" }}>
        <div className="chartBox">
          <h3>Distribución de Comidas ({periodoSeleccionado === "hoy" ? "Hoy" : periodoSeleccionado === "semana" ? "Semana" : periodoSeleccionado === "mes" ? "Mes" : "Año"})</h3>
          <div className="chartWrapper">
            <Pie data={comidaChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="chartBox">
          <h3>Participación por Categoría ({periodoSeleccionado === "hoy" ? "Hoy" : periodoSeleccionado === "semana" ? "Semana" : periodoSeleccionado === "mes" ? "Mes" : "Año"})</h3>
          <div className="chartWrapper">
            <Bar 
              data={asistenciasNominaChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* GRÁFICA DE DISTRIBUCIÓN DE TRABAJADORES (MISMA QUE GERENTE) */}
      <section className="pg-chart-section">
        <div className="pg-chart-header">
          <PieChart size={18} />
          <h2>Distribución de Nómina por Categoría</h2>
        </div>
        <div className="pg-chart-body">
          <div className="pg-pie">
            <div className="chart-wrapper">
              <Pie data={nominalChartData} options={nominalChartOptions} />
            </div>
            <div className="pg-pie-center">
              <span className="pg-pie-total">{loading ? "..." : totalTrabajadores}</span>
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
                  <div className="pg-leg-bar" style={{ width: totalTrabajadores > 0 ? `${(val / totalTrabajadores) * 100}%` : "0%", background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="pg-footer">© 2026 INVECEM – SisCOM V1.2 · Reservado para personal autorizado</footer>

      <style jsx>{`
        .pg-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.85);
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          flex-wrap: wrap;
          gap: 12px;
        }

        .welcome-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .welcome-icon-box {
          background: linear-gradient(135deg, #e53e3e, #b83232);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(229, 62, 62, 0.25);
        }

        .welcome-title {
          font-size: 20px;
          font-weight: 850;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
          font-family: var(--font-rajdhani), 'Segoe UI', sans-serif;
        }

        .supervisor-name {
          color: #e53e3e;
        }

        .welcome-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 2px 0 0 0;
          font-weight: 600;
        }

        .welcome-date {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }

        .welcome-date span {
          text-transform: capitalize;
        }

        /* METRICS */
        .metrics-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 18px;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s;
        }

        .card-desayuno:hover,
        .card-almuerzo:hover,
        .card-cena:hover {
          transform: translateY(-2px);
        }

        .metric-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .box-desayuno {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .box-almuerzo {
          background: linear-gradient(135deg, #0d9488, #0f766e);
        }

        .box-cena {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        }

        .metric-content h3 {
          font-size: 28px;
          font-weight: 850;
          margin: 0;
          font-family: var(--font-rajdhani), sans-serif;
          color: #0f172a;
          line-height: 1;
        }

        .metric-content p {
          font-size: 12px;
          color: #64748b;
          margin: 4px 0 0 0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* REGISTRAR ASISTENCIA CARD */
        .registrar-section {
          width: 100%;
        }

        .registrar-main-card {
          background: linear-gradient(135deg, #e53e3e, #b83232);
          color: white;
          border-radius: 20px;
          padding: 24px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 10px 25px rgba(229, 62, 62, 0.25);
          flex-wrap: wrap;
          gap: 20px;
        }

        .registrar-main-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(229, 62, 62, 0.35);
        }

        .registrar-card-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .registrar-icon-container {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .registrar-card-content h3 {
          font-size: 22px;
          font-weight: 850;
          margin: 0;
          font-family: var(--font-rajdhani), sans-serif;
        }

        .registrar-card-content p {
          font-size: 13.5px;
          margin: 4px 0 0 0;
          opacity: 0.9;
        }

        .registrar-arrow {
          background: white;
          color: #e53e3e;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13.5px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .registrar-main-card:hover .registrar-arrow {
          transform: scale(1.05);
        }

        /* REPORTS GRID & OPTION CARDS */
        .reports-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin: 0;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .report-option-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }

        .report-option-card:hover {
          transform: translateY(-2px);
          border-color: rgba(229, 62, 62, 0.2);
          box-shadow: 0 8px 25px rgba(229, 62, 62, 0.08);
        }

        .report-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .report-info {
          flex: 1;
        }

        .report-info h4 {
          font-size: 14px;
          font-weight: 750;
          color: #1e293b;
          margin: 0;
        }

        .report-info p {
          font-size: 11.5px;
          color: #94a3b8;
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        .report-arrow {
          color: #94a3b8;
          transition: transform 0.2s, color 0.2s;
        }

        .report-option-card:hover .report-arrow {
          transform: translateX(4px);
          color: #e53e3e;
        }

        /* CHART SECTION (NÓMINA ABSOLUTA) */
        .pg-chart-section {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.04);
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

        .chart-wrapper {
          width: 100%;
          height: 100%;
        }

        .chartsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .chartBox {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 18px;
          padding: 25px;
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

        /* LEGEND */
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

        .pg-footer {
          font-size: 11.5px;
          color: #94a3b8;
          text-align: center;
          padding-top: 10px;
          font-weight: 500;
        }

        .quickFiltersRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .quickFilterBtn {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quickFilterBtn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .quickFilterBtn.active {
          background: linear-gradient(135deg, #e53e3e, #b83232);
          border-color: #e53e3e;
          color: white;
          box-shadow: 0 4px 10px rgba(229, 62, 62, 0.2);
        }

        @media (max-width: 640px) {
          .welcome-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .registrar-main-card {
            padding: 20px;
          }
          .registrar-card-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .pg-chart-body {
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }
          .pg-legend {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}