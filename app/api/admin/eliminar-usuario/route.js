import { NextResponse } from "next/server";
import admin from "@/lib/fire-admin";

export async function POST(req) {
  try {
    const { uid, ficha, nombreCompleto, eliminadoPor } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "UID de usuario es obligatorio" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // 1. Eliminar de Firebase Auth
    try {
      await admin.auth().deleteUser(uid);
    } catch (authError) {
      // Si no existe en Auth pero sí en la BD, continuamos para limpiar la BD
      console.warn("Usuario no encontrado en Firebase Auth o ya eliminado:", authError.message);
    }

    // 2. Eliminar de Firestore
    await db.collection("usuarios").doc(uid).delete();

    // 3. Registrar en Auditoría
    await db.collection("auditoria").add({
      accion: "Eliminación de Usuario",
      descripcion: `Se eliminó al usuario ${nombreCompleto || "Desconocido"} con ficha ${ficha || "N/A"}.`,
      usuarioAfectado: uid,
      realizadoPor: eliminadoPor || "Administrador",
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error al eliminar usuario en backend:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
