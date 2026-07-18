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
  reauthenticateWithCredential,
  updateEmail
} from "firebase/auth";

import {
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react";

import { registrarAuditoria } from "../../lib/validationHelpers";

export default function PerfilSupervisor() {

  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [claveActual, setClaveActual] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [claveCorreo, setClaveCorreo] = useState("");
  const [showClaveCorreo, setShowClaveCorreo] = useState(false);

  useEffect(() => {

    async function cargarPerfil() {

      try {

        const user = auth.currentUser;

        if (!user) return;

        const docRef =
          doc(db, "usuarios", user.uid);

        const snap =
          await getDoc(docRef);

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

  function validarClave(password) {

    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]{8,}$/;

    return regex.test(password);

  }

  async function cambiarPassword() {

    if (
      !claveActual ||
      !nuevaClave ||
      !confirmarClave
    ) {

      alert("⚠️ Completa todos los campos");
      return;

    }

    if (!validarClave(nuevaClave)) {

      alert(
        "❌ La nueva contraseña debe tener mínimo 8 caracteres, letras, números y símbolos"
      );

      return;

    }

    if (nuevaClave !== confirmarClave) {

      alert(
        "❌ Las nuevas contraseñas no coinciden"
      );

      return;

    }

    try {

      const user =
        auth.currentUser;

      const credential =
        EmailAuthProvider.credential(
          user.email,
          claveActual
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      await updatePassword(
        user,
        nuevaClave
      );

      await updateDoc(
        doc(db, "usuarios", user.uid),
        {
          clave: nuevaClave
        }
      );

      alert(
        "✅ Contraseña actualizada correctamente"
      );

      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");

    } catch (error) {

      console.error(error);

      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        alert(
          "❌ La contraseña actual es incorrecta"
        );

      } else {

        alert(
          "❌ Error al actualizar contraseña"
        );

      }

    }

  }

  async function cambiarCorreo() {
    if (!nuevoCorreo || !claveCorreo) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoCorreo)) {
      alert("❌ Ingrese un correo electrónico válido");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const credential = EmailAuthProvider.credential(user.email, claveCorreo);
      await reauthenticateWithCredential(user, credential);

      // Actualizar en Firebase Auth
      await updateEmail(user, nuevoCorreo);

      // Actualizar en Firestore
      await updateDoc(doc(db, "usuarios", user.uid), {
        correo: nuevoCorreo
      });

      // Auditoría
      try {
        await registrarAuditoria(
          "Actualización de Perfil - Correo",
          `El usuario actualizó su correo electrónico de ${user.email} a ${nuevoCorreo}`
        );
      } catch (auditErr) {
        console.error("Error al registrar auditoría de correo:", auditErr);
      }

      alert("✅ Correo electrónico actualizado correctamente");

      setUserData(prev => prev ? { ...prev, correo: nuevoCorreo } : prev);
      setNuevoCorreo("");
      setClaveCorreo("");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/invalid-credential") {
        alert("❌ La contraseña es incorrecta");
      } else if (error.code === "auth/email-already-in-use") {
        alert("❌ El correo ingresado ya está en uso por otra cuenta");
      } else if (error.code === "auth/requires-recent-login") {
        alert("❌ Por seguridad, inicie sesión nuevamente para realizar este cambio");
      } else {
        alert("❌ Error al actualizar el correo electrónico: " + error.message);
      }
    }
  }

  if (loading) {

    return <p>Cargando perfil...</p>;

  }

  return (

    <div className="main">

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

      <div className="perfilCard">

        <div className="gridInfo">

          <div className="infoBox">

            <span>
              NOMBRES Y APELLIDOS
            </span>

            <h3>
              {userData?.nombres} {userData?.apellidos}
            </h3>

          </div>

          <div className="infoBox">

            <span>
              CÉDULA / FICHA
            </span>

            <h3>
              {userData?.cedula || "-"} /
              <strong className="ficha">
                {" "}
                {userData?.ficha || "-"}
              </strong>
            </h3>

          </div>

          <div className="infoBox">

            <span>
              ROL EN EL SISTEMA
            </span>

            <h3>
              {userData?.rol || "-"}
            </h3>

          </div>

          <div className="infoBox">

            <span>
              CORREO ELECTRÓNICO
            </span>

            <h3>
              {userData?.correo || "-"}
            </h3>

          </div>

        </div>

        <div className="security">

          <h2>
            Seguridad y Contraseña
          </h2>

          <p>
            Actualiza tu clave de acceso al sistema SISCOM
          </p>

          {/* CONTRASEÑA ACTUAL */}
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
        : <Eye size={18}/>
      }

    </button>

  </div>

</div>

{/* NUEVA CONTRASEÑA */}
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
        : <Eye size={18}/>
      }

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
        : <Eye size={18}/>
      }

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

{/* CAMBIO DE CORREO */}
<div className="security" style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "30px" }}>

  <h2>
    Cambiar Correo Electrónico
  </h2>

  <p>
    Actualiza tu dirección de correo electrónico vinculada a tu cuenta
  </p>

  <div className="inputGroup">
    <label>NUEVO CORREO ELECTRÓNICO</label>
    <div className="passwordBox">
      <input
        type="email"
        placeholder="Ingrese el nuevo correo electrónico"
        value={nuevoCorreo}
        onChange={(e) => setNuevoCorreo(e.target.value)}
        style={{ paddingRight: "16px" }}
      />
    </div>
  </div>

  <div className="inputGroup">
    <label>CONTRASEÑA DE CONFIRMACIÓN</label>
    <div className="passwordBox">
      <input
        type={showClaveCorreo ? "text" : "password"}
        placeholder="Ingrese su contraseña actual"
        value={claveCorreo}
        onChange={(e) => setClaveCorreo(e.target.value)}
      />
      <button type="button" onClick={() => setShowClaveCorreo(!showClaveCorreo)}>
        {showClaveCorreo ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>

  <button className="saveBtn" onClick={cambiarCorreo}>
    ACTUALIZAR CORREO
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
    grid-template-columns:
      repeat(auto-fit,minmax(280px,1fr));
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

  @media(max-width:768px){

    .main{
      padding:20px;
    }

    .perfilCard{
      padding:25px;
    }

    .topBar{
      flex-direction:column;
      align-items:flex-start;
    }

    .topBar h1{
      font-size:30px;
    }

  }

`}</style>

</div>

);

}