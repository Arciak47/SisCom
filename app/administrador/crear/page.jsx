"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";

import {
  createUserWithEmailAndPassword
} from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react";

export default function CrearUsuario() {

  const router = useRouter();

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    correo: "",
    clave: "",
    confirmarClave: "",
    rol: ""
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(e){

    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });

  }

  // 🔥 CAPITALIZAR
  function capitalizar(texto){

    if(!texto) return "";

    return texto
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());

  }

  // 🔥 VALIDAR CONTRASEÑA
  function validarClave(clave){

    // mínimo 8 caracteres
    // letras
    // números
    // símbolos

    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]{8,}$/;

    return regex.test(clave);

  }

  async function crearUsuario(){

    if(
      !form.nombres ||
      !form.apellidos ||
      !form.correo ||
      !form.clave ||
      !form.confirmarClave ||
      !form.rol
    ){
      alert("⚠️ Completa todos los campos");
      return;
    }

    // 🔥 VALIDAR CONTRASEÑA
    if(!validarClave(form.clave)){
      alert(
        "❌ La contraseña debe tener mínimo 8 caracteres, letras, números y símbolos"
      );
      return;
    }

    // 🔥 VALIDAR CONFIRMACIÓN
    if(form.clave !== form.confirmarClave){
      alert("❌ Las contraseñas no coinciden");
      return;
    }

    try{

      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          form.correo.trim(),
          form.clave
        );

      const user = userCredential.user;

      // 🔥 GUARDAR EN FIRESTORE
      await setDoc(doc(db, "usuarios", user.uid), {

        nombres: capitalizar(form.nombres),

        apellidos: capitalizar(form.apellidos),

        correo: form.correo.trim(),

        rol: form.rol,

        creado: new Date()

      });

      alert("✅ Usuario creado correctamente");

      router.push("/administrador/usuarios");

    }catch(error){

      console.error(error);

      if(error.code === "auth/email-already-in-use"){

        alert("❌ El correo ya existe");

      }else if(error.code === "auth/invalid-email"){

        alert("❌ Correo inválido");

      }else{

        alert("❌ Error al crear usuario");

      }

    }

    setLoading(false);

  }

  return (

    <div className="main">

      {/* 🔥 TITULO */}
      <div className="panelTitle">
        <h1>Crear Usuario del Sistema</h1>
      </div>

      {/* 🔥 CARD */}
      <div className="formCard">

        {/* NOMBRES */}
        <div className="inputGroup">

          <label>Nombres</label>

          <input
            type="text"
            name="nombres"
            placeholder="Ingrese los nombres"
            value={form.nombres}
            onChange={handleChange}
          />

        </div>

        {/* APELLIDOS */}
        <div className="inputGroup">

          <label>Apellidos</label>

          <input
            type="text"
            name="apellidos"
            placeholder="Ingrese los apellidos"
            value={form.apellidos}
            onChange={handleChange}
          />

        </div>

        {/* CORREO */}
        <div className="inputGroup">

          <label>Correo Electrónico</label>

          <input
            type="email"
            name="correo"
            placeholder="usuario@gmail.com"
            value={form.correo}
            onChange={handleChange}
          />

          <small>
            El usuario debe ingresar un correo válido
          </small>

        </div>

        {/* CONTRASEÑA */}
        <div className="inputGroup">

          <label>Contraseña</label>

          <div className="passwordBox">

            <input
              type={showPassword ? "text" : "password"}
              name="clave"
              placeholder="Ingrese la contraseña"
              value={form.clave}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword
                ? <EyeOff size={18}/>
                : <Eye size={18}/>}
            </button>

          </div>

          <small>
            Debe contener mínimo 8 caracteres,
            letras, números y símbolos
          </small>

        </div>

        {/* CONFIRMAR */}
        <div className="inputGroup">

          <label>Confirmar Contraseña</label>

          <div className="passwordBox">

            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmarClave"
              placeholder="Confirme la contraseña"
              value={form.confirmarClave}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              {showConfirmPassword
                ? <EyeOff size={18}/>
                : <Eye size={18}/>}
            </button>

          </div>

        </div>

        {/* ROL */}
        <div className="inputGroup">

          <label>Seleccionar Rol</label>

          <select
            name="rol"
            value={form.rol}
            onChange={handleChange}
          >

            <option value="">
              Seleccionar Rol
            </option>

            <option value="gerente">
              Gerente
            </option>

            <option value="supervisor">
              Supervisor
            </option>

            <option value="recursos humanos">
              Recursos Humanos
            </option>

          </select>

        </div>

        {/* BOTON CREAR */}
        <button
          className="saveBtn"
          onClick={crearUsuario}
          disabled={loading}
        >

          <UserPlus size={18}/>

          {loading
            ? "Creando Usuario..."
            : "Crear Usuario"}

        </button>

        {/* VOLVER */}
        <button
          className="backBtn"
          onClick={() => router.back()}
        >

          <ArrowLeft size={16}/>
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
          margin-bottom:30px;
          box-shadow:0 5px 15px rgba(0,0,0,0.1);
        }

        .panelTitle h1{
          font-size:24px;
          font-weight:bold;
        }

        .formCard{
          background:white;
          max-width:650px;
          margin:auto;
          padding:35px;
          border-radius:18px;
          box-shadow:0 10px 30px rgba(0,0,0,0.18);
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .inputGroup{
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .inputGroup label{
          font-size:14px;
          font-weight:600;
          color:#333;
        }

        .inputGroup small{
          font-size:11px;
          color:#666;
        }

        input,
        select{
          width:100%;
          padding:12px;
          border-radius:10px;
          border:1px solid #d1d5db;
          outline:none;
          font-size:14px;
          transition:.2s;
        }

        input:focus,
        select:focus{
          border-color:#2563eb;
          box-shadow:0 0 0 3px rgba(37,99,235,0.1);
        }

        .passwordBox{
          position:relative;
          display:flex;
          align-items:center;
        }

        .passwordBox input{
          padding-right:45px;
        }

        .passwordBox button{
          position:absolute;
          right:12px;
          background:none;
          border:none;
          cursor:pointer;
          color:#555;
        }

        .saveBtn{
          margin-top:10px;
          background:#2563eb;
          color:white;
          border:none;
          padding:14px;
          border-radius:10px;
          cursor:pointer;
          font-size:15px;
          font-weight:600;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          transition:.2s;
        }

        .saveBtn:hover{
          transform:scale(1.02);
          box-shadow:0 8px 20px rgba(37,99,235,0.3);
        }

        .saveBtn:disabled{
          opacity:.7;
          cursor:not-allowed;
        }

        .backBtn{
          background:#e5e7eb;
          border:none;
          padding:12px;
          border-radius:10px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          font-weight:500;
          transition:.2s;
        }

        .backBtn:hover{
          transform:scale(1.02);
          box-shadow:0 5px 15px rgba(0,0,0,0.15);
        }

      `}</style>

    </div>

  );

}