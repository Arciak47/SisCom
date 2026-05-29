"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  auth,
  db
} from "../lib/firebase";

import {
  doc,
  getDoc
} from "firebase/firestore";

import {
  Home,
  Users,
  Calendar,
  Upload,
  FileCheck,
  FileText,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserCircle2
} from "lucide-react";

export default function GerenteLayout({ children }) {

  const router = useRouter();

  const [gestionOpen, setGestionOpen] = useState(false);

  const [reportesOpen, setReportesOpen] = useState(false);

  const [nombreUsuario, setNombreUsuario] =
    useState("Cargando...");

  // 🔥 CARGAR NOMBRE
  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(auth, async (user) => {

        if(user){

          try{

            const docRef =
              doc(db, "usuarios", user.uid);

            const snap =
              await getDoc(docRef);

            if(snap.exists()){

              const data = snap.data();

              setNombreUsuario(
                `${data.nombres || ""} ${data.apellidos || ""}`
              );

            }

          }catch(error){

            console.log(error);

          }

        }

      });

    return () => unsubscribe();

  }, []);

  // 🔥 CERRAR SESIÓN
  const cerrarSesion = async () => {

    await signOut(auth);

    router.push("/login");

  };

  return (

    <div className="layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebarTop">

          {/* LOGO */}
          <div className="logoArea">

            <Image
              src="/logo-invecem-gerente.png"
              width={120}
              height={60}
              alt="logo"
            />

            <h2 className="siscom">
              <span className="sis">Sis</span>
              <span className="com">COM</span>
            </h2>

          </div>

          {/* NAV */}
          <nav>

            {/* PANEL */}
            <a
              className="menuItem"
              onClick={() => router.push("/gerente")}
            >

              <div className="menuLeft">

                <Home size={20}/>
                <span>Panel Principal</span>

              </div>

            </a>

            {/* PERFIL */}
            <a
              className="menuItem"
              onClick={() =>
                router.push("/gerente/perfil")
              }
            >

              <div className="menuLeft">

                <UserCircle2 size={20}/>
                <span>Mi Perfil</span>

              </div>

            </a>

            {/* GESTIÓN */}
            <div
              className="menuItem"
              onClick={() =>
                setGestionOpen(!gestionOpen)
              }
            >

              <div className="menuLeft">

                <Users size={20}/>
                <span>Gestión Humana</span>

              </div>

              {
                gestionOpen
                ? <ChevronDown size={18}/>
                : <ChevronRight size={18}/>
              }

            </div>

            {gestionOpen && (

              <div className="submenu">

                <a
                  onClick={() =>
                    router.push("/gerente/cargar-nomina")
                  }
                >

                  <Upload size={17}/>
                  <span>Cargar Nómina</span>

                </a>

                <a
                  onClick={() =>
                    router.push(
                      "/gerente/cargar-nomina/nomina-final"
                    )
                  }
                >

                  <FileCheck size={17}/>
                  <span>Ver Nómina Final</span>

                </a>

              </div>

            )}

            {/* REPORTES */}
            <div
              className="menuItem"
              onClick={() =>
                setReportesOpen(!reportesOpen)
              }
            >

              <div className="menuLeft">

                <Calendar size={20}/>
                <span>Reportes</span>

              </div>

              {
                reportesOpen
                ? <ChevronDown size={18}/>
                : <ChevronRight size={18}/>
              }

            </div>

            {reportesOpen && (

              <div className="submenu">

                <a>

                  <FileText size={17}/>
                  <span>Reporte Diario</span>

                </a>

                <a>

                  <BarChart3 size={17}/>
                  <span>Reporte Semanal</span>

                </a>

                <a>

                  <PieChart size={17}/>
                  <span>Reporte Mensual</span>

                </a>

              </div>

            )}

          </nav>

        </div>

        {/* ABAJO */}
        <div className="sidebarBottom">

          <div className="perfil">

            <Image
              src="/perfil-gerente.png"
              width={44}
              height={44}
              alt="perfil"
            />

            <div className="perfilInfo">

              <p className="nombre">
                {nombreUsuario}
              </p>

              <span className="cargo">
                GERENTE
              </span>

            </div>

          </div>

          <button
            className="logout"
            onClick={cerrarSesion}
          >

            <LogOut size={18}/>
            <span>Cerrar Sesión</span>

          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        {children}

      </main>

      <style jsx>{`

        .layout{
          display:flex;
          height:100vh;
          background:url('/background.png');
          background-size:cover;
          font-family:Arial;
        }

        /* SIDEBAR */
        .sidebar{
          width:270px;
          background:white;
          padding:25px 20px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          box-shadow:2px 0 10px rgba(0,0,0,0.1);
          overflow-y:auto;
        }

        .sidebarTop{
          display:flex;
          flex-direction:column;
        }

        /* LOGO */
        .logoArea{
          display:flex;
          flex-direction:column;
          align-items:center;
          margin-bottom:25px;
        }

        .siscom{
          font-size:30px;
          font-weight:900;
          margin-top:6px;
        }

        .sis{
          color:black;
        }

        .com{
          color:#e53935;
        }

        /* NAV */
        nav{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .menuItem{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:13px 14px;
          border-radius:10px;
          cursor:pointer;
          transition:.2s;
        }

        .menuItem:hover{
          background:#f5f5f5;
        }

        .menuLeft{
          display:flex;
          align-items:center;
          gap:14px;
        }

        .menuLeft span{
          font-size:16px;
          font-weight:600;
          color:#111;
          text-align:left;
        }

        /* SUBMENU */
        .submenu{
          margin-left:34px;
          display:flex;
          flex-direction:column;
          gap:10px;
          margin-top:4px;
          margin-bottom:4px;
        }

        .submenu a{
          display:flex;
          align-items:center;
          gap:10px;
          cursor:pointer;
          font-size:14px;
          color:#555;
          font-weight:500;
          text-align:left;
        }

        .submenu a:hover{
          color:#e53935;
        }

        /* PERFIL */
        .sidebarBottom{
          margin-top:20px;
          border-top:1px solid #eee;
          padding-top:16px;
        }

        .perfil{
          display:flex;
          align-items:center;
          gap:10px;
          margin-bottom:14px;
        }

        .perfilInfo{
          display:flex;
          flex-direction:column;
          align-items:flex-start;
        }

        .nombre{
          font-size:15px;
          font-weight:700;
          color:#111;
          margin:0;
          text-align:left;
        }

        .cargo{
          font-size:12px;
          color:#777;
          font-weight:600;
          margin-top:2px;
          text-align:left;
        }

        /* BOTON */
        .logout{
          width:100%;
          border:none;
          background:#222;
          color:white;
          padding:13px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          cursor:pointer;
          font-size:15px;
          font-weight:600;
          transition:.2s;
        }

        .logout:hover{
          background:black;
        }

        /* MAIN */
        .main{
          flex:1;
          padding:30px;
          overflow:auto;
        }

      `}</style>

    </div>

  );

}