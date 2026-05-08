"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function ManualContratistas(){

  const router = useRouter();

  const [form, setForm] = useState({
    ficha: "",
    nombres: "",
    apellidos: "",
    edad: "",
    cedula: "",
    cargo: "",
    empresa: "",
    jefe: ""
  });

  // 🔥 CAPITALIZAR
  function capitalizar(texto){
    if(!texto) return "";
    return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // 🔥 INPUTS
  function handleChange(e){

    const { name, value } = e.target;

    // SOLO NÚMEROS
    if(name === "ficha" || name === "edad"){
      setForm({
        ...form,
        [name]: value.replace(/\D/g, "")
      });
      return;
    }

    // CÉDULA SOLO NÚMEROS
    if(name === "cedula"){
      setForm({
        ...form,
        cedula: value.replace(/\D/g, "")
      });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  }

  // 🔥 VALIDACIÓN
  function validar(){
    return (
      form.ficha &&
      form.nombres &&
      form.apellidos &&
      form.edad &&
      form.cedula &&
      form.cargo &&
      form.empresa &&
      form.jefe
    );
  }

  // 🔥 GUARDAR
  async function guardar(){

    if(!validar()){
      alert("⚠️ Todos los campos son obligatorios");
      return;
    }

    try{

      const ref = doc(db, "nominas", "contratistas");
      const snap = await getDoc(ref);

      let datos = [];

      if(snap.exists()){
        datos = snap.data().datos || [];
      }

      const nuevo = {
        "Numero de ficha": form.ficha,
        "Nombres": capitalizar(form.nombres),
        "Apellidos": capitalizar(form.apellidos),
        "Edad": form.edad,
        "Cedula": `V-${form.cedula}`,
        "Cargo": capitalizar(form.cargo),
        "Empresa": capitalizar(form.empresa),
        "Jefe o Supervisor inmediato": capitalizar(form.jefe)
      };

      datos.push(nuevo);

      await setDoc(ref, { datos });

      alert("✅ Contratista agregado");

      router.push("/gerente/cargar-nomina/contratistas/ver");

    }catch(error){
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return(

    <div className="main">

      <div className="panelTitle">
        <h1>Añadir Contratista Manual</h1>
      </div>

      <div className="formCard">

        <input name="ficha" placeholder="Número de ficha" value={form.ficha} onChange={handleChange}/>
        <input name="nombres" placeholder="Nombres" value={form.nombres} onChange={handleChange}/>
        <input name="apellidos" placeholder="Apellidos" value={form.apellidos} onChange={handleChange}/>
        <input name="edad" placeholder="Edad" value={form.edad} onChange={handleChange}/>

        <input
          name="cedula"
          placeholder="Cédula"
          value={form.cedula ? `V-${form.cedula}` : ""}
          onChange={handleChange}
        />

        <input name="cargo" placeholder="Cargo" value={form.cargo} onChange={handleChange}/>
        <input name="empresa" placeholder="Empresa" value={form.empresa} onChange={handleChange}/>
        <input name="jefe" placeholder="Jefe o Supervisor" value={form.jefe} onChange={handleChange}/>

        <button className="saveBtn" onClick={guardar}>
          Guardar
        </button>

        <button className="backBtn" onClick={()=>router.back()}>
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
          border-left:5px solid #1d15fa;
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