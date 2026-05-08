"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ArrowLeft, Trash2, Pencil, FilePlus, Users } from "lucide-react";

export default function VerNominaInces() {

  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    "Numero de ficha",
    "Nombres",
    "Apellidos",
    "Edad",
    "Cedula",
    "Supervisor"
  ];

  // 🔥 FUNCIÓN PARA ASEGURAR "V-"
  const formatearCedula = (cedula) => {
    const limpia = cedula?.toString().trim().replace(/^V-/i, "");
    return limpia ? `V-${limpia}` : "-";
  };

  // 🔥 CARGAR DATOS
  useEffect(() => {

    async function fetchData() {
      try {
        const ref = doc(db, "nominas", "inces");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setData(snap.data().datos || []);
        } else {
          setData([]);
        }

      } catch (error) {
        console.error(error);
        setData([]);
      }

      setLoading(false);
    }

    fetchData();

  }, []);

  // 🔥 ELIMINAR
  async function borrarNomina() {

    const ok = confirm("¿Eliminar toda la nómina?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "nominas", "inces"));

      alert("✅ Nómina eliminada");

      router.push("/gerente/cargar-nomina/inces/cargar");

    } catch (error) {
      console.error(error);
      alert("❌ Error al eliminar");
    }
  }

  return (
    <div className="main">

      {/* TITULO */}
      <div className="panelTitle">
        <h1>Ver Nómina - Estudiantes INCES</h1>
      </div>

      {/* CARD */}
      <div className="card">

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            {/* 🔥 CONTADOR IGUAL AL DE CONTRATISTAS */}
            <div className="contadorPro">
              <Users size={18}/>
              <span>Total estudiantes</span>
              <strong>{data.length}</strong>
            </div>

            {data.length === 0 ? (
              <p>No hay nómina cargada</p>
            ) : (

              <div className="tableContainer">

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      {headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        {headers.map((h, j) => (
                          <td key={j}>
                            {h === "Cedula"
                              ? formatearCedula(row[h])
                              : row[h] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            )}
          </>
        )}

        {/* BOTONES */}
        <div className="buttons">

          <button
            className="editBtn"
            onClick={() => router.push("/gerente/cargar-nomina/inces/editar")}
          >
            <Pencil size={16}/> Editar
          </button>

          <button
            className="addBtn"
            onClick={() => router.push("/gerente/cargar-nomina/inces/manual")}
          >
            <FilePlus size={16}/> Añadir Manual
          </button>

          <button className="deleteBtn" onClick={borrarNomina}>
            <Trash2 size={16}/> Eliminar
          </button>

          <button
            className="backBtn"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16}/> Volver
          </button>

        </div>

      </div>

      {/* ESTILOS */}
      <style jsx>{`

        .main {
          padding:40px;
        }

        .panelTitle {
          background:white;
          padding:12px 20px;
          border-left:5px solid #fa1515;
          border-radius:10px;
          margin-bottom:30px;
        }

        .card {
          background:white;
          padding:30px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.2);
          text-align:center;
        }

        .contadorPro {
          display:inline-flex;
          align-items:center;
          gap:10px;
          background:#f8fafc;
          padding:8px 16px;
          border-radius:999px;
          border:1px solid #e2e8f0;
          font-size:14px;
          margin-bottom:20px;
        }

        .contadorPro strong {
          background:#2563eb;
          color:white;
          padding:4px 10px;
          border-radius:999px;
          font-size:13px;
        }

        .tableContainer {
          max-height:450px;
          overflow:auto;
          border-radius:10px;
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

        .buttons {
          margin-top:25px;
          display:flex;
          gap:10px;
          justify-content:center;
          flex-wrap:wrap;
        }

        .editBtn, .addBtn, .deleteBtn, .backBtn {
          display:flex;
          align-items:center;
          gap:5px;
          border:none;
          padding:10px 15px;
          border-radius:8px;
          cursor:pointer;
          transition:all .2s;
        }

        .editBtn { background:#2b4c7e; color:white; }
        .addBtn { background:#16a34a; color:white; }
        .deleteBtn { background:#dc2626; color:white; }
        .backBtn { background:#e5e7eb; }

        .editBtn:hover,
        .addBtn:hover,
        .deleteBtn:hover,
        .backBtn:hover {
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

      `}</style>

    </div>
  );
}