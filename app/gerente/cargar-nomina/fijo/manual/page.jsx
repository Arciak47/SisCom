"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";

export default function ManualFijos(){

  const router = useRouter();

  const [form, setForm] = useState({
    ficha: "",
    nombres: "",
    apellidos: "",
    edad: "",
    cedula: "",
    cargo: "",
    jefe: ""
  });

  // 🔥 BOTÓN VOLVER INTELIGENTE
  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/gerente/cargar-nomina/fijo/ver");
    }
  }

  // 🔥 CAPITALIZAR
  function capitalizar(texto){
    if(!texto) return "";
    return texto
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  // 🔥 INPUTS CONTROLADOS
  function handleChange(e){

    const { name, value } = e.target;

    // 🔢 SOLO NÚMEROS → ficha, edad
    if(name === "ficha" || name === "edad"){
      const numeros = value.replace(/\D/g, "");
      setForm({
        ...form,
        [name]: numeros
      });
      return;
    }

    // 🔢 SOLO NÚMEROS + FORMATO V-
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

  // 🔥 VALIDAR CAMPOS VACÍOS
  function validarCampos(){
    return Object.values(form).every(campo => campo !== "");
  }

  // 🔥 GUARDAR
  async function guardar(){

    if(!validarCampos()){
      alert("⚠️ Debes llenar todos los campos");
      return;
    }

    try{

      const docRef = doc(db, "nominas", "fijos");
      const docSnap = await getDoc(docRef);

      let datos = [];

      if(docSnap.exists()){
        datos = docSnap.data().datos || [];
      }

      const nuevo = {
        "Numero de ficha": form.ficha,
        "Nombres": capitalizar(form.nombres),
        "Apellidos": capitalizar(form.apellidos),
        "Edad": form.edad,
        "Cedula": `V-${form.cedula}`,
        "Cargo": capitalizar(form.cargo),
        "Jefe o Supervisor inmediato": capitalizar(form.jefe)
      };

      datos.push(nuevo);

      await setDoc(docRef, { datos });

      alert("✅ Trabajador agregado");

      router.push("/gerente/cargar-nomina/fijo/ver");

    }catch(error){
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return(

    <div className="main">

      <div className="panelTitle">
        <h1>Añadir Trabajador Manual</h1>
      </div>

      <div className="formCard">

        <input
          name="ficha"
          placeholder="Número de ficha"
          value={form.ficha}
          onChange={handleChange}
        />

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
          name="edad"
          placeholder="Edad"
          value={form.edad}
          onChange={handleChange}
        />

        <input
          name="cedula"
          placeholder="Cédula"
          value={form.cedula ? `V-${form.cedula}` : ""}
          onChange={handleChange}
        />

        <input
          name="cargo"
          placeholder="Cargo"
          value={form.cargo}
          onChange={handleChange}
        />

        <input
          name="jefe"
          placeholder="Jefe o Supervisor"
          value={form.jefe}
          onChange={handleChange}
        />

        <button className="saveBtn" onClick={guardar}>
          Guardar
        </button>

        {/* 🔥 BOTÓN VOLVER INTELIGENTE */}
        <button
          className="backBtn"
          onClick={handleBack}
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
          border-left:5px solid #facc15;
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