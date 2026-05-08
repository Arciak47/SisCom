"use client";

import { useRouter } from "next/navigation";

import {
Upload,
Pencil,
FilePlus,
Eye,
CheckCircle
} from "lucide-react";

export default function CargarNomina(){

const router = useRouter();

return(

<div className="main">

<div className="panelTitle">
<h1>Gestión de Nómina - Cargar Nómina</h1>
</div>

<h2 className="sectionTitle">
Cargar Nueva Nómina - Selección de Categoría
</h2>

<div className="cards">


{/* ================= TRABAJADORES FIJOS ================= */}

<div className="categoryCard">

<div
className="iconArea yellow"
onClick={()=>router.push("/gerente/cargar-nomina/fijo/cargar")}
>

<Upload size={28}/>
<p className="uploadText">Cargar Archivo</p>

</div>

<div className="options">

<h3 className="cardTitle">Trabajadores Fijos</h3>

<div className="buttons">

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/fijo/editar");}}>
<Pencil size={15}/>Editar
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/fijo/manual");}}>
<FilePlus size={15}/>Manual
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/fijo/ver");}}>
<Eye size={15}/>Ver
</button>

</div>

</div>

</div>


{/* ================= CONTRATISTAS ================= */}

<div className="categoryCard">

<div
className="iconArea blue"
onClick={()=>router.push("/gerente/cargar-nomina/contratistas/cargar")}
>

<Upload size={28}/>
<p className="uploadText">Cargar Archivo</p>

</div>

<div className="options">

<h3 className="cardTitle">Contratistas</h3>

<div className="buttons">

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/contratistas/editar");}}>
<Pencil size={15}/>Editar
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/contratistas/manual");}}>
<FilePlus size={15}/>Manual
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/contratistas/ver");}}>
<Eye size={15}/>Ver
</button>

</div>

</div>

</div>


{/* ================= ESTUDIANTES INCES ================= */}

<div className="categoryCard">

<div
className="iconArea red"
onClick={()=>router.push("/gerente/cargar-nomina/inces/cargar")}
>

<Upload size={28}/>
<p className="uploadText">Cargar Archivo</p>

</div>

<div className="options">

<h3 className="cardTitle">Estudiantes INCES</h3>

<div className="buttons">

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/inces/editar");}}>
<Pencil size={15}/>Editar
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/inces/manual");}}>
<FilePlus size={15}/>Manual
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/inces/ver");}}>
<Eye size={15}/>Ver
</button>

</div>

</div>

</div>


{/* ================= PASANTES ================= */}

<div className="categoryCard">

<div
className="iconArea green"
onClick={()=>router.push("/gerente/cargar-nomina/pasantes/cargar")}
>

<Upload size={28}/>
<p className="uploadText">Cargar Archivo</p>

</div>

<div className="options">

<h3 className="cardTitle">Pasantes</h3>

<div className="buttons">

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/pasantes/editar");}}>
<Pencil size={15}/>Editar
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/pasantes/manual");}}>
<FilePlus size={15}/>Manual
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/pasantes/ver");}}>
<Eye size={15}/>Ver
</button>

</div>

</div>

</div>


{/* ================= VISITANTES ================= */}

<div className="categoryCard">

<div
className="iconArea purple"
onClick={()=>router.push("/gerente/cargar-nomina/visitantes/cargar")}
>

<Upload size={28}/>
<p className="uploadText">Cargar Archivo</p>

</div>

<div className="options">

<h3 className="cardTitle">Visitantes</h3>

<div className="buttons">

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/visitantes/editar");}}>
<Pencil size={15}/>Editar
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/visitantes/manual");}}>
<FilePlus size={15}/>Manual
</button>

<button onClick={(e)=>{e.stopPropagation(); router.push("/gerente/cargar-nomina/visitantes/ver");}}>
<Eye size={15}/>Ver
</button>

</div>

</div>

</div>

</div>


<h2 className="sectionTitle">
Gestión de Nómina
</h2>

<div className="finalCard">

<div className="finalContent">

<CheckCircle size={55}/>

<h3 className="cardTitleFinal">
Ver Nómina Final
</h3>

</div>

<button
onClick={()=>router.push("/gerente/cargar-nomina/nomina-final")}
>
Ver
</button>

</div>


<style jsx>{`

.main{
padding:40px;
animation:fadeIn .6s ease;
}

@keyframes fadeIn{
from{opacity:0;transform:translateY(10px);}
to{opacity:1;transform:translateY(0);}
}

.panelTitle{
display:inline-block;
background:white;
padding:12px 20px;
border-left:5px solid #e53935;
border-radius:10px;
box-shadow:0 5px 20px rgba(0,0,0,0.1);
margin-bottom:25px;
}

.panelTitle h1{
font-size:24px;
font-weight:bold;
}

.sectionTitle{
font-size:26px;
font-weight:bold;
margin-bottom:20px;
}

.cards{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
gap:25px;
margin-bottom:40px;
}

.categoryCard{
display:flex;
background:white;
border-radius:16px;
overflow:hidden;
box-shadow:0 10px 30px rgba(0,0,0,0.15);
transition:all .3s ease;
}

.categoryCard:hover{
transform:translateY(-6px);
box-shadow:0 20px 40px rgba(0,0,0,0.2);
}

.iconArea{
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
padding:20px;
width:120px;
font-size:13px;
font-weight:bold;
cursor:pointer;
transition:all .3s ease;
}

.iconArea:hover{
transform:scale(1.1);
filter:brightness(1.15);
}

.uploadText{
margin-top:6px;
text-align:center;
}

.yellow{ background:#facc15; color:black; }
.blue{ background:#2563eb; color:white; }
.red{ background:#ef4444; color:white; }
.green{ background:#22c55e; color:white; }
.purple{ background:#7c3aed; color:white; }

.options{
padding:18px;
flex:1;
}

.cardTitle{
font-weight:bold;
margin-bottom:10px;
}

.buttons{
display:flex;
gap:6px;
flex-wrap:wrap;
}

.buttons button{
display:flex;
align-items:center;
gap:4px;
background:#2b4c7e;
color:white;
border:none;
padding:6px 10px;
font-size:13px;
border-radius:8px;
cursor:pointer;
transition:all .25s ease;
box-shadow:0 3px 8px rgba(0,0,0,0.15);
}

.buttons button:hover{
background:#1e3a5f;
transform:translateY(-2px);
box-shadow:0 8px 15px rgba(0,0,0,0.25);
}

.buttons button:active{
transform:scale(.92);
}

.finalCard{
background:white;
width:300px;
padding:25px;
border-radius:16px;
box-shadow:0 15px 35px rgba(0,0,0,0.2);
transition:all .3s ease;
}

.finalCard:hover{
transform:translateY(-6px);
box-shadow:0 25px 45px rgba(0,0,0,0.25);
}

.finalContent{
display:flex;
align-items:center;
gap:10px;
}

.cardTitleFinal{
font-weight:bold;
margin:0;
}

.finalCard button{
margin-top:15px;
width:100%;
padding:11px;
background:#2563eb;
border:none;
color:white;
border-radius:9px;
cursor:pointer;
transition:all .25s;
}

.finalCard button:hover{
background:#1d4ed8;
transform:translateY(-2px);
box-shadow:0 8px 18px rgba(0,0,0,0.25);
}

.finalCard button:active{
transform:scale(.95);
}

`}</style>

</div>

);

}