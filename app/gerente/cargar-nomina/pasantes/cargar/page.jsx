"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { checkDuplicateFichasInDB, normalizeHeader, findHeaderRowIndex, formatCategoryName, validarNombreArchivo, registrarAuditoria } from "../../../../lib/validationHelpers";
import { db } from "../../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CargarPasantes() {

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
    "Cedula",
    "Edad",
    "Supervisor",
    "Area Asignada"
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
    const normal = headers.map(h => normalizeHeader(h));
    const requeridos = [
      "nombres",
      "apellidos",
      "cedula",
      "edad",
      "supervisor",
      "area asignada"
    ];
    return requeridos.every(h => normal.includes(h));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!validarNombreArchivo(file.name, "pasantes")) {
      setErrorFormato(`❌ El archivo '${file.name}' no corresponde a la categoría de Pasantes.`);
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
        const supervisorIdx = getHeaderIdx("supervisor");
        const areaIdx = getHeaderIdx("area asignada");

        let internalFichas = new Set();
        let internalCedulas = new Set();
        let duplicateFichasInFile = new Set();
        let duplicateCedulasInFile = new Set();
        const formatted = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (!row || row.length === 0) continue;

          const getValue = (idx) => idx !== -1 && row[idx] !== undefined && row[idx] !== null ? limpiar(row[idx]) : "";

          const rawCedula = getValue(cedulaIdx);
          const cleanCed = rawCedula.replace(/^V-/i, "").replace(/\D/g, "");
          const formattedCedula = cleanCed ? `V-${cleanCed}` : "";

          if (!rawCedula && !getValue(nombresIdx)) continue; // Skip empty rows

          // Read Ficha if present, otherwise fallback to last 4 digits of Cedula
          let ficha = "";
          if (fichaIdx !== -1 && getValue(fichaIdx)) {
            ficha = getValue(fichaIdx);
          } else {
            ficha = cleanCed.slice(-4);
          }

          const nombres = capitalizar(getValue(nombresIdx));
          const apellidos = capitalizar(getValue(apellidosIdx));
          const edad = getValue(edadIdx);
          const supervisor = capitalizar(getValue(supervisorIdx));
          const areaAsignada = capitalizar(getValue(areaIdx));

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
            "Cedula": formattedCedula,
            "Edad": edad,
            "Supervisor": supervisor,
            "Area Asignada": areaAsignada
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
        const dbConflicts = await checkDuplicateFichasInDB(Array.from(internalFichas), "pasantes");
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

    const ok = confirm("⚠️ ¿Está seguro de que desea reemplazar toda la nómina actual de Pasantes? Esta acción no se puede deshacer y borrará los registros anteriores.");
    if (!ok) return;

    try {

      await setDoc(doc(db, "nominas", "pasantes"), {
        datos: data
      });

      // Log Audit Trail
      await registrarAuditoria(
        "Importación de Nómina",
        `Se importo y reemplazo la nomina de Pasantes vía Excel (total registros: ${data.length}).`
      );

      alert("✅ Nómina de Pasantes guardada");

      router.push("/gerente/cargar-nomina/pasantes/ver");

    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    }
  }

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Cargar Nómina - Pasantes</h1>
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
          <p className="error" style={{ whiteSpace: "pre-line" }}>{errorFormato}</p>
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
              Total de pasantes: {data.length}
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
          border-left:5px solid #16a34a;
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