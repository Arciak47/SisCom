"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";

import {
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";

export default function PerfilAdministrador() {

  const router = useRouter();

  const [userData, setUserData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [claveActual, setClaveActual] = useState("");

  const [nuevaClave, setNuevaClave] = useState("");

  const [confirmarClave, setConfirmarClave] = useState("");

  const [showActual, setShowActual] = useState(false);

  const [showNueva, setShowNueva] = useState(false);

  const [showConfirmar, setShowConfirmar] = useState(false);

  // 🔥 CARGAR PERFIL
  useEffect(() => {

    async function cargarPerfil() {

      try {

        const user = auth.currentUser;

        if (!user) return;

        const docRef = doc(db, "usuarios", user.uid);

        const snap = await getDoc(docRef);

        if (snap.exists()) {

          setUserData(snap.data());

        }

      } catch (error) {

        console.error(error);

      }

      setLoading(false);

    }

    cargarPerfil();

  }, []);

  // 🔥 VALIDAR CONTRASEÑA
  function validarClave(password){

    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]{8,}$/;

    return regex.test(password);

  }

  // 🔥 CAMBIAR PASSWORD
  async function cambiarPassword(){

    if(
      !claveActual ||
      !nuevaClave ||
      !confirmarClave
    ){
      alert("⚠️ Completa todos los campos");
      return;
    }

    if(!validarClave(nuevaClave)){

      alert(
        "❌ La nueva contraseña debe tener mínimo 8 caracteres, letras, números y símbolos"
      );

      return;

    }

    if(nuevaClave !== confirmarClave){

      alert("❌ Las nuevas contraseñas no coinciden");

      return;

    }

    try {

      const user = auth.currentUser;

      const credential =
        EmailAuthProvider.credential(
          user.email,
          claveActual
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      await updatePassword(user, nuevaClave);

      await updateDoc(
        doc(db, "usuarios", user.uid),
        {
          clave: nuevaClave
        }
      );

      alert("✅ Contraseña actualizada correctamente");

      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");

    } catch (error) {

      console.error(error);

      if(
        error.code ===
        "auth/invalid-credential"
      ){

        alert("❌ La contraseña actual es incorrecta");

      }else{

        alert("❌ Error al actualizar contraseña");

      }

    }

  }

  if(loading){

    return <p>Cargando perfil...</p>;

  }

  return (

    <div className="main">

      {/* HEADER */}
      <div className="topBar">

        <button
          className="volverBtn"
          onClick={() => router.back()}
        >

          <ArrowLeft size={18}/>
          Volver

        </button>

        <h1>
          Mi Perfil
        </h1>

      </div>

      {/* CARD */}
      <div className="perfilCard">

        {/* INFORMACIÓN */}
        <div className="gridInfo">

          <div className="infoBox">

            <span>NOMBRES Y APELLIDOS</span>

            <h3>
              {userData?.nombres} {userData?.apellidos}
            </h3>

          </div>

          <div className="infoBox">

            <span>CÉDULA / FICHA</span>

            <h3>
              {userData?.cedula || "-"} /
              <strong className="ficha">
                {" "} {userData?.ficha || "-"}
              </strong>
            </h3>

          </div>

          <div className="infoBox">

            <span>ROL EN EL SISTEMA</span>

            <h3>
              {userData?.rol || "-"}
            </h3>

          </div>

          <div className="infoBox">

            <span>CORREO ELECTRÓNICO</span>

            <h3>
              {userData?.correo || "-"}
            </h3>

          </div>

        </div>

        {/* SEGURIDAD */}
        <div className="security">

          <h2>
            Seguridad y Contraseña
          </h2>

          <p>
            Actualiza tu clave de acceso al sistema SISCOM
          </p>

          {/* ACTUAL */}
          <div className="inputGroup">

            <label>
              CONTRASEÑA ACTUAL
            </label>

            <div className="passwordBox">

              <input
                type={showActual ? "text" : "password"}
                placeholder="Ingrese contraseña actual"
                value={claveActual}
                onChange={(e)=>
                  setClaveActual(e.target.value)
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowActual(!showActual)
                }
              >

                {showActual
                  ? <EyeOff size={18}/>
                  : <Eye size={18}/>}

              </button>

            </div>

          </div>

          {/* NUEVA */}
          <div className="inputGroup">

            <label>
              NUEVA CONTRASEÑA
            </label>

            <div className="passwordBox">

              <input
                type={showNueva ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={nuevaClave}
                onChange={(e)=>
                  setNuevaClave(e.target.value)
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowNueva(!showNueva)
                }
              >

                {showNueva
                  ? <EyeOff size={18}/>
                  : <Eye size={18}/>}

              </button>

            </div>

          </div>

          {/* CONFIRMAR */}
          <div className="inputGroup">

            <label>
              CONFIRMAR NUEVA CONTRASEÑA
            </label>

            <div className="passwordBox">

              <input
                type={showConfirmar ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmarClave}
                onChange={(e)=>
                  setConfirmarClave(e.target.value)
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmar(!showConfirmar)
                }
              >

                {showConfirmar
                  ? <EyeOff size={18}/>
                  : <Eye size={18}/>}

              </button>

            </div>

          </div>

          <button
            className="saveBtn"
            onClick={cambiarPassword}
          >

            ACTUALIZAR CONTRASEÑA

          </button>

        </div>

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        .topBar{
          display:flex;
          align-items:center;
          gap:20px;
          margin-bottom:25px;
        }

        .topBar h1{
          font-size:38px;
          font-weight:800;
        }

        .volverBtn{
          border:none;
          background:white;
          padding:10px 18px;
          border-radius:10px;
          display:flex;
          align-items:center;
          gap:8px;
          cursor:pointer;
          font-weight:600;
          box-shadow:0 4px 10px rgba(0,0,0,0.1);
        }

        .perfilCard{
          background:white;
          padding:40px;
          border-radius:20px;
          max-width:950px;
          box-shadow:0 10px 30px rgba(0,0,0,0.15);
        }

        .gridInfo{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
          gap:30px;
          margin-bottom:40px;
        }

        .infoBox span{
          font-size:12px;
          font-weight:800;
          color:#888;
        }

        .infoBox h3{
          margin-top:8px;
          font-size:28px;
          font-weight:800;
          text-transform:uppercase;
        }

        .ficha{
          color:#e53935;
        }

        .security h2{
          font-size:34px;
          font-weight:800;
        }

        .security p{
          color:#777;
          margin-bottom:30px;
        }

        .inputGroup{
          margin-bottom:22px;
        }

        .inputGroup label{
          display:block;
          margin-bottom:8px;
          font-size:13px;
          font-weight:800;
        }

        .passwordBox{
          position:relative;
        }

        .passwordBox input{
          width:100%;
          padding:16px;
          padding-right:55px;
          border-radius:12px;
          border:2px solid #e5e7eb;
          font-size:15px;
          outline:none;
        }

        .passwordBox input:focus{
          border-color:#e53935;
        }

        .passwordBox button{
          position:absolute;
          right:15px;
          top:50%;
          transform:translateY(-50%);
          border:none;
          background:none;
          cursor:pointer;
          color:#666;
        }

        .saveBtn{
          width:100%;
          margin-top:20px;
          background:#c8102e;
          color:white;
          border:none;
          padding:16px;
          border-radius:12px;
          font-size:15px;
          font-weight:800;
          cursor:pointer;
          transition:.2s;
        }

        .saveBtn:hover{
          transform:scale(1.02);
          background:#a80d26;
        }

      `}</style>

    </div>

  );

}