"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      const correo = usuario + "@gmail.com";
      const userCredential = await signInWithEmailAndPassword(auth, correo, clave);
      const user = userCredential.user;
      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Usuario sin rol");
        return;
      }

      const rol = docSnap.data().rol.toLowerCase();
      const rutas = {
        administrador: "/administrador",
        supervisor: "/supervisor",
        "recursos humanos": "/recursos-humanos",
        "gerente": "/gerente"
      };

      const ruta = rutas[rol];
      if (ruta) {
        router.push(ruta);
      } else {
        setError("Rol no válido");
      }
    } catch (error) {
      console.error(error);
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Login del sistema</h2>
        <form onSubmit={manejarLogin}>
          <div className="input-group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </div>

          <button type="submit">Iniciar Sesión</button>
          {error && <p className="error-msg">{error}</p>}
          <p className="footer-text">
            © 2026 Planta INVECEM – Sistema de control de asistencia del comedor
          </p>
        </form>
      </div>

      <style jsx global>{`
        /* 1. RESET TOTAL */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #000;
        }

        /* 2. CONTENEDOR - PANTALLA COMPLETA Y MOVIMIENTO DE IMAGEN */
        .container {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          
          /* CONFIGURACIÓN DE IMAGEN PARA QUE SE MUEVA */
          background-image: url("/img/fondo.jpg");
          background-repeat: no-repeat;
          background-attachment: fixed;
          
          /* TRUCO: Imagen más grande que el monitor para poder desplazarla */
          background-size: 100% auto; 
          background-position: right center; /* La pega totalmente a la derecha */
        }

        /* 3. CAJA DE LOGIN */
        .login-box {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 40px;
          border-radius: 18px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          color: #000; /* Letras negras para mejor contraste */
          text-align: center;
          width: 380px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .login-box h2 {
          margin-bottom: 25px;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .input-group {
          text-align: left;
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
          font-weight: 700;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          outline: none;
          background: rgba(255, 255, 255, 0.95);
          font-size: 15px;
        }

        button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #e30613; /* Usamos el rojo corporativo */
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          background: #ff0000;
          transform: scale(1.02);
        }

        .footer-text {
          margin-top: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .container {
            background-size: cover;
            background-position: center;
          }
          .login-box {
            width: 90%;
          }
        }
      `}</style>
    </div>
  );
}