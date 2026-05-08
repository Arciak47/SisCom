"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function ManualVisitantes() {

  const router = useRouter();

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    area: "",
    supervisor: ""
  });

  // 🔥 CAPITALIZAR
  function capitalizar(texto){
    if(!texto) return "";
    return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // 🔥 MANEJO DE INPUTS
  function handleChange(e){

    const { name, value } = e.target;

    // SOLO NÚMEROS EN CÉDULA
    if(name === "cedula"){
      const numeros = value.replace(/\D/g, "");
      setForm({
        ...form,
        cedula: numeros
      });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  }

  // 🔥 GUARDAR
  async function guardar(){

    try{

      const docRef = doc(db, "nominas", "visitantes");
      const docSnap = await getDoc(docRef);

      let datos = [];

      if(docSnap.exists()){
        datos = docSnap.data().datos || [];
      }

      const nuevo = {
        "Nombres": capitalizar(form.nombres),
        "Apellidos": capitalizar(form.apellidos),
        "Cedula": `V-${form.cedula}`,
        "Area": capitalizar(form.area),
        "Supervisor": capitalizar(form.supervisor)
      };

      datos.push(nuevo);

      await setDoc(docRef, { datos });

      alert("✅ Visitante agregado");

      router.push("/gerente/cargar-nomina/visitantes/ver");

    }catch(error){
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return(

    <div className="main">

      <div className="panelTitle">
        <h1>Añadir Visitante</h1>
      </div>

      <div className="formCard">

        <input
          name="nombres"
          placeholder="Nombres"
          value={form.nombres}
          onChange={handleChange}
        />

        <input
          name="apellidos"
          placeholder="Apellidos"
          value={form.apellidos}
          onChange={handleChange}
        />

        <input
          name="cedula"
          placeholder="Cédula"
          value={form.cedula ? `V-${form.cedula}` : ""}
          onChange={handleChange}
        />

        <input
          name="area"
          placeholder="Área"
          value={form.area}
          onChange={handleChange}
        />

        <input
          name="supervisor"
          placeholder="Supervisor"
          value={form.supervisor}
          onChange={handleChange}
        />

        <button className="saveBtn" onClick={guardar}>
          Guardar
        </button>

        <button
          className="backBtn"
          onClick={()=>router.back()}
        >
          <ArrowLeft size={16}/> Volver
        </button>

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        .panelTitle{
          background:white;
          padding:12px 20px;
          border-left:5px solid #a10a97;
          border-radius:10px;
          margin-bottom:30px;
        }

        .formCard{
          background:white;
          padding:30px;
          max-width:500px;
          margin:auto;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.2);
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        input{
          padding:10px;
          border-radius:8px;
          border:1px solid #ccc;
        }

        .saveBtn{
          margin-top:10px;
          background:#2563eb;
          color:white;
          border:none;
          padding:10px;
          border-radius:8px;
          cursor:pointer;
          transition:.2s;
        }

        .saveBtn:hover{
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

        .backBtn{
          background:#e5e7eb;
          border:none;
          padding:10px;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:5px;
          transition:.2s;
        }

        .backBtn:hover{
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

      `}</style>

    </div>

  );

}