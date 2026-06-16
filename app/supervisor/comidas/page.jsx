"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc, where } from "firebase/firestore";
import { UtensilsCrossed, Search, ArrowLeft, Trash2, Coffee, Soup, Moon, Filter, User2 } from "lucide-react";

export default function ControlComidasPage() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [comidaFiltro, setComidaFiltro] = useState("todos");
  
  // Custom delete confirmation modal state
  const [registroAEliminar, setRegistroAEliminar] = useState(null);

  // Load today's records
  async function cargarAsistenciasHoy() {
    setLoading(true);
    try {
      const q = query(collection(db, "asistencias"), orderBy("fechaRegistro", "desc"));
      const snap = await getDocs(q);
      
      const hoy = new Date().toDateString();
      const lista = [];

      snap.forEach((docu) => {
        const data = docu.data();
        if (data.fechaRegistro) {
          const dateStr = data.fechaRegistro.toDate().toDateString();
          if (dateStr === hoy) {
            lista.push({
              id: docu.id,
              ...data,
              hora: data.fechaRegistro.toDate().toLocaleTimeString("es-VE", {
                hour: "2-digit",
                minute: "2-digit"
              })
            });
          }
        }
      });

      setRegistros(lista);
      setRegistrosFiltrados(lista);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    cargarAsistenciasHoy();
  }, []);

  // Filter records
  useEffect(() => {
    let res = registros.filter((item) =>
      `${item.nombres || ""} ${item.apellidos || ""} ${item.ficha || ""} ${item.cedula || ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );

    if (comidaFiltro !== "todos") {
      res = res.filter((item) => item.tipoComida === comidaFiltro);
    }

    setRegistrosFiltrados(res);
  }, [busqueda, comidaFiltro, registros]);

  // Handle delete action
  async function confirmarEliminacion() {
    if (!registroAEliminar) return;

    try {
      await deleteDoc(doc(db, "asistencias", registroAEliminar.id));
      
      // Update local state
      const actualizados = registros.filter((r) => r.id !== registroAEliminar.id);
      setRegistros(actualizados);
      setRegistroAEliminar(null);
      
      alert("✅ Registro de comida eliminado correctamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error al eliminar el registro");
    }
  }

  // Count items
  const totalDesayuno = registros.filter((r) => r.tipoComida === "desayuno").length;
  const totalAlmuerzo = registros.filter((r) => r.tipoComida === "almuerzo").length;
  const totalCena = registros.filter((r) => r.tipoComida === "cena").length;

  return (
    <div className="main">
      {/* HEADER */}
      <div className="topBar">
        <button className="volverBtn" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>Control de Comidas (Hoy)</h1>
      </div>

      {/* DASHBOARD DEL DIA */}
      <div className="statsRow">
        <div className="statCard colorDesayuno">
          <Coffee size={24} />
          <div>
            <h3>{totalDesayuno}</h3>
            <p>Desayunos Hoy</p>
          </div>
        </div>
        <div className="statCard colorAlmuerzo">
          <Soup size={24} />
          <div>
            <h3>{totalAlmuerzo}</h3>
            <p>Almuerzos Hoy</p>
          </div>
        </div>
        <div className="statCard colorCena">
          <Moon size={24} />
          <div>
            <h3>{totalCena}</h3>
            <p>Cenas Hoy</p>
          </div>
        </div>
        <div className="statCard colorTotal">
          <UtensilsCrossed size={24} />
          <div>
            <h3>{registros.length}</h3>
            <p>Total Servicios</p>
          </div>
        </div>
      </div>

      {/* CARD PRINCIPAL */}
      <div className="card">
        {/* BUSCADOR Y FILTROS */}
        <div className="filtersGrid">
          <div className="filterGroup search">
            <label>Buscar Trabajador</label>
            <div className="inputWithIcon">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, ficha o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="filterGroup">
            <label>Tipo de Comida</label>
            <div className="inputWithIcon">
              <Filter size={16} />
              <select
                value={comidaFiltro}
                onChange={(e) => setComidaFiltro(e.target.value)}
              >
                <option value="todos">Todos los servicios</option>
                <option value="desayuno">Desayunos</option>
                <option value="almuerzo">Almuerzos</option>
                <option value="cena">Cenas</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLA */}
        {loading ? (
          <p className="loading">Cargando registros del día...</p>
        ) : registrosFiltrados.length === 0 ? (
          <p className="loading">No hay registros de comidas para hoy.</p>
        ) : (
          <div className="tableContainer">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Ficha</th>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th>Tipo Nómina</th>
                  <th>Servicio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((item) => (
                  <tr key={item.id}>
                    <td>{item.hora}</td>
                    <td><strong>{item.ficha}</strong></td>
                    <td>{item.cedula}</td>
                    <td>{`${item.nombres} ${item.apellidos}`}</td>
                    <td><span className="nominaBadge">{item.tipoNomina}</span></td>
                    <td>
                      <span className={`comidaBadge ${item.tipoComida === "desayuno" ? "des" : item.tipoComida === "almuerzo" ? "alm" : "cen"}`}>
                        {item.tipoComida}
                      </span>
                    </td>
                    <td>
                      <button
                        className="deleteBtn"
                        title="Eliminar Registro"
                        onClick={() => setRegistroAEliminar(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔥 MODAL CONFIRMAR ELIMINAR REGISTRO */}
      {registroAEliminar && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "450px" }}>
            <div className="modalHeader" style={{ borderBottom: "none", marginBottom: "15px" }}>
              <div className="perfilCircle" style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "50%", width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={35}/>
              </div>
              <div>
                <h2>Confirmar Eliminación</h2>
                <p>¿Seguro que deseas eliminar este registro de asistencia al comedor?</p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #e5e7eb" }}>
              <p style={{ margin: "0", fontSize: "14px", color: "#4b5563", textAlign: "left" }}>
                <strong>Trabajador:</strong> {`${registroAEliminar.nombres} ${registroAEliminar.apellidos}`}
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#4b5563", textAlign: "left" }}>
                <strong>Ficha:</strong> {registroAEliminar.ficha}
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#4b5563", textAlign: "left" }}>
                <strong>Servicio:</strong> {registroAEliminar.tipoComida?.toUpperCase()} ({registroAEliminar.hora})
              </p>
            </div>

            <div className="bottomActions" style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="cerrarBtn"
                onClick={() => setRegistroAEliminar(null)}
                style={{ background: "#e5e7eb", color: "#4b5563", border: "none" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                style={{ background: "#dc2626", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .main {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 25px;
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

        .card {
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
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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

        .deleteBtn {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .deleteBtn:hover {
          background: #ef4444;
          color: white;
          transform: scale(1.05);
        }

        .loading {
          text-align: center;
          color: #64748b;
          padding: 30px;
        }

        /* MODAL STYLES */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          display: flex;
          flex-direction: column;
        }

        .modalHeader {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .modalHeader h2 {
          font-size: 20px;
          margin: 0;
          color: #111827;
        }

        .modalHeader p {
          margin: 5px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .bottomActions {
          margin-top: 10px;
        }

        .cerrarBtn {
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .main {
            padding: 20px;
          }
          .card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
}
