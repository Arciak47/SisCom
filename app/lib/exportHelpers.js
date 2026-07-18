/**
 * SisCOM – Export Helpers
 * Funciones para exportar tablas a PDF y Excel
 */

import { registrarAuditoria } from "./validationHelpers";

// ── EXCEL ─────────────────────────────────────────────────────
export async function exportarExcel(columnas, filas, nombreArchivo = "reporte") {
  // Log Audit Trail
  await registrarAuditoria(
    "Descarga de Reporte Excel",
    `Se descargo el archivo Excel: ${nombreArchivo} (total registros: ${filas.length}).`
  );
  const norm = nombreArchivo.toLowerCase();
  let templateName = null;
  if (norm.includes("fijos")) templateName = "fijos.xlsx";
  else if (norm.includes("pasantes")) templateName = "pasantes.xlsx";
  else if (norm.includes("contratistas")) templateName = "contratistas.xlsx";
  else if (norm.includes("visitantes")) templateName = "visitantes.xlsx";
  else if (norm.includes("inces")) templateName = "inces.xlsx";

  const ExcelJS = await import("exceljs/dist/exceljs.min.js");
  const workbook = new ExcelJS.Workbook();

  if (templateName) {
    try {
      // Fetch the template file from the server
      const response = await fetch(`/templates/${templateName}`);
      if (!response.ok) throw new Error("Plantilla no encontrada");
      
      const buffer = await response.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      // Get the first worksheet
      const worksheet = workbook.worksheets[0];
      
      // Find the header row to know where each column maps
      // The headers are at row 12 (1-indexed in exceljs)
      const headerRow = worksheet.getRow(12);
      
      // Map column keys from the database to column positions in the Excel sheet
      const cleanHeaderCell = (cellVal) => {
        return String(cellVal || "")
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      const colMapping = {}; // key -> cell Index (1-indexed)
      headerRow.eachCell((cell, colNumber) => {
        const normVal = cleanHeaderCell(cell.value);
        columnas.forEach(col => {
          const normColKey = cleanHeaderCell(col.key);
          const normColLabel = cleanHeaderCell(col.label);
          if (normVal === normColKey || normVal === normColLabel || 
              (normVal === "ficha" && normColKey === "numero de ficha") ||
              (normVal === "empresa contratista" && normColKey === "empresa")) {
            colMapping[col.key] = colNumber;
          }
        });
      });

      // Write data starting at row 13
      filas.forEach((fila, rowIndex) => {
        const rIndex = 13 + rowIndex;
        const row = worksheet.getRow(rIndex);
        
        columnas.forEach(col => {
          const colIndex = colMapping[col.key];
          if (colIndex) {
            let val = fila[col.key] ?? "-";
            row.getCell(colIndex).value = val;
          }
        });
        
        // Preserve standard data row height
        row.height = 20;
        
        // Apply standard thin borders to the new data cells to match the grid
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
            left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
            bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
            right: { style: 'thin', color: { argb: 'FFAAAAAA' } }
          };
          cell.font = { name: 'Arial', size: 10 };
        });
        
        row.commit();
      });

      // Write to ArrayBuffer
      const writeBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([writeBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nombreArchivo}_${fechaHoy()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch (err) {
      console.warn("Error cargando plantilla. Fallback a exportación básica:", err);
    }
  }

  // FALLBACK: Basic export using exceljs (styled beautifully!)
  const worksheet = workbook.addWorksheet("Reporte");

  // Determine last column letter for merging headers
  const getColLetter = (n) => {
    let ordA = 'a'.charCodeAt(0);
    let ordZ = 'z'.charCodeAt(0);
    let len = ordZ - ordA + 1;
    let s = "";
    while(n >= 0) {
      s = String.fromCharCode(n % len + ordA) + s;
      n = Math.floor(n / len) - 1;
    }
    return s.toUpperCase();
  };

  const lastColLetter = getColLetter(columnas.length - 1);

  // Merge rows for title blocks
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  worksheet.mergeCells(`A4:${lastColLetter}4`);
  worksheet.mergeCells(`A5:${lastColLetter}5`);

  // Row 2: INVECEM main title
  const cellA2 = worksheet.getCell("A2");
  cellA2.value = "INVECEM  -  INDUSTRIA VENEZOLANA DE CEMENTOS";
  cellA2.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1F2937" } };
  cellA2.alignment = { horizontal: "center", vertical: "middle" };

  // Row 3: SisCom subtitle
  const cellA3 = worksheet.getCell("A3");
  cellA3.value = "Sistema de Control de Comidas (SisCom)";
  cellA3.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFC21919" } };
  cellA3.alignment = { horizontal: "center", vertical: "middle" };

  // Row 4: Report Type
  const cellA4 = worksheet.getCell("A4");
  cellA4.value = nombreArchivo.replace(/_/g, " ").toUpperCase();
  cellA4.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF374151" } };
  cellA4.alignment = { horizontal: "center", vertical: "middle" };

  // Row 5: Timestamp
  const cellA5 = worksheet.getCell("A5");
  cellA5.value = `Generado el: ${new Date().toLocaleString("es-VE")}`;
  cellA5.font = { name: "Arial", size: 8, color: { argb: "FF9CA3AF" } };
  cellA5.alignment = { horizontal: "center", vertical: "middle" };

  // Row heights for header block
  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 18;
  worksheet.getRow(4).height = 18;
  worksheet.getRow(5).height = 16;

  // Style headers at row 7
  const headerRow = worksheet.getRow(7);
  columnas.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.label;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE53E3E' } // corporate red
    };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
      left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
      bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
      right: { style: 'thin', color: { argb: 'FFAAAAAA' } }
    };
  });
  headerRow.height = 25;
  headerRow.commit();

  // Populate data starting at row 8
  filas.forEach((fila, rIdx) => {
    const rIndex = 8 + rIdx;
    const row = worksheet.getRow(rIndex);
    columnas.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = fila[col.key] ?? "-";
      cell.font = { name: 'Arial', size: 9 };
      
      // Zebra striping
      if (rIdx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      // Alignment
      const cleanKey = col.key.toLowerCase();
      if (cleanKey === "index" || cleanKey === "ficha" || cleanKey === "cedula" || cleanKey === "edad" || cleanKey === "fecha" || cleanKey === "fechahoratexto" || cleanKey === "tipocomida" || cleanKey === "tiponomina") {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
    row.height = 21;
    row.commit();
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      // Don't calculate title cells (row 2 to 5) when doing widths
      if (cell.row >= 7) {
        maxLen = Math.max(maxLen, cell.value ? String(cell.value).length : 0);
      }
    });
    column.width = Math.max(maxLen + 4, 11);
  });

  const writeBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([writeBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}_${fechaHoy()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF ───────────────────────────────────────────────────────
export async function exportarPDF(titulo, columnas, filas, nombreArchivo = "reporte") {
  // Log Audit Trail
  await registrarAuditoria(
    "Descarga de Reporte PDF",
    `Se descargo el archivo PDF: ${nombreArchivo} - ${titulo} (total registros: ${filas.length}).`
  );
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const norm = nombreArchivo.toLowerCase();
  const isPayroll = norm.includes("fijos") || norm.includes("pasantes") || norm.includes("contratistas") || norm.includes("visitantes") || norm.includes("inces");

  // Load logo INVECEM
  let logoBase64 = null;
  try {
    logoBase64 = await loadImgToBase64("/logo-invecem.png");
  } catch (err) {
    console.warn("Error cargando logotipo para PDF:", err);
  }

  // Top header accent line
  doc.setFillColor(194, 25, 25); // corporate red
  doc.rect(14, 4, 269, 1.2, "F");

  // Draw Logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 14, 8, 35, 12);
  }

  const titleX = logoBase64 ? 55 : 14;

  if (isPayroll) {
    let categoriaLabel = "Personal";
    let descLabel = "personal autorizado";
    let tipoLabel = "NOMINA GENERAL";
    let countLabel = "REGISTROS";
    
    if (norm.includes("fijos")) {
      categoriaLabel = "Trabajadores Fijos";
      descLabel = "trabajadores fijos autorizados";
      tipoLabel = "TRABAJADORES FIJOS";
      countLabel = "TRABAJADORES FIJOS REGISTRADOS";
    } else if (norm.includes("pasantes")) {
      categoriaLabel = "Pasantes";
      descLabel = "pasantes autorizados";
      tipoLabel = "PASANTES";
      countLabel = "PASANTES REGISTRADOS";
    } else if (norm.includes("contratistas")) {
      categoriaLabel = "Contratistas";
      descLabel = "contratistas autorizados";
      tipoLabel = "CONTRATISTAS";
      countLabel = "CONTRATISTAS REGISTRADOS";
    } else if (norm.includes("visitantes")) {
      categoriaLabel = "Visitantes";
      descLabel = "visitantes autorizados";
      tipoLabel = "VISITANTES";
      countLabel = "VISITANTES REGISTRADOS";
    } else if (norm.includes("inces")) {
      categoriaLabel = "Estudiantes Inces";
      descLabel = "estudiantes inces autorizados";
      tipoLabel = "ESTUDIANTES INCES";
      countLabel = "ESTUDIANTES INCES REGISTRADOS";
    }

    // Draw Excel-like Title Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55); // Dark charcoal
    doc.text("INVECEM  -  INDUSTRIA VENEZOLANA DE CEMENTOS", titleX, 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(194, 25, 25); // Corporate Red
    doc.text(`SisCom — Nómina de ${categoriaLabel} (Comedor)`, titleX, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Cool grey
    doc.text(`Registro de ${descLabel} para el ingreso al comedor.`, titleX, 21);

    // Draw Summary Card (mirroring Excel rows 8 & 9)
    const cardX = 200;
    const cardY = 7;
    const cardW = 83;
    const cardH = 15;

    // Background box with border (set fill & draw colors BEFORE drawing roundedRect)
    doc.setFillColor(249, 250, 251); // Light slate-50 fill
    doc.setDrawColor(226, 232, 240); // Grey border
    doc.setLineWidth(0.25);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "FD");
    doc.line(cardX, cardY + 7.5, cardX + cardW, cardY + 7.5); // Division line

    // Card Content
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text(countLabel, cardX + 3, cardY + 5);
    doc.text("TIPO DE NÓMINA", cardX + 3, cardY + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39); // Very dark gray
    doc.text(String(filas.length), cardX + cardW - 3, cardY + 5, { align: "right" });
    doc.text(tipoLabel, cardX + cardW - 3, cardY + 12, { align: "right" });

    // Row 11 representation: "Registro de Personal Autorizado"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text("Registro de Personal Autorizado", 14, 27);

    // Timestamp on top right of document title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    const stamp = `Generado: ${new Date().toLocaleString("es-VE")}`;
    doc.text(stamp, 283 - doc.getTextWidth(stamp), 27);

    const cabeceras = columnas.map((c) => c.label);
    const cuerpo = filas.map((fila) => columnas.map((c) => String(fila[c.key] ?? "-")));

    autoTable(doc, {
      head: [cabeceras],
      body: cuerpo,
      startY: 33,
      headStyles: {
        fillColor: [31, 41, 55], // Premium dark grey header matching excel style
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
        valign: "middle"
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: [55, 65, 81] 
      },
      alternateRowStyles: { 
        fillColor: [249, 250, 251] 
      },
      styles: { 
        cellPadding: 3, 
        overflow: "linebreak",
        font: "helvetica" 
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        // Draw footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175); // light grey
        
        // Divider line at the bottom
        doc.setDrawColor(226, 232, 240); // slate 200
        doc.setLineWidth(0.2);
        doc.line(14, 198, 283, 198);

        // Left footer
        doc.text("SisCom - INVECEM | Sistema de Control del Comedor", 14, 202);

        // Right footer
        const pgString = `Página ${data.pageNumber} de ${pageCount}`;
        doc.text(pgString, 283 - doc.getTextWidth(pgString), 202);
      }
    });

  } else {
    // General Corporate Report Layout (Stats, Audits, etc.)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text("INVECEM  -  INDUSTRIA VENEZOLANA DE CEMENTOS", titleX, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text("Gerencia de Recursos Humanos — SisCom", titleX, 17);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(194, 25, 25);
    doc.text(titulo.toUpperCase(), 14, 27);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    const stamp = `Generado: ${new Date().toLocaleString("es-VE")}`;
    doc.text(stamp, 283 - doc.getTextWidth(stamp), 27);

    const cabeceras = columnas.map((c) => c.label);
    const cuerpo = filas.map((fila) => columnas.map((c) => String(fila[c.key] ?? "-")));

    autoTable(doc, {
      head: [cabeceras],
      body: cuerpo,
      startY: 33,
      headStyles: {
        fillColor: [194, 25, 25], // Use corporate red for general reports
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "left",
        valign: "middle"
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: [55, 65, 81] 
      },
      alternateRowStyles: { 
        fillColor: [249, 250, 251] 
      },
      styles: { 
        cellPadding: 3, 
        overflow: "linebreak",
        font: "helvetica" 
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        // Draw footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175); // light grey
        
        // Divider line at the bottom
        doc.setDrawColor(226, 232, 240); // slate 200
        doc.setLineWidth(0.2);
        doc.line(14, 198, 283, 198);

        // Left footer
        doc.text("SisCom - INVECEM | Sistema de Control del Comedor", 14, 202);

        // Right footer
        const pgString = `Página ${data.pageNumber} de ${pageCount}`;
        doc.text(pgString, 283 - doc.getTextWidth(pgString), 202);
      }
    });
  }

  doc.save(`${nombreArchivo}_${fechaHoy()}.pdf`);
}

function loadImgToBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith("http") && !url.includes(window.location.host)) {
      img.crossOrigin = "Anonymous";
    }
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

// ── UTILIDADES ────────────────────────────────────────────────
function fechaHoy() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Formatea un Firestore Timestamp o Date a string legible
 */
export function formatearFecha(ts) {
  if (!ts) return "-";
  let d;
  if (ts.toDate) d = ts.toDate();
  else if (ts instanceof Date) d = ts;
  else d = new Date(ts);
  return d.toLocaleString("es-VE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/**
 * Devuelve true si un Firestore Timestamp está dentro del rango [desde, hasta]
 */
export function enRango(ts, desde, hasta) {
  if (!ts) return true;
  let d;
  if (ts.toDate) d = ts.toDate();
  else d = new Date(ts);

  if (desde && d < new Date(desde + "T00:00:00")) return false;
  if (hasta && d > new Date(hasta + "T23:59:59")) return false;
  return true;
}
