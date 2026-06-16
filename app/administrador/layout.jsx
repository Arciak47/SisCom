"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import {
  Home, Users, LogOut,
  UserCircle2, ClipboardList, MessageSquare
} from "lucide-react";

export default function AdminLayout({ children }) {

  const router = useRouter();
  const [nombreAdmin, setNombreAdmin] = useState("Cargando...");
  const [authorized, setAuthorized] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.rol?.toLowerCase() === "administrador") {
              setNombreAdmin(`${data.nombres || ""} ${data.apellidos || ""}`);
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
        <div style={{ width: 24 }} />
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
            <span className="sl-role-tag">ADMINISTRADOR</span>
          </div>

          <nav className="sl-nav">

            <a className="sl-item" onClick={() => { router.push("/administrador"); setMenuAbierto(false); }}>
              <Home size={18}/><span>Dashboard</span>
            </a>

            <a className="sl-item" onClick={() => { router.push("/administrador/usuarios"); setMenuAbierto(false); }}>
              <Users size={18}/><span>Usuarios</span>
            </a>

            <a className="sl-item" onClick={() => { router.push("/administrador/auditoria"); setMenuAbierto(false); }}>
              <ClipboardList size={18}/><span>Auditoría</span>
            </a>

            <a className="sl-item" onClick={() => { router.push("/administrador/chat"); setMenuAbierto(false); }}>
              <MessageSquare size={18}/><span>Mensajería</span>
            </a>

            <a className="sl-item" onClick={() => { router.push("/administrador/perfil"); setMenuAbierto(false); }}>
              <UserCircle2 size={18}/><span>Mi Perfil</span>
            </a>

          </nav>
        </div>

        <div className="sl-bottom">
          <div className="sl-user">
            <Image src="/perfil-gerente.png" width={40} height={40} alt="perfil"/>
            <div>
              <p className="sl-uname">{nombreAdmin}</p>
              <span className="sl-urole">Administrador</span>
            </div>
          </div>
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
          background: #ffffff;
          border-right: 1px solid #e8edf5;
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
          border-bottom: 1px solid #f1f5f9;
          gap: 4px;
        }
        .sl-brand {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 1px;
          font-family: var(--font-rajdhani), sans-serif;
          margin: 2px 0 0;
        }
        .sl-sis { color: #1a202c; }
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
        .sl-bottom {
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sl-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e8edf5;
        }
        .sl-uname {
          font-size: 13px;
          font-weight: 700;
          color: #1a202c;
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
          background: linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.88)), url('/corporate_background.png') no-repeat center center;
          background-size: cover;
          background-attachment: fixed;
        }

        /* Responsive Layout classes */
        .sl-mobile-header {
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
            background: #ffffff;
            border-bottom: 1px solid #e8edf5;
            padding: 0 16px;
            position: sticky;
            top: 0;
            z-index: 30;
            flex-shrink: 0;
          }
          .sl-menu-toggle {
            background: none;
            border: none;
            color: #1a202c;
            cursor: pointer;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
          }
          .sl-menu-toggle:hover {
            background: #f1f5f9;
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
      `}</style>
    </div>
  );
}