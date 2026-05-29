"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { db } from "../../lib/firebase";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  Users,
  Search,
  Shield,
  Mail,
  Trash2,
  KeyRound,
  Eye,
  User2,
  ArrowLeft
} from "lucide-react";

export default function UsuariosSistema() {

  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);

  const [usuariosFiltrados, setUsuariosFiltrados] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  // 🔥 MODAL
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null);

  // 🔥 CARGAR USUARIOS
  useEffect(() => {

    async function cargarUsuarios() {

      try {

        const querySnapshot =
          await getDocs(
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

        alert(
          "❌ Error al cargar usuarios"
        );

      }

      setLoading(false);

    }

    cargarUsuarios();

  }, []);

  // 🔥 BUSCAR
  useEffect(() => {

    const filtrados =
      usuarios.filter((user) =>

        `${user.nombres || ""}
         ${user.apellidos || ""}
         ${user.correo || ""}
         ${user.rol || ""}`
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )

      );

    setUsuariosFiltrados(filtrados);

  }, [busqueda, usuarios]);

  // 🔥 CAMBIAR STATUS
  async function cambiarStatus(id, statusActual){

    try{

      const nuevoStatus =
        statusActual === "activo"
          ? "inactivo"
          : "activo";

      await updateDoc(
        doc(db, "usuarios", id),
        {
          status: nuevoStatus
        }
      );

      const actualizados =
        usuarios.map((u)=>{

          if(u.id === id){

            return {
              ...u,
              status: nuevoStatus
            };

          }

          return u;

        });

      setUsuarios(actualizados);

      setUsuariosFiltrados(actualizados);

    }catch(error){

      console.error(error);

      alert(
        "❌ Error al actualizar estado"
      );

    }

  }

  // 🔥 ELIMINAR
  async function eliminarUsuario(id, nombre) {

    const confirmar = confirm(
      `¿Seguro que deseas eliminar el usuario ${nombre}?`
    );

    if (!confirmar) return;

    try {

      await deleteDoc(
        doc(db, "usuarios", id)
      );

      const nuevosUsuarios =
        usuarios.filter(
          (u) => u.id !== id
        );

      setUsuarios(nuevosUsuarios);

      setUsuariosFiltrados(
        nuevosUsuarios
      );

      alert(
        "✅ Usuario eliminado correctamente"
      );

    } catch (error) {

      console.error(error);

      alert(
        "❌ Error al eliminar usuario"
      );

    }

  }

  return (

    <div className="main">

      {/* TITULO */}
      <div className="panelTitle">

        <h1>
          Usuarios del Sistema
        </h1>

      </div>

      {/* DASHBOARD */}
      <div className="dashboard">

        <div className="cardDash">

          <div>

            <span>
              Total Usuarios
            </span>

            <strong>
              {usuarios.length}
            </strong>

          </div>

          <Users size={28}/>

        </div>

      </div>

      {/* BUSCADOR */}
      <div className="searchBox">

        <Search size={18}/>

        <input
          type="text"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e)=>
            setBusqueda(e.target.value)
          }
        />

      </div>

      {/* TABLA */}
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
                  <th>Status</th>
                  <th>Acciones</th>

                </tr>

              </thead>

              <tbody>

                {usuariosFiltrados.map(
                  (user, index)=>(

                  <tr key={user.id}>

                    <td>
                      {index + 1}
                    </td>

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

                    {/* STATUS */}
                    <td>

                      <button
                        className={
                          user.status === "activo"
                          ? "statusMini activo"
                          : "statusMini inactivo"
                        }
                        onClick={() =>
                          cambiarStatus(
                            user.id,
                            user.status
                          )
                        }
                      >

                        <span className="statusDot"></span>

                        {
                          user.status === "activo"
                          ? "Activo"
                          : "Inactivo"
                        }

                      </button>

                    </td>

                    {/* ACCIONES */}
                    <td>

                      <div className="acciones">

                        {/* VER */}
                        <button
                          className="viewBtn"
                          onClick={() =>
                            setUsuarioSeleccionado(user)
                          }
                        >

                          <Eye size={15}/>
                          Ver

                        </button>

                        {/* CAMBIAR */}
                        <button
                          className="editBtn"
                          onClick={() =>
                            router.push(
                              `/administrador/cambiar-password?id=${user.id}`
                            )
                          }
                        >

                          <KeyRound size={15}/>
                          Cambiar

                        </button>

                        {/* ELIMINAR */}
                        <button
                          className="deleteBtn"
                          onClick={() =>
                            eliminarUsuario(
                              user.id,
                              `${user.nombres} ${user.apellidos}`
                            )
                          }
                        >

                          <Trash2 size={14}/>

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

      {/* 🔥 MODAL VER USUARIO */}
      {usuarioSeleccionado && (

        <div className="modalOverlay">

          <div className="modal">

            <div className="modalHeader">

              <div className="perfilCircle">

                <User2 size={35}/>

              </div>

              <div>

                <h2>
                  Información Completa del Usuario
                </h2>

                <p>
                  Datos registrados en el sistema
                </p>

              </div>

            </div>

            <div className="infoGrid">

              {/* CREDENCIALES */}
              <div className="infoCard">
                <span>Correo Institucional</span>
                <strong>
                  {usuarioSeleccionado.correo || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Status</span>
                <strong>
                  {usuarioSeleccionado.status || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Rol del Sistema</span>
                <strong>
                  {usuarioSeleccionado.rol || "-"}
                </strong>
              </div>

              {/* INFORMACIÓN PERSONAL */}
              <div className="infoCard">
                <span>Nombres</span>
                <strong>
                  {usuarioSeleccionado.nombres || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Apellidos</span>
                <strong>
                  {usuarioSeleccionado.apellidos || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Cédula de Identidad</span>
                <strong>
                  {usuarioSeleccionado.cedula || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Teléfono</span>
                <strong>
                  {usuarioSeleccionado.telefono || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Fecha de Nacimiento</span>
                <strong>
                  {usuarioSeleccionado.fechaNacimiento || "-"}
                </strong>
              </div>

              {/* FICHA LABORAL */}
              <div className="infoCard">
                <span>N° de Ficha</span>
                <strong>
                  {usuarioSeleccionado.ficha || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Cargo</span>
                <strong>
                  {usuarioSeleccionado.cargo || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Departamento</span>
                <strong>
                  {usuarioSeleccionado.departamento || "-"}
                </strong>
              </div>

              <div className="infoCard">
                <span>Fecha de Ingreso</span>
                <strong>
                  {usuarioSeleccionado.fechaIngreso || "-"}
                </strong>
              </div>

            </div>

            {/* BOTON ABAJO */}
            <div className="bottomActions">

              <button
                className="cerrarBtn"
                onClick={() =>
                  setUsuarioSeleccionado(null)
                }
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* BOTON VOLVER ABAJO */}
      <div className="bottomBack">

        <button
          className="backBtn"
          onClick={() => router.back()}
        >

          <ArrowLeft size={18}/>
          Volver

        </button>

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
          margin-bottom:25px;
        }

        .cardDash{
          width:250px;
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
          box-shadow:0 10px 30px rgba(0, 0, 0, 0.15);
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

        .statusMini{
          border:none;
          padding:5px 10px;
          border-radius:30px;
          display:flex;
          align-items:center;
          gap:6px;
          font-size:11px;
          font-weight:700;
          cursor:pointer;
          transition:.2s;
        }

        .statusMini:hover{
          transform:scale(1.05);
        }

        .statusDot{
          width:8px;
          height:8px;
          border-radius:50%;
          background:currentColor;
        }

        .activo{
          background:#dcfce7;
          color:#15803d;
        }

        .inactivo{
          background:#fee2e2;
          color:#dc2626;
        }

        .acciones{
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        }

        .viewBtn{
          display:flex;
          align-items:center;
          gap:5px;
          background:#facc15;
          color:#111827;
          border:none;
          padding:8px 11px;
          border-radius:8px;
          cursor:pointer;
          font-size:12px;
          font-weight:700;
          transition:.2s;
        }

        .viewBtn:hover{
          background:#eab308;
          transform:scale(1.05);
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
          font-size:12px;
          font-weight:600;
          transition:.2s;
        }

        .editBtn:hover{
          transform:scale(1.05);
        }

        .deleteBtn{
          width:34px;
          height:34px;
          background:#dc2626;
          color:white;
          border:none;
          border-radius:8px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          transition:.2s;
        }

        .deleteBtn:hover{
          transform:scale(1.08);
          background:#b91c1c;
        }

        .loading{
          text-align:center;
          padding:30px;
          color:#666;
        }

        .modalOverlay{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.5);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:999;
          padding:20px;
        }

        .modal{
          width:100%;
          max-width:850px;
          max-height:90vh;
          overflow:auto;
          background:white;
          border-radius:20px;
          padding:30px;
          box-shadow:0 20px 40px rgba(0,0,0,0.2);
        }

        .modalHeader{
          display:flex;
          align-items:center;
          gap:15px;
          margin-bottom:25px;
        }

        .perfilCircle{
          width:70px;
          height:70px;
          border-radius:50%;
          background:#eef2ff;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#2563eb;
        }

        .modalHeader h2{
          font-size:24px;
          margin:0;
        }

        .modalHeader p{
          color:#666;
          margin-top:4px;
        }

        .infoGrid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
          gap:15px;
        }

        .infoCard{
          background:#f8fafc;
          padding:16px;
          border-radius:12px;
          border:1px solid #e5e7eb;
        }

        .infoCard span{
          display:block;
          font-size:12px;
          color:#666;
          margin-bottom:5px;
        }

        .infoCard strong{
          font-size:15px;
          color:#111;
          word-break:break-word;
        }

        .bottomActions{
          margin-top:30px;
        }

        .cerrarBtn{
          width:100%;
          background:#111827;
          color:white;
          border:none;
          padding:13px;
          border-radius:12px;
          cursor:pointer;
          font-size:14px;
          font-weight:600;
        }

        /* BOTON VOLVER ABAJO */
        .bottomBack{
          display:flex;
          justify-content:center;
          margin-top:30px;
        }

        .backBtn{
          display:flex;
          align-items:center;
          gap:8px;
          background:#111827;
          color:white;
          border:none;
          padding:12px 18px;
          border-radius:10px;
          cursor:pointer;
          font-size:14px;
          font-weight:600;
          transition:.2s;
        }

        .backBtn:hover{
          transform:translateY(-2px);
          background:#1f2937;
        }

      `}</style>

    </div>

  );

}