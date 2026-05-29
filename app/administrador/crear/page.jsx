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
  UserPlus,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Briefcase,
  Phone,
  IdCard,
  CalendarDays,
  Building2,
  BadgeCheck
} from "lucide-react";

export default function CrearUsuario() {

  const router = useRouter();

  const [form, setForm] = useState({

    correo: "",
    clave: "",
    confirmarClave: "",

    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    fechaNacimiento: "",

    ficha: "",
    rol: "",
    cargo: "",
    departamento: "",
    fechaIngreso: ""

  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

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

    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{6,}$/;

    return regex.test(clave);

  }

  // 🔥 CREAR USUARIO
  async function crearUsuario(){

    if(

      !form.correo ||
      !form.clave ||
      !form.confirmarClave ||

      !form.nombres ||
      !form.apellidos ||
      !form.cedula ||
      !form.telefono ||
      !form.fechaNacimiento ||

      !form.ficha ||
      !form.rol ||
      !form.cargo ||
      !form.departamento ||
      !form.fechaIngreso

    ){

      alert("⚠️ Completa todos los campos");
      return;

    }

    // 🔥 VALIDAR CONTRASEÑA
    if(!validarClave(form.clave)){

      alert(
        "❌ La contraseña debe contener letras, números y mínimo 6 caracteres"
      );

      return;

    }

    // 🔥 CONFIRMAR
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

      // 🔥 GUARDAR FIRESTORE
      await setDoc(doc(db, "usuarios", user.uid), {

        correo: form.correo.trim(),

        clave: form.clave,

        nombres: capitalizar(form.nombres),

        apellidos: capitalizar(form.apellidos),

        cedula: form.cedula,

        telefono: form.telefono,

        fechaNacimiento: form.fechaNacimiento,

        ficha: form.ficha,

        rol: form.rol,

        cargo: capitalizar(form.cargo),

        departamento: capitalizar(form.departamento),

        fechaIngreso: form.fechaIngreso,

        status: "activo",

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

      {/* 🔥 HEADER */}

      <div className="panelTitle">

        <h1>
          Registrar Usuario
        </h1>

      </div>

      {/* 🔥 CARD */}

      <div className="formCard">

        {/* 🔥 CREDENCIALES */}

        <div className="sectionTitle">

          <ShieldCheck size={18}/>

          <span>
            Credenciales de Acceso
          </span>

        </div>

        <div className="grid">

          {/* CORREO */}

          <div className="inputGroup">

            <label>
              Correo Institucional
            </label>

            <div className="inputIcon">

              <Mail
                size={18}
                className="iconLeft"
              />

              <input
                type="email"
                name="correo"
                placeholder="usuario@gmail.com"
                value={form.correo}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div className="inputGroup">

            <label>
              Contraseña
            </label>

            <div className="passwordBox">

              <Lock
                size={18}
                className="iconLeft"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="clave"
                placeholder="Ingrese contraseña"
                value={form.clave}
                onChange={handleChange}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >

                {showPassword
                  ? <EyeOff size={18}/>
                  : <Eye size={18}/>}

              </button>

            </div>

          </div>

        </div>

        {/* CONFIRMAR */}

        <div className="inputGroup">

          <label>
            Confirmar Contraseña
          </label>

          <div className="passwordBox">

            <Lock
              size={18}
              className="iconLeft"
            />

            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              name="confirmarClave"
              placeholder="Repita la contraseña"
              value={form.confirmarClave}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >

              {showConfirmPassword
                ? <EyeOff size={18}/>
                : <Eye size={18}/>}

            </button>

          </div>

        </div>

        {/* 🔥 REGLAS PASSWORD */}

        <div className="passwordInfo">

          <strong>
            La contraseña debe contener:
          </strong>

          <ul>
            <li>Mínimo 6 caracteres</li>
            <li>Al menos una letra</li>
            <li>Al menos un número</li>
          </ul>

        </div>

        {/* 🔥 INFORMACIÓN PERSONAL */}

        <div className="sectionTitle">

          <User size={18}/>

          <span>
            Información Personal
          </span>

        </div>

        <div className="grid">

          {/* NOMBRES */}

          <div className="inputGroup">

            <label>
              Nombres
            </label>

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

            <label>
              Apellidos
            </label>

            <input
              type="text"
              name="apellidos"
              placeholder="Ingrese los apellidos"
              value={form.apellidos}
              onChange={handleChange}
            />

          </div>

          {/* CEDULA */}

          <div className="inputGroup">

            <label>
              Cédula de Identidad
            </label>

            <div className="inputIcon">

              <IdCard
                size={18}
                className="iconLeft"
              />

              <input
                type="text"
                name="cedula"
                placeholder="Ej: 30123456"
                value={form.cedula}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* TELEFONO */}

          <div className="inputGroup">

            <label>
              Teléfono
            </label>

            <div className="inputIcon">

              <Phone
                size={18}
                className="iconLeft"
              />

              <input
                type="text"
                name="telefono"
                placeholder="0412-0000000"
                value={form.telefono}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* FECHA NACIMIENTO */}

          <div className="inputGroup">

            <label>
              Fecha de Nacimiento
            </label>

            <div className="inputIcon">

              <CalendarDays
                size={18}
                className="iconLeft"
              />

              <input
                type="date"
                name="fechaNacimiento"
                value={form.fechaNacimiento}
                onChange={handleChange}
              />

            </div>

          </div>

        </div>

        {/* 🔥 FICHA LABORAL */}

        <div className="sectionTitle">

          <Briefcase size={18}/>

          <span>
            Ficha Laboral
          </span>

        </div>

        <div className="grid">

          {/* FICHA */}

          <div className="inputGroup">

            <label>
              N° de Ficha
            </label>

            <div className="inputIcon">

              <BadgeCheck
                size={18}
                className="iconLeft"
              />

              <input
                type="text"
                name="ficha"
                placeholder="Ej: 554433"
                value={form.ficha}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* ROL */}

          <div className="inputGroup">

            <label>
              Rol
            </label>

            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
            >

              <option value="">
                Seleccionar Rol
              </option>

              <option value="administrador">
                Administrador
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

          {/* CARGO */}

          <div className="inputGroup">

            <label>
              Cargo
            </label>

            <div className="inputIcon">

              <Briefcase
                size={18}
                className="iconLeft"
              />

              <input
                type="text"
                name="cargo"
                placeholder="Ingrese el cargo"
                value={form.cargo}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* DEPARTAMENTO */}

          <div className="inputGroup">

            <label>
              Departamento
            </label>

            <div className="inputIcon">

              <Building2
                size={18}
                className="iconLeft"
              />

              <input
                type="text"
                name="departamento"
                placeholder="Ingrese el departamento"
                value={form.departamento}
                onChange={handleChange}
              />

            </div>

          </div>

          {/* FECHA INGRESO */}

          <div className="inputGroup">

            <label>
              Fecha de Ingreso
            </label>

            <div className="inputIcon">

              <CalendarDays
                size={18}
                className="iconLeft"
              />

              <input
                type="date"
                name="fechaIngreso"
                value={form.fechaIngreso}
                onChange={handleChange}
              />

            </div>

          </div>

        </div>

        {/* 🔥 BOTONES */}

        <div className="buttons">

          <button
            className="saveBtn"
            onClick={crearUsuario}
            disabled={loading}
          >

            <UserPlus size={18}/>

            {loading
              ? "Creando Usuario..."
              : "Registrar Usuario"}

          </button>

          <button
            className="backBtn"
            onClick={() => router.back()}
          >

            <ArrowLeft size={16}/>
            Volver

          </button>

        </div>

      </div>

      <style jsx>{`

        .main{
          padding:40px;
        }

        /* 🔥 TITULO */

        .panelTitle{
          background:white;
          padding:18px 24px;
          border-left:5px solid #dc2626;
          border-radius:14px;
          margin-bottom:30px;
          box-shadow:0 5px 18px rgba(0,0,0,0.12);
        }

        .panelTitle h1{
          margin:0;
          font-size:28px;
          font-weight:700;
          color:#111827;
        }

        /* 🔥 CARD */

        .formCard{
          background:white;
          padding:35px;
          border-radius:20px;
          box-shadow:0 10px 30px rgba(0,0,0,0.15);

          display:flex;
          flex-direction:column;
          gap:25px;
        }

        /* 🔥 SECCIONES */

        .sectionTitle{
          display:flex;
          align-items:center;
          gap:10px;
          color:#dc2626;
          font-weight:700;
          font-size:15px;
          text-transform:uppercase;
          letter-spacing:.5px;
        }

        /* 🔥 GRID */

        .grid{
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
          gap:20px;
        }

        .inputGroup{
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        label{
          font-size:13px;
          font-weight:700;
          color:#111827;
          text-transform:uppercase;
        }

        /* 🔥 INPUTS */

        input,
        select{
          width:100%;
          height:52px;
          border-radius:12px;
          border:1px solid #d1d5db;
          outline:none;
          background:white;
          font-size:14px;
          transition:.2s;
          padding:0 15px;
        }

        input:focus,
        select:focus{
          border-color:#dc2626;
          box-shadow:0 0 0 3px rgba(220,38,38,0.12);
        }

        /* 🔥 ICONOS */

        .inputIcon,
        .passwordBox{
          position:relative;
          display:flex;
          align-items:center;
        }

        .iconLeft{
          position:absolute;
          left:15px;
          color:#6b7280;
          z-index:2;
        }

        .inputIcon input{
          padding-left:48px;
        }

        .passwordBox input{
          padding-left:48px;
          padding-right:50px;
        }

        .passwordBox button{
          position:absolute;
          right:15px;
          border:none;
          background:none;
          color:#666;
          cursor:pointer;

          display:flex;
          align-items:center;
          justify-content:center;
        }

        /* 🔥 PASSWORD INFO */

        .passwordInfo{
          background:#fef2f2;
          border:1px solid #fecaca;
          padding:16px;
          border-radius:14px;
          color:#991b1b;
          font-size:14px;
        }

        .passwordInfo strong{
          display:block;
          margin-bottom:8px;
        }

        .passwordInfo ul{
          padding-left:18px;
        }

        .passwordInfo li{
          margin-bottom:5px;
        }

        /* 🔥 BOTONES */

        .buttons{
          display:flex;
          gap:14px;
          margin-top:10px;
        }

        .saveBtn{
          flex:1;
          height:54px;
          background:#dc2626;
          color:white;
          border:none;
          border-radius:12px;
          cursor:pointer;
          font-size:15px;
          font-weight:700;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;

          transition:.2s;
        }

        .saveBtn:hover{
          background:#b91c1c;
          transform:translateY(-2px);
          box-shadow:0 10px 20px rgba(220,38,38,0.25);
        }

        .saveBtn:disabled{
          opacity:.7;
          cursor:not-allowed;
        }

        .backBtn{
          height:54px;
          padding:0 24px;
          background:#111827;
          color:white;
          border:none;
          border-radius:12px;
          cursor:pointer;
          font-size:14px;
          font-weight:700;

          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;

          transition:.2s;
        }

        .backBtn:hover{
          background:#1f2937;
          transform:translateY(-2px);
        }

        /* 🔥 RESPONSIVE */

        @media(max-width:768px){

          .main{
            padding:20px;
          }

          .formCard{
            padding:25px;
          }

          .buttons{
            flex-direction:column;
          }

        }

      `}</style>

    </div>

  );

}