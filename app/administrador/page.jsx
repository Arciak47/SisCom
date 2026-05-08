"use client";

import { useRouter } from "next/navigation";
import { Users, UserPlus, KeyRound } from "lucide-react";

export default function AdminPage() {

  const router = useRouter();

  return (
    <div className="main">

      <div className="panelTitle">
        <h1>Panel de Administración</h1>
        <p>Gestión completa de usuarios del sistema SisCOM</p>
      </div>

      <div className="cards">

        {/* CREAR USUARIO */}
        <div className="card">
          <UserPlus size={40}/>
          <h3>Crear Usuario</h3>
          <button onClick={()=>router.push("/administrador/crear")}>
            Crear nuevo usuario
          </button>
        </div>

        {/* USUARIOS */}
        <div className="card">
          <Users size={40}/>
          <h3>Usuarios del Sistema</h3>
          <button onClick={()=>router.push("/administrador/usuarios")}>
            Ver usuarios
          </button>
        </div>

        {/* CONTRASEÑAS */}
        <div className="card">
          <KeyRound size={40}/>
          <h3>Cambiar Contraseñas</h3>
          <button onClick={()=>router.push("/administrador/cambiar-clave")}>
            Gestionar contraseñas
          </button>
        </div>

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        .panelTitle{
          margin-bottom:30px;
        }

        .cards{
          display:flex;
          gap:20px;
          flex-wrap:wrap;
        }

        .card{
          background:white;
          padding:25px;
          border-radius:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:10px;
          width:250px;
        }

        button{
          background:#2563eb;
          color:white;
          border:none;
          padding:8px 12px;
          border-radius:6px;
          cursor:pointer;
        }

      `}</style>

    </div>
  );
}