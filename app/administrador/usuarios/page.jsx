"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { db } from "../../lib/firebase";

import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

import {
  Users,
  Search,
  Shield,
  Mail,
  Eye,
  EyeOff,
  Trash2,
  KeyRound
} from "lucide-react";

export default function UsuariosSistema() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [mostrarClaves, setMostrarClaves] = useState({});

  // 🔥 CARGAR USUARIOS
  useEffect(() => {

    async function cargarUsuarios() {

      try {

        const querySnapshot = await getDocs(
          collection(db, "usuarios")
        );

        const lista = [];

        querySnapshot.forEach((docu) => {

          lista.push({
            id: docu.id,
            ...docu.data()
          });

        });

        setUsuarios(lista);
        setUsuariosFiltrados(lista);

      } catch (error) {

        console.error(error);
        alert("❌ Error al cargar usuarios");

      }

      setLoading(false);

    }

    cargarUsuarios();

  }, []);

  // 🔥 BUSCAR
  useEffect(() => {

    const filtrados = usuarios.filter((user) =>

      `${user.nombres || ""}
       ${user.apellidos || ""}
       ${user.correo || ""}
       ${user.rol || ""}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())

    );

    setUsuariosFiltrados(filtrados);

  }, [busqueda, usuarios]);

  // 🔥 MOSTRAR / OCULTAR CONTRASEÑA
  function togglePassword(id) {

    setMostrarClaves(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

  }

  // 🔥 ELIMINAR USUARIO
  async function eliminarUsuario(id, nombre) {

    const confirmar = confirm(
      `¿Seguro que deseas eliminar el usuario ${nombre}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {

      await deleteDoc(doc(db, "usuarios", id));

      const nuevosUsuarios = usuarios.filter(
        (u) => u.id !== id
      );

      setUsuarios(nuevosUsuarios);
      setUsuariosFiltrados(nuevosUsuarios);

      alert("✅ Usuario eliminado correctamente");

    } catch (error) {

      console.error(error);
      alert("❌ Error al eliminar usuario");

    }

  }

  return (

    <div className="main">

      {/* 🔥 TITULO */}
      <div className="panelTitle">

        <h1>Usuarios del Sistema</h1>

      </div>

      {/* 🔥 DASHBOARD */}
      <div className="dashboard">

        <div className="cardDash">

          <div>
            <span>Total Usuarios</span>
            <strong>{usuarios.length}</strong>
          </div>

          <Users size={28}/>

        </div>

      </div>

      {/* 🔥 BUSCADOR */}
      <div className="searchBox">

        <Search size={18}/>

        <input
          type="text"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e)=>setBusqueda(e.target.value)}
        />

      </div>

      {/* 🔥 TABLA */}
      <div className="tableCard">

        {loading ? (

          <p className="loading">
            Cargando usuarios...
          </p>

        ) : usuariosFiltrados.length === 0 ? (

          <p className="loading">
            No hay usuarios registrados
          </p>

        ) : (

          <div className="tableContainer">

            <table>

              <thead>

                <tr>

                  <th>#</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Contraseña</th>
                  <th>Acciones</th>

                </tr>

              </thead>

              <tbody>

                {usuariosFiltrados.map((user, index)=>(

                  <tr key={user.id}>

                    <td>{index + 1}</td>

                    <td>
                      {user.nombres || "-"}
                    </td>

                    <td>
                      {user.apellidos || "-"}
                    </td>

                    <td>

                      <div className="correoBox">

                        <Mail size={14}/>

                        {user.correo || "-"}

                      </div>

                    </td>

                    <td>

                      <div className="rolBox">

                        <Shield size={14}/>

                        {user.rol || "-"}

                      </div>

                    </td>

                    {/* 🔥 CONTRASEÑA */}
                    <td>

                      <div className="passwordBox">

                        <span>

                          {mostrarClaves[user.id]
                            ? user.clave || "No disponible"
                            : "••••••••"}

                        </span>

                        <button
                          onClick={() => togglePassword(user.id)}
                        >

                          {mostrarClaves[user.id]
                            ? <EyeOff size={16}/>
                            : <Eye size={16}/>}

                        </button>

                      </div>

                    </td>

                    {/* 🔥 ACCIONES */}
                    <td>

                      <div className="acciones">

                        <button
                          className="editBtn"
                          onClick={() =>
                            router.push(
                              `/administrador/cambiar-password?id=${user.id}`
                            )
                          }
                        >

                          <KeyRound size={16}/>
                          Cambiar

                        </button>

                        <button
                          className="deleteBtn"
                          onClick={() =>
                            eliminarUsuario(
                              user.id,
                              `${user.nombres} ${user.apellidos}`
                            )
                          }
                        >

                          <Trash2 size={16}/>
                          Eliminar

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        .panelTitle{
          background:white;
          padding:12px 20px;
          border-left:5px solid #e53935;
          border-radius:10px;
          margin-bottom:25px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
        }

        .panelTitle h1{
          font-size:24px;
          font-weight:bold;
        }

        .dashboard{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
          gap:15px;
          margin-bottom:25px;
        }

        .cardDash{
          background:white;
          padding:20px;
          border-radius:15px;
          box-shadow:0 10px 25px rgba(0,0,0,0.15);
          display:flex;
          align-items:center;
          justify-content:space-between;
        }

        .cardDash span{
          font-size:13px;
          color:#666;
        }

        .cardDash strong{
          display:block;
          margin-top:5px;
          font-size:24px;
          color:#2563eb;
        }

        .searchBox{
          display:flex;
          align-items:center;
          gap:10px;
          background:white;
          padding:12px 15px;
          border-radius:12px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
          margin-bottom:25px;
        }

        .searchBox input{
          flex:1;
          border:none;
          outline:none;
          font-size:14px;
        }

        .tableCard{
          background:white;
          padding:25px;
          border-radius:18px;
          box-shadow:0 10px 30px rgba(0,0,0,0.15);
        }

        .tableContainer{
          overflow:auto;
        }

        table{
          width:100%;
          border-collapse:collapse;
        }

        th,
        td{
          padding:12px;
          border:1px solid #e5e7eb;
          font-size:14px;
          text-align:left;
        }

        th{
          background:#2563eb;
          color:white;
          position:sticky;
          top:0;
        }

        tr:hover{
          background:#f8fafc;
        }

        .correoBox,
        .rolBox{
          display:flex;
          align-items:center;
          gap:6px;
        }

        .passwordBox{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          background:#f8fafc;
          padding:8px 10px;
          border-radius:8px;
        }

        .passwordBox button{
          border:none;
          background:none;
          cursor:pointer;
          display:flex;
          align-items:center;
          color:#555;
        }

        .acciones{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .editBtn{
          display:flex;
          align-items:center;
          gap:5px;
          background:#2563eb;
          color:white;
          border:none;
          padding:8px 10px;
          border-radius:8px;
          cursor:pointer;
          font-size:13px;
          transition:.2s;
        }

        .deleteBtn{
          display:flex;
          align-items:center;
          gap:5px;
          background:#dc2626;
          color:white;
          border:none;
          padding:8px 10px;
          border-radius:8px;
          cursor:pointer;
          font-size:13px;
          transition:.2s;
        }

        .editBtn:hover,
        .deleteBtn:hover{
          transform:scale(1.05);
          box-shadow:0 5px 15px rgba(0,0,0,0.2);
        }

        .loading{
          text-align:center;
          padding:30px;
          color:#666;
          font-size:15px;
        }

      `}</style>

    </div>

  );

}