"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";
import { ArrowLeft, Eye, EyeOff, User, Lock, KeyRound, Mail } from "lucide-react";
import { registrarAuditoria } from "../../lib/validationHelpers";

export default function PerfilRRHH() {
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
  function validarClave(password) {
    // mínimo 6 caracteres, letras y números
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&._-]{6,}$/;
    return regex.test(password);
  }

  // 🔥 CAMBIAR PASSWORD
  async function cambiarPassword() {
    if (!claveActual || !nuevaClave || !confirmarClave) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    if (!validarClave(nuevaClave)) {
      alert("❌ La nueva contraseña debe tener mínimo 6 caracteres, conteniendo letras y números");
      return;
    }

    if (nuevaClave !== confirmarClave) {
      alert("❌ Las nuevas contraseñas no coinciden");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, claveActual);

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nuevaClave);

      await updateDoc(doc(db, "usuarios", user.uid), {
        clave: nuevaClave
      });

      alert("✅ Contraseña actualizada correctamente");
      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/invalid-credential") {
        alert("❌ La contraseña actual es incorrecta");
      } else {
        alert("❌ Error al actualizar contraseña");
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
    return <p className="loading">Cargando perfil...</p>;
  }

  return (
    <div className="main">
      <div className="topBar">
        <button className="volverBtn" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>Mi Perfil</h1>
      </div>

      <div className="perfilCard">
        {/* INFORMACIÓN DEL USUARIO */}
        <div className="gridInfo">
          <div className="infoBox">
            <span>Nombres y Apellidos</span>
            <h3>{userData?.nombres} {userData?.apellidos}</h3>
          </div>

          <div className="infoBox">
            <span>Cédula / Ficha</span>
            <h3>
              {userData?.cedula || "-"} / 
              <strong className="ficha"> {userData?.ficha || "-"}</strong>
            </h3>
          </div>

          <div className="infoBox">
            <span>Rol en el Sistema</span>
            <h3>{userData?.rol || "-"}</h3>
          </div>

          <div className="infoBox">
            <span>Correo Electrónico</span>
            <h3>{userData?.correo || "-"}</h3>
          </div>
        </div>

        {/* CAMBIO DE CLAVE */}
        <div className="security">
          <h2>Seguridad y Contraseña</h2>
          <p>Actualiza tu clave de acceso al sistema SISCOM</p>

          <div className="inputGroup">
            <label>Contraseña Actual</label>
            <div className="passwordBox">
              <input
                type={showActual ? "text" : "password"}
                placeholder="Ingrese contraseña actual"
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
              />
              <button type="button" onClick={() => setShowActual(!showActual)}>
                {showActual ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="inputGroup">
            <label>Nueva Contraseña</label>
            <div className="passwordBox">
              <input
                type={showNueva ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
              />
              <button type="button" onClick={() => setShowNueva(!showNueva)}>
                {showNueva ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="inputGroup">
            <label>Confirmar Nueva Contraseña</label>
            <div className="passwordBox">
              <input
                type={showConfirmar ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirmar(!showConfirmar)}>
                {showConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="saveBtn" onClick={cambiarPassword}>
            <KeyRound size={18} /> Actualizar Contraseña
          </button>
        </div>

        {/* CAMBIO DE CORREO */}
        <div className="security" style={{ marginTop: "40px", borderTop: "1px solid #eee", paddingTop: "30px" }}>
          <h2>Cambiar Correo Electrónico</h2>
          <p>Actualiza tu dirección de correo electrónico vinculada a tu cuenta</p>

          <div className="inputGroup">
            <label>Nuevo Correo Electrónico</label>
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
            <label>Contraseña de Confirmación</label>
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
            <Mail size={18} /> Actualizar Correo
          </button>
        </div>
      </div>

      <style jsx>{`
        .main {
          padding: 40px;
        }

        .topBar {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
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
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .volverBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.12);
        }

        .perfilCard {
          background: white;
          padding: 40px;
          border-radius: 20px;
          max-width: 950px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .gridInfo {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .infoBox span {
          font-size: 12px;
          font-weight: 800;
          color: #888;
          text-transform: uppercase;
        }

        .infoBox h3 {
          margin-top: 8px;
          font-size: 20px;
          font-weight: 800;
          color: #1f2937;
        }

        .ficha {
          color: #e53935;
        }

        .security h2 {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .security p {
          color: #64748b;
          margin: 5px 0 25px 0;
          font-size: 14px;
        }

        .inputGroup {
          margin-bottom: 20px;
          text-align: left;
        }

        .inputGroup label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
        }

        .passwordBox {
          position: relative;
        }

        .passwordBox input {
          width: 100%;
          padding: 14px 16px;
          padding-right: 50px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          font-size: 15px;
          outline: none;
          background: white;
          transition: all 0.2s;
        }

        .passwordBox input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.15);
        }

        .passwordBox button {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .saveBtn {
          width: 100%;
          margin-top: 20px;
          background: #dc2626;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .saveBtn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        .loading {
          text-align: center;
          color: #64748b;
          padding: 30px;
        }
      `}</style>
    </div>
  );
}
