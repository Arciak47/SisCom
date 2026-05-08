"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CargarNominaFijos() {

  const router = useRouter();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [errorFormato, setErrorFormato] = useState("");

  const headersOrdenados = [
    "Numero de ficha",
    "Nombres",
    "Apellidos",
    "Edad",
    "Cedula",
    "Cargo",
    "Jefe o Supervisor inmediato"
  ];

  const limpiar = (txt) =>
    txt?.toString().trim().replace(/\s+/g, " ");

  const capitalizar = (txt) =>
    txt?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  function openFileExplorer() {
    fileInputRef.current.click();
  }

  function eliminarArchivo() {
    setFileName("");
    setData([]);
    setFileLoaded(false);
    setErrorFormato("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validar(headers) {
    const requeridos = [
      "Numero de ficha",
      "Primer Nombre",
      "Segundo Nombre",
      "Primer Apellido",
      "Segundo Apellido",
      "Edad",
      "Cedula",
      "Cargo",
      "Jefe o Supervisor inmediato"
    ];

    const normal = headers.map(h => h?.toString().toLowerCase());

    return requeridos.every(h =>
      normal.includes(h.toLowerCase())
    );
  }

  function handleFile(e) {

    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorFormato("");

    const reader = new FileReader();

    reader.onload = (evt) => {

      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        setErrorFormato("❌ Archivo vacío");
        return;
      }

      const headers = Object.keys(json[0]);

      if (!validar(headers)) {
        setErrorFormato("❌ Formato incorrecto (usa la plantilla)");
        return;
      }

      let fichas = new Set();
      let cedulas = new Set();
      let duplicados = false;

      const formatted = json.map((row) => {

        const ficha = limpiar(row["Numero de ficha"]);
        const cedula = limpiar(row["Cedula"]);

        if (fichas.has(ficha) || cedulas.has(cedula)) {
          duplicados = true;
        }

        fichas.add(ficha);
        cedulas.add(cedula);

        return {
          "Numero de ficha": ficha,
          "Nombres": capitalizar(
            `${limpiar(row["Primer Nombre"])} ${limpiar(row["Segundo Nombre"])}`
          ),
          "Apellidos": capitalizar(
            `${limpiar(row["Primer Apellido"])} ${limpiar(row["Segundo Apellido"])}`
          ),
          "Edad": limpiar(row["Edad"]),
          "Cedula": `V-${cedula}`,
          "Cargo": capitalizar(limpiar(row["Cargo"])),
          "Jefe o Supervisor inmediato": capitalizar(
            limpiar(row["Jefe o Supervisor inmediato"])
          )
        };
      });

      if (duplicados) {
        setErrorFormato("❌ Hay fichas o cédulas duplicadas");
        return;
      }

      setData(formatted);
      setFileLoaded(true);
    };

    reader.readAsBinaryString(file);
  }

  async function guardarNomina() {

    if (data.length === 0) {
      alert("No hay datos para guardar");
      return;
    }

    try {

      await setDoc(doc(db, "nominas", "fijos"), {
        datos: data
      });

      alert("✅ Nómina guardada correctamente");

      router.push("/gerente/cargar-nomina/fijo/ver");

    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Cargar Nómina - Trabajadores Fijos</h1>
      </div>

      <div className="uploadCard">

        <div className="iconContainer">
          <FileSpreadsheet size={65} className="excelIcon"/>
        </div>

        <h2>Arrastre el archivo Excel aquí</h2>

        <p className="warning">
          ⚠️ Cargar una nueva nómina reemplazará completamente la anterior
        </p>

        {errorFormato && (
          <p style={{color:"red", marginTop:"10px"}}>
            {errorFormato}
          </p>
        )}

        <div
          className="dropZone"
          onClick={openFileExplorer}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile({ target: { files: e.dataTransfer.files } });
          }}
        >
          <Upload size={40}/>
          <p>Haga clic o arrastre el archivo aquí</p>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            ref={fileInputRef}
            onChange={handleFile}
            hidden
          />
        </div>

        {fileName && (
          <div className="filePreview">
            <FileSpreadsheet size={20}/>
            <span>{fileName}</span>

            <button className="deleteBtn" onClick={eliminarArchivo}>
              ❌
            </button>
          </div>
        )}

        {data.length > 0 && (
          <>
            <p style={{marginTop:"15px", fontWeight:"bold"}}>
              Total de trabajadores: {data.length}
            </p>

            <div className="tableContainer">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {headersOrdenados.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {headersOrdenados.map((h, j) => (
                        <td key={j}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <button
          className="uploadBtn"
          onClick={fileLoaded ? guardarNomina : openFileExplorer}
        >
          {fileLoaded ? "Guardar Nómina" : "Subir archivo"}
        </button>

        <button
          className="backBtn"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18}/> Volver
        </button>

      </div>

      <style jsx>{`
        .main { padding:40px; }

        .panelTitle {
          display:inline-block;
          background:white;
          padding:12px 20px;
          border-left:5px solid #facc15;
          border-radius:10px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
          margin-bottom:30px;
        }

        .uploadCard {
          background:white;
          padding:40px;
          width:90%;
          max-width:1000px;
          margin:auto;
          border-radius:18px;
          box-shadow:0 15px 35px rgba(0,0,0,0.2);
          text-align:center;
        }

        .iconContainer {
          display:flex;
          justify-content:center;
          margin-bottom:10px;
        }

        .excelIcon { color:#16a34a; }

        .warning {
          color:#dc2626;
          font-size:13px;
        }

        .dropZone {
          margin-top:20px;
          border:2px dashed #cbd5e1;
          border-radius:12px;
          padding:40px;
          cursor:pointer;
          background:#f8fafc;
          transition:.2s;
        }

        .dropZone:hover {
          background:#eef2ff;
          transform:scale(1.02);
        }

        .filePreview {
          margin-top:15px;
          display:flex;
          justify-content:center;
          align-items:center;
          gap:10px;
          background:#f1f5f9;
          padding:10px;
          border-radius:8px;
        }

        .deleteBtn {
          background:red;
          color:white;
          border:none;
          padding:5px 8px;
          border-radius:6px;
          cursor:pointer;
        }

        .tableContainer {
          margin-top:20px;
          max-height:400px;
          overflow:auto;
        }

        table {
          width:100%;
          border-collapse:collapse;
        }

        th, td {
          border:1px solid #ddd;
          padding:8px;
          font-size:13px;
        }

        th {
          background:#2563eb;
          color:white;
          position:sticky;
          top:0;
        }

        /* 🔥 EFECTOS PROFESIONALES */
        .uploadBtn {
          margin-top:20px;
          background:#2563eb;
          color:white;
          padding:12px;
          width:100%;
          border-radius:9px;
          cursor:pointer;
          transition:all .25s ease;
        }

        .uploadBtn:hover {
          transform:scale(1.05);
          box-shadow:0 8px 20px rgba(0,0,0,0.25);
        }

        .backBtn {
          margin-top:10px;
          display:flex;
          justify-content:center;
          align-items:center;
          gap:5px;
          background:#e5e7eb;
          padding:10px;
          width:100%;
          border-radius:9px;
          cursor:pointer;
          border:none;
          transition:all .25s ease;
        }

        .backBtn:hover {
          transform:scale(1.05);
          box-shadow:0 8px 20px rgba(0,0,0,0.2);
        }

      `}</style>

    </div>
  );
}