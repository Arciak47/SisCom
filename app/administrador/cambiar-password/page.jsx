"use client";

import { useEffect, useState } from "react";

import { db } from "../../lib/firebase";

import {
  collection,
  getDocs
} from "firebase/firestore";

import {
  ArrowLeft,
  KeyRound,
  User2,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";

import {
  useRouter,
  useSearchParams
} from "next/navigation";

export default function CambiarPasswordAdmin() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const userId =
    searchParams.get("id");

  const [usuarios, setUsuarios] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null);

  const [password, setPassword] =
    useState("");

  const [confirmarPassword, setConfirmarPassword] =
    useState("");

  // 🔥 MOSTRAR PASSWORD
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  // 🔥 CARGAR USUARIOS
  useEffect(() => {

    async function fetchUsers() {

      try {

        const snap =
          await getDocs(
            collection(db, "usuarios")
          );

        const lista =
          snap.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          }));

        setUsuarios(lista);

        // 🔥 BUSCAR USUARIO POR ID
        if(userId){

          const usuario =
            lista.find(
              (u)=>u.uid === userId
            );

          if(usuario){

            setUsuarioSeleccionado(usuario);

          }

        }

      } catch (error) {

        console.error(error);

      }

      setLoading(false);

    }

    fetchUsers();

  }, [userId]);

  // 🔥 VALIDAR PASSWORD
  function validarPassword(password){

    // mínimo 6 caracteres
    const minimoCaracteres =
      password.length >= 6;

    // contiene letras
    const tieneLetras =
      /[a-zA-Z]/.test(password);

    // contiene números
    const tieneNumeros =
      /[0-9]/.test(password);

    return (
      minimoCaracteres &&
      tieneLetras &&
      tieneNumeros
    );

  }

  // 🔥 CAMBIAR CONTRASEÑA
  async function cambiarPassword() {

    if (!password || !confirmarPassword) {

      alert(
        "Completa todos los campos"
      );

      return;

    }

    // VALIDACION
    if(!validarPassword(password)){

      alert(
        "La contraseña debe contener letras, números y mínimo 6 caracteres"
      );

      return;

    }

    if(password !== confirmarPassword){

      alert(
        "Las contraseñas no coinciden"
      );

      return;

    }

    try {

      const res =
        await fetch(
          "/api/admin/cambiar-password",
          {
            method: "POST",

            body: JSON.stringify({

              uid: usuarioSeleccionado.uid,

              nuevaPassword: password

            })
          }
        );

      const data =
        await res.json();

      if (data.ok) {

        alert(
          "✅ Contraseña actualizada correctamente"
        );

        setPassword("");

        setConfirmarPassword("");

      } else {

        alert(
          "❌ Error al cambiar contraseña"
        );

      }

    } catch (error) {

      console.error(error);

      alert(
        "❌ Error de conexión"
      );

    }

  }

  return (

    <div className="main">

      {/* TITULO */}
      <div className="panelTitle">

        <h1>
          Cambiar Contraseña
        </h1>

      </div>

      {/* CARD */}
      <div className="card">

        {loading ? (

          <p className="loading">
            Cargando usuario...
          </p>

        ) : !usuarioSeleccionado ? (

          <p className="loading">
            Usuario no encontrado
          </p>

        ) : (

          <>

            {/* USUARIO */}
            <div className="usuarioBox">

              <div className="avatar">

                <User2 size={35}/>

              </div>

              <div>

                <span>
                  Usuario Seleccionado
                </span>

                <h2>

                  {
                    usuarioSeleccionado.nombres
                  }{" "}

                  {
                    usuarioSeleccionado.apellidos
                  }

                </h2>

                <p>
                  {
                    usuarioSeleccionado.correo
                  }
                </p>

              </div>

            </div>

            {/* REGLAS */}
            <div className="rulesBox">

              <div className="rulesTitle">

                <ShieldCheck size={18}/>

                Requisitos de la contraseña

              </div>

              <ul>

                <li>
                  Mínimo 6 caracteres
                </li>

                <li>
                  Debe contener letras
                </li>

                <li>
                  Debe contener números
                </li>

              </ul>

            </div>

            {/* NUEVA PASSWORD */}
            <div className="inputBox">

              <LockKeyhole size={18}/>

              <input
                type={
                  mostrarPassword
                  ? "text"
                  : "password"
                }
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e)=>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="showBtn"
                onClick={() =>
                  setMostrarPassword(
                    !mostrarPassword
                  )
                }
              >

                {
                  mostrarPassword
                  ? <EyeOff size={18}/>
                  : <Eye size={18}/>
                }

              </button>

            </div>

            {/* CONFIRMAR PASSWORD */}
            <div className="inputBox">

              <LockKeyhole size={18}/>

              <input
                type={
                  mostrarPassword
                  ? "text"
                  : "password"
                }
                placeholder="Confirmar contraseña"
                value={confirmarPassword}
                onChange={(e)=>
                  setConfirmarPassword(
                    e.target.value
                  )
                }
              />

            </div>

            {/* BOTONES */}
            <div className="buttonsRow">

              {/* CAMBIAR */}
              <button
                className="saveBtn"
                onClick={cambiarPassword}
              >

                <KeyRound size={18}/>

                Cambiar Contraseña

              </button>

              {/* VOLVER */}
              <button
                className="backBtn"
                onClick={()=>router.back()}
              >

                <ArrowLeft size={18}/>
                Volver

              </button>

            </div>

          </>

        )}

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        /* TITULO */
        .panelTitle{
          background:white;
          padding:14px 22px;
          border-left:5px solid #9333ea;
          border-radius:12px;
          margin-bottom:30px;
          box-shadow:0 5px 15px rgba(0,0,0,0.08);
        }

        .panelTitle h1{
          font-size:26px;
          font-weight:800;
          color:#111827;
        }

        /* CARD */
        .card{
          background:white;
          padding:35px;
          max-width:600px;
          margin:auto;
          border-radius:22px;
          box-shadow:0 15px 35px rgba(0,0,0,0.15);
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        /* USUARIO */
        .usuarioBox{
          display:flex;
          align-items:center;
          gap:15px;
          background:#f8fafc;
          border:1px solid #e5e7eb;
          padding:18px;
          border-radius:16px;
        }

        .avatar{
          width:70px;
          height:70px;
          border-radius:50%;
          background:#ede9fe;
          color:#7c3aed;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .usuarioBox span{
          font-size:13px;
          color:#6b7280;
        }

        .usuarioBox h2{
          margin-top:3px;
          font-size:22px;
          color:#111827;
        }

        .usuarioBox p{
          margin-top:4px;
          color:#6b7280;
          font-size:14px;
        }

        /* REGLAS */
        .rulesBox{
          background:#faf5ff;
          border:1px solid #e9d5ff;
          padding:18px;
          border-radius:14px;
        }

        .rulesTitle{
          display:flex;
          align-items:center;
          gap:8px;
          font-weight:700;
          color:#7e22ce;
          margin-bottom:10px;
        }

        .rulesBox ul{
          margin:0;
          padding-left:18px;
          color:#4b5563;
          font-size:14px;
          line-height:1.8;
        }

        /* INPUT */
        .inputBox{
          display:flex;
          align-items:center;
          gap:10px;
          border:1px solid #d1d5db;
          padding:14px;
          border-radius:12px;
          background:white;
        }

        .inputBox input{
          flex:1;
          border:none;
          outline:none;
          font-size:15px;
        }

        .showBtn{
          border:none;
          background:none;
          cursor:pointer;
          color:#6b7280;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        /* BOTONES */
        .buttonsRow{
          display:flex;
          gap:12px;
          margin-top:10px;
        }

        .saveBtn{
          flex:1;
          background:#9333ea;
          color:white;
          border:none;
          padding:14px;
          border-radius:12px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          font-size:15px;
          font-weight:700;
          transition:.2s;
        }

        .saveBtn:hover{
          transform:translateY(-2px);
          background:#7e22ce;
        }

        .backBtn{
          background:#111827;
          color:white;
          border:none;
          padding:14px 20px;
          border-radius:12px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          font-size:15px;
          font-weight:700;
          transition:.2s;
        }

        .backBtn:hover{
          transform:translateY(-2px);
          background:#1f2937;
        }

        .loading{
          text-align:center;
          color:#666;
          padding:20px;
        }

        @media(max-width:600px){

          .buttonsRow{
            flex-direction:column;
          }

        }

      `}</style>

    </div>

  );

}