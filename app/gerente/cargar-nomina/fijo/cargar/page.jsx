"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { checkDuplicateFichasInDB, normalizeHeader, findHeaderRowIndex, formatCategoryName, validarNombreArchivo, registrarAuditoria } from "../../../../lib/validationHelpers";
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
    const normal = headers.map(h => normalizeHeader(h));
    
    // Check new layout
    const newRequeridos = ["ficha", "nombres", "apellidos", "cedula", "edad", "cargo", "jefe o supervisor inmediato"];
    const matchesNew = newRequeridos.every(h => normal.includes(h));
    if (matchesNew) return true;

    // Check old layout (at least need: ficha/cedula/nombres/cargo/jefe)
    const oldRequeridos = ["numero de ficha", "primer nombre", "primer apellido", "cedula", "cargo", "jefe o supervisor inmediato"];
    return oldRequeridos.every(h => normal.includes(h));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!validarNombreArchivo(file.name, "fijos")) {
      setErrorFormato(`❌ El archivo '${file.name}' no corresponde a la categoría de Trabajadores Fijos.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    setErrorFormato("");
    setData([]);
    setFileLoaded(false);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length === 0) {
          setErrorFormato("❌ Archivo vacío");
          return;
        }

        const headerIndex = findHeaderRowIndex(rows);
        if (headerIndex === -1) {
          setErrorFormato("❌ No se encontraron las cabeceras válidas en el archivo");
          return;
        }

        const headers = rows[headerIndex];
        if (!validar(headers)) {
          setErrorFormato("❌ Formato incorrecto (verifica las columnas de la plantilla)");
          return;
        }

        const dataRows = rows.slice(headerIndex + 1);
        
        const getHeaderIdx = (name) => {
          const target = normalizeHeader(name);
          return headers.findIndex(h => {
            const normH = normalizeHeader(h);
            if (target === "numero de ficha" && normH === "ficha") return true;
            return normH === target;
          });
        };

        const fichaIdx = getHeaderIdx("numero de ficha");
        const nombresIdx = getHeaderIdx("nombres");
        const apellidosIdx = getHeaderIdx("apellidos");
        const cedulaIdx = getHeaderIdx("cedula");
        const edadIdx = getHeaderIdx("edad");
        const cargoIdx = getHeaderIdx("cargo");
        const supervisorIdx = getHeaderIdx("jefe o supervisor inmediato");

        let internalFichas = new Set();
        let internalCedulas = new Set();
        let duplicateFichasInFile = new Set();
        let duplicateCedulasInFile = new Set();
        const formatted = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.length === 0) continue;

          const getValue = (idx) => idx !== -1 && row[idx] !== undefined && row[idx] !== null ? limpiar(row[idx]) : "";

          let ficha = getValue(fichaIdx);
          
          if (!ficha && !getValue(nombresIdx) && !getValue(cedulaIdx)) continue; // skip empty rows

          let nombres = "";
          if (nombresIdx !== -1 && getValue(nombresIdx)) {
            nombres = capitalizar(getValue(nombresIdx));
          } else {
            const primerNombreIdx = getHeaderIdx("primer nombre");
            const segundoNombreIdx = getHeaderIdx("segundo nombre");
            nombres = capitalizar(`${getValue(primerNombreIdx)} ${getValue(segundoNombreIdx)}`);
          }

          let apellidos = "";
          if (apellidosIdx !== -1 && getValue(apellidosIdx)) {
            apellidos = capitalizar(getValue(apellidosIdx));
          } else {
            const primerApellidoIdx = getHeaderIdx("primer apellido");
            const segundoApellidoIdx = getHeaderIdx("segundo apellido");
            apellidos = capitalizar(`${getValue(primerApellidoIdx)} ${getValue(segundoApellidoIdx)}`);
          }

          const rawCedula = getValue(cedulaIdx);
          const cleanCed = rawCedula.replace(/^V-/i, "").replace(/\D/g, "");
          const formattedCedula = cleanCed ? `V-${cleanCed}` : "";

          const edad = getValue(edadIdx);
          const cargo = capitalizar(getValue(cargoIdx));
          const supervisor = capitalizar(getValue(supervisorIdx));

          if (ficha && internalFichas.has(ficha)) {
            const existing = formatted.find(item => item["Numero de ficha"] === ficha);
            if (existing && existing["Cedula"] === formattedCedula) {
              // Exact duplicate row (same person & card), skip it silently
              continue;
            } else {
              duplicateFichasInFile.add(ficha);
            }
          }

          if (formattedCedula && internalCedulas.has(formattedCedula)) {
            const existing = formatted.find(item => item["Cedula"] === formattedCedula);
            if (existing && existing["Numero de ficha"] === ficha) {
              // Exact duplicate row (same person & card), skip it silently
              continue;
            } else {
              duplicateCedulasInFile.add(formattedCedula);
            }
          }

          if (ficha) internalFichas.add(ficha);
          if (formattedCedula) internalCedulas.add(formattedCedula);

          formatted.push({
            "Numero de ficha": ficha,
            "Nombres": nombres,
            "Apellidos": apellidos,
            "Edad": edad,
            "Cedula": formattedCedula,
            "Cargo": cargo,
            "Jefe o Supervisor inmediato": supervisor
          });
        }

        if (duplicateFichasInFile.size > 0) {
          setErrorFormato(`❌ El archivo contiene números de ficha duplicados: ${Array.from(duplicateFichasInFile).join(", ")}`);
          return;
        }

        if (duplicateCedulasInFile.size > 0) {
          setErrorFormato(`❌ El archivo contiene cédulas duplicadas: ${Array.from(duplicateCedulasInFile).join(", ")}`);
          return;
        }

        // Validate duplicates against DB (other categories)
        const dbConflicts = await checkDuplicateFichasInDB(Array.from(internalFichas), "fijos");
        if (dbConflicts.length > 0) {
          const conflictMsgs = dbConflicts.map(c => `Ficha ${c.ficha} (ya existe en ${formatCategoryName(c.category)})`);
          setErrorFormato(`❌ Conflicto de fichas con la base de datos:\n${conflictMsgs.join("\n")}`);
          return;
        }

        setData(formatted);
        setFileLoaded(true);
      } catch (err) {
        console.error(err);
        setErrorFormato("❌ Error al procesar: " + err.message);
      }
    };

    reader.readAsBinaryString(file);
  }

  async function guardarNomina() {

    if (data.length === 0) {
      alert("No hay datos para guardar");
      return;
    }

    const ok = confirm("⚠️ ¿Está seguro de que desea reemplazar toda la nómina actual de Trabajadores Fijos? Esta acción no se puede deshacer y borrará los registros anteriores.");
    if (!ok) return;

    try {

      await setDoc(doc(db, "nominas", "fijos"), {
        datos: data
      });

      // Log Audit Trail
      await registrarAuditoria(
        "Importación de Nómina",
        `Se importo y reemplazo la nomina de Trabajadores Fijos vía Excel (total registros: ${data.length}).`
      );

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
          <p style={{color:"red", marginTop:"10px", whiteSpace:"pre-line"}}>
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