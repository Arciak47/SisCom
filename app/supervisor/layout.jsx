"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";

import {
  Home, ClipboardCheck, FileText,
  ChevronDown, ChevronRight, LogOut,
  UserCircle2, UtensilsCrossed, MessageSquare, Sun, Moon
} from "lucide-react";

export default function SupervisorLayout({ children }) {

  const router = useRouter();
  const [nombreSupervisor, setNombreSupervisor] = useState("Cargando...");
  const [authorized, setAuthorized] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [mensajesSinLeer, setMensajesSinLeer] = useState(0);
  const [toast, setToast] = useState(null);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playBeep(587.33, now, 0.15);
      playBeep(880.00, now + 0.18, 0.2);
    } catch (e) {
      console.error("Error playing audio notification:", e);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!authorized || !auth.currentUser) return;
    const user = auth.currentUser;
    const q = query(
      collection(db, "mensajes"),
      where("receptorId", "==", user.uid),
      where("leido", "==", false)
    );
    let isFirstLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;
      setMensajesSinLeer(count);
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msgData = change.doc.data();
          if (!window.location.pathname.endsWith("/chat")) {
            setToast(msgData);
            playNotificationSound();
          }
        }
      });
    });
    return () => unsubscribe();
  }, [authorized]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    } else {
      setIsDarkMode(false);
      document.body.classList.remove("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      setIsDarkMode(false);
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    } else {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.rol?.toLowerCase() === "supervisor") {
              setNombreSupervisor(`${data.nombres || ""} ${data.apellidos || ""}`);
              setAuthorized(true);
              return;
            }
          }
        } catch (e) { console.log(e); }
      }
      router.push("/login");
    });
    return () => unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!authorized) {
    return (
      <div style={{ display:"flex", height:"100vh", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ border:"3px solid #e2e8f0", borderTop:"3px solid #e53e3e", borderRadius:"50%", width:"38px", height:"38px", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <p style={{ color:"#718096", fontWeight:600, fontSize:"14px" }}>Verificando credenciales…</p>
          <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-layout">
      {toast && (
        <div className="sl-toast" onClick={() => {
          const role = window.location.pathname.split('/')[1] || "supervisor";
          router.push(`/${role}/chat`);
          setToast(null);
        }}>
          <div className="sl-toast-icon">
            <MessageSquare size={20} color="#fff" />
          </div>
          <div className="sl-toast-content">
            <h4 className="sl-toast-title">Nuevo mensaje de {toast.emisorNombre}</h4>
            <p className="sl-toast-desc">{toast.mensaje || "Archivo adjunto"}</p>
          </div>
          <button className="sl-toast-close" onClick={(e) => {
            e.stopPropagation();
            setToast(null);
          }}>
            &times;
          </button>
        </div>
      )}

      {/* Mobile Topbar */}
      <header className="sl-mobile-header">
        <button className="sl-menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <div className="sl-mobile-logo">
          <span className="sl-sis">Sis</span><span className="sl-com">COM</span>
        </div>
        <button className="sl-mobile-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {menuAbierto && (
        <div className="sl-backdrop" onClick={() => setMenuAbierto(false)} />
      )}

      <aside className={`sl-sidebar ${menuAbierto ? "open" : ""}`}>
        <div className="sl-top">
          <div className="sl-logo">
            <Image src="/logo-invecem-gerente.png" width={108} height={54} alt="INVECEM"/>
            <h2 className="sl-brand">
              <span className="sl-sis">Sis</span><span className="sl-com">COM</span>
            </h2>
            <span className="sl-role-tag">SUPERVISOR</span>
          </div>

          <nav className="sl-nav">

            <a className="sl-item" onClick={() => { router.push("/supervisor"); setMenuAbierto(false); }}>
              <Home size={18}/><span>Dashboard</span>
            </a>

            <a className="sl-item" onClick={() => { router.push("/supervisor/registrar"); setMenuAbierto(false); }}>
              <ClipboardCheck size={18}/><span>Registrar Asistencia</span>
            </a>

             <a className="sl-item" onClick={() => { router.push("/supervisor/chat"); setMenuAbierto(false); }}>
              <MessageSquare size={18}/>
              <span>Mensajería</span>
              {mensajesSinLeer > 0 && (
                <span className="unread-badge">{mensajesSinLeer}</span>
              )}
            </a>

            <a className="sl-item" onClick={() => { router.push("/supervisor/perfil"); setMenuAbierto(false); }}>
              <UserCircle2 size={18}/><span>Mi Perfil</span>
            </a>

          </nav>
        </div>

        <div className="sl-bottom">
          <div className="sl-user">
            <Image src="/perfil-gerente.png" width={40} height={40} alt="perfil"/>
            <div>
              <p className="sl-uname">{nombreSupervisor}</p>
              <span className="sl-urole">Supervisor Comedor</span>
            </div>
          </div>
          <button className="sl-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>
          <button className="sl-logout" onClick={cerrarSesion}>
            <LogOut size={16}/><span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="sl-main">
        {children}
      </main>

      <style jsx>{`
        .sl-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        .sl-sidebar {
          width: 255px;
          flex-shrink: 0;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow-y: auto;
          z-index: 20;
          box-shadow: 4px 0 20px rgba(102,126,234,0.06);
        }
        .sl-top {
          display: flex;
          flex-direction: column;
          padding: 24px 16px 0;
          gap: 20px;
        }
        .sl-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          gap: 4px;
        }
        .sl-brand {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 1px;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 2px 0 0;
        }
        .sl-sis { color: var(--text-primary); }
        .sl-com { color: #e53e3e; }
        .sl-role-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.5px;
          color: #e53e3e;
          background: rgba(229,62,62,0.07);
          border: 1px solid rgba(229,62,62,0.15);
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .sl-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sl-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border: 1px solid transparent;
        }
        .sl-item:hover {
          background: linear-gradient(90deg, rgba(229,62,62,0.06) 0%, transparent 100%);
          color: #e53e3e;
          border-color: rgba(229,62,62,0.1);
        }
        .sl-item span { flex: 1; }
        .sl-has-sub { justify-content: space-between; }
        .sl-item-left { display: flex; align-items: center; gap: 11px; }
        .sl-sub {
          margin-left: 30px;
          padding-left: 14px;
          border-left: 2px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sl-sub a {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.15s;
        }
        .sl-sub a:hover {
          color: #e53e3e;
          background: rgba(229,62,62,0.05);
        }
        .sl-bottom {
          padding: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sl-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .sl-uname {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .sl-urole {
          font-size: 10px;
          color: #e53e3e;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sl-theme-toggle {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s;
          font-family: var(--font-outfit), sans-serif;
          margin-bottom: 4px;
        }
        .sl-theme-toggle:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }
        .sl-logout {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1px solid rgba(229,62,62,0.15);
          background: rgba(229,62,62,0.06);
          color: #e53e3e;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.18s;
          font-family: var(--font-outfit), sans-serif;
        }
        .sl-logout:hover {
          background: #e53e3e;
          color: #fff;
          border-color: #e53e3e;
          box-shadow: 0 4px 14px rgba(229,62,62,0.25);
        }
        .sl-main {
          flex: 1;
          overflow-y: auto;
          padding: 32px 36px;
          position: relative;
          z-index: 1;
          background: linear-gradient(var(--main-overlay, rgba(248, 250, 252, 0.88)), var(--main-overlay, rgba(248, 250, 252, 0.88))), url('/corporate_background.png') no-repeat center center;
          background-size: cover;
          background-attachment: fixed;
        }

        /* Responsive Layout classes */
        .sl-mobile-header {
          display: none;
        }
        .sl-mobile-theme-toggle {
          display: none;
        }
        .sl-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .sl-layout {
            flex-direction: column;
          }
          .sl-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 60px;
            background: var(--sidebar-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 0 16px;
            position: sticky;
            top: 0;
            z-index: 30;
            flex-shrink: 0;
          }
          .sl-menu-toggle {
            background: none;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }
          .sl-menu-toggle:hover {
            background: var(--bg-secondary);
          }
          .sl-mobile-theme-toggle {
            background: none;
            border: none;
            color: var(--text-primary);
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            width: 32px;
            height: 32px;
            z-index: 10;
          }
          .sl-mobile-theme-toggle:hover {
            background: var(--bg-secondary);
          }
          .sl-mobile-logo {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            font-size: 22px;
            font-weight: 950;
            font-family: var(--font-rajdhani), sans-serif;
          }
          .sl-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 40;
            height: 100vh;
            border-right: 1px solid #cbd5e1;
          }
          .sl-sidebar.open {
            transform: translateX(0);
          }
          .sl-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 35;
          }
          .sl-main {
            padding: 20px 16px;
            height: calc(100vh - 60px);
            overflow-x: hidden;
          }
        }

        .unread-badge {
          background-color: #e53e3e;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 9999px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          box-shadow: 0 2px 5px rgba(229, 62, 62, 0.3);
        }

        .sl-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          background: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 320px;
          cursor: pointer;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }
        .sl-toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 10px 12px -6px rgba(0, 0, 0, 0.15);
        }
        .sl-toast-icon {
          background: #e53e3e;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sl-toast-content {
          flex: 1;
          min-width: 0;
        }
        .sl-toast-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sl-toast-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sl-toast-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }
        .sl-toast-close:hover {
          color: var(--text-primary);
        }

        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

    </div>
  );
}