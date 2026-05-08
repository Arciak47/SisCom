"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileText, BarChart3, PieChart } from "lucide-react";

export default function PanelRRHH(){

  const router = useRouter();

  return(

    <div>

      <header className="header">

        <div className="panelTitle">
          <h1>Panel Recursos Humanos</h1>
        </div>

        <div className="welcome">
          <Image src="/perfil-gerente.png" width={30} height={30} alt="perfil"/>
          Bienvenido, Recursos Humanos
        </div>

      </header>

      <h2 className="bigTitle">
        Reportes del Sistema
      </h2>

      <div className="cards">

        <div className="card">
          <div className="iconBox"><FileText size={28}/></div>
          <div>
            <h3><b>Reporte Diario</b></h3>
            <button 
              className="smallBtn"
              onClick={()=>router.push("/gerente/reportes/diario")}
            >
              Ir
            </button>
          </div>
        </div>

        <div className="card">
          <div className="iconBox"><BarChart3 size={28}/></div>
          <div>
            <h3><b>Reporte Semanal</b></h3>
            <button 
              className="smallBtn"
              onClick={()=>router.push("/gerente/reportes/semanal")}
            >
              Ir
            </button>
          </div>
        </div>

        <div className="card">
          <div className="iconBox"><PieChart size={28}/></div>
          <div>
            <h3><b>Reporte Mensual</b></h3>
            <button 
              className="smallBtn"
              onClick={()=>router.push("/gerente/reportes/mensual")}
            >
              Ir
            </button>
          </div>
        </div>

      </div>

      <style jsx>{`
        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:30px;
        }

        .panelTitle{
          background:white;
          padding:10px 18px;
          border-left:5px solid #2563eb;
          border-radius:8px;
        }

        .welcome{
          display:flex;
          align-items:center;
          gap:10px;
          background:white;
          padding:10px 15px;
          border-radius:10px;
        }

        .bigTitle{
          font-size:28px;
          font-weight:bold;
          margin-top:25px;
        }

        .cards{
          display:flex;
          gap:20px;
          flex-wrap:wrap;
        }

        .card{
          display:flex;
          gap:15px;
          background:white;
          padding:20px;
          border-radius:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
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
        }

        .smallBtn{
          margin-top:8px;
          background:#2563eb;
          color:white;
          border:none;
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
        }
      `}</style>

    </div>

  );
}