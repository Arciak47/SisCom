import { NextResponse } from "next/server";
import admin from "@/lib/fire-admin";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      correo,
      clave,
      nombres,
      apellidos,
      cedula,
      telefono,
      fechaNacimiento,
      ficha,
      rol,
      cargo,
      departamento,
      fechaIngreso,
      creadoPor // Nombre del administrador que crea al usuario
    } = body;

    // Validar datos mínimos
    if (!correo || !clave || !nombres || !apellidos || !ficha || !rol) {
      return NextResponse.json(
        { error: "Datos obligatorios incompletos" },
        { status: 400 }
      );
    }

    // Initialize Firestore admin client
    const db = admin.firestore();

    // Validar duplicados en Firestore
    const queryCorreo = await db.collection("usuarios").where("correo", "==", correo.trim().toLowerCase()).get();
    if (!queryCorreo.empty) {
      return NextResponse.json(
        { error: "El correo ya está registrado en el sistema" },
        { status: 400 }
      );
    }

    if (cedula) {
      const queryCedula = await db.collection("usuarios").where("cedula", "==", cedula).get();
      if (!queryCedula.empty) {
        return NextResponse.json(
          { error: "La cédula ya está registrada en el sistema" },
          { status: 400 }
        );
      }
    }

    const queryFicha = await db.collection("usuarios").where("ficha", "==", ficha).get();
    if (!queryFicha.empty) {
      return NextResponse.json(
        { error: "El número de ficha ya está registrado en el sistema" },
        { status: 400 }
      );
    }


    // 1. Crear en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: correo.trim().toLowerCase(),
      password: clave,
      displayName: `${nombres} ${apellidos}`,
    });

    // 2. Guardar en Firestore
    await db.collection("usuarios").doc(userRecord.uid).set({
      correo: correo.trim().toLowerCase(),
      clave: clave, // guardado en texto plano según el comportamiento original, se mantiene por compatibilidad
      nombres,
      apellidos,
      cedula,
      telefono,
      fechaNacimiento,
      ficha,
      rol: rol.toLowerCase(),
      cargo,
      departamento,
      fechaIngreso,
      status: "activo",
      creado: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Registrar en Auditoría
    await db.collection("auditoria").add({
      accion: "Creación de Usuario",
      descripcion: `Se registró al usuario ${nombres} ${apellidos} con ficha ${ficha} y rol ${rol}.`,
      usuarioAfectado: userRecord.uid,
      realizadoPor: creadoPor || "Administrador",
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      ok: true,
      uid: userRecord.uid
    });

  } catch (error) {
    console.error("Error al crear usuario en backend:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear usuario" },
      { status: 500 }
    );
  }
}
