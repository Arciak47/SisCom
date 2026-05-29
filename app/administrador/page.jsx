"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import {
  Users,
  UserPlus,
  KeyRound,
  ClipboardList
} from "lucide-react";

import {
  auth,
  db
} from "../lib/firebase";

import {
  doc,
  getDoc
} from "firebase/firestore";

export default function AdminPage() {

  const router = useRouter();

  // 🔥 NOMBRE ADMIN
  const [nombreAdmin, setNombreAdmin] =
    useState("Cargando...");

  // 🔥 CARGAR NOMBRE
  useEffect(() => {

    async function cargarUsuario(){

      try{

        const user =
          auth.currentUser;

        if(user){

          const docRef =
            doc(db, "usuarios", user.uid);

          const snap =
            await getDoc(docRef);

          if(snap.exists()){

            const data =
              snap.data();

            setNombreAdmin(
              `${data.nombres || ""} ${data.apellidos || ""}`
            );

          }

        }

      }catch(error){

        console.log(error);

      }

    }

    cargarUsuario();

  }, []);

  return (

    <div className="container">

      <div className="content">

        {/* HEADER */}
        <header className="header">

          <div className="panelTitle">

            <h1>
              Panel de Administración
            </h1>

          </div>

          <div className="welcome">

            <Image
              src="/perfil-gerente.png"
              width={30}
              height={30}
              alt="perfil"
            />

            <span>
              Bienvenido, {nombreAdmin}
            </span>

          </div>

        </header>

        {/* TITULO */}
        <h2 className="bigTitle">
          Gestión de Usuarios del Sistema
        </h2>

        {/* CARDS */}
        <div className="cards">

          {/* CREAR */}
          <div className="card">

            <div className="iconBox blue">

              <UserPlus size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Crear Usuario
              </h3>

              <p>
                Registrar nuevos usuarios dentro del sistema SisCOM.
              </p>

              <button
                className="smallBtn blueBtn"
                onClick={() =>
                  router.push("/administrador/crear")
                }
              >

                Crear nuevo usuario

              </button>

            </div>

          </div>

          {/* USUARIOS */}
          <div className="card">

            <div className="iconBox green">

              <Users size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Usuarios del Sistema
              </h3>

              <p>
                Visualizar, editar y administrar todos los usuarios.
              </p>

              <button
                className="smallBtn greenBtn"
                onClick={() =>
                  router.push("/administrador/usuarios")
                }
              >

                Ver usuarios

              </button>

            </div>

          </div>

          {/* PASSWORD */}
          <div className="card">

            <div className="iconBox red">

              <KeyRound size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Cambiar Contraseñas
              </h3>

              <p>
                Gestionar y actualizar contraseñas del sistema.
              </p>

              <button
                className="smallBtn redBtn"
                onClick={() =>
                  router.push(
                    "/administrador/cambiar-clave"
                  )
                }
              >

                Gestionar contraseñas

              </button>

            </div>

          </div>

          {/* AUDITORIA */}
          <div className="card">

            <div className="iconBox orange">

              <ClipboardList size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Auditoría del Sistema
              </h3>

              <p>
                Supervisar movimientos, accesos y actividades del sistema.
              </p>

              <button
                className="smallBtn orangeBtn"
                onClick={() =>
                  router.push(
                    "/administrador/auditoria"
                  )
                }
              >

                Ver auditoría

              </button>

            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="footer">

        © 2024 INVECEM - Sistema SisCOM V1.2
        Reservado para personal autorizado.

      </footer>

      <style jsx>{`

        .container{
          min-height:100vh;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          padding:35px;
        }

        .content{
          flex:1;
        }

        /* HEADER */

        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:35px;
          flex-wrap:wrap;
          gap:15px;
        }

        .panelTitle{
          background:white;
          padding:15px 22px;
          border-left:6px solid #dc2626;
          border-radius:14px;
          box-shadow:0 5px 18px rgba(0,0,0,0.08);
        }

        .panelTitle h1{
          font-size:28px;
          font-weight:700;
          color:#111827;
        }

        .welcome{
          display:flex;
          align-items:center;
          gap:12px;
          background:white;
          padding:12px 18px;
          border-radius:14px;
          box-shadow:0 5px 15px rgba(0,0,0,0.08);
          font-weight:600;
          color:#111827;
        }

        /* TITULO */

        .bigTitle{
          font-size:30px;
          font-weight:800;
          color:#111827;
          margin-bottom:25px;
        }

        /* CARDS */

        .cards{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
          gap:22px;
        }

        .card{
          background:white;
          border-radius:22px;
          padding:24px;
          border:1px solid #e5e7eb;
          transition:.25s;
          display:flex;
          gap:18px;
          align-items:flex-start;
        }

        .card:hover{
          transform:translateY(-4px);
          box-shadow:0 10px 25px rgba(0,0,0,0.08);
        }

        .iconBox{
          width:65px;
          height:65px;
          border-radius:18px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        }

        .blue{
          background:#dbeafe;
          color:#2563eb;
        }

        .green{
          background:#dcfce7;
          color:#16a34a;
        }

        .red{
          background:#fee2e2;
          color:#dc2626;
        }

        .orange{
          background:#ffedd5;
          color:#ea580c;
        }

        .cardContent{
          flex:1;
        }

        .card h3{
          font-size:20px;
          font-weight:700;
          color:#111827;
          margin-bottom:8px;
        }

        .card p{
          font-size:14px;
          color:#6b7280;
          line-height:1.5;
          margin-bottom:15px;
        }

        /* BOTONES */

        .smallBtn{
          border:none;
          padding:11px 16px;
          border-radius:10px;
          cursor:pointer;
          transition:.2s;
          font-size:14px;
          font-weight:700;
          color:white;
        }

        .smallBtn:hover{
          transform:scale(1.03);
        }

        .blueBtn{
          background:#2563eb;
        }

        .blueBtn:hover{
          background:#1d4ed8;
        }

        .greenBtn{
          background:#16a34a;
        }

        .greenBtn:hover{
          background:#15803d;
        }

        .redBtn{
          background:#dc2626;
        }

        .redBtn:hover{
          background:#b91c1c;
        }

        .orangeBtn{
          background:#ea580c;
        }

        .orangeBtn:hover{
          background:#c2410c;
        }

        /* FOOTER */

        .footer{
          margin-top:45px;
          font-size:13px;
          color:#6b7280;
          text-align:center;
        }

        /* RESPONSIVE */

        @media(max-width:768px){

          .container{
            padding:20px;
          }

          .header{
            flex-direction:column;
            align-items:flex-start;
          }

          .bigTitle{
            font-size:24px;
          }

          .card{
            flex-direction:column;
          }

        }

      `}</style>

    </div>

  );

}