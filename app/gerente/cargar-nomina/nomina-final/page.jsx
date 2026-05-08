"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Users, Download, Search, ArrowLeft } from "lucide-react";
import * as XLSX from "xlsx";

export default function NominaFinal() {

  const router = useRouter();

  const [fijos, setFijos] = useState([]);
  const [contratistas, setContratistas] = useState([]);
  const [inces, setInces] = useState([]);
  const [pasantes, setPasantes] = useState([]); // 🔥 NUEVO
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busquedaGlobal, setBusquedaGlobal] = useState("");

  useEffect(() => {

    async function fetchAll() {
      try {

        const [f, c, i, p, v] = await Promise.all([
          getDoc(doc(db, "nominas", "fijos")),
          getDoc(doc(db, "nominas", "contratistas")),
          getDoc(doc(db, "nominas", "inces")),
          getDoc(doc(db, "nominas", "pasantes")), // 🔥
          getDoc(doc(db, "nominas", "visitantes"))
        ]);

        setFijos(f.exists() ? f.data().datos || [] : []);
        setContratistas(c.exists() ? c.data().datos || [] : []);
        setInces(i.exists() ? i.data().datos || [] : []);
        setPasantes(p.exists() ? p.data().datos || [] : []); // 🔥
        setVisitantes(v.exists() ? v.data().datos || [] : []);

      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    fetchAll();

  }, []);

  function filtrar(data) {
    return data.filter(row =>
      Object.values(row).some(val =>
        val?.toString().toLowerCase().includes(busquedaGlobal.toLowerCase())
      )
    );
  }

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Nómina General del Sistema</h1>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          
          <div className="buscadorGlobal">
            <Search size={18}/>
            <input
              type="text"
              placeholder="Buscar en todas las nóminas..."
              value={busquedaGlobal}
              onChange={(e)=>setBusquedaGlobal(e.target.value)}
            />
          </div>

          {/* DASHBOARD */}
          <div className="dashboard">
            <Card label="Fijos" value={fijos.length}/>
            <Card label="Contratistas" value={contratistas.length}/>
            <Card label="INCES" value={inces.length}/>
            <Card label="Pasantes" value={pasantes.length}/> {/* 🔥 */}
            <Card label="Visitantes" value={visitantes.length}/>
            <Card 
              label="TOTAL" 
              value={
                fijos.length +
                contratistas.length +
                inces.length +
                pasantes.length + // 🔥
                visitantes.length
              }
              total
            />
          </div>

          {/* TABLAS */}

          <Seccion 
            titulo="Trabajadores Fijos" 
            data={filtrar(fijos)}
            headers={[
              "Numero de ficha",
              "Nombres",
              "Apellidos",
              "Edad",
              "Cedula",
              "Cargo",
              "Jefe o Supervisor inmediato"
            ]}
          />

          <Seccion 
            titulo="Contratistas" 
            data={filtrar(contratistas)}
            headers={[
              "Numero de ficha",
              "Nombres",
              "Apellidos",
              "Edad",
              "Cedula",
              "Cargo",
              "Empresa",
              "Jefe o Supervisor inmediato"
            ]}
          />

          <Seccion 
            titulo="Estudiantes INCES" 
            data={filtrar(inces)}
            headers={[
              "Numero de ficha",
              "Nombres",
              "Apellidos",
              "Edad",
              "Cedula",
              "Supervisor"
            ]}
          />

          {/* 🔥 PASANTES (CLON EXACTO DE INCES) */}
          <Seccion 
            titulo="Pasantes" 
            data={filtrar(pasantes)}
            headers={[
              "Numero de ficha",
              "Nombres",
              "Apellidos",
              "Edad",
              "Cedula",
              "Supervisor"
            ]}
          />

          <Seccion 
            titulo="Visitantes" 
            data={filtrar(visitantes)}
            headers={[
              "Nombres",
              "Apellidos",
              "Cedula",
              "Area",
              "Supervisor"
            ]}
          />

          <div className="backContainer">
            <button
              className="backBtn"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18}/> Volver
            </button>
          </div>

        </>
      )}

      <style jsx>{`
        .main { padding:40px; }

        .panelTitle {
          display:inline-block;
          background:white;
          padding:12px 20px;
          border-left:5px solid #facc15;
          border-radius:10px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
          margin-bottom:20px;
        }

        .buscadorGlobal {
          display:flex;
          align-items:center;
          gap:10px;
          background:#f1f5f9;
          padding:10px;
          border-radius:10px;
          margin-bottom:20px;
        }

        .buscadorGlobal input {
          border:none;
          outline:none;
          background:transparent;
          width:100%;
        }

        .dashboard {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
          gap:12px;
          margin-bottom:25px;
        }

        .cardDash {
          background:white;
          padding:12px 15px;
          border-radius:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.15);
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .cardDash h3 {
          font-size:13px;
          margin:0;
        }

        .cardDash strong {
          font-size:16px;
          color:#2563eb;
        }

        .cardDash.total strong {
          color:#16a34a;
        }

        .backContainer {
          margin-top:30px;
          display:flex;
          justify-content:center;
        }

        .backBtn {
          display:flex;
          align-items:center;
          gap:6px;
          background:#e5e7eb;
          border:none;
          padding:10px 18px;
          border-radius:10px;
          cursor:pointer;
          transition:all .2s;
        }

        .backBtn:hover {
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

      `}</style>

    </div>
  );
}

/* CARD */
function Card({ label, value, total }) {
  return (
    <div className={`cardDash ${total ? "total" : ""}`}>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
      </div>
      <Users size={20}/>
    </div>
  );
}

/* SECCION */
function Seccion({ titulo, data, headers }) {

  const [search, setSearch] = useState("");

  function descargarExcel() {
    if (data.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Nomina");
    XLSX.writeFile(wb, `${titulo}.xlsx`);
  }

  const filtrados = data.filter(row =>
    Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  if (data.length === 0) {
    return (
      <div className="section">
        <h2>{titulo}</h2>
        <p>No hay datos</p>
      </div>
    );
  }

  return (
    <div className="section">

      <div className="headerSection">
        <h2>{titulo}</h2>

        <div className="actions">
          <div className="searchBox">
            <Search size={16}/>
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
            />
          </div>

          <button className="downloadBtn" onClick={descargarExcel}>
            <Download size={16}/> Excel
          </button>
        </div>
      </div>

      <div className="tableContainer">

        <table>
          <thead>
            <tr>
              <th>#</th>
              {headers.map((h,i)=><th key={i}>{h}</th>)}
            </tr>
          </thead>

          <tbody>
            {filtrados.map((row,i)=>(
              <tr key={i}>
                <td>{i+1}</td>
                {headers.map((h,j)=>(
                  <td key={j}>{row[h] || "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      <style jsx>{`
        .section {
          margin-top:30px;
          background:white;
          padding:25px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.2);
        }

        .headerSection {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:15px;
          flex-wrap:wrap;
          gap:10px;
        }

        .actions {
          display:flex;
          gap:10px;
        }

        .searchBox {
          display:flex;
          align-items:center;
          gap:5px;
          background:#f1f5f9;
          padding:6px 10px;
          border-radius:8px;
        }

        .searchBox input {
          border:none;
          outline:none;
          background:transparent;
        }

        .downloadBtn {
          display:flex;
          align-items:center;
          gap:6px;
          background:#16a34a;
          color:white;
          border:none;
          padding:8px 12px;
          border-radius:8px;
          cursor:pointer;
        }

        .tableContainer {
          max-height:400px;
          overflow:auto;
        }

        table {
          width:100%;
          border-collapse:collapse;
        }

        th, td {
          border:1px solid #ddd;
          padding:8px;
          font-size:13px;
        }

        th {
          background:#2563eb;
          color:white;
          position:sticky;
          top:0;
        }

        tr:hover {
          background:#f1f5f9;
        }
      `}</style>

    </div>
  );
}