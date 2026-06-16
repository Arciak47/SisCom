"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [mostrarReset, setMostrarReset] = useState(false);
  const [correoReset, setCorreoReset] = useState("");
  const [cargandoReset, setCargandoReset] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [mostrarSimulador, setMostrarSimulador] = useState(false);
  const [claveRecuperada, setClaveRecuperada] = useState("");
  const [correoEnviado, setCorreoEnviado] = useState("");
  const [montado, setMontado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMontado(true);
  }, []);

  // LOGIN
  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      let correo = usuario.trim().toLowerCase();
      if (!correo.includes("@")) {
        correo = correo + "@gmail.com";
      }

      // LOGIN FIREBASE
      const userCredential = await signInWithEmailAndPassword(auth, correo, clave);
      const user = userCredential.user;

      // BUSCAR USUARIO
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      // NO EXISTE
      if (!docSnap.exists()) {
        setError("Usuario sin rol asignado en el sistema");
        await signOut(auth);
        setCargando(false);
        return;
      }

      const data = docSnap.data();

      // VALIDAR STATUS
      if (data.status && data.status.toLowerCase() === "inactivo") {
        setError("❌ Usuario desactivado en el sistema");
        await signOut(auth);
        setCargando(false);
        return;
      }

      // ROL
      const rol = data.rol.toLowerCase();
      const rutas = {
        administrador: "/administrador",
        supervisor: "/supervisor",
        "recursos humanos": "/recursos-humanos",
        gerente: "/gerente"
      };

      const ruta = rutas[rol];

      // REDIRECCIONAR
      if (ruta) {
        router.push(ruta);
      } else {
        setError("Rol no válido");
        await signOut(auth);
        setCargando(false);
      }
    } catch (err) {
      console.error(err);
      setError("Usuario o contraseña incorrectos");
      setCargando(false);
    }
  };

  // RECUPERAR CONTRASEÑA
  const manejarReset = async (e) => {
    e.preventDefault();
    if (!correoReset) return;
    setCargandoReset(true);
    try {
      let email = correoReset.trim();
      if (!email.includes("@")) {
        email = email.toLowerCase() + "@gmail.com";
      }

      // Buscar en Firestore el usuario para obtener la contraseña en texto plano
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("correo", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("❌ El usuario o correo ingresado no existe en el sistema.");
        setCargandoReset(false);
        return;
      }

      let passwordRecuperada = "";
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        passwordRecuperada = data.clave || "No asignada";
      });

      // Enviar el enlace oficial de recuperación de Firebase por si el correo es real
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (authErr) {
        console.warn("Fallo el envío oficial por Firebase Auth:", authErr);
      }

      setClaveRecuperada(passwordRecuperada);
      setCorreoEnviado(email);
      setMostrarReset(false);
      setMostrarSimulador(true);
      setCorreoReset("");
    } catch (err) {
      console.error(err);
      alert("❌ Error al procesar la recuperación de contraseña.");
    }
    setCargandoReset(false);
  };

  if (!montado) return null;

  return (
    <div className="login-container">
      {/* GLOW DECORATIONS */}
      <div className="glow-1" />
      <div className="glow-2" />

      {/* CONTENEDOR */}
      <div className="login-wrapper">
        
        {/* LOGO */}
        <div className="logo-box">
          <img
            src="/logo-invecem.png"
            alt="INVECEM Logo"
            className="logo-img"
          />
          <h1 className="logo-title">INVECEM</h1>
          <p className="logo-subtitle">Industria Venezolana de Cemento</p>
        </div>

        {/* CARD LOGIN */}
        <div className="login-card">
          
          <div className="card-header">
            <h2 className="card-title">
              Sis<span className="accent-red">COM</span>
            </h2>
            <p className="card-subtitle">
              Consola Ejecutiva Comedor - Planta INVECEM
            </p>
          </div>

          <form onSubmit={manejarLogin} className="login-form">
            
            {/* USUARIO */}
            <div className="input-group">
              <span className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Usuario o Correo"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="form-input"
              />
            </div>

            {/* PASSWORD */}
            <div className="input-group">
              <span className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={verClave ? "text" : "password"}
                placeholder="Contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                className="form-input password-input"
              />
              <button
                type="button"
                onClick={() => setVerClave(!verClave)}
                className="eye-toggle-btn"
              >
                {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {/* BOTÓN SUBMIT */}
            <button
              type="submit"
              disabled={cargando}
              className="submit-btn"
            >
              <span>{cargando ? "AUTENTICANDO..." : "INICIAR SESIÓN"}</span>
            </button>

          </form>

          <button 
            type="button"
            className="forgot-password-link"
            onClick={() => setMostrarReset(true)}
          >
            ¿OLVIDÓ SU CONTRASEÑA?
          </button>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="login-footer">
        <p className="footer-text">
          © 2026 PLANTA INVECEM – SISTEMA DE CONTROL DE ASISTENCIA DEL COMEDOR.
        </p>
      </footer>

      {/* MODAL RESET PASSWORD */}
      {mostrarReset && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-up">
            <h3 className="modal-title">Restablecer Contraseña</h3>
            <p className="modal-desc">
              Ingresa tu usuario del sistema (ej: juan.perez) o tu correo registrado para recuperar tu contraseña.
            </p>
            <form onSubmit={manejarReset} className="modal-form">
              <div className="input-group">
                <span className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Usuario o Correo"
                  value={correoReset}
                  onChange={(e) => setCorreoReset(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setMostrarReset(false)}
                  className="modal-cancel-btn"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={cargandoReset}
                  className="modal-submit-btn"
                >
                  {cargandoReset ? "ENVIANDO..." : "RECUPERAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR DE CORREO */}
      {mostrarSimulador && (
        <div className="modal-overlay dark-overlay">
          <div className="sim-card animate-scale-up">
            <div className="sim-header">
              <span className="sim-icon">📧</span>
              <div>
                <h3 className="sim-title">Bandeja de Entrada</h3>
                <p className="sim-badge">Simulador de Desarrollo</p>
              </div>
            </div>
            
            <div className="sim-body">
              <div className="sim-meta">
                <span className="sim-meta-label">Para:</span>
                <span className="sim-meta-value">{correoEnviado}</span>
              </div>
              <div className="sim-meta">
                <span className="sim-meta-label">De:</span>
                <span className="sim-meta-value font-mono text-rose-400">sistema-siscom@invecem.gob.ve</span>
              </div>
              <div className="sim-subject">
                <span className="sim-meta-label">Asunto:</span>
                <span className="sim-meta-value font-bold">🔑 Credenciales de Acceso - SisCOM</span>
              </div>
              <div className="sim-content">
                <p>Estimado usuario,</p>
                <p className="sim-content-text">Se ha procesado una solicitud de recuperación para tu cuenta de SisCOM. Tu contraseña de ingreso registrada en el sistema es:</p>
                <div className="sim-password-box">
                  <code className="sim-password">{claveRecuperada}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(claveRecuperada);
                      alert("✅ Contraseña copiada al portapapeles");
                    }}
                    className="sim-copy-btn"
                  >
                    COPIAR
                  </button>
                </div>
                <p className="sim-note">Por seguridad, te sugerimos cambiar esta clave una vez ingreses al sistema.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarSimulador(false)}
              className="sim-close-btn"
            >
              ENTENDIDO, VOLVER AL LOGIN
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .login-container {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          background: url('/corporate_background.png') no-repeat center center;
          background-size: cover;
          font-family: var(--font-outfit), 'Segoe UI', sans-serif;
          color: #1a202c;
          padding: 40px 16px;
          box-sizing: border-box;
        }

        .login-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(241, 245, 249, 0.82);
          pointer-events: none;
          z-index: 0;
        }

        .glow-1 {
          position: absolute;
          top: 25%;
          left: 25%;
          width: 384px;
          height: 384px;
          background: rgba(239, 68, 68, 0.04);
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .glow-2 {
          position: absolute;
          bottom: 25%;
          right: 25%;
          width: 384px;
          height: 384px;
          background: rgba(34, 211, 238, 0.04);
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .login-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 896px;
          padding: 0 16px;
          box-sizing: border-box;
        }

        .logo-box {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .logo-img {
          width: 260px;
          height: auto;
          margin-bottom: 12px;
          object-fit: contain;
          filter: drop-shadow(0 4px 10px rgba(239, 68, 68, 0.15));
        }

        .logo-title {
          font-size: 30px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.05em;
          margin: 0;
          line-height: 1.2;
        }

        .logo-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #ef4444;
          font-weight: 700;
          margin-top: 4px;
          margin-bottom: 0;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 35px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08), 0 0 1px rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.9);
          padding: 40px 48px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s ease;
        }

        .login-card:hover {
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
        }

        .card-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .card-title {
          font-size: 38px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin: 0;
          font-family: var(--font-rajdhani), sans-serif;
          line-height: 1.1;
        }

        .accent-red {
          color: #ef4444;
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
        }

        .card-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 8px;
          margin-bottom: 0;
          font-weight: 600;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          position: relative;
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 100%;
          padding: 0 16px 0 48px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          outline: none;
          font-size: 15px;
          color: #1e293b;
          font-weight: 500;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .form-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          background: #ffffff;
        }

        .password-input {
          padding-right: 48px;
        }

        .eye-toggle-btn {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
          outline: none;
        }

        .eye-toggle-btn:hover {
          color: #475569;
        }

        .error-message {
          font-size: 13px;
          color: #dc2626;
          font-weight: 700;
          text-align: center;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 10px 14px;
          border-radius: 12px;
          margin: 0;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, #ef4444 0%, #be123c 100%);
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
          outline: none;
        }

        .submit-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .forgot-password-link {
          margin-top: 24px;
          background: none;
          border: none;
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: color 0.2s;
          outline: none;
          padding: 0;
        }

        .forgot-password-link:hover {
          color: #ef4444;
        }

        .login-footer {
          margin-top: auto;
          padding: 24px 0 12px;
          width: 100%;
          text-align: center;
          z-index: 10;
        }

        .footer-text {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 0.08em;
          border-top: 1px solid rgba(226, 232, 240, 0.6);
          padding-top: 16px;
          display: inline-block;
          width: 100%;
          max-width: 576px;
          margin: 0;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }

        .dark-overlay {
          background: rgba(15, 23, 42, 0.65);
        }

        .modal-card {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 32px;
          max-width: 448px;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .modal-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 8px;
        }

        .modal-desc {
          font-size: 13px;
          color: #64748b;
          text-align: center;
          line-height: 1.6;
          margin-top: 0;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .modal-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 8px;
        }

        .modal-cancel-btn {
          flex: 1;
          height: 48px;
          background: #f1f5f9;
          color: #475569;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          outline: none;
        }

        .modal-cancel-btn:hover {
          background: #e2e8f0;
        }

        .modal-cancel-btn:active {
          transform: scale(0.97);
        }

        .modal-submit-btn {
          flex: 1;
          height: 48px;
          background: linear-gradient(135deg, #ef4444 0%, #be123c 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: filter 0.2s, transform 0.1s;
          outline: none;
        }

        .modal-submit-btn:hover {
          filter: brightness(1.08);
        }

        .modal-submit-btn:active {
          transform: scale(0.97);
        }

        .sim-card {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f1f5f9;
          border-radius: 30px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          padding: 32px;
          max-width: 448px;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .sim-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #334155;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .sim-icon {
          font-size: 24px;
        }

        .sim-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .sim-badge {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 2px 0 0;
          font-family: monospace;
          font-weight: 600;
        }

        .sim-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sim-meta {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-size: 13px;
        }

        .sim-meta-label {
          color: #94a3b8;
          font-family: monospace;
          width: 50px;
          flex-shrink: 0;
        }

        .sim-meta-value {
          color: #f1f5f9;
          font-weight: 600;
        }

        .sim-subject {
          display: flex;
          align-items: baseline;
          gap: 8px;
          border-top: 1px solid #334155;
          margin-top: 4px;
          padding-top: 8px;
          font-size: 13px;
        }

        .sim-content {
          border-top: 1px solid #334155;
          padding-top: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: #cbd5e1;
        }

        .sim-content p {
          margin: 0;
        }

        .sim-content-text {
          margin-top: 8px !important;
        }

        .sim-password-box {
          margin: 14px 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .sim-password {
          font-size: 15px;
          font-family: monospace;
          color: #22d3ee;
          font-weight: 700;
          user-select: all;
        }

        .sim-copy-btn {
          font-size: 10px;
          background: #ef4444;
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s;
          outline: none;
        }

        .sim-copy-btn:hover {
          background: #dc2626;
        }

        .sim-note {
          font-size: 10px;
          color: #64748b;
          font-family: monospace;
          margin-top: 8px !important;
        }

        .sim-close-btn {
          margin-top: 24px;
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #ef4444 0%, #be123c 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: filter 0.2s, transform 0.1s;
          outline: none;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.2);
        }

        .sim-close-btn:hover {
          filter: brightness(1.08);
        }

        .sim-close-btn:active {
          transform: scale(0.98);
        }

        .animate-scale-up {
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleUp {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* MEDIA QUERIES PARA RESPONSIVE Y ZOOM */
        @media (max-height: 680px) {
          .login-container {
            padding: 20px 16px;
          }
          .login-card {
            padding: 30px 40px;
            border-radius: 28px;
          }
          .card-header {
            margin-bottom: 24px;
          }
          .logo-box {
            margin-bottom: 16px;
          }
          .logo-img {
            width: 210px;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 30px 24px;
            border-radius: 25px;
          }
          .logo-img {
            width: 200px;
          }
          .logo-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}