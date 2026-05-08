"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

import {
Home,
Users,
Calendar,
Upload,
FileCheck,
FileText,
BarChart3,
PieChart,
ChevronDown,
ChevronRight,
LogOut
} from "lucide-react";

export default function GerenteLayout({ children }) {

const router = useRouter();

const [gestionOpen,setGestionOpen] = useState(false);
const [reportesOpen,setReportesOpen] = useState(false);

const cerrarSesion = async ()=>{
await signOut(auth);
router.push("/login");
};

return (

<div className="layout">

{/* SIDEBAR */}

<aside className="sidebar">

<div className="sidebarTop">

<div className="logoArea">

<Image
src="/logo-invecem-gerente.png"
width={120}
height={60}
alt="logo"
/>

<h2 className="siscom">
<span className="sis">Sis</span><span className="com">COM</span>
</h2>

</div>

<nav>

<a
className="menuItem"
onClick={()=>router.push("/gerente")}
>

<Home size={18}/>
Panel Principal

</a>

{/* GESTION HUMANA */}

<div
className="menuItem"
onClick={()=>setGestionOpen(!gestionOpen)}
>

<Users size={18}/>
Gestión Humana
{gestionOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}

</div>

{gestionOpen &&(

<div className="submenu">

<a onClick={()=>router.push("/gerente/cargar-nomina")}>
<Upload size={16}/>
Cargar Nómina
</a>

<a onClick={()=>router.push("/gerente/cargar-nomina/nomina-final")}>
<FileCheck size={16}/>
Ver Nómina Final
</a>

</div>

)}

{/* REPORTES */}

<div
className="menuItem"
onClick={()=>setReportesOpen(!reportesOpen)}
>

<Calendar size={18}/>
Reportes
{reportesOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}

</div>

{reportesOpen &&(

<div className="submenu">

<a>
<FileText size={16}/>
Reporte Diario
</a>

<a>
<BarChart3 size={16}/>
Reporte Semanal
</a>

<a>
<PieChart size={16}/>
Reporte Mensual
</a>

</div>

)}

</nav>

</div>

{/* PARTE INFERIOR */}

<div className="sidebarBottom">

<div className="perfil">

<Image
src="/perfil-gerente.png"
width={42}
height={42}
alt="perfil"
/>

<div>

<p className="nombre">Marcos Herrera</p>
<span className="cargo">GERENTE</span>

</div>

</div>

<button
className="logout"
onClick={cerrarSesion}
>

<LogOut size={18}/>
Cerrar Sesión

</button>

</div>

</aside>

{/* CONTENIDO */}

<main className="main">

{children}

</main>

<style jsx>{`

.layout{
display:flex;
height:100vh;
background:url('/background.png');
background-size:cover;
font-family:Arial;
}

.sidebar{
width:260px;
background:white;
padding:25px;
display:flex;
flex-direction:column;
justify-content:space-between;
box-shadow:2px 0 10px rgba(0,0,0,0.1);
overflow-y:auto;
}

.sidebarTop{
display:flex;
flex-direction:column;
}

.logoArea{
display:flex;
flex-direction:column;
align-items:center;
margin-bottom:20px;
}

.siscom{
font-size:28px;
font-weight:900;
margin-top:4px;
letter-spacing:0px;
}

.sis{color:black;}
.com{color:#e53935;}

nav{
display:flex;
flex-direction:column;
gap:10px;
}

.menuItem{
display:flex;
align-items:center;
gap:12px;
padding:12px;
border-radius:8px;
cursor:pointer;
font-size:15px;
font-weight:500;
}

.menuItem:hover{
background:#f4f4f4;
}

.submenu{
margin-left:30px;
display:flex;
flex-direction:column;
gap:8px;
}

.submenu a{
display:flex;
align-items:center;
gap:8px;
font-size:14px;
cursor:pointer;
}

.sidebarBottom{
margin-top:20px;
}

.perfil{
display:flex;
align-items:center;
gap:10px;
}

.nombre{
font-size:14px;
font-weight:600;
}

.cargo{
font-size:12px;
color:#777;
}

.logout{
margin-top:12px;
border:none;
background:#2b2b2b;
color:white;
padding:10px;
border-radius:8px;
display:flex;
align-items:center;
gap:8px;
cursor:pointer;
font-size:14px;
font-weight:500;
}

.main{
flex:1;
padding:30px;
overflow:auto;
}

`}</style>

</div>

);

}