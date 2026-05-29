"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  KeyRound,
  Shield,
  Mail,
  User2,
  Phone,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  IdCard
} from "lucide-react";

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

  // 🔥 OBTENER USUARIO
  const usuarioData = usuarios.find(
    (u) => u.uid === usuarioSeleccionado
  );

  // 🔥 VALIDAR PASSWORD
  function validarPassword(pass) {

    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

    return regex.test(pass);

  }

  // 🔥 CAMBIAR PASSWORD
  async function cambiarPassword() {

    if (!usuarioSeleccionado || !password || !confirmarPassword) {

      alert("❌ Completa todos los campos");
      return;

    }

    if (!validarPassword(password)) {

      alert(
        "❌ La contraseña debe contener letras, números y mínimo 6 caracteres"
      );

      return;

    }

    if (password !== confirmarPassword) {

      alert("❌ Las contraseñas no coinciden");
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

        <h1>
          Cambiar Contraseña
        </h1>

      </div>

      {/* CARD */}

      <div className="card">

        {/* SELECT */}

        <div className="inputGroup">

          <label>
            Seleccionar Usuario
          </label>

          <select
            value={usuarioSeleccionado}
            onChange={(e)=>
              setUsuarioSeleccionado(e.target.value)
            }
          >

            <option value="">
              Seleccionar usuario
            </option>

            {usuarios.map((u)=>(

              <option
                key={u.uid}
                value={u.uid}
              >

                {u.nombres} {u.apellidos}

              </option>

            ))}

          </select>

        </div>

        {/* INFO USUARIO */}

        {usuarioData && (

          <div className="infoContainer">

            <div className="perfilHeader">

              <div className="perfilCircle">

                <User2 size={35}/>

              </div>

              <div>

                <h2>
                  {usuarioData.nombres} {usuarioData.apellidos}
                </h2>

                <p>
                  Información completa del usuario
                </p>

              </div>

            </div>

            <div className="infoGrid">

              <div className="infoCard">

                <span>
                  <Mail size={14}/>
                  Correo
                </span>

                <strong>
                  {usuarioData.correo || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <Shield size={14}/>
                  Rol
                </span>

                <strong>
                  {usuarioData.rol || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <BadgeCheck size={14}/>
                  Cédula
                </span>

                <strong>
                  {usuarioData.cedula || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <Phone size={14}/>
                  Teléfono
                </span>

                <strong>
                  {usuarioData.telefono || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <IdCard size={14}/>
                  Número de Ficha
                </span>

                <strong>
                  {usuarioData.ficha || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <BriefcaseBusiness size={14}/>
                  Cargo
                </span>

                <strong>
                  {usuarioData.cargo || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <Building2 size={14}/>
                  Departamento
                </span>

                <strong>
                  {usuarioData.departamento || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>
                  <CalendarDays size={14}/>
                  Fecha de Ingreso
                </span>

                <strong>
                  {usuarioData.fechaIngreso || "-"}
                </strong>

              </div>

              <div className="infoCard">

                <span>Status</span>

                <strong className={
                  usuarioData.status === "activo"
                  ? "activo"
                  : "inactivo"
                }>

                  {usuarioData.status || "-"}

                </strong>

              </div>

            </div>

          </div>

        )}

        {/* PASSWORD */}

        <div className="inputGroup">

          <label>
            Nueva Contraseña
          </label>

          <input
            type={mostrarPass ? "text" : "password"}
            placeholder="Ingrese nueva contraseña"
            value={password}
            onChange={(e)=>
              setPassword(e.target.value)
            }
          />

        </div>

        {/* CONFIRMAR */}

        <div className="inputGroup">

          <label>
            Confirmar Contraseña
          </label>

          <input
            type={mostrarPass ? "text" : "password"}
            placeholder="Repita la contraseña"
            value={confirmarPassword}
            onChange={(e)=>
              setConfirmarPassword(e.target.value)
            }
          />

        </div>

        {/* MOSTRAR */}

        <div className="showPass">

          <input
            type="checkbox"
            checked={mostrarPass}
            onChange={()=>
              setMostrarPass(!mostrarPass)
            }
          />

          <span>
            Mostrar contraseñas
          </span>

        </div>

        {/* REGLAS */}

        <div className="passwordInfo">

          La contraseña debe contener:
          <ul>
            <li>Mínimo 6 caracteres</li>
            <li>Al menos una letra</li>
            <li>Al menos un número</li>
          </ul>

        </div>

        {/* BOTONES */}

        <div className="buttons">

          <button
            className="saveBtn"
            onClick={cambiarPassword}
          >

            <KeyRound size={17}/>
            Cambiar Contraseña

          </button>

          <button
            className="backBtn"
            onClick={()=>router.back()}
          >

            <ArrowLeft size={17}/>
            Volver

          </button>

        </div>

      </div>

      <style jsx>{`

        .container{
          padding:40px;
        }

        /* HEADER */

        .titleBox{
          background:white;
          padding:20px 25px;
          border-left:5px solid #dc2626;
          border-radius:14px;
          margin-bottom:30px;
          box-shadow:0 5px 18px rgba(0,0,0,0.12);
        }

        .titleBox h1{
          font-size:28px;
          margin:0;
          color:#111827;
          font-weight:700;
        }

        /* CARD */

        .card{
          background:white;
          max-width:950px;
          padding:30px;
          border-radius:20px;
          box-shadow:0 10px 30px rgba(0,0,0,0.15);

          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .inputGroup{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        label{
          font-size:14px;
          font-weight:700;
          color:#111827;
        }

        select,
        input{
          padding:13px;
          border-radius:10px;
          border:1px solid #d1d5db;
          font-size:14px;
          outline:none;
          transition:.2s;
          background:white;
        }

        select:focus,
        input:focus{
          border-color:#dc2626;
          box-shadow:0 0 0 3px rgba(220,38,38,0.15);
        }

        /* INFO USUARIO */

        .infoContainer{
          background:#f8fafc;
          border-radius:18px;
          padding:25px;
          border:1px solid #e5e7eb;
        }

        .perfilHeader{
          display:flex;
          align-items:center;
          gap:15px;
          margin-bottom:25px;
        }

        .perfilCircle{
          width:70px;
          height:70px;
          border-radius:50%;
          background:#fee2e2;
          color:#dc2626;

          display:flex;
          align-items:center;
          justify-content:center;
        }

        .perfilHeader h2{
          margin:0;
          font-size:24px;
          color:#111827;
        }

        .perfilHeader p{
          margin-top:5px;
          color:#666;
        }

        .infoGrid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
          gap:15px;
        }

        .infoCard{
          background:white;
          padding:16px;
          border-radius:14px;
          border:1px solid #e5e7eb;
          transition:.2s;
        }

        .infoCard:hover{
          transform:translateY(-2px);
          box-shadow:0 8px 20px rgba(0,0,0,0.08);
        }

        .infoCard span{
          display:flex;
          align-items:center;
          gap:6px;
          font-size:12px;
          color:#666;
          margin-bottom:8px;
        }

        .infoCard strong{
          font-size:15px;
          color:#111827;
          word-break:break-word;
        }

        .activo{
          color:#15803d;
        }

        .inactivo{
          color:#dc2626;
        }

        /* PASSWORD */

        .showPass{
          display:flex;
          align-items:center;
          gap:8px;
        }

        .showPass span{
          font-size:14px;
          color:#444;
        }

        .passwordInfo{
          background:#fef2f2;
          border:1px solid #fecaca;
          color:#991b1b;
          padding:14px;
          border-radius:12px;
          font-size:14px;
        }

        .passwordInfo ul{
          margin-top:8px;
          padding-left:18px;
        }

        .passwordInfo li{
          margin-bottom:5px;
        }

        /* BOTONES */

        .buttons{
          display:flex;
          gap:12px;
          margin-top:10px;
        }

        .saveBtn{
          flex:1;
          background:#dc2626;
          color:white;
          border:none;
          padding:13px;
          border-radius:10px;
          cursor:pointer;
          font-size:14px;
          font-weight:700;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;

          transition:.2s;
        }

        .saveBtn:hover{
          background:#b91c1c;
          transform:scale(1.02);
        }

        .backBtn{
          background:#111827;
          color:white;
          border:none;
          padding:13px 22px;
          border-radius:10px;
          cursor:pointer;
          font-size:14px;
          font-weight:700;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;

          transition:.2s;
        }

        .backBtn:hover{
          background:#1f2937;
          transform:scale(1.02);
        }

        /* RESPONSIVE */

        @media(max-width:768px){

          .container{
            padding:20px;
          }

          .buttons{
            flex-direction:column;
          }

        }

      `}</style>

    </div>
  );
}