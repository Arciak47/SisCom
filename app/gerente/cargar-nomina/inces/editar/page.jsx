"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { registrarAuditoria } from "../../../../lib/validationHelpers";

export default function EditarEstudiantes(){

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

      const docRef = doc(db, "nominas", "inces");
      const docSnap = await getDoc(docRef);

      if(docSnap.exists()){
        setData(docSnap.data().datos || []);
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

    // CÉDULA CON V-
    if(field === "Cedula"){
      const numeros = value.replace(/\D/g, "");
      value = `V-${numeros}`;
    }

    // TEXTOS EN MAYÚSCULA INICIAL
    if(
      field === "Nombres" ||
      field === "Apellidos" ||
      field === "Supervisor"
    ){
      value = capitalizar(value);
    }

    newData[index][field] = value;

    setData(newData);
  }

  // 🔥 ELIMINAR
  function eliminar(index){

    const confirmacion = confirm("¿Eliminar estudiante?");
    if(!confirmacion) return;

    let newData = data.filter((_,i)=>i !== index);
    setData(newData);
  }

  // 🔥 GUARDAR
  async function guardar(){

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const cleanCed = String(row["Cedula"] || "").replace(/^V-/i, "").replace(/\D/g, "");
      if (cleanCed.length < 7 || cleanCed.length > 8) {
        alert(`❌ En la fila ${i + 1}, la cédula de ${row["Nombres"] || "este registro"} debe tener entre 7 y 8 dígitos.`);
        return;
      }
      const cleanEdad = String(row["Edad"] || "").replace(/\D/g, "");
      if (cleanEdad.length !== 2) {
        alert(`❌ En la fila ${i + 1}, la edad de ${row["Nombres"] || "este registro"} debe tener exactamente 2 dígitos.`);
        return;
      }
    }


    try{

      const docRef = doc(db, "nominas", "inces");

      await setDoc(docRef, { datos: data });

      // Log Audit Trail
      await registrarAuditoria(
        "Modificación de Nómina",
        `Se guardaron cambios y modificaciones en la nomina de Estudiantes INCES (total registros: ${data.length}).`
      );

      alert("✅ Cambios guardados");

      router.push("/gerente/cargar-nomina/inces/ver");

    }catch(error){
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return(

    <div className="main">

      <div className="panelTitle">
        <h1>Editar Nómina - Estudiantes INCES</h1>
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
                  <th>#</th>
                  <th>Numero de ficha</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Edad</th>
                  <th>Cedula</th>
                  <th>Supervisor</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {data.map((row,index)=>(

                  <tr key={index}>

                    <td>{index + 1}</td>

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
                      <input value={row["Edad"] || ""} onChange={(e)=>handleChange(index,"Edad",e.target.value)} maxLength={2}/>
                    </td>

                    <td>
                      <input value={row["Cedula"] || ""} onChange={(e)=>handleChange(index,"Cedula",e.target.value)} maxLength={10}/>
                    </td>

                    <td>
                      <input value={row["Supervisor"] || ""} onChange={(e)=>handleChange(index,"Supervisor",e.target.value)}/>
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
          border-left:5px solid #fa1515;
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
          transition:.2s;
        }

        .saveBtn:hover{
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

        .deleteBtn{
          background:#dc2626;
          color:white;
          border:none;
          padding:6px;
          border-radius:6px;
          cursor:pointer;
          transition:.2s;
        }

        .deleteBtn:hover{
          transform:scale(1.1);
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