"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "../../lib/firebase";

import {
  Search,
  User2,
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  ClipboardCheck,
  Coffee,
  Soup,
  Moon,
  Clock3,
  CalendarDays,
  ShieldCheck,
  Users,
  CheckCircle2,
  FileBadge2,
  IdCard
} from "lucide-react";

export default function RegistrarAsistenciaPage() {

  const [ficha, setFicha] =
    useState("");

  const [trabajador, setTrabajador] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [nombreSupervisor, setNombreSupervisor] =
    useState("");

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

  // 🔥 CARGAR SUPERVISOR
  useEffect(() => {

    async function cargarSupervisor(){

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

            setNombreSupervisor(
              `${data.nombres || ""} ${data.apellidos || ""}`
            );

          }

        }

      }catch(error){

        console.log(error);

      }

    }

    cargarSupervisor();

  }, []);

  // 🔥 HORARIOS
  function obtenerComidaDisponible(){

    const hora =
      new Date().getHours();

    // DESAYUNO
    if(hora >= 6 && hora < 10){

      return "desayuno";

    }

    // ALMUERZO
    if(hora >= 11 && hora < 15){

      return "almuerzo";

    }

    // CENA
    if(hora >= 18 && hora < 22){

      return "cena";

    }

    return null;

  }

  // 🔥 BUSCAR TRABAJADOR EN TODAS LAS NOMINAS
  async function buscarTrabajador(){

    if(!ficha){

      alert("Ingrese el número de ficha");
      return;

    }

    try{

      setLoading(true);

      const tiposNomina = [
        "fijos",
        "contratistas",
        "inces",
        "pasantes",
        "visitantes"
      ];

      let encontrado = null;

      for(const tipo of tiposNomina){

        const ref =
          doc(db, "nominas", tipo);

        const snap =
          await getDoc(ref);

        if(snap.exists()){

          const datos =
            snap.data().datos || [];

          const trabajadorEncontrado =
            datos.find((item)=>

              String(
                item["Numero de ficha"] || ""
              ).trim()

              ===

              ficha.trim()

            );

          if(trabajadorEncontrado){

            encontrado = {

              ficha:
                trabajadorEncontrado["Numero de ficha"] || "-",

              nombres:
                trabajadorEncontrado["Nombres"] || "-",

              apellidos:
                trabajadorEncontrado["Apellidos"] || "-",

              cedula:
                trabajadorEncontrado["Cedula"] || "-",

              cargo:
                trabajadorEncontrado["Cargo"] || "-",

              departamento:
                trabajadorEncontrado["Departamento"] ||

                trabajadorEncontrado["Area"] ||

                trabajadorEncontrado["Empresa"] ||

                "-",

              supervisor:
                trabajadorEncontrado["Jefe o Supervisor inmediato"] ||

                trabajadorEncontrado["Supervisor"] ||

                "-",

              tipoNomina:
                tipo

            };

            break;

          }

        }

      }

      if(!encontrado){

        alert(
          "❌ Trabajador no encontrado"
        );

        setTrabajador(null);

        setLoading(false);

        return;

      }

      setTrabajador(encontrado);

    }catch(error){

      console.log(error);

      alert(
        "❌ Error al buscar trabajador"
      );

    }

    setLoading(false);

  }

  // 🔥 REGISTRAR
  async function registrarAsistencia(){

    if(!trabajador){

      alert(
        "Debe buscar un trabajador"
      );

      return;

    }

    const comidaActual =
      obtenerComidaDisponible();

    if(!comidaActual){

      alert(
        "❌ Fuera del horario permitido"
      );

      return;

    }

    try{

      // VALIDAR DUPLICADO
      const q =
        await getDocs(
          collection(db, "asistencias")
        );

      const hoy =
        new Date().toDateString();

      let yaRegistrado =
        false;

      q.forEach((doc)=>{

        const data =
          doc.data();

        if(

          data.ficha === trabajador.ficha

          &&

          data.tipoComida === comidaActual

        ){

          if(data.fechaRegistro){

            const fecha =
              data.fechaRegistro
                .toDate()
                .toDateString();

            if(fecha === hoy){

              yaRegistrado = true;

            }

          }

        }

      });

      if(yaRegistrado){

        alert(
          `❌ Ya registró ${comidaActual} hoy`
        );

        return;

      }

      // 🔥 GUARDAR
      await addDoc(
        collection(db, "asistencias"),
        {

          nombres:
            trabajador.nombres,

          apellidos:
            trabajador.apellidos,

          ficha:
            trabajador.ficha,

          cedula:
            trabajador.cedula,

          cargo:
            trabajador.cargo,

          departamento:
            trabajador.departamento,

          supervisor:
            trabajador.supervisor,

          tipoNomina:
            trabajador.tipoNomina,

          tipoComida:
            comidaActual,

          supervisorRegistro:
            nombreSupervisor,

          fechaRegistro:
            serverTimestamp(),

          estado:
            "registrado"

        }
      );

      alert(
        `✅ ${comidaActual.toUpperCase()} registrado correctamente`
      );

      setFicha("");
      setTrabajador(null);

    }catch(error){

      console.log(error);

      alert(
        "❌ Error al registrar"
      );

    }

  }

  const comidaDisponible =
    obtenerComidaDisponible();

  return (

    <div className="container">

      {/* HEADER */}
      <div className="header">

        <div className="titleBox">

          <h1>
            Registro de Asistencia
          </h1>

          <p>
            Sistema de control de comedor SisCOM
          </p>

        </div>

        <div className="timeBox">

          <Clock3 size={24}/>

          <div>

            <strong>
              {horaActual}
            </strong>

            <p>
              {fechaActual}
            </p>

          </div>

        </div>

      </div>

      {/* STATUS */}
      <div className="foodStatus">

        <ShieldCheck size={22}/>

        {

          comidaDisponible

          ?

          <span>

            Horario habilitado para:
            {" "}

            <strong>
              {comidaDisponible.toUpperCase()}
            </strong>

          </span>

          :

          <span>
            No hay horario habilitado actualmente
          </span>

        }

      </div>

      {/* CARD */}
      <div className="card">

        {/* BUSQUEDA */}
        <div className="searchSection">

          <div className="inputGroup">

            <label>
              Número de Ficha
            </label>

            <div className="inputBox">

              <BadgeCheck
                size={18}
                className="icon"
              />

              <input
                type="text"
                placeholder="Ingrese el número de ficha"
                value={ficha}
                onChange={(e)=>
                  setFicha(e.target.value)
                }
              />

            </div>

          </div>

          <button
            className="searchBtn"
            onClick={buscarTrabajador}
          >

            <Search size={18}/>

            {
              loading
              ? "Buscando..."
              : "Buscar"
            }

          </button>

        </div>

        {/* DATOS */}
        {trabajador && (

          <div className="trabajadorCard">

            {/* PERFIL */}
            <div className="perfilHeader">

              <div className="perfilCircle">

                <User2 size={42}/>

              </div>

              <div>

                <h2>

                  {trabajador.nombres}
                  {" "}
                  {trabajador.apellidos}

                </h2>

                <p>
                  Trabajador encontrado en nómina
                </p>

              </div>

            </div>

            {/* GRID */}
            <div className="grid">

              <div className="infoCard">

                <span>

                  <BadgeCheck size={14}/>

                  Número de ficha

                </span>

                <strong>
                  {trabajador.ficha}
                </strong>

              </div>

              <div className="infoCard">

                <span>

                  <IdCard size={14}/>

                  Cédula

                </span>

                <strong>
                  {trabajador.cedula}
                </strong>

              </div>

              <div className="infoCard">

                <span>

                  <BriefcaseBusiness size={14}/>

                  Cargo

                </span>

                <strong>
                  {trabajador.cargo}
                </strong>

              </div>

              <div className="infoCard">

                <span>

                  <Building2 size={14}/>

                  Departamento / Área

                </span>

                <strong>
                  {trabajador.departamento}
                </strong>

              </div>

              <div className="infoCard">

                <span>

                  <Users size={14}/>

                  Supervisor

                </span>

                <strong>
                  {trabajador.supervisor}
                </strong>

              </div>

              <div className="infoCard">

                <span>

                  <FileBadge2 size={14}/>

                  Tipo de nómina

                </span>

                <strong className="capitalize">
                  {trabajador.tipoNomina}
                </strong>

              </div>

            </div>

            {/* COMIDAS */}
            <div className="foodBox">

              <label>
                Comida habilitada actualmente
              </label>

              <div className="foodGrid">

                <button
                  className={
                    comidaDisponible === "desayuno"
                    ? "foodBtn active"
                    : "foodBtn"
                  }
                >

                  <Coffee size={18}/>

                  Desayuno

                </button>

                <button
                  className={
                    comidaDisponible === "almuerzo"
                    ? "foodBtn active"
                    : "foodBtn"
                  }
                >

                  <Soup size={18}/>

                  Almuerzo

                </button>

                <button
                  className={
                    comidaDisponible === "cena"
                    ? "foodBtn active"
                    : "foodBtn"
                  }
                >

                  <Moon size={18}/>

                  Cena

                </button>

              </div>

            </div>

            {/* BOTON */}
            <button
              className="saveBtn"
              onClick={registrarAsistencia}
            >

              <ClipboardCheck size={20}/>

              Registrar Asistencia

            </button>

            {/* ESTADO */}
            <div className="successInfo">

              <CheckCircle2 size={18}/>

              El sistema verificará automáticamente
              duplicados y horarios permitidos.

            </div>

          </div>

        )}

      </div>

      <style jsx>{`

        .container{
          padding:35px;
        }

        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:25px;
          gap:20px;
          flex-wrap:wrap;
        }

        .titleBox{
          background:white;
          padding:22px 26px;
          border-left:6px solid #dc2626;
          border-radius:20px;
          box-shadow:0 8px 22px rgba(0,0,0,0.08);
        }

        .titleBox h1{
          font-size:32px;
          font-weight:800;
          color:#111827;
        }

        .titleBox p{
          margin-top:5px;
          color:#6b7280;
        }

        .timeBox{
          background:white;
          padding:18px 22px;
          border-radius:18px;
          display:flex;
          align-items:center;
          gap:12px;
          box-shadow:0 8px 20px rgba(0,0,0,0.08);
        }

        .timeBox strong{
          font-size:18px;
        }

        .timeBox p{
          font-size:13px;
          color:#6b7280;
          text-transform:capitalize;
        }

        .foodStatus{
          background:#dcfce7;
          border:1px solid #86efac;
          color:#166534;
          padding:16px 18px;
          border-radius:15px;
          margin-bottom:25px;

          display:flex;
          align-items:center;
          gap:10px;

          font-weight:700;
        }

        .card{
          background:white;
          padding:30px;
          border-radius:26px;
          box-shadow:0 12px 30px rgba(0,0,0,0.08);
        }

        .searchSection{
          display:flex;
          gap:15px;
          align-items:end;
          flex-wrap:wrap;
        }

        .inputGroup{
          flex:1;
        }

        label{
          display:block;
          margin-bottom:8px;
          font-size:14px;
          font-weight:700;
          color:#111827;
        }

        .inputBox{
          position:relative;
        }

        .icon{
          position:absolute;
          left:14px;
          top:50%;
          transform:translateY(-50%);
          color:#6b7280;
        }

        input{
          width:100%;
          height:58px;
          border-radius:15px;
          border:1px solid #d1d5db;
          padding-left:45px;
          font-size:15px;
          outline:none;
        }

        input:focus{
          border-color:#dc2626;
          box-shadow:0 0 0 3px rgba(220,38,38,0.1);
        }

        .searchBtn{
          height:58px;
          border:none;
          padding:0 25px;
          border-radius:15px;
          background:#2563eb;
          color:white;
          font-weight:700;
          cursor:pointer;

          display:flex;
          align-items:center;
          gap:8px;
        }

        .trabajadorCard{
          margin-top:30px;
          background:#f8fafc;
          border-radius:24px;
          padding:28px;
          border:1px solid #e5e7eb;
        }

        .perfilHeader{
          display:flex;
          align-items:center;
          gap:18px;
          margin-bottom:28px;
        }

        .perfilCircle{
          width:90px;
          height:90px;
          border-radius:50%;
          background:#fee2e2;
          color:#dc2626;

          display:flex;
          align-items:center;
          justify-content:center;
        }

        .perfilHeader h2{
          font-size:26px;
          font-weight:800;
          color:#111827;
        }

        .perfilHeader p{
          color:#6b7280;
          margin-top:5px;
        }

        .grid{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(230px,1fr));
          gap:16px;
          margin-bottom:28px;
        }

        .infoCard{
          background:white;
          padding:20px;
          border-radius:18px;
          border:1px solid #e5e7eb;
          transition:.2s;
        }

        .infoCard:hover{
          transform:translateY(-2px);
          box-shadow:0 8px 18px rgba(0,0,0,0.05);
        }

        .infoCard span{
          display:flex;
          align-items:center;
          gap:6px;
          font-size:13px;
          color:#6b7280;
          margin-bottom:8px;
        }

        .infoCard strong{
          color:#111827;
          font-size:15px;
        }

        .capitalize{
          text-transform:capitalize;
        }

        .foodBox{
          margin-top:10px;
        }

        .foodGrid{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(180px,1fr));
          gap:15px;
          margin-top:15px;
        }

        .foodBtn{
          height:60px;
          border-radius:16px;
          border:1px solid #d1d5db;
          background:white;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;

          font-size:14px;
          font-weight:700;
        }

        .active{
          background:#dc2626;
          color:white;
          border-color:#dc2626;
        }

        .saveBtn{
          margin-top:30px;
          width:100%;
          height:60px;
          border:none;
          border-radius:18px;
          background:#16a34a;
          color:white;
          font-size:16px;
          font-weight:800;
          cursor:pointer;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
        }

        .saveBtn:hover{
          background:#15803d;
        }

        .successInfo{
          margin-top:18px;
          background:#eff6ff;
          color:#1d4ed8;
          padding:14px 16px;
          border-radius:14px;

          display:flex;
          align-items:center;
          gap:10px;

          font-size:14px;
          font-weight:600;
        }

        @media(max-width:768px){

          .container{
            padding:20px;
          }

          .searchSection{
            flex-direction:column;
            align-items:stretch;
          }

        }

      `}</style>

    </div>

  );

}