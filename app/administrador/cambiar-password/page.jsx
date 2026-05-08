"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CambiarPasswordAdmin() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uidSeleccionado, setUidSeleccionado] = useState("");
  const [password, setPassword] = useState("");

  // 🔥 Cargar usuarios
  useEffect(() => {

    async function fetchUsers() {

      try {
        const snap = await getDocs(collection(db, "usuarios"));

        const lista = snap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        setUsuarios(lista);

      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    fetchUsers();

  }, []);

  // 🔥 Cambiar contraseña
  async function cambiarPassword() {

    if (!uidSeleccionado || !password) {
      alert("Completa los datos");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    try {

      const res = await fetch("/api/admin/cambiar-password", {
        method: "POST",
        body: JSON.stringify({
          uid: uidSeleccionado,
          nuevaPassword: password
        })
      });

      const data = await res.json();

      if (data.ok) {
        alert("✅ Contraseña actualizada correctamente");
        setPassword("");
      } else {
        alert("❌ Error al cambiar contraseña");
      }

    } catch (error) {
      console.error(error);
      alert("❌ Error de conexión");
    }
  }

  return (

    <div className="main">

      <div className="panelTitle">
        <h1>Cambiar Contraseña</h1>
      </div>

      <div className="card">

        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (

          <>
            {/* SELECT USUARIO */}
            <select
              value={uidSeleccionado}
              onChange={(e)=>setUidSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar usuario</option>

              {usuarios.map((u)=>(
                <option key={u.uid} value={u.uid}>
                  {u.usuario} ({u.rol})
                </option>
              ))}

            </select>

            {/* NUEVA PASSWORD */}
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />

            <button className="saveBtn" onClick={cambiarPassword}>
              <KeyRound size={16}/> Cambiar Contraseña
            </button>

            <button
              className="backBtn"
              onClick={()=>router.back()}
            >
              <ArrowLeft size={16}/> Volver
            </button>
          </>
        )}

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        .panelTitle{
          background:white;
          padding:12px 20px;
          border-left:5px solid #9333ea;
          border-radius:10px;
          margin-bottom:30px;
        }

        .card{
          background:white;
          padding:30px;
          max-width:500px;
          margin:auto;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.2);
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        select, input{
          padding:10px;
          border-radius:8px;
          border:1px solid #ccc;
        }

        .saveBtn{
          background:#9333ea;
          color:white;
          border:none;
          padding:10px;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:5px;
        }

        .backBtn{
          background:#e5e7eb;
          border:none;
          padding:10px;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:5px;
        }

      `}</style>

    </div>
  );
}