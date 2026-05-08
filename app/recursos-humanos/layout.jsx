"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LayoutRRHH({ children }) {

  const router = useRouter();

  useEffect(() => {

    async function checkRol(){

      const user = auth.currentUser;

      if(!user){
        router.push("/");
        return;
      }

      const snap = await getDoc(doc(db,"usuarios",user.uid));

      if(snap.exists()){
        const rol = snap.data().rol;

        if(rol !== "rrhh"){  // 🔥 SOLO RRHH ENTRA
          router.push("/");
        }
      }

    }

    checkRol();

  }, []);

  return (
    <div className="layout">

      {/* HEADER IGUAL AL DE GERENTE */}
      <header className="header">
        <h1>Sistema SisCOM - RRHH</h1>
        <button onClick={()=>auth.signOut().then(()=>router.push("/"))}>
          Cerrar sesión
        </button>
      </header>

      {/* CONTENIDO */}
      <main className="content">
        {children}
      </main>

      <style jsx>{`
        .layout{
          min-height:100vh;
          background:#f1f5f9;
        }

        .header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          background:white;
          padding:15px 25px;
          box-shadow:0 5px 10px rgba(0,0,0,0.1);
        }

        .content{
          padding:30px;
        }
      `}</style>

    </div>
  );
}