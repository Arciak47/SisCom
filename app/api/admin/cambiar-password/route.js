import { NextResponse } from "next/server";
import admin from "firebase-admin";

// 🔥 Inicializar Firebase Admin (una sola vez)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req) {
  try {
    const { uid, nuevaPassword } = await req.json();

    if (!uid || !nuevaPassword) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 🔥 Cambiar contraseña
    await admin.auth().updateUser(uid, {
      password: nuevaPassword,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al cambiar contraseña" },
      { status: 500 }
    );
  }
}