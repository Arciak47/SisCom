import { NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(req) {

  try {

    const {
      uid,
      nuevaPassword
    } = await req.json();

    if (!uid || !nuevaPassword) {

      return NextResponse.json(
        {
          error: "Datos incompletos"
        },
        {
          status: 400
        }
      );

    }

    // 🔥 CAMBIAR PASSWORD
    await admin.auth().updateUser(
      uid,
      {
        password: nuevaPassword
      }
    );

    return NextResponse.json(
      {
        ok: true
      }
    );

  } catch(error){

    console.log(error);

    return NextResponse.json(
      {
        error: "Error al cambiar contraseña"
      },
      {
        status: 500
      }
    );

  }

}