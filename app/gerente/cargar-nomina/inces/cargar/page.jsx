"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CargarInces() {

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
    "Supervisor"
  ];

  const limpiar = (txt) =>
    txt?.toString().trim().replace(/\s+/g, " ");

  const capitalizar = (txt) =>
    txt?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  // 🔥 ASEGURA SIEMPRE "V-" AL INICIO
  const formatearCedula = (cedula) => {
    const limpia = limpiar(cedula)?.replace(/^V-/i, "");
    return limpia ? `V-${limpia}` : "";
  };

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
      "Nombres",
      "Apellidos",
      "Edad",
      "Cedula",
      "Supervisor"
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

      const formatted = json.map((row) => ({
        "Numero de ficha": limpiar(row["Numero de ficha"]),
        "Nombres": capitalizar(limpiar(row["Nombres"])),
        "Apellidos": capitalizar(limpiar(row["Apellidos"])),
        "Edad": limpiar(row["Edad"]),
        "Cedula": formatearCedula(row["Cedula"]), // 🔥 AQUÍ SE ARREGLA
        "Supervisor": capitalizar(limpiar(row["Supervisor"]))
      }));

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

      await setDoc(doc(db, "nominas", "inces"), {
        datos: data
      });

      alert("✅ Nómina INCES guardada");

      router.push("/gerente/cargar-nomina/inces/ver");

    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Cargar Nómina - Estudiantes INCES</h1>
      </div>

      <div className="uploadCard">

        <div className="iconContainer">
          <FileSpreadsheet size={70} className="excelIcon"/>
        </div>

        <h2>Arrastre el archivo Excel aquí</h2>

        <p className="warning">
          ⚠️ Cargar una nueva nómina reemplazará completamente la anterior
        </p>

        {errorFormato && (
          <p className="error">{errorFormato}</p>
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
            <p className="contador">
              Total de estudiantes: {data.length}
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
          background:white;
          padding:12px 20px;
          border-left:5px solid #fa1515;
          border-radius:10px;
          margin-bottom:30px;
        }

        .uploadCard {
          background:white;
          padding:40px;
          max-width:1000px;
          margin:auto;
          border-radius:18px;
          box-shadow:0 15px 35px rgba(0,0,0,0.2);
          text-align:center;
        }

        .iconContainer {
          display:flex;
          justify-content:center;
          align-items:center;
          margin-bottom:15px;
        }

        .excelIcon {
          color:#16a34a;
        }

        .warning {
          color:#dc2626;
          font-size:13px;
        }

        .error {
          color:red;
          margin-top:10px;
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

        .contador {
          margin-top:15px;
          font-weight:bold;
          font-size:16px;
        }

        .tableContainer {
          margin-top:15px;
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
        }

        th {
          background:#2563eb;
          color:white;
        }

        .uploadBtn {
          margin-top:20px;
          background:#2563eb;
          color:white;
          padding:12px;
          width:100%;
          border-radius:9px;
          cursor:pointer;
          transition:.2s;
        }

        .uploadBtn:hover {
          transform:scale(1.05);
        }

        .backBtn {
          margin-top:10px;
          background:#e5e7eb;
          padding:10px;
          width:100%;
          border-radius:9px;
          cursor:pointer;
          border:none;
          display:flex;
          justify-content:center;
          align-items:center;
          gap:5px;
          transition:.2s;
        }

        .backBtn:hover {
          transform:scale(1.05);
        }

      `}</style>

    </div>
  );
}