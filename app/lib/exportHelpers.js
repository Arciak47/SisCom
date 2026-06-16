/**
 * SisCOM – Export Helpers
 * Funciones para exportar tablas a PDF y Excel
 */

// ── EXCEL ─────────────────────────────────────────────────────
export async function exportarExcel(columnas, filas, nombreArchivo = "reporte") {
  const XLSX = (await import("xlsx")).default;

  const datos = filas.map((fila) => {
    const obj = {};
    columnas.forEach((col) => {
      obj[col.label] = fila[col.key] ?? "-";
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");

  // Ajustar ancho de columnas automáticamente
  const maxWidths = columnas.map((col) => ({
    wch: Math.max(col.label.length, ...filas.map((f) => String(f[col.key] ?? "").length)) + 2
  }));
  ws["!cols"] = maxWidths;

  XLSX.writeFile(wb, `${nombreArchivo}_${fechaHoy()}.xlsx`);
}

// ── PDF ───────────────────────────────────────────────────────
export async function exportarPDF(titulo, columnas, filas, nombreArchivo = "reporte") {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(229, 62, 62);
  doc.text("SisCOM – INVECEM", 14, 16);

  doc.setFontSize(12);
  doc.setTextColor(26, 32, 44);
  doc.text(titulo, 14, 24);

  doc.setFontSize(9);
  doc.setTextColor(113, 128, 150);
  doc.text(`Generado: ${new Date().toLocaleString("es-VE")}`, 14, 30);

  const cabeceras = columnas.map((c) => c.label);
  const cuerpo = filas.map((fila) => columnas.map((c) => String(fila[c.key] ?? "-")));

  autoTable(doc, {
    head: [cabeceras],
    body: cuerpo,
    startY: 36,
    headStyles: {
      fillColor: [229, 62, 62],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [26, 32, 44] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { cellPadding: 3, overflow: "linebreak" },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${nombreArchivo}_${fechaHoy()}.pdf`);
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
