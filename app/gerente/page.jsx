"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import { Pie } from "react-chartjs-2";

import {
  FileText,
  BarChart3,
  PieChart,
  Upload,
  FileCheck
} from "lucide-react";

import { db, auth } from "../lib/firebase";

import {
  doc,
  getDoc
} from "firebase/firestore";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function PanelPrincipal(){

  const router = useRouter();

  // 🔥 NOMBRE DEL GERENTE
  const [nombreUsuario, setNombreUsuario] =
    useState("Cargando...");

  // 🔥 TOTALES
  const [totales, setTotales] = useState({

    contratistas: 0,
    fijos: 0,
    inces: 0,
    pasantes: 0,
    visitantes: 0

  });

  // 🔥 CARGAR DATOS
  useEffect(()=>{

    async function fetchData(){

      try{

        // 🔥 USUARIO ACTUAL
        const user = auth.currentUser;

        if(user){

          const userRef =
            doc(db,"usuarios",user.uid);

          const userSnap =
            await getDoc(userRef);

          if(userSnap.exists()){

            const data = userSnap.data();

            const nombreCompleto =
              `${data.nombres || ""} ${data.apellidos || ""}`;

            setNombreUsuario(nombreCompleto);

          }

        }

        // 🔥 NOMINAS
        const contratistasRef =
          doc(db,"nominas","contratistas");

        const fijosRef =
          doc(db,"nominas","fijos");

        const incesRef =
          doc(db,"nominas","inces");

        const pasantesRef =
          doc(db,"nominas","pasantes");

        const visitantesRef =
          doc(db,"nominas","visitantes");

        const [
          cSnap,
          fSnap,
          iSnap,
          pSnap,
          vSnap
        ] = await Promise.all([

          getDoc(contratistasRef),
          getDoc(fijosRef),
          getDoc(incesRef),
          getDoc(pasantesRef),
          getDoc(visitantesRef)

        ]);

        setTotales({

          contratistas:
            cSnap.exists()
              ? (cSnap.data().datos || []).length
              : 0,

          fijos:
            fSnap.exists()
              ? (fSnap.data().datos || []).length
              : 0,

          inces:
            iSnap.exists()
              ? (iSnap.data().datos || []).length
              : 0,

          pasantes:
            pSnap.exists()
              ? (pSnap.data().datos || []).length
              : 0,

          visitantes:
            vSnap.exists()
              ? (vSnap.data().datos || []).length
              : 0

        });

      }catch(error){

        console.error(error);

      }

    }

    fetchData();

  },[]);

  // 🔥 DATA GRÁFICA
  const data={

    labels:[

      "Contratistas",
      "Trabajadores Fijos",
      "Estudiantes INCES",
      "Pasantes",
      "Visitantes"

    ],

    datasets:[

      {

        data:[

          totales.contratistas,
          totales.fijos,
          totales.inces,
          totales.pasantes,
          totales.visitantes

        ],

        backgroundColor:[

          "#ef4444",
          "#3b82f6",
          "#2dd4bf",
          "#f59e0b",
          "#8b5cf6"

        ],

        borderWidth:2,
        borderColor:"#ffffff",
        hoverOffset:15

      }

    ]

  };

  // 🔥 OPCIONES
  const options={

    plugins:{

      legend:{ display:false },

      tooltip:{

        callbacks:{

          label:(ctx)=>
            `${ctx.label}: ${ctx.raw} personas`

        }

      }

    },

    cutout:"60%"

  };

  return(

    <div>

      {/* HEADER */}
      <header className="header">

        <div className="panelTitle">

          <h1>
            Panel Principal
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
            Bienvenido, {nombreUsuario}
          </span>

        </div>

      </header>

      {/* TITULO */}
      <h2 className="bigTitle">
        Reportes de Uso del Comedor
      </h2>

      {/* CARDS */}
      <div className="cards">

        <div className="card">

          <div className="iconBox">

            <FileText size={28}/>

          </div>

          <div>

            <h3>
              <b>Reporte Diario</b>
            </h3>

            <button className="smallBtn">
              Ir a Reportes Diarios
            </button>

          </div>

        </div>

        <div className="card">

          <div className="iconBox">

            <BarChart3 size={28}/>

          </div>

          <div>

            <h3>
              <b>Reporte Semanal</b>
            </h3>

            <button className="smallBtn">
              Ir a Reportes Semanales
            </button>

          </div>

        </div>

        <div className="card">

          <div className="iconBox">

            <PieChart size={28}/>

          </div>

          <div>

            <h3>
              <b>Reporte Mensual</b>
            </h3>

            <button className="smallBtn">
              Ir a Reportes Mensuales
            </button>

          </div>

        </div>

      </div>

      {/* GESTIÓN */}
      <h2 className="bigTitle">
        Gestión de Nómina
      </h2>

      <div className="cards">

        <div className="card">

          <div className="iconBox">

            <Upload size={28}/>

          </div>

          <div>

            <h3>
              <b>Cargar Nómina</b>
            </h3>

            <button
              className="smallBtn"
              onClick={() =>
                router.push(
                  "/gerente/cargar-nomina"
                )
              }
            >
              Cargar Archivo
            </button>

          </div>

        </div>

        <div className="card">

          <div className="iconBox">

            <FileCheck size={28}/>

          </div>

          <div>

            <h3>
              <b>Ver Nómina Final</b>
            </h3>

            <button
              className="smallBtn"
              onClick={() =>
                router.push(
                  "/gerente/cargar-nomina/nomina-final"
                )
              }
            >
              Ver Nómina
            </button>

          </div>

        </div>

      </div>

      {/* GRÁFICA */}
      <div className="chartBox">

        <h2 className="chartTitle">
          Resumen de Nómina por Categoría
        </h2>

        <div className="chartContent">

          <div className="pie">

            <Pie
              data={data}
              options={options}
            />

          </div>

          <div className="legend">

            <div className="legendItem">
              <span className="dot red"></span>
              <b>Contratistas:</b>
              {totales.contratistas}
            </div>

            <div className="legendItem">
              <span className="dot blue"></span>
              <b>Trabajadores Fijos:</b>
              {totales.fijos}
            </div>

            <div className="legendItem">
              <span className="dot green"></span>
              <b>Estudiantes INCES:</b>
              {totales.inces}
            </div>

            <div className="legendItem">
              <span className="dot orange"></span>
              <b>Pasantes:</b>
              {totales.pasantes}
            </div>

            <div className="legendItem">
              <span className="dot purple"></span>
              <b>Visitantes:</b>
              {totales.visitantes}
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

        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:30px;
          flex-wrap:wrap;
          gap:15px;
        }

        .panelTitle{
          background:white;
          padding:10px 18px;
          border-left:5px solid #e53935;
          border-radius:8px;
          box-shadow:0 3px 10px rgba(0,0,0,0.1);
        }

        .panelTitle h1{
          font-size:24px;
          font-weight:bold;
        }

        .welcome{
          display:flex;
          align-items:center;
          gap:10px;
          background:white;
          padding:10px 15px;
          border-radius:10px;
          box-shadow:0 3px 10px rgba(0,0,0,0.1);
          font-weight:600;
        }

        .bigTitle{
          font-size:28px;
          font-weight:bold;
          margin-top:25px;
          margin-bottom:10px;
        }

        .cards{
          display:flex;
          gap:20px;
          flex-wrap:wrap;
          margin-bottom:20px;
        }

        .card{
          display:flex;
          gap:15px;
          background:white;
          padding:20px;
          border-radius:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
          min-width:260px;
          max-width:320px;
        }

        .iconBox{
          background:#eef3ff;
          width:55px;
          height:55px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#2563eb;
          flex-shrink:0;
        }

        .smallBtn{
          margin-top:8px;
          background:#2563eb;
          color:white;
          border:none;
          padding:6px 10px;
          font-size:13px;
          border-radius:6px;
          cursor:pointer;
          transition:.2s;
        }

        .smallBtn:hover{
          transform:scale(1.03);
        }

        .chartBox{
          background:white;
          padding:30px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.15);
          margin-top:20px;
        }

        .chartTitle{
          font-size:20px;
          font-weight:bold;
          margin-bottom:20px;
        }

        .chartContent{
          display:flex;
          align-items:center;
          gap:50px;
          flex-wrap:wrap;
        }

        .pie{
          width:300px;
        }

        .legend{
          display:flex;
          flex-direction:column;
          gap:15px;
        }

        .legendItem{
          display:flex;
          align-items:center;
          gap:10px;
          background:#f8f8f8;
          padding:12px;
          border-radius:10px;
          font-size:15px;
        }

        .dot{
          width:12px;
          height:12px;
          border-radius:50%;
        }

        .red{
          background:#ef4444;
        }

        .blue{
          background:#3b82f6;
        }

        .green{
          background:#2dd4bf;
        }

        .orange{
          background:#f59e0b;
        }

        .purple{
          background:#8b5cf6;
        }

        .footer{
          margin-top:20px;
          font-size:13px;
          color:#666;
        }

      `}</style>

    </div>

  );

}