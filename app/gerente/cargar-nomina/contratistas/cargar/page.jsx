"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CargarContratistas() {

  const router = useRouter();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [fileLoaded, setFileLoaded] = useState(false);

  // 🔥 HEADERS ACTUALIZADOS (CON EMPRESA)
  const headersOrdenados = [
    "Numero de ficha",
    "Nombres",
    "Apellidos",
    "Edad",
    "Cedula",
    "Cargo",
    "Empresa",
    "Jefe o Supervisor inmediato"
  ];

  const limpiar = (txt) =>
    txt?.toString().trim().replace(/\s+/g, " ");

  // 🔥 DETECTAR HEADER
  function encontrarHeader(rows) {
    return rows.findIndex(row =>
      row.some(cell =>
        typeof cell === "string" &&
        cell.toLowerCase().includes("nombre")
      )
    );
  }

  // 🔥 LEER EXCEL (CORREGIDO)
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (evt) => {

      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headerIndex = encontrarHeader(rows);

      if (headerIndex === -1) {
        alert("❌ El archivo no tiene estructura válida");
        return;
      }

      const dataRows = rows.slice(headerIndex + 1);

      const formatted = dataRows
        .filter(row => row.length > 0)
        .map(row => ({

          "Numero de ficha": limpiar(row[1]),
          "Nombres": limpiar(row[2]) + " " + limpiar(row[3]),
          "Apellidos": limpiar(row[4]) + " " + limpiar(row[5]),
          "Edad": limpiar(row[6]),
          "Cedula": "V-" + limpiar(row[7]),
          "Cargo": limpiar(row[8]),
          "Empresa": limpiar(row[9]),
          "Jefe o Supervisor inmediato": limpiar(row[10]),

        }))
        .filter(item =>
          item["Nombres"] &&
          item["Nombres"].toLowerCase() !== "nombres"
        );

      setData(formatted);
      setFileLoaded(true);
    };

    reader.readAsBinaryString(file);
  }

  // 🔥 GUARDAR
  async function guardarNomina() {

    if (data.length === 0) {
      alert("No hay datos para guardar");
      return;
    }

    try {

      await setDoc(doc(db, "nominas", "contratistas"), {
        datos: data
      });

      alert("✅ Nómina de contratistas guardada");

      router.push("/gerente/cargar-nomina/contratistas/ver");

    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  function openFileExplorer() {
    fileInputRef.current.click();
  }

  function eliminarArchivo() {
    setFileName("");
    setData([]);
    setFileLoaded(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Cargar Nómina - Contratistas</h1>
      </div>

      <div className="uploadCard">

        <div className="iconContainer">
          <FileSpreadsheet size={65} className="excelIcon"/>
        </div>

        <h2>Arrastre el archivo Excel aquí</h2>

        <p className="warning">
          ⚠️ Cargar una nueva nómina reemplazará completamente la anterior
        </p>

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
          <div className="tableContainer">
            <table>
              <thead>
                <tr>
                  {headersOrdenados.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {headersOrdenados.map((h, j) => (
                      <td key={j}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          border-left:5px solid #1519fa;
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
          transition:0.2s;
        }

        .dropZone:hover {
          background:#e2e8f0;
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
        }

        /* 🔥 BOTONES CON EFECTO PRO */
        .uploadBtn {
          margin-top:20px;
          background:#2563eb;
          color:white;
          padding:12px;
          width:100%;
          border-radius:9px;
          cursor:pointer;
          transition:all 0.2s;
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
          transition:all 0.2s;
        }

        .backBtn:hover {
          transform:scale(1.05);
          box-shadow:0 8px 20px rgba(0,0,0,0.2);
        }

      `}</style>

    </div>
  );
}