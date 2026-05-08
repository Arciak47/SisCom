"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft, Trash2, Save } from "lucide-react";

export default function EditarContratistas(){

  const router = useRouter();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 CAPITALIZAR
  function capitalizar(texto){
    if(!texto) return "";
    return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // 🔥 CARGAR DATA
  useEffect(()=>{

    async function fetchData(){

      try{
        const ref = doc(db, "nominas", "contratistas");
        const snap = await getDoc(ref);

        if(snap.exists()){
          setData(snap.data().datos || []);
        }

      }catch(error){
        console.error(error);
      }

      setLoading(false);
    }

    fetchData();

  },[]);

  // 🔥 EDITAR CAMPOS
  function handleChange(index, field, value){

    let newData = [...data];

    // SOLO NÚMEROS
    if(field === "Numero de ficha" || field === "Edad"){
      value = value.replace(/\D/g, "");
    }

    // CÉDULA
    if(field === "Cedula"){
      const numeros = value.replace(/\D/g, "");
      value = `V-${numeros}`;
    }

    // TEXTOS
    if(
      field === "Nombres" ||
      field === "Apellidos" ||
      field === "Cargo" ||
      field === "Empresa" ||
      field === "Jefe o Supervisor inmediato"
    ){
      value = capitalizar(value);
    }

    newData[index][field] = value;

    setData(newData);
  }

  // 🔥 ELIMINAR FILA
  function eliminar(index){

    const ok = confirm("¿Eliminar contratista?");
    if(!ok) return;

    const newData = data.filter((_,i)=>i !== index);
    setData(newData);
  }

  // 🔥 GUARDAR
  async function guardar(){

    try{

      const ref = doc(db, "nominas", "contratistas");

      await setDoc(ref, { datos: data });

      alert("✅ Cambios guardados");

      router.push("/gerente/cargar-nomina/contratistas/ver");

    }catch(error){
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return(

    <div className="main">

      <div className="panelTitle">
        <h1>Editar Nómina - Contratistas</h1>
      </div>

      <div className="card">

        {loading ? (
          <p>Cargando...</p>
        ) : data.length === 0 ? (
          <p>No hay datos</p>
        ) : (

          <div className="tableContainer">

            <table>

              <thead>
                <tr>
                  <th>Numero de ficha</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Edad</th>
                  <th>Cedula</th>
                  <th>Cargo</th>
                  <th>Empresa</th>
                  <th>Jefe o Supervisor inmediato</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {data.map((row,index)=>(

                  <tr key={index}>

                    <td>
                      <input value={row["Numero de ficha"] || ""} onChange={(e)=>handleChange(index,"Numero de ficha",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Nombres"] || ""} onChange={(e)=>handleChange(index,"Nombres",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Apellidos"] || ""} onChange={(e)=>handleChange(index,"Apellidos",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Edad"] || ""} onChange={(e)=>handleChange(index,"Edad",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Cedula"] || ""} onChange={(e)=>handleChange(index,"Cedula",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Cargo"] || ""} onChange={(e)=>handleChange(index,"Cargo",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Empresa"] || ""} onChange={(e)=>handleChange(index,"Empresa",e.target.value)}/>
                    </td>

                    <td>
                      <input value={row["Jefe o Supervisor inmediato"] || ""} onChange={(e)=>handleChange(index,"Jefe o Supervisor inmediato",e.target.value)}/>
                    </td>

                    <td>
                      <button className="deleteBtn" onClick={()=>eliminar(index)}>
                        <Trash2 size={14}/>
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        <div className="buttons">

          <button className="saveBtn" onClick={guardar}>
            <Save size={16}/> Guardar Cambios
          </button>

          <button className="backBtn" onClick={()=>router.back()}>
            <ArrowLeft size={16}/> Volver
          </button>

        </div>

      </div>

      <style jsx>{`

        .main{ padding:40px; }

        .panelTitle{
          background:white;
          padding:12px 20px;
          border-left:5px solid #1520fa;
          border-radius:10px;
          margin-bottom:30px;
        }

        .card{
          background:white;
          padding:25px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.2);
        }

        .tableContainer{
          overflow:auto;
          max-height:450px;
        }

        table{
          width:100%;
          border-collapse:collapse;
        }

        th,td{
          border:1px solid #ddd;
          padding:6px;
        }

        th{
          background:#2563eb;
          color:white;
        }

        input{
          width:100%;
          padding:5px;
          border-radius:5px;
          border:1px solid #ccc;
        }

        .buttons{
          margin-top:20px;
          display:flex;
          gap:10px;
        }

        .saveBtn{
          background:#16a34a;
          color:white;
          padding:10px;
          border:none;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:5px;
        }

        .deleteBtn{
          background:#dc2626;
          color:white;
          border:none;
          padding:6px;
          border-radius:6px;
          cursor:pointer;
        }

        .backBtn{
          background:#e5e7eb;
          border:none;
          padding:10px;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:5px;
        }

      `}</style>

    </div>
  );

}