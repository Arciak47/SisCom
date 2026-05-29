"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useState
} from "react";

import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  auth,
  db
} from "../lib/firebase";

import {
  ClipboardCheck,
  UtensilsCrossed,
  FileText,
  Coffee,
  Soup,
  Moon,
  Clock3
} from "lucide-react";

export default function SupervisorPage() {

  const router = useRouter();

  const [nombreSupervisor, setNombreSupervisor] =
    useState("Cargando...");

  const [desayunosHoy, setDesayunosHoy] =
    useState(0);

  const [almuerzosHoy, setAlmuerzosHoy] =
    useState(0);

  const [cenasHoy, setCenasHoy] =
    useState(0);

  const [ultimosRegistros, setUltimosRegistros] =
    useState([]);

  const [horaActual, setHoraActual] =
    useState("");

  const [fechaActual, setFechaActual] =
    useState("");

  // 🔥 FECHA Y HORA
  useEffect(() => {

    function actualizarHora(){

      const ahora =
        new Date();

      setHoraActual(

        ahora.toLocaleTimeString(
          "es-VE",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )

      );

      setFechaActual(

        ahora.toLocaleDateString(
          "es-VE",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          }
        )

      );

    }

    actualizarHora();

    const intervalo =
      setInterval(
        actualizarHora,
        1000
      );

    return () =>
      clearInterval(intervalo);

  }, []);

  // 🔥 CARGAR DATOS
  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async(user)=>{

          try{

            if(!user){

              router.push("/login");
              return;

            }

            // 🔥 BUSCAR USUARIO
            const docRef =
              doc(db, "usuarios", user.uid);

            const snap =
              await getDoc(docRef);

            if(snap.exists()){

              const data =
                snap.data();

              setNombreSupervisor(
                `${data.nombres || ""} ${data.apellidos || ""}`
              );

            }

            // 🔥 CONSULTAR ASISTENCIAS
            const q =
              query(
                collection(db, "asistencias")
              );

            const asistencias =
              await getDocs(q);

            let desayuno = 0;
            let almuerzo = 0;
            let cena = 0;

            const recientes = [];

            asistencias.forEach((doc)=>{

              const data =
                doc.data();

              if(
                data.tipoComida ===
                "desayuno"
              ){

                desayuno++;

              }

              if(
                data.tipoComida ===
                "almuerzo"
              ){

                almuerzo++;

              }

              if(
                data.tipoComida ===
                "cena"
              ){

                cena++;

              }

              recientes.push(data);

            });

            setDesayunosHoy(desayuno);

            setAlmuerzosHoy(almuerzo);

            setCenasHoy(cena);

            // 🔥 ORDENAR
            recientes.sort((a,b)=>{

              if(
                !a.fecha ||
                !b.fecha
              ) return 0;

              return (
                b.fecha.seconds -
                a.fecha.seconds
              );

            });

            setUltimosRegistros(
              recientes.slice(0,5)
            );

          }catch(error){

            console.log(error);

          }

        }
      );

    return () => unsubscribe();

  }, []);

  return (

    <div className="container">

      <div className="content">

        {/* HEADER */}
        <header className="header">

          <div className="panelTitle">

            <h1>
              Panel de Supervisor
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
              Bienvenido, {nombreSupervisor}
            </span>

          </div>

        </header>

        {/* FECHA Y HORA */}
        <div className="timeCard">

          <div>

            <h2>
              {horaActual}
            </h2>

            <p>
              {fechaActual}
            </p>

          </div>

          <Clock3 size={42}/>

        </div>

        {/* TITULO */}
        <h2 className="bigTitle">

          Gestión del Comedor SisCOM

        </h2>

        {/* ESTADISTICAS */}
        <div className="statsGrid">

          <div className="statCard">

            <div className="statIcon yellow">

              <Coffee size={25}/>

            </div>

            <div>

              <h3>
                {desayunosHoy}
              </h3>

              <p>
                Desayunos Hoy
              </p>

            </div>

          </div>

          <div className="statCard">

            <div className="statIcon orange">

              <Soup size={25}/>

            </div>

            <div>

              <h3>
                {almuerzosHoy}
              </h3>

              <p>
                Almuerzos Hoy
              </p>

            </div>

          </div>

          <div className="statCard">

            <div className="statIcon blue">

              <Moon size={25}/>

            </div>

            <div>

              <h3>
                {cenasHoy}
              </h3>

              <p>
                Cenas Hoy
              </p>

            </div>

          </div>

        </div>

        {/* TARJETAS */}
        <div className="cards">

          {/* REGISTRAR */}
          <div className="card">

            <div className="iconBox blueBg">

              <ClipboardCheck size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Registrar Asistencia
              </h3>

              <p>
                Registrar asistencia de trabajadores mediante número de ficha.
              </p>

              <button
                className="smallBtn blueBtn"
                onClick={() =>
                  router.push("/supervisor/registrar")
                }
              >

                Registrar asistencia

              </button>

            </div>

          </div>

          {/* CONTROL */}
          <div className="card">

            <div className="iconBox greenBg">

              <UtensilsCrossed size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Control de Comidas
              </h3>

              <p>
                Registrar y ver registros diarios de desayuno, almuerzo y cena.
              </p>

              <button
                className="smallBtn greenBtn"
                onClick={() =>
                  router.push("/supervisor/comidas")
                }
              >

                Gestionar comidas

              </button>

            </div>

          </div>

          {/* REPORTES */}
          <div className="card">

            <div className="iconBox redBg">

              <FileText size={28}/>

            </div>

            <div className="cardContent">

              <h3>
                Reporte Diario
              </h3>

              <p>
                Generar reportes diarios de asistencias registradas.
              </p>

              <button
                className="smallBtn redBtn"
                onClick={() =>
                  router.push("/supervisor/reportes")
                }
              >

                Ver reporte diario

              </button>

            </div>

          </div>

        </div>

        {/* ULTIMOS REGISTROS */}
        <div className="recentCard">

          <h3>
            Últimos Registros
          </h3>

          <div className="recentTable">

            {

              ultimosRegistros.length > 0

              ? ultimosRegistros.map((item,index)=>(

                <div
                  key={index}
                  className="recentItem"
                >

                  <div>

                    <strong>
                      {item.nombres}
                      {" "}
                      {item.apellidos}
                    </strong>

                    <p>
                      {item.tipoComida}
                    </p>

                  </div>

                  <span>
                    {item.ficha}
                  </span>

                </div>

              ))

              :

              <p>
                No hay registros
              </p>

            }

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="footer">

        © 2026 INVECEM - Sistema SisCOM V1.2

      </footer>

      <style jsx>{`

        .container{
          min-height:100vh;
          padding:35px;
        }

        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:25px;
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
        }

        .timeCard{
          background:white;
          border-radius:22px;
          padding:25px;
          margin-bottom:30px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          box-shadow:0 8px 20px rgba(0,0,0,0.08);
        }

        .timeCard h2{
          font-size:40px;
          font-weight:800;
          color:#111827;
        }

        .timeCard p{
          color:#6b7280;
          margin-top:5px;
          text-transform:capitalize;
        }

        .bigTitle{
          font-size:30px;
          font-weight:800;
          margin-bottom:25px;
        }

        .statsGrid{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(250px,1fr));
          gap:20px;
          margin-bottom:30px;
        }

        .statCard{
          background:white;
          padding:22px;
          border-radius:20px;
          display:flex;
          align-items:center;
          gap:15px;
          box-shadow:0 6px 18px rgba(0,0,0,0.06);
        }

        .statIcon{
          width:60px;
          height:60px;
          border-radius:18px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .yellow{
          background:#fef3c7;
          color:#d97706;
        }

        .orange{
          background:#ffedd5;
          color:#ea580c;
        }

        .blue{
          background:#dbeafe;
          color:#2563eb;
        }

        .statCard h3{
          font-size:28px;
          font-weight:800;
        }

        .statCard p{
          color:#6b7280;
          margin-top:3px;
        }

        .cards{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
          gap:22px;
          margin-bottom:30px;
        }

        .card{
          background:white;
          border-radius:22px;
          padding:24px;
          border:1px solid #e5e7eb;
          display:flex;
          gap:18px;
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

        .blueBg{
          background:#dbeafe;
          color:#2563eb;
        }

        .greenBg{
          background:#dcfce7;
          color:#16a34a;
        }

        .redBg{
          background:#fee2e2;
          color:#dc2626;
        }

        .cardContent h3{
          font-size:20px;
          font-weight:700;
          margin-bottom:8px;
        }

        .cardContent p{
          color:#6b7280;
          margin-bottom:15px;
          line-height:1.5;
        }

        .smallBtn{
          border:none;
          padding:11px 16px;
          border-radius:10px;
          cursor:pointer;
          color:white;
          font-weight:700;
        }

        .blueBtn{
          background:#2563eb;
        }

        .greenBtn{
          background:#16a34a;
        }

        .redBtn{
          background:#dc2626;
        }

        .recentCard{
          background:white;
          padding:25px;
          border-radius:22px;
          box-shadow:0 8px 20px rgba(0,0,0,0.06);
        }

        .recentCard h3{
          font-size:22px;
          font-weight:700;
          margin-bottom:20px;
        }

        .recentTable{
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .recentItem{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:14px;
          border-radius:14px;
          background:#f9fafb;
        }

        .recentItem p{
          color:#6b7280;
          font-size:14px;
          margin-top:3px;
          text-transform:capitalize;
        }

        .recentItem span{
          font-weight:700;
          color:#111827;
        }

        .footer{
          margin-top:45px;
          text-align:center;
          color:#6b7280;
          font-size:13px;
        }

        @media(max-width:768px){

          .container{
            padding:20px;
          }

          .header{
            flex-direction:column;
            align-items:flex-start;
          }

          .cards{
            grid-template-columns:1fr;
          }

          .statsGrid{
            grid-template-columns:1fr;
          }

        }

      `}</style>

    </div>

  );

}