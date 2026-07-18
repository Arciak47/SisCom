import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";

/**
 * Checks if any of the provided fichas already exist in other categories in Firestore.
 * 
 * @param {string[]} fichasToCheck List of ficha numbers to validate
 * @param {string} currentCategory The category being uploaded/modified (e.g. 'fijos')
 * @returns {Promise<{ficha: string, category: string}[]>} List of conflicts
 */
export async function checkDuplicateFichasInDB(fichasToCheck, currentCategory) {
  const categories = ["fijos", "pasantes", "contratistas", "visitantes", "inces"];
  // We only check against OTHER categories since the current category will be replaced
  const others = categories.filter(c => c !== currentCategory);
  
  let allExisting = {}; // maps ficha -> category
  
  try {
    const docs = await Promise.all(
      others.map(cat => getDoc(doc(db, "nominas", cat)))
    );
    
    docs.forEach((snap, idx) => {
      const cat = others[idx];
      if (snap.exists()) {
        const datos = snap.data().datos || [];
        datos.forEach(item => {
          const ficha = String(item["Numero de ficha"] || "").trim();
          if (ficha) {
            allExisting[ficha] = cat;
          }
        });
      }
    });
    
    const conflicts = [];
    fichasToCheck.forEach(ficha => {
      const cleanFicha = String(ficha || "").trim();
      if (cleanFicha && allExisting[cleanFicha]) {
        conflicts.push({ ficha: cleanFicha, category: allExisting[cleanFicha] });
      }
    });
    
    return conflicts;
  } catch (err) {
    console.error("Error in checkDuplicateFichasInDB:", err);
    return [];
  }
}

/**
 * Normalizes text to easily find matching headers.
 */
export function normalizeHeader(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents/diacritics
}

/**
 * Finds the index of the header row in a 2D array of rows from Excel.
 * Looks for columns like 'ficha', 'cedula', or 'nombres'.
 */
export function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i];
    if (Array.isArray(row) && row.some(cell => {
      const cellStr = normalizeHeader(cell);
      return cellStr === "ficha" || cellStr === "numero de ficha" || cellStr === "nombres" || cellStr === "cedula";
    })) {
      return i;
    }
  }
  return -1;
}

/**
 * Formats a category name for user-friendly error messages.
 */
export function formatCategoryName(category) {
  const mapping = {
    fijos: "Trabajadores Fijos",
    pasantes: "Pasantes",
    contratistas: "Contratistas",
    visitantes: "Visitantes",
    inces: "Estudiantes INCES"
  };
  return mapping[category] || category;
}

/**
 * Validates that the uploaded filename matches the expected category to prevent uploading the wrong file.
 */
export function validarNombreArchivo(fileName, category) {
  const lower = fileName.toLowerCase();
  if (category === "fijos" && !lower.includes("fijos")) return false;
  if (category === "pasantes" && !lower.includes("pasantes")) return false;
  if (category === "contratistas" && !lower.includes("contratistas")) return false;
  if (category === "visitantes" && !lower.includes("visitantes")) return false;
  if (category === "inces" && !lower.includes("inces")) return false;
  return true;
}

/**
  * Logs a system action into the audit trail dynamically detecting the currently logged-in user.
  */
export async function registrarAuditoria(accion, descripcion) {
  try {
    let usuarioStr = "Usuario desconocido";
    const user = auth.currentUser;
    if (user) {
      const snap = await getDoc(doc(db, "usuarios", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        usuarioStr = `${data.rol || "Usuario"} (${data.nombres || ""} ${data.apellidos || ""})`;
      } else {
        usuarioStr = `Usuario UID: ${user.uid}`;
      }
    }
    
    await addDoc(collection(db, "auditoria"), {
      accion,
      descripcion,
      realizadoPor: usuarioStr,
      fecha: serverTimestamp()
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
}
