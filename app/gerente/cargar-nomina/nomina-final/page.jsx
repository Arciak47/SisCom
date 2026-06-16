"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  Users, 
  Download, 
  Search, 
  ArrowLeft, 
  Upload, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Trash,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  FileCheck
} from "lucide-react";

export default function NominaConsole() {
  const router = useRouter();

  // Active Category state: fijos | contratistas | inces | pasantes | visitantes
  const [activeCat, setActiveCat] = useState("fijos");

  // Roster lists from Firestore
  const [nominas, setNominas] = useState({
    fijos: [],
    contratistas: [],
    inces: [],
    pasantes: [],
    visitantes: []
  });

  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Pagination
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Modals state
  const [modalVer, setModalVer] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalAgregar, setModalAgregar] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({});

  // File Input Ref
  const fileInputRef = useRef(null);

  // Headers definitions per category
  const headersConfig = {
    fijos: [
      "Numero de ficha",
      "Nombres",
      "Apellidos",
      "Edad",
      "Cedula",
      "Cargo",
      "Jefe o Supervisor inmediato"
    ],
    contratistas: [
      "Numero de ficha",
      "Nombres",
      "Apellidos",
      "Edad",
      "Cedula",
      "Cargo",
      "Empresa",
      "Jefe o Supervisor inmediato"
    ],
    inces: [
      "Nombres",
      "Apellidos",
      "Numero de ficha",
      "Edad",
      "Cedula",
      "Supervisor"
    ],
    pasantes: [
      "Numero de ficha",
      "Nombres",
      "Apellidos",
      "Cedula",
      "Edad",
      "Supervisor",
      "Area Asignada"
    ],
    visitantes: [
      "Numero de ficha",
      "Nombres",
      "Apellidos",
      "Cedula",
      "Edad",
      "Supervisor"
    ]
  };

  const currentHeaders = headersConfig[activeCat];

  // 1. Fetch All Nominas
  async function fetchAllNominas() {
    setLoading(true);
    try {
      const [f, c, i, p, v] = await Promise.all([
        getDoc(doc(db, "nominas", "fijos")),
        getDoc(doc(db, "nominas", "contratistas")),
        getDoc(doc(db, "nominas", "inces")),
        getDoc(doc(db, "nominas", "pasantes")),
        getDoc(doc(db, "nominas", "visitantes"))
      ]);

      setNominas({
        fijos: f.exists() ? f.data().datos || [] : [],
        contratistas: c.exists() ? c.data().datos || [] : [],
        inces: i.exists() ? i.data().datos || [] : [],
        pasantes: p.exists() ? p.data().datos || [] : [],
        visitantes: v.exists() ? v.data().datos || [] : []
      });
    } catch (error) {
      console.error("Error loading nominas:", error);
      alert("❌ Error al cargar nóminas de la base de datos");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAllNominas();
  }, []);

  // Sync back to Firestore
  async function saveCategoryData(category, arrayData) {
    try {
      await setDoc(doc(db, "nominas", category), { datos: arrayData });
      setNominas(prev => ({
        ...prev,
        [category]: arrayData
      }));
    } catch (error) {
      console.error(`Error saving ${category} data:`, error);
      alert("❌ Error al guardar en base de datos");
    }
  }

  // Handle excel import
  function handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (rawData.length === 0) {
          alert("⚠️ El archivo Excel está vacío.");
          return;
        }

        // Clean headers to match the expected format exactly
        const cleanedData = rawData.map(row => {
          const newRow = {};
          currentHeaders.forEach(h => {
            // Find key in row that case-insensitive matches header
            const keyFound = Object.keys(row).find(k => k.trim().toLowerCase() === h.toLowerCase());
            newRow[h] = keyFound ? String(row[keyFound]).trim() : "";
          });

          // Auto-generate Numero de ficha for pasantes and visitantes in excel upload
          const cleanCedulaNum = (c) => String(c || "").replace(/\D/g, "");
          if (activeCat === "pasantes") {
            const cleanC = cleanCedulaNum(newRow["Cedula"]);
            newRow["Numero de ficha"] = cleanC.slice(-4);
          } else if (activeCat === "visitantes") {
            newRow["Numero de ficha"] = newRow["Cedula"];
          }

          return newRow;
        });

        await saveCategoryData(activeCat, cleanedData);
        alert(`✅ Se importaron ${cleanedData.length} trabajadores correctamente.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        console.error(err);
        alert("❌ Error al procesar el archivo Excel. Verifica el formato.");
      }
    };
    reader.readAsBinaryString(file);
  }

  // Individual Row Actions
  async function handleIndividualDelete(rowIndex) {
    const currentList = [...nominas[activeCat]];
    currentList.splice(rowIndex, 1);
    await saveCategoryData(activeCat, currentList);
    alert("✅ Trabajador eliminado correctamente");
  }

  async function handleWipeCategory() {
    await saveCategoryData(activeCat, []);
    setConfirmWipe(false);
    alert(`✅ Se vació la categoría ${activeCat.toUpperCase()}`);
  }

  // Open Edit Modal
  function openEdit(worker, index) {
    setFormData({ ...worker });
    setModalEditar({ worker, index });
  }

  async function handleSaveEdit() {
    const currentList = [...nominas[activeCat]];
    const cleanCedulaNum = (c) => String(c || "").replace(/\D/g, "");
    
    let ficha = formData["Numero de ficha"];
    if (activeCat === "pasantes") {
      ficha = cleanCedulaNum(formData["Cedula"]).slice(-4);
    } else if (activeCat === "visitantes") {
      ficha = formData["Cedula"];
    }

    const registroEditado = { ...formData };
    if (activeCat === "pasantes" || activeCat === "visitantes") {
      registroEditado["Numero de ficha"] = ficha;
    }

    currentList[modalEditar.index] = registroEditado;
    await saveCategoryData(activeCat, currentList);
    setModalEditar(null);
    setFormData({});
    alert("✅ Datos actualizados correctamente");
  }

  // Open Add Modal
  function openAdd() {
    const emptyForm = {};
    currentHeaders.forEach(h => {
      emptyForm[h] = "";
    });
    setFormData(emptyForm);
    setModalAgregar(true);
  }

  async function handleSaveAdd() {
    const currentList = [...nominas[activeCat]];
    const cleanCedulaNum = (c) => String(c || "").replace(/\D/g, "");
    
    let ficha = formData["Numero de ficha"];
    if (activeCat === "pasantes") {
      ficha = cleanCedulaNum(formData["Cedula"]).slice(-4);
    } else if (activeCat === "visitantes") {
      ficha = formData["Cedula"];
    }

    const nuevoRegistro = { ...formData };
    if (activeCat === "pasantes" || activeCat === "visitantes") {
      nuevoRegistro["Numero de ficha"] = ficha;
    }

    currentList.unshift(nuevoRegistro); // add to beginning
    await saveCategoryData(activeCat, currentList);
    setModalAgregar(false);
    setFormData({});
    alert("✅ Trabajador registrado correctamente");
  }

  // Export Category to Excel
  function exportExcel() {
    const data = nominas[activeCat];
    if (data.length === 0) {
      alert("No hay registros para exportar");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeCat.toUpperCase());
    XLSX.writeFile(wb, `Nomina_${activeCat}_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  // Export Category to PDF
  function exportPDF() {
    const data = nominas[activeCat];
    if (data.length === 0) {
      alert("No hay registros para exportar");
      return;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    pdf.setFontSize(16);
    pdf.text(`Nómina - ${activeCat.toUpperCase()}`, 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Generado: ${new Date().toLocaleString()}`, 14, 21);

    const body = data.map((row) =>
      currentHeaders.map((header) => row[header] || "-")
    );

    autoTable(pdf, {
      startY: 27,
      head: [currentHeaders],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] }
    });

    pdf.save(`Nomina_${activeCat}.pdf`);
  }

  // Filter list of active category
  const dataActivaFiltrada = nominas[activeCat].filter(row =>
    Object.values(row).some(val =>
      val?.toString().toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  // Reset pagination on category change or search change
  useEffect(() => {
    setPaginaActual(1);
  }, [activeCat, busqueda]);

  // Pagination calculations
  const totalPaginas = Math.ceil(dataActivaFiltrada.length / itemsPorPagina);
  const indUltimo = paginaActual * itemsPorPagina;
  const indPrimer = indUltimo - itemsPorPagina;
  const dataPaginaActual = dataActivaFiltrada.slice(indPrimer, indUltimo);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };


  return (
    <div className="container">
      {/* HEADER TITLE */}
      <div className="topTitleBar">
        <div className="titleArea">
          <FileCheck size={28} className="text-[#dc2626]" />
          <div>
            <h1>Consola Unificada de Nóminas</h1>
            <p>Importa, agrega, edita y administra todas las categorías de trabajadores</p>
          </div>
        </div>
        <button className="volverBtn" onClick={() => router.push("/gerente")}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* DASHBOARD SUMMARY CARDS */}
      <div className="dashboardGrid">
        <div className={`summaryCard ${activeCat === "fijos" ? "active" : ""}`} onClick={() => setActiveCat("fijos")}>
          <span>Fijos</span>
          <strong>{nominas.fijos.length}</strong>
        </div>
        <div className={`summaryCard ${activeCat === "contratistas" ? "active" : ""}`} onClick={() => setActiveCat("contratistas")}>
          <span>Contratistas</span>
          <strong>{nominas.contratistas.length}</strong>
        </div>
        <div className={`summaryCard ${activeCat === "inces" ? "active" : ""}`} onClick={() => setActiveCat("inces")}>
          <span>INCES</span>
          <strong>{nominas.inces.length}</strong>
        </div>
        <div className={`summaryCard ${activeCat === "pasantes" ? "active" : ""}`} onClick={() => setActiveCat("pasantes")}>
          <span>Pasantes</span>
          <strong>{nominas.pasantes.length}</strong>
        </div>
        <div className={`summaryCard ${activeCat === "visitantes" ? "active" : ""}`} onClick={() => setActiveCat("visitantes")}>
          <span>Visitantes</span>
          <strong>{nominas.visitantes.length}</strong>
        </div>
        <div className="summaryCard total">
          <span>Total Nómina</span>
          <strong className="text-[#dc2626]">
            {nominas.fijos.length + nominas.contratistas.length + nominas.inces.length + nominas.pasantes.length + nominas.visitantes.length}
          </strong>
        </div>
      </div>

      {/* TABS DE SELECCIÓN */}
      <div className="tabsRow">
        <button className={activeCat === "fijos" ? "tab active" : "tab"} onClick={() => setActiveCat("fijos")}>Fijos</button>
        <button className={activeCat === "contratistas" ? "tab active" : "tab"} onClick={() => setActiveCat("contratistas")}>Contratistas</button>
        <button className={activeCat === "inces" ? "tab active" : "tab"} onClick={() => setActiveCat("inces")}>INCES</button>
        <button className={activeCat === "pasantes" ? "tab active" : "tab"} onClick={() => setActiveCat("pasantes")}>Pasantes</button>
        <button className={activeCat === "visitantes" ? "tab active" : "tab"} onClick={() => setActiveCat("visitantes")}>Visitantes</button>
      </div>

      {/* ACTION PANEL */}
      <div className="actionsPanel">
        {/* BUSCADOR */}
        <div className="searchBox">
          <Search size={18} />
          <input
            type="text"
            placeholder={`Buscar en ${activeCat}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* OPERATIONS */}
        <div className="buttonsRow">
          {/* EXCEL IMPORT */}
          <label className="actionBtn excelImport">
            <Upload size={16} /> Importar Excel
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleExcelImport}
              style={{ display: "none" }}
            />
          </label>

          <button className="actionBtn addManual" onClick={openAdd}>
            <Plus size={16} /> Añadir Manual
          </button>

          <button className="actionBtn wipeBtn" onClick={() => setConfirmWipe(true)}>
            <Trash size={16} /> Vaciar Tabla
          </button>

          <button className="exportBtn excel" onClick={exportExcel}>
            <Download size={16} /> Excel
          </button>

          <button className="exportBtn pdf" onClick={exportPDF}>
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {/* EXCEL INSTRUCTIONS TIP */}
      <div className="excelInstructionTip">
        <Info size={16} className="text-blue-500" />
        <p>
          <strong>Formato Excel:</strong> El archivo debe contener los encabezados exactos:{" "}
          {currentHeaders.map((h, i) => (
            <span key={i} className="codeHeader">
              {h}
              {i < currentHeaders.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </div>

      {/* MAIN DATA TABLE CARD */}
      <div className="tableCard">
        {loading ? (
          <p className="loadingMsg">Cargando trabajadores...</p>
        ) : dataPaginaActual.length === 0 ? (
          <p className="loadingMsg">No se encontraron trabajadores registrados en esta categoría.</p>
        ) : (
          <>
            <div className="tableContainer">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {currentHeaders.map((h, idx) => (
                      <th key={idx}>{h}</th>
                    ))}
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPaginaActual.map((row, idx) => {
                    const globalIdx = indPrimer + idx;
                    return (
                      <tr key={globalIdx}>
                        <td>{globalIdx + 1}</td>
                        {currentHeaders.map((h, colIdx) => (
                          <td key={colIdx}>{row[h] || "-"}</td>
                        ))}
                        <td>
                          <div className="rowActions">
                            <button className="rowBtn view" onClick={() => setModalVer(row)}>
                              <Eye size={14} /> Ver
                            </button>
                            <button className="rowBtn edit" onClick={() => openEdit(row, globalIdx)}>
                              <Pencil size={14} />
                            </button>
                            <button className="rowBtn delete" onClick={() => handleIndividualDelete(globalIdx)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPaginas > 1 && (
              <div className="pagination">
                <button className="pageBtn" onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="pageIndicator">
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button className="pageBtn" onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= MODAL VER MÁS DETALLES ================= */}
      {modalVer && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "550px" }}>
            <div className="modalHeader">
              <Users size={32} className="text-[#dc2626]" />
              <div>
                <h2>Información Completa</h2>
                <p>Detalles del trabajador en {activeCat.toUpperCase()}</p>
              </div>
            </div>

            <div className="detailsGrid">
              {currentHeaders.map((h, idx) => (
                <div key={idx} className="detailItem">
                  <span>{h}</span>
                  <strong>{modalVer[h] || "-"}</strong>
                </div>
              ))}
            </div>

            <button className="closeBtn" onClick={() => setModalVer(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ================= MODAL AGREGAR MANUAL ================= */}
      {modalAgregar && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div className="modalHeader">
              <Plus size={32} className="text-[#dc2626]" />
              <div>
                <h2>Añadir Trabajador</h2>
                <p>Registrar de forma manual en {activeCat.toUpperCase()}</p>
              </div>
            </div>

            <div className="formGrid">
              {currentHeaders
                .filter(h => !((activeCat === "pasantes" || activeCat === "visitantes") && h === "Numero de ficha"))
                .map((h, idx) => (
                  <div key={idx} className="formGroup">
                    <label>{h}</label>
                    <input
                      type="text"
                      value={formData[h] || ""}
                      onChange={(e) => setFormData({ ...formData, [h]: e.target.value })}
                      placeholder={`Ingrese ${h.toLowerCase()}`}
                    />
                  </div>
                ))}
            </div>

            <div className="modalActions">
              <button className="modalBtn cancel" onClick={() => setModalAgregar(false)}>Cancelar</button>
              <button className="modalBtn save" onClick={handleSaveAdd}>Guardar Registro</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITAR INDIVIDUAL ================= */}
      {modalEditar && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div className="modalHeader">
              <Pencil size={32} className="text-[#dc2626]" />
              <div>
                <h2>Editar Trabajador</h2>
                <p>Modificar ficha en {activeCat.toUpperCase()}</p>
              </div>
            </div>

            <div className="formGrid">
              {currentHeaders
                .filter(h => !((activeCat === "pasantes" || activeCat === "visitantes") && h === "Numero de ficha"))
                .map((h, idx) => (
                  <div key={idx} className="formGroup">
                    <label>{h}</label>
                    <input
                      type="text"
                      value={formData[h] || ""}
                      onChange={(e) => setFormData({ ...formData, [h]: e.target.value })}
                    />
                  </div>
                ))}
            </div>

            <div className="modalActions">
              <button className="modalBtn cancel" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button className="modalBtn save" onClick={handleSaveEdit}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CONFIRMAR VACIADO ================= */}
      {confirmWipe && (
        <div className="modalOverlay">
          <div className="modal" style={{ maxWidth: "450px" }}>
            <div className="modalHeader" style={{ borderBottom: "none" }}>
              <Trash2 size={42} className="text-[#dc2626]" />
              <div>
                <h2>¿Vaciar Categoría?</h2>
                <p>Esta acción eliminará a TODOS los trabajadores registrados en <strong>{activeCat.toUpperCase()}</strong>. Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="modalActions" style={{ marginTop: "20px" }}>
              <button className="modalBtn cancel" onClick={() => setConfirmWipe(false)}>Cancelar</button>
              <button className="modalBtn save" style={{ background: "#dc2626" }} onClick={handleWipeCategory}>Confirmar Vaciado</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 25px;
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* HEADER */
        .topTitleBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 18px 25px;
          border-left: 5px solid #dc2626;
          border-radius: 14px;
          box-shadow: 0 5px 18px rgba(0,0,0,0.08);
        }

        .titleArea {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .titleArea h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
        }

        .titleArea p {
          margin: 3px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .volverBtn {
          border: 1px solid #e2e8f0;
          background: white;
          padding: 10px 18px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
          color: #475569;
          transition: all 0.2s;
        }

        .volverBtn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* SUMMARY DASHBOARD */
        .dashboardGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }

        .summaryCard {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          cursor: pointer;
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
          text-align: center;
        }

        .summaryCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.08);
          border-color: #e2e8f0;
        }

        .summaryCard.active {
          border-color: #dc2626;
          background: #fee2e2;
        }

        .summaryCard span {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .summaryCard strong {
          display: block;
          font-size: 22px;
          font-weight: 800;
          color: #1e293b;
          margin-top: 4px;
        }

        .summaryCard.total {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          cursor: default;
        }

        /* TABS ROW */
        .tabsRow {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          gap: 10px;
        }

        .tab {
          border: none;
          background: none;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab.active {
          color: #dc2626;
        }

        .tab.active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #dc2626;
        }

        /* ACTIONS PANEL */
        .actionsPanel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .searchBox {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 10px;
          color: #64748b;
          width: 250px;
        }

        .searchBox input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #1e293b;
          width: 100%;
        }

        .buttonsRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .actionBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .actionBtn.excelImport {
          background: #2563eb;
          color: white;
        }

        .actionBtn.excelImport:hover {
          background: #1d4ed8;
        }

        .actionBtn.addManual {
          background: #10b981;
          color: white;
        }

        .actionBtn.addManual:hover {
          background: #059669;
        }

        .actionBtn.wipeBtn {
          background: #64748b;
          color: white;
        }

        .actionBtn.wipeBtn:hover {
          background: #475569;
        }

        .exportBtn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          color: white;
        }

        .exportBtn.excel {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .exportBtn.pdf {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .exportBtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .excelInstructionTip {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #eff6ff;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
        }

        .excelInstructionTip p {
          margin: 0;
          font-size: 12px;
          color: #1e40af;
        }

        .codeHeader {
          font-family: monospace;
          background: #dbeafe;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: bold;
        }

        /* DATA TABLE */
        .tableCard {
          background: white;
          padding: 25px;
          border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }

        .tableContainer {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th, td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }

        th {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
        }

        tr:hover {
          background: #f8fafc;
        }

        .rowActions {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
        }

        .rowBtn {
          display: flex;
          align-items: center;
          gap: 4px;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          color: white;
          transition: all 0.2s;
        }

        .rowBtn.view {
          background: #eab308;
        }

        .rowBtn.view:hover {
          background: #ca8a04;
        }

        .rowBtn.edit {
          background: #3b82f6;
        }

        .rowBtn.edit:hover {
          background: #2563eb;
        }

        .rowBtn.delete {
          background: #ef4444;
        }

        .rowBtn.delete:hover {
          background: #dc2626;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .pageBtn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pageBtn:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .pageBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pageIndicator {
          font-size: 14px;
          color: #64748b;
        }

        .loadingMsg {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          padding: 20px;
        }

        /* MODALS */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal {
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modalHeader {
          display: flex;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 15px;
        }

        .modalHeader h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
        }

        .modalHeader p {
          margin: 3px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .detailsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .detailItem {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .detailItem span {
          display: block;
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
        }

        .detailItem strong {
          display: block;
          font-size: 14px;
          color: #1e293b;
          margin-top: 4px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .formGroup {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .formGroup label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }

        .formGroup input {
          height: 40px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
        }

        .formGroup input:focus {
          border-color: #dc2626;
        }

        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .modalBtn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          color: white;
        }

        .modalBtn.cancel {
          background: #e2e8f0;
          color: #475569;
        }

        .modalBtn.save {
          background: #10b981;
        }

        .closeBtn {
          background: #1e293b;
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }

        @media (max-width: 640px) {
          .topTitleBar {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          .actionsPanel {
            flex-direction: column;
            align-items: stretch;
          }
          .searchBox {
            width: 100%;
          }
          .buttonsRow {
            justify-content: stretch;
          }
          .actionBtn, .exportBtn {
            flex: 1;
            justify-content: center;
          }
          .detailsGrid, .formGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}