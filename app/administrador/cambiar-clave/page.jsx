"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CambiarClave() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mostrarPass, setMostrarPass] = useState(false);

  // 🔥 CARGAR USUARIOS
  useEffect(() => {

    async function cargarUsuarios() {

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
    }

    cargarUsuarios();

  }, []);

  // 🔥 CAMBIAR CONTRASEÑA
  async function cambiarPassword() {

    if (!usuarioSeleccionado || !password || !confirmarPassword) {
      alert("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {

      const res = await fetch("/api/admin/cambiar-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: usuarioSeleccionado,
          nuevaPassword: password
        })
      });

      const data = await res.json();

      if (data.ok) {

        alert("✅ Contraseña actualizada correctamente");

        setPassword("");
        setConfirmarPassword("");

      } else {

        alert("❌ Error al cambiar contraseña");

      }

    } catch (error) {

      console.error(error);
      alert("❌ Error del servidor");

    }
  }

  return (

    <div className="container">

      {/* HEADER */}

      <div className="titleBox">

        <h1>Cambiar Contraseña</h1>

        <p>
          Gestión segura de contraseñas del sistema SisCOM
        </p>

      </div>

      {/* CARD */}

      <div className="card">

        {/* USUARIO */}

        <label>Seleccionar Usuario</label>

        <select
          value={usuarioSeleccionado}
          onChange={(e)=>setUsuarioSeleccionado(e.target.value)}
        >

          <option value="">
            Seleccionar usuario
          </option>

          {usuarios.map((u)=>(

            <option key={u.uid} value={u.uid}>
              {u.email} - {u.rol}
            </option>

          ))}

        </select>

        {/* PASSWORD */}

        <label>Nueva Contraseña</label>

        <input
          type={mostrarPass ? "text" : "password"}
          placeholder="Ingrese nueva contraseña"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        {/* CONFIRMAR */}

        <label>Confirmar Contraseña</label>

        <input
          type={mostrarPass ? "text" : "password"}
          placeholder="Repita la contraseña"
          value={confirmarPassword}
          onChange={(e)=>setConfirmarPassword(e.target.value)}
        />

        {/* MOSTRAR PASSWORD */}

        <div className="showPass">

          <input
            type="checkbox"
            checked={mostrarPass}
            onChange={()=>setMostrarPass(!mostrarPass)}
          />

          <span>Mostrar contraseñas</span>

        </div>

        <small>
          La contraseña debe contener letras, números y mínimo 6 caracteres.
        </small>

        {/* BOTONES */}

        <div className="buttons">

          <button
            className="saveBtn"
            onClick={cambiarPassword}
          >
            Cambiar Contraseña
          </button>

          <button
            className="backBtn"
            onClick={()=>router.back()}
          >
            Volver
          </button>

        </div>

      </div>

      <style jsx>{`

        .container{
          padding:40px;
        }

        .titleBox{
          background:white;
          padding:20px;
          border-left:5px solid #2563eb;
          border-radius:12px;
          margin-bottom:30px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
        }

        .titleBox h1{
          font-size:28px;
          margin-bottom:5px;
        }

        .titleBox p{
          color:#666;
        }

        .card{
          background:white;
          max-width:520px;
          padding:30px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.15);

          display:flex;
          flex-direction:column;
          gap:12px;
        }

        label{
          font-weight:600;
          font-size:14px;
        }

        select,
        input{
          padding:12px;
          border-radius:8px;
          border:1px solid #ccc;
          font-size:15px;
          outline:none;
        }

        select:focus,
        input:focus{
          border-color:#2563eb;
        }

        .showPass{
          display:flex;
          align-items:center;
          gap:8px;
          margin-top:5px;
        }

        .showPass span{
          font-size:14px;
          color:#444;
        }

        small{
          color:#666;
          font-size:13px;
        }

        .buttons{
          display:flex;
          gap:10px;
          margin-top:10px;
        }

        .saveBtn{
          flex:1;
          background:#2563eb;
          color:white;
          border:none;
          padding:12px;
          border-radius:8px;
          cursor:pointer;
          font-weight:bold;
          font-size:14px;
        }

        .saveBtn:hover{
          background:#1d4ed8;
        }

        .backBtn{
          background:#e5e7eb;
          border:none;
          padding:12px 20px;
          border-radius:8px;
          cursor:pointer;
          font-weight:bold;
          font-size:14px;
        }

      `}</style>

    </div>
  );
}