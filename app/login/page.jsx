"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [montado, setMontado] = useState(false);

  const router = useRouter();

  // Evita errores de hidratación esperando a que el componente cargue en el cliente
  useEffect(() => {
    setMontado(true);
  }, []);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const correo = usuario.trim().toLowerCase() + "@gmail.com";
      const userCredential = await signInWithEmailAndPassword(auth, correo, clave);
      const user = userCredential.user;

      const docRef = doc(db, "usuarios", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Usuario sin rol asignado");
        setCargando(false);
        return;
      }

      const rol = docSnap.data().rol.toLowerCase();
      const rutas = {
        administrador: "/administrador",
        supervisor: "/supervisor",
        "recursos humanos": "/recursos-humanos",
        gerente: "/gerente"
      };

      const ruta = rutas[rol];
      if (ruta) {
        router.push(ruta);
      } else {
        setError("Rol no válido");
        setCargando(false);
      }
    } catch (err) {
      console.error(err);
      setError("Usuario o contraseña incorrectos");
      setCargando(false);
    }
  };

  if (!montado) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans">
      
      {/* FONDO: Usando tu imagen background.png */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4 py-8">
        
        {/* LOGO SUPERIOR */}
        <div className="mb-10 flex flex-col items-center text-center">
          <img 
            src="/logo-invecem.png" 
            alt="INVECEM Logo" 
            className="w-56 md:w-64 mb-4 object-contain" 
          />
          <h1 className="text-4xl font-black text-[#333] tracking-tighter leading-none">INVECEM</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-2">
            Industria Venezolana de Cemento
          </p>
        </div>

        {/* TARJETA DE LOGIN */}
        <div className="w-full max-w-[420px] bg-white rounded-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-10 md:p-14 flex flex-col items-center">
          
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold tracking-tight text-[#444]">
              Sis<span className="text-[#e31e24]">COM</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Sistema de Comedor - Planta INVECEM
            </p>
          </div>

          <form onSubmit={manejarLogin} className="w-full space-y-5">
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 outline-none text-gray-700"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type="password"
                placeholder="Contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 outline-none text-gray-700"
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#e31e24] hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              <span>{cargando ? "Entrando..." : "Iniciar Sesión"}</span>
            </button>
          </form>

          <button className="mt-8 text-sm text-gray-400 hover:text-red-600 font-medium">
            ¿Olvido su contraseña?
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto py-8 w-full text-center z-10">
        <p className="text-[11px] text-gray-500 font-medium border-t border-gray-100 pt-6 inline-block w-full max-w-2xl">
          © 2026 Planta INVECEM – Sistema de control de asistencia del comedor.
        </p>
      </footer>
    </div>
  );
}