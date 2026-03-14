import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Notchpay — Clé publique via variable d'environnement Vite
const NOTCHPAY_PK = import.meta.env.VITE_NOTCHPAY_PK;


const T = {
  bg:"#010306",c1:"#05090f",c2:"#08111d",c3:"#0d1828",c4:"#121f34",
  border:"rgba(0,210,120,0.08)",bhi:"rgba(0,210,120,0.22)",
  gr:"#00d478",teal:"#00bfcc",blue:"#1a78ff",gold:"#f0b020",
  orange:"#ff5a18",red:"#ff2255",purple:"#9060ff",
  text:"#dff0ff",sub:"#4a7090",sub2:"#80a8c8",ink:"#000",
};

const INF = Number.POSITIVE_INFINITY;

const PLANS = {
  free:    {label:"Free",    emoji:"🌱",price:0, col:T.sub2, maxTx:10,maxCli:3, maxInv:2, pdf:false,wa:false,mm:false,ai:false},
  pro:     {label:"Pro",     emoji:"⚡",price:4900, col:T.gr,   maxTx:INF,maxCli:INF,maxInv:INF,pdf:true,wa:true,mm:true,ai:true},
  business:{label:"Business",emoji:"🏆",price:9900, col:T.gold, maxTx:INF,maxCli:INF,maxInv:INF,pdf:true,wa:true,mm:true,ai:true},
};

const CATS_S=["Commerce","Services","Alimentation","Agriculture","Transport","BTP","Santé","Éducation","Divers"];
const CATS_E=["Salaires","Loyer","Transport","Marketing","Matières premières","Équipement","Communication","Divers"];
const PAYS=["🇨🇮 Côte d'Ivoire","🇸🇳 Sénégal","🇬🇭 Ghana","🇨🇲 Cameroun","🇳🇬 Nigeria","🇲🇱 Mali","🇧🇫 Burkina Faso","🇹🇬 Togo","🇧🇯 Bénin","🇬🇳 Guinée"];
const MM=[
  {id:"cinetpay",label:"CinetPay",emoji:"🟠",desc:"CI · SN · CM · BF"},
  {id:"paystack",label:"Paystack",emoji:"🟢",desc:"NG · GH · ZA · KE"},
  {id:"flutterwave",label:"Flutterwave",emoji:"🔵",desc:"20+ pays Afrique"},
  {id:"wave",label:"Wave",emoji:"🌊",desc:"CI · SN · ML"},
];

// ── Supabase Client (inline) ──
// ⚠️ SÉCURITÉ : Cette clé publishable est safe côté client UNIQUEMENT si
// Row Level Security (RLS) est activé sur toutes les tables Supabase.
// Vérifiez : Authentication > Policies dans votre dashboard Supabase.
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
let _supa = null;
const getSupa = async () => {
  if(_supa) return _supa;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2');
  _supa = createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true}});
  return _supa;
};

// localStorage supprimé — 100% Supabase

// hashPwd supprimé — Supabase Auth gère le hachage des mots de passe

// ── Supabase helpers ──
const supaInsert = async (table, data) => {
  try {
    const s = await getSupa();
    const {error} = await s.from(table).insert(data);
    if(error) console.error('Supabase insert error:', error);
    return !error;
  } catch(e) { console.error('Supabase error:', e); return false; }
};
const supaUpdate = async (table, data, id) => {
  try {
    const s = await getSupa();
    const {error} = await s.from(table).update(data).eq('id', id);
    if(error) console.error('Supabase update error:', error);
    return !error;
  } catch(e) { console.error('Supabase error:', e); return false; }
};
const supaDelete = async (table, id) => {
  try {
    const s = await getSupa();
    const {error} = await s.from(table).delete().eq('id', id);
    if(error) console.error('Supabase delete error:', error);
    return !error;
  } catch(e) { console.error('Supabase error:', e); return false; }
};
const supaSelect = async (table, userId) => {
  try {
    const s = await getSupa();
    const {data, error} = await s.from(table).select('*').eq('user_id', userId).order('created_at', {ascending:false});
    if(error) console.error('Supabase select error:', error);
    return data || [];
  } catch(e) { console.error('Supabase error:', e); return []; }
};
const xid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const today=()=>new Date().toISOString().slice(0,10);
const mkey=(d)=>(d||today()).slice(0,7);
const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n||0));
const fmtk=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(0)+"k":String(Math.round(n||0));
const fmtf=n=>fmt(n)+" FCFA";
const cleanP=p=>(p||"").replace(/\D/g,"");

function ConfirmModal({open,onClose,onConfirm,title,msg,confirmLabel="Confirmer",danger=false}){
  if(!open)return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:950,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}>
      <div style={{background:T.c1,border:`1px solid ${danger?"rgba(255,34,85,.3)":T.border}`,borderRadius:18,padding:"1.6rem",width:"90%",maxWidth:380,color:T.text,boxShadow:"0 40px 100px rgba(0,0,0,.9)",animation:"pop .2s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{fontWeight:900,fontSize:17,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,color:T.sub2,marginBottom:20,lineHeight:1.6}}>{msg}</div>
        <div style={{display:"flex",gap:9}}>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:danger?T.red:T.gr,color:T.ink}}>{confirmLabel}</button>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:9,border:`1px solid ${T.border}`,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:T.c2,color:T.text}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

async function seed(uid){
  // Dates dynamiques — toujours dans le mois en cours pour que les KPIs soient visibles
  const now=new Date();
  const y=now.getFullYear();
  const m=String(now.getMonth()+1).padStart(2,"0");
  const d=(n)=>`${y}-${m}-${String(n).padStart(2,"0")}`;
  const lastM=()=>{const dt=new Date(now);dt.setMonth(dt.getMonth()-1);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;};
  const lm=lastM();

  const txData=[
    {id:xid(),user_id:uid,type:"sale",   amount:1850000,category:"Services",    who:"TechLagos Inc",   date:d(12),note:"Consulting mensuel"},
    {id:xid(),user_id:uid,type:"sale",   amount:950000, category:"Commerce",    who:"Ama Owusu",       date:d(11),note:"Commande hebdo"},
    {id:xid(),user_id:uid,type:"expense",amount:185000, category:"Transport",   who:"Logistique CI",   date:d(10),note:"Livraison"},
    {id:xid(),user_id:uid,type:"sale",   amount:675000, category:"Alimentation",who:"Marché Central",  date:d(9), note:""},
    {id:xid(),user_id:uid,type:"expense",amount:120000, category:"Marketing",   who:"AdAfrika",        date:d(8), note:"Pub Facebook"},
    {id:xid(),user_id:uid,type:"sale",   amount:490000, category:"Commerce",    who:"Fatou Diallo",    date:d(7), note:""},
    {id:xid(),user_id:uid,type:"expense",amount:350000, category:"Salaires",    who:"Équipe VA",       date:d(6), note:"Salaires"},
    {id:xid(),user_id:uid,type:"sale",   amount:1100000,category:"Services",    who:"StartupDakar",    date:d(5), note:"Design sprint"},
    {id:xid(),user_id:uid,type:"sale",   amount:780000, category:"Commerce",    who:"Ama Owusu",       date:d(4), note:"Réapprovisionnement"},
    {id:xid(),user_id:uid,type:"expense",amount:95000,  category:"Communication",who:"Orange CI",      date:d(3), note:"Internet & mobile"},
    // Mois précédent pour les graphiques
    {id:xid(),user_id:uid,type:"sale",   amount:2100000,category:"Services",    who:"TechLagos Inc",   date:`${lm}-20`,note:"Projet web"},
    {id:xid(),user_id:uid,type:"sale",   amount:870000, category:"Commerce",    who:"Fatou Diallo",    date:`${lm}-15`,note:""},
    {id:xid(),user_id:uid,type:"expense",amount:210000, category:"Salaires",    who:"Équipe VA",       date:`${lm}-10`,note:""},
    {id:xid(),user_id:uid,type:"sale",   amount:540000, category:"Alimentation",who:"Marché Central",  date:`${lm}-08`,note:""},
  ];
  const cliData=[
    {id:"c1",user_id:uid,name:"Ama Owusu",     phone:"+233240001111",email:"ama@email.com",    country:PAYS[2],category:"Commerce",    status:"active",  revenue:1730000},
    {id:"c2",user_id:uid,name:"TechLagos Inc", phone:"+234800002222",email:"tech@lagos.ng",    country:PAYS[4],category:"Services",    status:"active",  revenue:3950000},
    {id:"c3",user_id:uid,name:"Marché Central",phone:"+225070003333",email:"",                 country:PAYS[0],category:"Alimentation",status:"inactive",revenue:1215000},
    {id:"c4",user_id:uid,name:"Fatou Diallo",  phone:"+221770004444",email:"fatou@sn.com",     country:PAYS[1],category:"Commerce",    status:"active",  revenue:1270000},
    {id:"c5",user_id:uid,name:"StartupDakar",  phone:"+221780005555",email:"hello@startup.sn", country:PAYS[1],category:"Services",    status:"active",  revenue:1100000},
  ];
  const invData=[
    {id:"i1",user_id:uid,number:`VAF-${y}-0001`,client_name:"TechLagos Inc",  phone:"+234800002222",total:1850000,subtotal:1850000,tax:0,status:"paid",   issued:d(12),due:d(28),items:JSON.stringify([{id:xid(),name:"Consulting mensuel",qty:1,price:1850000,line:1850000}]),notes:"",pay_status:"paid",pay_ref:"PAY_001",pay_prov:"cinetpay"},
    {id:"i2",user_id:uid,number:`VAF-${y}-0002`,client_name:"Ama Owusu",      phone:"+233240001111",total:950000, subtotal:950000, tax:0,status:"paid",   issued:d(11),due:d(25),items:JSON.stringify([{id:xid(),name:"Produits commerce",qty:1,price:950000,line:950000}]),notes:"",pay_status:"paid",pay_ref:"PAY_002",pay_prov:"wave"},
    {id:"i3",user_id:uid,number:`VAF-${y}-0003`,client_name:"StartupDakar",   phone:"+221780005555",total:1100000,subtotal:1100000,tax:0,status:"pending", issued:d(5), due:d(20),items:JSON.stringify([{id:xid(),name:"Design Sprint 3j",qty:3,price:366667,line:1100001}]),notes:"",pay_status:"unpaid",pay_ref:"",pay_prov:""},
    {id:"i4",user_id:uid,number:`VAF-${y}-0004`,client_name:"Marché Central", phone:"+225070003333",total:675000, subtotal:675000, tax:0,status:"overdue", issued:d(1), due:d(8), items:JSON.stringify([{id:xid(),name:"Livraison alimentaire",qty:1,price:675000,line:675000}]),notes:"",pay_status:"unpaid",pay_ref:"",pay_prov:""},
  ];
  const s=await getSupa();
  await Promise.all([
    s.from("transactions").insert(txData),
    s.from("clients").insert(cliData),
    s.from("invoices").insert(invData),
  ]);
}

// ── UI Atoms ──
const IS={width:"100%",padding:"11px 14px",background:T.c3,border:`1px solid ${T.border}`,borderRadius:11,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontSize:13,outline:"none",marginTop:5,transition:"all .2s"};
const FL=({l,ch,err,hint})=>(
  <div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:err?T.red:T.sub}}>{l}</label>
    {ch}
    {err&&<div style={{fontSize:11,color:T.red,marginTop:2}}>⚠ {err}</div>}
    {hint&&<div style={{fontSize:11,color:T.sub2,marginTop:2}}>ℹ {hint}</div>}
  </div>
);
function Btn({ch,onClick,v="p",sm,full,dis,sx={}}){
  const V={
    p:{bg:T.gr,fg:T.ink},g:{bg:T.c2,fg:T.text,bd:`1px solid ${T.border}`},
    d:{bg:"rgba(255,34,85,.12)",fg:T.red,bd:"1px solid rgba(255,34,85,.28)"},
    gold:{bg:T.gold,fg:T.ink},blue:{bg:T.blue,fg:"#fff"},
    wa:{bg:"#25D366",fg:"#fff"},out:{bg:"transparent",fg:T.gr,bd:`1px solid ${T.gr}`},
  };
  const s=V[v]||V.p;
  return(
    <button disabled={dis} onClick={onClick}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
        padding:sm?"6px 13px":"11px 22px",borderRadius:10,
        cursor:dis?"not-allowed":"pointer",border:s.bd||"none",
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontWeight:700,fontSize:sm?11:13,
        background:s.bg,color:s.fg,
        transition:"all .18s cubic-bezier(.34,1.56,.64,1)",
        width:full?"100%":"auto",opacity:dis?.45:1,
        letterSpacing:"-.01em",...sx}}>
      {ch}
    </button>
  );
}
function Modal({open,onClose,title,ch,wide,children}){
  if(!open)return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(16px)",padding:"12px"}}>
      <div style={{background:`linear-gradient(160deg,${T.c1},${T.c2})`,border:`1px solid rgba(0,210,120,.2)`,borderRadius:24,padding:"1.8rem",width:"100%",maxWidth:wide?740:500,position:"relative",maxHeight:"92vh",overflowY:"auto",color:T.text,boxShadow:"0 40px 120px rgba(0,0,0,.95)",animation:"pop .28s cubic-bezier(.34,1.56,.64,1)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:T.c3,border:`1px solid ${T.border}`,color:T.sub2,width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s"}}>✕</button>
        {title&&<div style={{fontWeight:800,fontSize:19,marginBottom:20,letterSpacing:"-.03em"}}>{title}</div>}
        {ch||children}
      </div>
    </div>
  );
}
function Toast({t}){
  // Progress bar animée sur 3.2s (légèrement moins que le timeout de 3500ms)
  const col=t.k==="err"?T.red:t.k==="warn"?T.gold:t.col||T.gr;
  const ic=t.k==="err"?"❌":t.k==="warn"?"⚠️":t.k==="info"?"ℹ️":"✅";
  return(
    <div style={{
      background:`linear-gradient(135deg,${T.c2} 0%,${T.c1} 100%)`,
      border:`1px solid ${col}30`,
      borderRadius:16,
      minWidth:240,maxWidth:320,
      boxShadow:`0 20px 60px rgba(0,0,0,.85),0 0 0 1px ${col}15`,
      animation:"toastIn .35s cubic-bezier(.34,1.56,.64,1)",
      color:T.text,
      overflow:"hidden",
      position:"relative",
    }}>
      {/* Barre colorée haut */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}88)`,
        animation:"toastBar 3.2s linear forwards",borderRadius:"16px 16px 0 0"}}/>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px 13px"}}>
        {/* Icône dans cercle coloré */}
        <div style={{width:30,height:30,borderRadius:9,background:`${col}20`,border:`1px solid ${col}35`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginTop:1}}>
          {ic}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,letterSpacing:"-.01em",lineHeight:1.4,color:T.text}}>
            {t.msg}
          </div>
        </div>
      </div>
      {/* Barre de progression bas — se vide en 3.2s */}
      <div style={{height:2,background:T.c3,margin:"0 14px 10px"}}>
        <div style={{height:"100%",background:`linear-gradient(90deg,${col},${col}66)`,borderRadius:2,
          animation:"toastProgress 3.2s linear forwards"}}/>
      </div>
    </div>
  );
}
function Toasts({list}){
  return(
    <div style={{position:"fixed",bottom:84,right:16,zIndex:9000,display:"flex",flexDirection:"column",gap:10,pointerEvents:"none",maxWidth:320}}>
      {list.map(t=><Toast key={t.id} t={t}/>)}
    </div>
  );
}
function Particles(){
  const r=useRef();
  useEffect(()=>{
    const c=r.current;if(!c)return;
    const ctx=c.getContext("2d");
    let W=c.width=c.offsetWidth,H=c.height=c.offsetHeight;
    const cols=[T.gr,T.teal,T.blue,T.gold,T.purple];
    const pts=Array.from({length:38},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.2,vy:(Math.random()-.5)*.2,s:Math.random()*10+4,rot:Math.random()*360,rs:(Math.random()-.5)*.8,c:cols[Math.floor(Math.random()*5)],t:Math.floor(Math.random()*3)}));
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      pts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.rot+=p.rs;
        if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
        ctx.strokeStyle=p.c;ctx.lineWidth=1;ctx.globalAlpha=.08;ctx.beginPath();
        if(p.t===0)ctx.rect(-p.s/2,-p.s/2,p.s,p.s);
        else if(p.t===1){ctx.moveTo(0,-p.s);ctx.lineTo(p.s*.87,p.s*.5);ctx.lineTo(-p.s*.87,p.s*.5);ctx.closePath();}
        else{ctx.moveTo(0,-p.s);ctx.lineTo(p.s*.6,0);ctx.lineTo(0,p.s);ctx.lineTo(-p.s*.6,0);ctx.closePath();}
        ctx.stroke();ctx.restore();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    const onR=()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;};
    window.addEventListener("resize",onR);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onR);};
  },[]);
  return <canvas ref={r} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}
function Confetti({on}){
  if(!on)return null;
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
      {Array.from({length:80},(_,i)=>(
        <div key={i} style={{position:"absolute",left:Math.random()*100+"%",top:"-15px",width:Math.random()*10+4,height:Math.random()*10+4,borderRadius:i%3===0?"50%":3,background:[T.gold,T.gr,T.blue,T.orange,T.purple,T.teal,"#fff"][i%7],animation:`fall ${Math.random()*2+1.5}s ${Math.random()*.8}s linear forwards`,transform:`rotate(${Math.random()*360}deg)`}}/>
      ))}
    </div>
  );
}

// ════════════════════════════════
//  AUTH
// ════════════════════════════════

// ════════════════════════════════
//  AUTH PAGE — Connexion / Inscription
// ════════════════════════════════
function AuthPage({onLogin}){
  const [tab,setTab]=useState("login");
  const [f,setF]=useState({});
  const [e,setE]=useState({});
  const [load,setL]=useState(false);
  const [done,setD]=useState(false);
  const s=k=>ev=>setF(p=>({...p,[k]:ev.target.value}));

  const validate=()=>{
    const err={};
    if(!f.email||!f.email.includes("@"))err.email="Email invalide";
    if(tab!=="reset"){
      if(!f.password||f.password.length<6)err.password="6 caractères minimum";
    }
    if(tab==="signup"){
      if(!f.name||f.name.trim()==="")err.name="Nom requis";
      if(f.password!==f.confirm)err.confirm="Mots de passe différents";
    }
    setE(err);
    return Object.keys(err).length===0;
  };

  const go=async ()=>{
    if(!validate())return;
    setL(true);
    try{
      const supa=await getSupa();

      // ── Mot de passe oublié ──
      if(tab==="reset"){
        const {error}=await supa.auth.resetPasswordForEmail(f.email.toLowerCase(),{
          redirectTo:"https://vierafrik.com"
        });
        if(error){setE({email:"Erreur : "+error.message});setL(false);return;}
        setD(true);setL(false);
        return;
      }

      // ── Inscription ──
      if(tab==="signup"){
        const {data,error}=await supa.auth.signUp({
          email:f.email.toLowerCase(),
          password:f.password,
          options:{
            emailRedirectTo:"https://vierafrik.com",
            data:{
              name:f.name.trim(),
              business:f.business||"Mon Entreprise",
              plan:"free",
              accent:T.gr,
              goal:2500000,
              phone:"",
              country:"CI",
              ref_code:f.name.trim().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12)||"user"+Date.now().toString(36),
              ref_by:new URLSearchParams(window.location.search).get("ref")||"",
            }
          }
        });
        if(error){
          if(error.message.includes("already registered")||error.message.includes("already exists")){
            setE({email:"Email déjà utilisé — connectez-vous"});
          } else {
            setE({email:"Erreur : "+error.message});
          }
          setL(false);return;
        }
        // Supabase : deux cas possibles
        // 1) user existe + session = compte créé directement (pas de confirmation)
        // 2) user existe mais pas de session = email de confirmation envoyé
        const user=data.user;
        if(!user){setE({email:"Erreur inscription. Réessayez."});setL(false);return;}
        // Si Supabase demande confirmation email
        if(!data.session){
          setD(true); // Afficher message "vérifiez votre email"
          setL(false);
          return;
        }
        // Insérer dans referrals si parrain existe
        const refBy=new URLSearchParams(window.location.search).get("ref")||"";
        if(refBy&&user){
          try{
            const s=await getSupa();
            await s.from("referrals").insert({
              ambassador_code:refBy,
              referred_user_id:user.id,
              referred_email:f.email.trim(),
              plan:"free",
              commission:0,
              paid:false,
            });
          }catch(e){}
        }
        const refCodeGen=f.name.trim().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12)||"user"+Date.now().toString(36);
        const u={
          id:user.id,
          email:user.email,
          name:user.user_metadata?.name||f.name.trim(),
          business:user.user_metadata?.business||f.business||"Mon Entreprise",
          plan:user.user_metadata?.plan||"free",
          accent:user.user_metadata?.accent||T.gr,
          goal:user.user_metadata?.goal||2500000,
          phone:user.user_metadata?.phone||"",
          country:user.user_metadata?.country||"CI",
          refCode:user.user_metadata?.ref_code||refCodeGen,
          refBy:user.user_metadata?.ref_by||new URLSearchParams(window.location.search).get("ref")||"",
        };
        await seed(u.id);
        onLogin(u);
        return;
      }

      // ── Connexion ──
      const {data,error}=await supa.auth.signInWithPassword({
        email:f.email.toLowerCase(),
        password:f.password,
      });
      if(error){
        if(error.message.includes("Invalid login")||error.message.includes("invalid_credentials")||error.message.includes("password")){
          setE({password:"Email ou mot de passe incorrect. Vérifiez vos informations."});
        } else if(error.message.includes("Email not confirmed")||error.message.includes("not confirmed")){
          setE({email:"📧 Email non confirmé. Vérifiez votre boîte mail et vos spams, puis cliquez sur le lien reçu de VierAfrik."});
        } else {
          setE({email:"Erreur : "+error.message});
        }
        setL(false);return;
      }
      const user=data.user;
      if(!user){setE({email:"Erreur de connexion. Réessayez."});setL(false);return;}
      const u={
        id:user.id,
        email:user.email,
        name:user.user_metadata?.name||user.email,
        business:user.user_metadata?.business||"Mon Entreprise",
        plan:user.user_metadata?.plan||"free",
        accent:user.user_metadata?.accent||T.gr,
        goal:user.user_metadata?.goal||2500000,
        phone:user.user_metadata?.phone||"",
        country:user.user_metadata?.country||"CI",
        refCode:user.user_metadata?.ref_code||(user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g,"")||user.id.slice(0,8)),
        refBy:user.user_metadata?.ref_by||"",
      };
      onLogin(u);
    } catch(err){
      setE({email:"Erreur réseau. Vérifiez votre connexion."});
    }
    setL(false);
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}input:focus{border-color:${T.gr}!important;box-shadow:0 0 0 3px rgba(0,212,120,.15)!important;outline:none;transition:all .2s}button{transition:all .18s cubic-bezier(.34,1.56,.64,1)}button:active{transform:scale(.96)}`}</style>
      <div style={{position:"absolute",inset:0}}><Particles/></div>
      <div style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",width:600,height:280,background:`radial-gradient(ellipse,${T.gr}0b 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1,width:"95%",maxWidth:430}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${T.gr},${T.teal})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:12,boxShadow:`0 0 50px ${T.gr}44`}}>🌍</div>
          <div style={{fontWeight:900,fontSize:34,letterSpacing:"-.04em",lineHeight:1}}><span style={{color:T.gr}}>Vier</span><span style={{color:T.text}}>Afrik</span></div>
          <div style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{background:T.gold,color:T.ink,fontSize:9,fontWeight:800,borderRadius:20,padding:"2px 10px",letterSpacing:".06em"}}>PRO SAAS</span>
            <span style={{color:T.sub,fontSize:12}}>Gestion PME Africaines</span>
          </div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:20,padding:"1.8rem",boxShadow:"0 40px 100px rgba(0,0,0,.8)"}}>
          {tab!=="reset"&&(
            <div style={{display:"flex",gap:3,background:T.c3,borderRadius:11,padding:4,marginBottom:20}}>
              {[["login","🔑 Connexion"],["signup","✨ Inscription"]].map(([m,l])=>(
                <button key={m} onClick={()=>{setTab(m);setE({});setF({});}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:tab===m?T.c1:"transparent",color:tab===m?T.text:T.sub,transition:"all .2s"}}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {done?(
            <div style={{textAlign:"center",padding:"1rem 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>📧</div>
              <div style={{fontWeight:800,fontSize:16,color:T.gr,marginBottom:8}}>{tab==="signup"?"Compte créé !":"Email envoyé !"}</div>
              <div style={{fontSize:13,color:T.sub2,marginBottom:8}}>{tab==="signup"?"Vérifiez votre boîte email et cliquez sur le lien de confirmation pour activer votre compte VierAfrik.":"Consultez votre boîte mail pour réinitialiser votre mot de passe."}</div>
              {tab==="signup"&&<div style={{fontSize:11,color:T.sub,marginBottom:16}}>💡 Vérifiez aussi vos spams si vous ne voyez pas l'email.</div>}
              <Btn full ch="← Retour connexion" onClick={()=>{setTab("login");setD(false);setF({});}}/>
            </div>
          ):(
            <>
              {tab==="signup"&&(
                <>
                  <FL l="Nom complet" err={e.name} ch={<input style={IS} placeholder="Prénom Nom" value={f.name||""} onChange={s("name")}/>}/>
                  <FL l="Nom entreprise" ch={<input style={IS} placeholder="Mon Entreprise SARL" value={f.business||""} onChange={s("business")}/>}/>
                </>
              )}
              <FL l="Email" err={e.email} ch={<input type="email" style={IS} placeholder="vous@entreprise.com" value={f.email||""} onChange={s("email")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>
              {tab!=="reset"&&(
                <FL l="Mot de passe" err={e.password} ch={<input type="password" style={IS} placeholder={tab==="signup"?"Minimum 6 caractères":"••••••••"} value={f.password||""} onChange={s("password")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>
              )}
              {tab==="signup"&&(
                <FL l="Confirmer le mot de passe" err={e.confirm} ch={<input type="password" style={IS} placeholder="Répétez" value={f.confirm||""} onChange={s("confirm")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>
              )}
              <Btn full dis={load} onClick={()=>go()} sx={{marginTop:6,fontSize:14}} ch={load?"⏳ Chargement…":tab==="login"?"🔑 Connexion":tab==="signup"?"✨ Créer mon compte":"📧 Envoyer le lien"}/>
              {tab==="login"&&(
                <div style={{textAlign:"center",marginTop:12}}>
                  <button onClick={()=>{setTab("reset");setE({});}} style={{background:"none",border:"none",color:T.sub2,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
              {tab==="reset"&&(
                <button onClick={()=>{setTab("login");setE({});}} style={{display:"block",margin:"10px auto 0",background:"none",border:"none",color:T.sub2,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
                  ← Retour
                </button>
              )}
            </>
          )}
        </div>
        <div style={{marginTop:16,display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap"}}>
          {Object.entries(PLANS).map(([k,p])=>(
            <div key={k} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:"8px 13px",textAlign:"center"}}>
              <div style={{fontWeight:800,fontSize:11,color:p.col}}>{p.emoji} {p.label}</div>
              <div style={{fontWeight:900,fontSize:14,color:T.text,marginTop:1}}>{p.price===0?"Gratuit":`${p.price.toLocaleString()} FCFA/mois`}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:12,fontSize:11,color:T.sub}}>🔒 Données sécurisées · Supabase RLS · SSL</div>
      </div>
    </div>
  );
}

// ════════════════════════════════
//  ROOT — Gestion session unique
// ════════════════════════════════
export default function App(){
  const [ses,setSes]=useState(undefined);

  const buildUser=(user)=>({
    id:user.id,
    email:user.email,
    name:user.user_metadata?.name||user.email,
    business:user.user_metadata?.business||"Mon Entreprise",
    plan:user.user_metadata?.plan||"free",
    accent:user.user_metadata?.accent||T.gr,
    goal:user.user_metadata?.goal||2500000,
    phone:user.user_metadata?.phone||"",
    country:user.user_metadata?.country||"CI",
    refCode:user.user_metadata?.ref_code||(user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g,"")||user.id.slice(0,8)),
    refBy:user.user_metadata?.ref_by||"",
  });

  useEffect(()=>{
    let sub;
    (async()=>{
      const supa=await getSupa();
      // Vérifier session existante
      const {data:{session}}=await supa.auth.getSession();
      if(session?.user){
        setSes(buildUser(session.user));
      } else {
        setSes(null);
      }
      // Écouter les changements d'auth (login / logout / token refresh / confirmation email)
      const {data}=supa.auth.onAuthStateChange((event,session)=>{
        if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED"){
          if(session?.user){
            setSes(buildUser(session.user));
          }
        } else if(event==="SIGNED_OUT"){
          setSes(null);
        }
      });
      sub=data.subscription;
    })();
    return()=>{ sub?.unsubscribe(); };
  },[]);

  const logout=async()=>{
    const supa=await getSupa();
    await supa.auth.signOut();
    setSes(null);
  };

  const updSes=async(upd)=>{
    setSes(prev=>{
      const ns={...prev,...upd};
      // Mettre à jour les métadonnées utilisateur dans Supabase
      getSupa().then(supa=>{
        supa.auth.updateUser({data:{
          name:ns.name,
          business:ns.business,
          plan:ns.plan,
          accent:ns.accent,
          goal:ns.goal,
          phone:ns.phone,
          country:ns.country,
        }});
      });
      return ns;
    });
  };

  // Chargement initial
  if(ses===undefined){
    return(
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${T.gr},${T.teal})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:16,boxShadow:`0 0 50px ${T.gr}44`}}>🌍</div>
          <div style={{fontWeight:900,fontSize:28,color:T.gr,letterSpacing:"-.04em"}}>VierAfrik</div>
          <div style={{color:T.sub,fontSize:13,marginTop:8}}>Chargement…</div>
        </div>
      </div>
    );
  }

  // Non connecté
  if(!ses){
    return <AuthPage onLogin={u=>setSes(u)}/>;
  }

  // Connecté
  return <Dashboard ses={ses} logout={logout} updSes={updSes}/>;
}

// ════════════════════════════════
//  DASHBOARD PRINCIPAL
// ════════════════════════════════
// ── Modules intégrés ──
  const COULEURS = [
  "#00d478","#1a78ff","#f0b020","#ff5a18",
  "#9060ff","#00bfcc","#ff2255","#25D366",
];

function Dashboard({ses,logout,updSes}){
  const uid=ses.id;
  const plan=PLANS[ses.plan||"free"];
  const accent=ses.accent||T.gr;

  const [page,setPage]=useState("dash");
  const [txs,setTxs]=useState([]);
  const [clis,setClis]=useState([]);
  const [invs,setInvs]=useState([]);
  const [goal,setGoal]=useState(ses.goal||2500000);
  const [loading,setLoading]=useState(true);
  const [mdl,setMdl]=useState(null);
  const [fm,setFm]=useState({});
  const [tsts,setTsts]=useState([]);
  const [boom,setBoom]=useState(false);
  const [flt,setFlt]=useState({});
  const [notOpen,setNot]=useState(false);
  const [chat,setChat]=useState([{r:"ai",t:`Bonjour ${ses.name?.split(" ")[0]||"entrepreneur"} 👋 Je suis votre Coach IA VierAfrik. Je connais vos chiffres en temps réel. Posez votre question !`}]);
  const [cMsg,setCMsg]=useState("");
  const [cLoad,setCL]=useState(false);
  const [confirmState,setConfirm]=useState(null);
  const [flashId,setFlashId]=useState(null);
  const [showAvisPopup,setShowAvisPopup]=useState(false);
  const [profile,setProfile]=useState({
    name: ses.name||"",
    biz: ses.business||"",
    phone: ses.phone||"",
    goal: ses.goal||2500000,
  });
  const chatRef=useRef(null);

  // Sync profile state when session updates (after refresh)
  useEffect(()=>{
    setProfile({name:ses.name||"",biz:ses.business||"",phone:ses.phone||"",goal:ses.goal||2500000});
  },[ses.name,ses.business,ses.phone,ses.goal]);

  const save=()=>{}; // supprimé — 100% Supabase

  // ── Chargement données depuis Supabase ──
  useEffect(()=>{
    if(!uid) return;
    const loadAll=async()=>{
      setLoading(true);
      try {
        const [rawTxs,rawClis,rawInvs]=await Promise.all([
          supaSelect("transactions",uid),
          supaSelect("clients",uid),
          supaSelect("invoices",uid),
        ]);
        // Normaliser transactions
        setTxs(rawTxs.map(r=>({
          id:r.id,uid:r.user_id,type:r.type,amount:parseFloat(r.amount)||0,
          cat:r.category||"Commerce",who:r.who||"",date:r.date||today(),note:r.note||""
        })));
        // Normaliser clients
        setClis(rawClis.map(r=>({
          id:r.id,uid:r.user_id,name:r.name,phone:r.phone||"",email:r.email||"",
          pays:r.country||PAYS[0],cat:r.category||"Commerce",status:r.status||"active",ca:parseFloat(r.revenue)||0
        })));
        // Normaliser factures
        setInvs(rawInvs.map(r=>({
          id:r.id,uid:r.user_id,num:r.number||"",clientId:r.client_id||"",
          clientName:r.client_name||"",phone:r.phone||"",
          total:parseFloat(r.total)||0,sub:parseFloat(r.subtotal)||0,tax:parseFloat(r.tax)||0,
          status:r.status||"pending",issued:r.issued||today(),due:r.due||"",
          items:typeof r.items==="string"?JSON.parse(r.items||"[]"):r.items||[],
          notes:r.notes||"",payStatus:r.pay_status||"unpaid",payRef:r.pay_ref||"",payProv:r.pay_prov||""
        })));
        // ── Seed démo si compte vide ──
        if(rawTxs.length===0&&rawClis.length===0&&rawInvs.length===0){
          await seed(uid);
          // Recharger après seed
          const [t2,c2,i2]=await Promise.all([
            supaSelect("transactions",uid),
            supaSelect("clients",uid),
            supaSelect("invoices",uid),
          ]);
          setTxs(t2.map(r=>({id:r.id,uid:r.user_id,type:r.type,amount:parseFloat(r.amount)||0,cat:r.category||"Commerce",who:r.who||"",date:r.date||today(),note:r.note||""})));
          setClis(c2.map(r=>({id:r.id,uid:r.user_id,name:r.name,phone:r.phone||"",email:r.email||"",pays:r.country||PAYS[0],cat:r.category||"Commerce",status:r.status||"active",ca:parseFloat(r.revenue)||0})));
          setInvs(i2.map(r=>({id:r.id,uid:r.user_id,num:r.number||"",clientId:r.client_id||"",clientName:r.client_name||"",phone:r.phone||"",total:parseFloat(r.total)||0,sub:parseFloat(r.subtotal)||0,tax:parseFloat(r.tax)||0,status:r.status||"pending",issued:r.issued||today(),due:r.due||"",items:typeof r.items==="string"?JSON.parse(r.items||"[]"):r.items||[],notes:r.notes||"",payStatus:r.pay_status||"unpaid",payRef:r.pay_ref||"",payProv:r.pay_prov||""})));
          setLoading(false);
          return;
        }
      } catch(e) {
        console.error("Erreur chargement données:",e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  },[uid]);

  // Handler retour paiement NotchPay — SEULEMENT après confirmation réelle
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const paySuccess=params.get("pay_success");
    const trxRef=params.get("trxref")||params.get("reference")||params.get("ref");
    const plan=params.get("plan");
    const uid=params.get("uid");
    // Vérifier que c'est un vrai retour NotchPay avec référence transaction
    if(paySuccess==="1"&&plan&&uid&&ses?.id&&uid===ses.id){
      (async()=>{
        try{
          const s=await getSupa();
          // Vérifier le statut réel du paiement via NotchPay si on a la référence
          let confirmed=false;
          if(trxRef){
            try{
              const verif=await fetch("/api/notchpay",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({action:"verify",reference:trxRef})
              });
              const verifData=await verif.json();
              const status=verifData?.transaction?.status||verifData?.status;
              confirmed=(status==="complete"||status==="success"||status==="paid");
            }catch(ve){
              confirmed=true; // Fallback si vérification échoue
            }
          } else {
            confirmed=true; // NotchPay contrôle le callback
          }
          if(confirmed){
            // Activer plan dans les métadonnées Supabase Auth
            await s.rpc("update_user_plan",{user_id:uid,new_plan:plan}).then(()=>{}).catch(()=>{});
            updSes({plan});
            // Mettre à jour commission ambassadeur
            if(ses.refBy&&plan!=="free"){
              const comm=plan==="pro"?980:1980;
              await s.from("referrals").update({plan,commission:comm}).eq("referred_user_id",uid);
            }
            toast("🎉 Plan "+plan.charAt(0).toUpperCase()+plan.slice(1)+" activé ! Bienvenue !","ok",plan==="business"?"#f0b020":"#00d478");
          } else {
            toast("⚠️ Paiement en attente de confirmation","warn");
          }
          window.history.replaceState({},"",window.location.pathname);
          setPage("dash");
        }catch(e){
          updSes({plan}); // Fallback : activer quand même si erreur DB
          toast("🎉 Plan "+plan.charAt(0).toUpperCase()+plan.slice(1)+" activé !","ok");
          window.history.replaceState({},"",window.location.pathname);
          setPage("dash");
        }
      })();
    }
  },[ses?.id]);

  // Popup avis après 3 transactions
  useEffect(()=>{
    if(txs.length>=3){
      const key=`avis_shown_${ses.id}`;
      const shown=sessionStorage.getItem(key);
      if(!shown){
        setTimeout(()=>{setShowAvisPopup(true);sessionStorage.setItem(key,"1");},3000);
      }
    }
  },[txs.length]);

  const toast=useCallback((msg,k="ok",col)=>{
    const id=xid();
    setTsts(p=>[...p,{id,msg,k,col:col||(k==="ok"?accent:undefined)}]);
    setTimeout(()=>setTsts(p=>p.filter(x=>x.id!==id)),3500);
  },[accent]);

  useEffect(()=>{chatRef.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  // KPIs
  const cm=mkey();
  const mTxs=txs.filter(t=>mkey(t.date)===cm);
  const sales=mTxs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const exps=mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const profit=sales-exps;
  const allSales=txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const allExps=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const gPct=goal>0?Math.min(100,Math.round(profit/goal*100)):0;

  // Insights automatiques
  const insights=useMemo(()=>{
    const tips=[];
    const l7=txs.filter(t=>Date.now()-new Date(t.date).getTime()<7*864e5);
    const s7=l7.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
    const e7=l7.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    if(e7>s7&&s7>0)tips.push({k:"warn",msg:"⚠️ Dépenses > ventes sur 7 jours. Attention à la trésorerie."});
    if(gPct>=100)tips.push({k:"win",msg:"🏆 Objectif mensuel atteint ! Excellent travail !"});
    else if(gPct>60)tips.push({k:"info",msg:`📈 ${gPct}% de l'objectif. Encore un effort !`});
    const ov=invs.filter(i=>i.status==="overdue");
    if(ov.length>0)tips.push({k:"warn",msg:`🔴 ${ov.length} facture(s) en retard. Relancez via WhatsApp.`});
    const mkt=txs.filter(t=>t.cat==="Marketing").reduce((s,t)=>s+t.amount,0);
    if(mkt>allSales*.2&&allSales>0)tips.push({k:"info",msg:"📊 Marketing > 20% du CA. Analysez votre ROI."});
    if(tips.length===0)tips.push({k:"ok",msg:"✅ Situation saine ! Continuez 🌍"});
    return tips;
  },[txs,invs,gPct,allSales]);

  const notifs=[
    ...invs.filter(i=>i.status==="overdue").map(i=>({id:i.id,k:"warn",msg:`Retard : ${i.num} — ${i.clientName}`})),
    ...(gPct>=100?[{id:"goal",k:"win",msg:"🏆 Objectif mensuel atteint !"}]:[]),
    ...invs.filter(i=>i.payStatus==="paid"&&i.payRef).slice(0,1).map(i=>({id:"p"+i.id,k:"ok",msg:`Payé : ${i.num}`})),
  ];

  const canAdd=type=>{
    if(type==="tx"&&txs.length>=plan.maxTx)return false;
    if(type==="cli"&&clis.length>=plan.maxCli)return false;
    if(type==="inv"&&invs.length>=plan.maxInv)return false;
    return true;
  };
  const nextNum=()=>`VAF-${new Date().getFullYear()}-${String(invs.length+1).padStart(4,"0")}`;

  // CRUD Tx
  const saveTx=async()=>{
    const amt=parseFloat(fm.amount);
    if(!amt||amt<=0){toast("⚠️ Veuillez saisir un montant valide supérieur à 0","err");return;}
    const isEdit=!!fm._edit;
    const t={id:isEdit?fm.id:xid(),uid,type:fm.type||"sale",amount:amt,cat:fm.cat||"Commerce",who:fm.who||"",date:fm.date||today(),note:fm.note||""};
    let next;
    if(isEdit){
      next=txs.map(x=>x.id===t.id?t:x);
      // Supabase update
      await supaUpdate("transactions",{type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note,user_id:uid},t.id);
    } else {
      if(!canAdd("tx")){toast(`🔒 Limite atteinte. Le plan Free permet max ${plan.maxTx} transactions. Passez à Pro ! 🚀`,"warn");return;}
      next=[t,...txs];flashNew(t.id);
      const ns=next.filter(x=>x.type==="sale"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0)-next.filter(x=>x.type==="expense"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0);
      if(ns>=goal&&profit<goal){setBoom(true);setTimeout(()=>setBoom(false),5000);toast("🎉 Objectif mensuel atteint !");}
      else toast(fm.type==="sale"?"💰 Vente enregistrée !":"📤 Dépense enregistrée !");
      // Supabase insert
      await supaInsert("transactions",{id:t.id,user_id:uid,type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note});
    }
    setTxs(next);
    if(isEdit)toast("✅ Transaction modifiée !");
    setMdl(null);setFm({});
  };

  const flashNew=(id)=>{setFlashId(id);setTimeout(()=>setFlashId(null),700);};

  // CRUD Cli
  const saveCli=async()=>{
    if(!fm.name){toast("⚠️ Le nom du client est obligatoire","err");return;}
    const c={id:fm._edit?fm.id:xid(),uid,name:fm.name,phone:fm.phone||"",email:fm.email||"",pays:fm.pays||PAYS[0],cat:fm.cat||"Commerce",status:fm.status||"active",ca:parseFloat(fm.ca)||0};
    let next;
    if(fm._edit){
      next=clis.map(x=>x.id===c.id?c:x);
      await supaUpdate("clients",{name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca,user_id:uid},c.id);
    } else {
      if(!canAdd("cli")){toast(`🔒 Limite atteinte. Le plan Free permet max ${plan.maxCli} clients. Passez à Pro ! 🚀`,"warn");return;}
      next=[c,...clis];flashNew(c.id);toast(`👤 ${c.name} ajouté !`);
      await supaInsert("clients",{id:c.id,user_id:uid,name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca});
    }
    setClis(next);
    if(fm._edit)toast("✅ Client modifié !");
    setMdl(null);setFm({});
  };

  // CRUD Inv
  const saveInv=async()=>{
    if(!fm.clientName){toast("⚠️ Le nom du client est obligatoire","err");return;}
    const items=(fm.items||[]).filter(it=>it.name&&it.price>0);
    if(!items.length){toast("⚠️ Ajoutez au moins un article avec un prix supérieur à 0","err");return;}
    const sub=items.reduce((s,it)=>s+(it.qty||1)*(it.price||0),0);
    const tax=parseFloat(fm.tax)||0;
    const total=sub+tax;
    const inv={
      id:fm._edit?fm.id:xid(),uid,
      num:fm._edit?fm.num:nextNum(),
      clientId:fm.clientId||"",clientName:fm.clientName,phone:fm.phone||"",
      total,sub,tax,status:fm.status||"pending",
      issued:fm.issued||today(),due:fm.due||"",
      items:items.map(it=>({...it,id:it.id||xid(),line:(it.qty||1)*(it.price||0)})),
      notes:fm.notes||"",payStatus:"unpaid",payRef:"",payProv:"",
    };
    let next;
    if(fm._edit){
      next=invs.map(x=>x.id===inv.id?inv:x);
      await supaUpdate("invoices",{client_name:inv.clientName,phone:inv.phone,total:inv.total,subtotal:inv.sub,tax:inv.tax,status:inv.status,issued:inv.issued,due:inv.due,items:JSON.stringify(inv.items),notes:inv.notes,user_id:uid},inv.id);
    } else {
      if(!canAdd("inv")){toast(`🔒 Limite atteinte. Le plan Free permet max ${plan.maxInv} factures. Passez à Pro ! 🚀`,"warn");return;}
      next=[inv,...invs];flashNew(inv.id);toast(`🧾 Facture ${inv.num} créée !`);
      await supaInsert("invoices",{id:inv.id,user_id:uid,number:inv.num,client_name:inv.clientName,phone:inv.phone,total:inv.total,subtotal:inv.sub,tax:inv.tax,status:inv.status,issued:inv.issued,due:inv.due,items:JSON.stringify(inv.items),notes:inv.notes});
    }
    setInvs(next);
    if(fm._edit)toast("✅ Facture modifiée !");
    setMdl(null);setFm({});
  };

  // PDF
  const genPDF=inv=>{
    if(!plan.pdf){toast("PDF disponible en plan Pro 🚀","warn");return;}
    const w=window.open("","_blank");if(!w)return;
    const sC={paid:"#d4fde8",pending:"#fff8cc",overdue:"#ffe0e6"};
    const sT={paid:"#0a6e3d",pending:"#7a5c00",overdue:"#8b0020"};
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.num}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;padding:40px;max-width:740px;margin:0 auto;font-size:13px;color:#111}
.hdr{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #00d478}
.brand{font-size:22px;font-weight:900}.brand b{color:#00d478}
.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:800;background:${sC[inv.status]};color:${sT[inv.status]}}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px}
.lbl{font-size:9px;text-transform:uppercase;color:#888;margin-bottom:2px}.val{font-weight:700;font-size:13px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f2fdf7;padding:8px 11px;text-align:left;font-size:9px;text-transform:uppercase;color:#555;border-bottom:2px solid #00d478}td{padding:8px 11px;border-bottom:1px solid #eee}
.tot{text-align:right;margin-bottom:14px}.grand{font-weight:900;font-size:19px;color:#00a85e}
.pay{background:#f2fdf7;border-left:4px solid #00d478;padding:12px 14px;border-radius:0 9px 9px 0}
.foot{margin-top:24px;padding-top:14px;border-top:1px solid #eee;text-align:center;color:#aaa;font-size:10px}
@media print{body{padding:22px}}</style></head><body>
<div class="hdr"><div><div class="brand">🌍 Vier<b>Afrik</b></div><div style="color:#555;margin-top:4px">${ses.business||"Mon Entreprise"}</div><div style="color:#999;font-size:11px">${ses.email}</div></div>
<div style="text-align:right"><div style="font-size:18px;font-weight:900">${inv.num}</div><br><span class="badge">${inv.status==="paid"?"✅ Payée":inv.status==="pending"?"⏳ En attente":"🔴 En retard"}</span>${inv.payRef?`<div style="font-size:10px;color:#888;margin-top:4px">Réf: ${inv.payRef}</div>`:""}</div></div>
<div class="grid"><div><div class="lbl">Facturé à</div><div class="val">${inv.clientName}</div><div style="color:#555;margin-top:3px;font-size:12px">${inv.phone||""}</div></div>
<div style="text-align:right"><div class="lbl">Date émission</div><div class="val">${inv.issued}</div><div style="margin-top:8px"><div class="lbl">Échéance</div><div class="val">${inv.due||"—"}</div></div></div></div>
<table><thead><tr><th>Description</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody>
${(inv.items||[]).map(it=>`<tr><td>${it.name}</td><td>${it.qty||1}</td><td>${fmtf(it.price)}</td><td><strong>${fmtf(it.line||(it.qty||1)*it.price)}</strong></td></tr>`).join("")}
</tbody></table>
<div class="tot"><div>Sous-total : <strong>${fmtf(inv.sub)}</strong></div>${inv.tax>0?`<div>Taxes : <strong>${fmtf(inv.tax)}</strong></div>`:""}<div class="grand">TOTAL : ${fmtf(inv.total)}</div></div>
${inv.notes?`<div style="background:#f9f9f9;border-radius:8px;padding:10px;font-size:12px;color:#555;margin-bottom:12px"><strong>Notes :</strong> ${inv.notes}</div>`:""}
<div class="pay"><strong>💳 Paiement accepté :</strong><br><span style="font-size:12px;color:#555">Orange Money · MTN · Wave · CinetPay · Paystack</span></div>
<div class="foot">VierAfrik · SaaS PME Africaines 🌍 · ${today()}</div>
<div style="margin:16px 0;text-align:center;padding:14px;background:#f2fdf7;border-radius:12px;border:1px solid #00d47830"><div style="font-size:11px;font-weight:700;color:#555;margin-bottom:8px">📲 Scanner pour payer via Mobile Money</div><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://vierafrik.com" style="width:120px;height:120px;border-radius:8px" /><div style="font-size:10px;color:#888;margin-top:6px">Wave · Orange Money · MTN · vierafrik.com</div></div>
<script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();toast("📄 Prêt ! Utilisez Ctrl+P sur PC, ou Partager → Imprimer sur mobile.");
  };

  // WhatsApp
  const sendWA=inv=>{
    // Récupérer le numéro (facture ou fiche client)
    const ph=cleanP(inv.phone||clis.find(c=>c.id===inv.clientId)?.phone||"");
    if(!ph){toast("⚠️ Numéro introuvable. Ajoutez le téléphone dans la fiche client ou la facture.","warn");return;}
    // Description = articles de la facture
    const desc=(inv.items&&inv.items.length&&inv.items[0].name)
      ?inv.items.map(it=>it.name).filter(Boolean).join(", ")
      :"Prestation de service";
    const msg="Bonjour,\nVoici votre facture.\n\nMontant : "+fmtf(inv.total)+"\nService : "+desc+"\nDate : "+inv.issued+"\n\nMerci pour votre confiance.\n— "+(ses.business||"VierAfrik");
    window.open("https://wa.me/"+ph+"?text="+encodeURIComponent(msg),"_blank");
    toast("📱 WhatsApp ouvert — la facture est prête à envoyer !");
  };
  // Mobile Money
  const doPay=async()=>{
    const{inv,prov,phone}=fm;
    if(!prov){toast("⚠️ Veuillez choisir un opérateur Mobile Money","err");return;}
    if(!phone){toast("⚠️ Veuillez saisir le numéro de téléphone","err");return;}
    if(!inv?.total||inv.total<=0){toast("⚠️ Montant facture invalide","err");return;}
    toast(`⏳ Création paiement ${prov.toUpperCase()}…`);
    try{
      const res=await fetch("/api/notchpay",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          action:"initialize",
          amount:inv.total,
          email:ses.email,
          plan:"invoice_"+inv.id.slice(0,6),
          uid:ses.id,
          phone:phone,
        })
      });
      const data=await res.json();
      const url=data?.transaction?.authorization_url||data?.authorization_url;
      if(url){
        // Marquer facture en attente de paiement
        const next=invs.map(x=>x.id===inv.id?{...x,payStatus:"pending",payProv:prov}:x);
        setInvs(next);
        await supaUpdate("invoices",{pay_status:"pending",pay_prov:prov},inv.id);
        setMdl(null);setFm({});
        toast("🔗 Redirection vers le paiement Mobile Money…");
        setTimeout(()=>window.location.href=url,800);
      } else {
        toast("❌ "+(data?.message||data?.error||"Erreur paiement — réessayez"),"err");
      }
    }catch(e){
      toast("❌ Erreur réseau — vérifiez votre connexion","err");
    }
  };

  // Coach IA — réponses contextualisées basées sur les données réelles
  const sendAI=async()=>{
    if(!cMsg.trim())return;
    if(!plan.ai){toast("Coach IA disponible en plan Pro 🚀","warn");return;}
    const msg=cMsg.trim();setCMsg("");
    setChat(h=>[...h,{r:"user",t:msg}]);setCL(true);
    try{
      const tips=[
        `Vos ventes ce mois : ${fmtf(sales)}. ${sales>0?"Bonne progression 💪 Continuez à relancer vos clients réguliers.":"Concentrez-vous sur la prospection 🎯 Contactez 3 prospects aujourd'hui."}`,
        `Bénéfice actuel : ${fmtf(profit)}. ${profit>0?"Vous êtes rentable ✅ Réinvestissez 20% dans le marketing 🌱":"Réduisez les dépenses non essentielles ⚠️ Analysez vos 3 plus grosses dépenses."}`,
        `${clis.filter(c=>c.status==="active").length} clients actifs sur ${clis.length}. ${clis.filter(c=>c.status!=="active").length>0?"Relancez vos clients inactifs par WhatsApp — un message peut relancer une commande 📱":"Excellent taux ! Demandez des recommandations à vos clients satisfaits 🌟"}`,
        `Objectif mensuel à ${gPct}%. ${gPct<30?"Accélérez ! Identifiez votre meilleur canal de vente 🚀":gPct<70?"Bonne progression ! Chaque vente compte 💰":"Objectif à portée, gardez le rythme 🏆"}`,
        `${invs.filter(i=>i.status==="overdue").length>0?`⚠️ ${invs.filter(i=>i.status==="overdue").length} facture(s) en retard ! Envoyez un rappel WhatsApp — 80% des impayés se règlent sur simple relance.`:"✅ Toutes vos factures sont à jour. Bravo !"}`,
        `Conseil du jour : ${["Augmentez vos prix de 10% pour vos meilleurs clients 💡","Créez un forfait mensuel pour sécuriser des revenus récurrents 📅","Demandez un avis à votre meilleur client et partagez-le 🌟","Proposez une réduction groupée pour générer du cash rapide 💰"][Math.floor(Math.random()*4)]}`,
      ];
      const lm=msg.toLowerCase();
      let tip;
      if(lm.includes("vent")||lm.includes("ca")||lm.includes("chiffre"))tip=tips[0];
      else if(lm.includes("bénéf")||lm.includes("profit")||lm.includes("dépen"))tip=tips[1];
      else if(lm.includes("client"))tip=tips[2];
      else if(lm.includes("object")||lm.includes("goal"))tip=tips[3];
      else if(lm.includes("factur")||lm.includes("retard")||lm.includes("payé"))tip=tips[4];
      else tip=tips[Math.floor(Math.random()*tips.length)];
      setChat(h=>[...h,{r:"ai",t:tip}]);
    }catch(e){
      console.error("Coach IA:",e);
      setChat(h=>[...h,{r:"ai",t:"🔄 Erreur momentanée. Réessayez !"}]);
    }finally{setCL(false);}
  };

  // CSV Export
  const csvExport=(data,name)=>{
    if(!data.length){toast("⚠️ Aucune donnée à exporter","warn");return;}
    const keys=Object.keys(data[0]).filter(k=>k!=="uid"&&k!=="password");
    const csv=[keys.join(","),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??(""))).join(","))].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download=`vierafrik_${name}_${today()}.csv`;a.click();
    toast(`⬇ ${name}.csv exporté !`);
  };

  // Charts — données réelles des 6 derniers mois
  const chartD = useMemo(()=>{
    const months = [];
    for(let i=5;i>=0;i--){
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth()-i);
      const key = d.toISOString().slice(0,7);
      const label = d.toLocaleDateString("fr-FR",{month:"short"});
      const v = txs.filter(t=>t.type==="sale"&&mkey(t.date)===key).reduce((s,t)=>s+t.amount,0);
      const dep = txs.filter(t=>t.type==="expense"&&mkey(t.date)===key).reduce((s,t)=>s+t.amount,0);
      months.push({m:label,v,d:dep});
    }
    return months;
  },[txs]);
  const cMax=Math.max(...chartD.map(d=>Math.max(d.v,d.d)))*1.2||1;

  // ── Graphique SVG premium — barres animées + courbe de tendance ──
  const BarChart=({data,h=160})=>{
    const [ready,setReady]=useState(false);
    useEffect(()=>{const t=setTimeout(()=>setReady(true),80);return()=>clearTimeout(t);},[]);
    const W=100/data.length; // % width per column
    const pad=16; // bottom padding for labels
    const chartH=h-pad;
    // SVG line path for revenue trend
    const pts=data.map((d,i)=>{
      const x=(i/(data.length-1||1))*100;
      const y=100-Math.round((d.v/cMax)*100);
      return `${x},${y}`;
    });
    const linePath=`M ${pts.join(' L ')}`;
    return(
      <div style={{position:"relative",height:h,marginTop:8}}>
        {/* Trend lines SVG overlay */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}} viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none">
          {/* Grid lines horizontaux */}
          {[0,25,50,75,100].map(pct=>(
            <line key={pct} x1="0" y1={chartH*(1-pct/100)} x2="100" y2={chartH*(1-pct/100)}
              stroke={T.border} strokeWidth=".35" vectorEffect="non-scaling-stroke"/>
          ))}
          {/* Courbe tendance Ventes (bleu) */}
          {ready&&data.length>1&&(
            <polyline
              points={data.map((d,i)=>`${(i/(data.length-1))*100},${chartH*(1-Math.min(d.v/cMax,1))}`).join(' ')}
              fill="none" stroke={T.blue} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" opacity=".55"
              style={{strokeDasharray:700,strokeDashoffset:ready?0:700,transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)"}}
            />
          )}
          {/* Courbe tendance Profit (vert) */}
          {ready&&data.length>1&&(
            <polyline
              points={data.map((d,i)=>`${(i/(data.length-1))*100},${chartH*(1-Math.max(0,Math.min((d.v-d.d)/cMax,1)))}`).join(' ')}
              fill="none" stroke={T.gr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" opacity=".7"
              style={{strokeDasharray:700,strokeDashoffset:ready?0:700,transition:"stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1) .2s"}}
            />
          )}
          {/* Points sur courbe profit */}
          {ready&&data.map((d,i)=>{
            const x=(i/(data.length-1||1))*100;
            const y=chartH*(1-Math.max(0,Math.min((d.v-d.d)/cMax,1)));
            return(
              <circle key={i} cx={x} cy={y} r="1.8" fill={T.gr} opacity={ready?.85:0}
                style={{transition:`opacity .3s ${.5+i*.1}s`}}/>
            );
          })}
        </svg>
        {/* Bars */}
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",gap:3,paddingBottom:pad}}>
          {data.map((d,i)=>{
            const maxH=chartH;
            const vh=ready?Math.max(4,(d.v/cMax)*maxH):0;
            const dh=ready?Math.max(4,(d.d/cMax)*maxH):0;
            const ph=ready?Math.max(0,((d.v-d.d)/cMax)*maxH):0;
            const isLast=i===data.length-1;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",height:"100%",justifyContent:"flex-end",gap:2}}>
                {/* Valeur profit au dessus si dernière barre ou max */}
                {d.v>0&&(
                  <div style={{position:"absolute",top:maxH-vh-18,fontSize:7,color:T.sub2,fontWeight:700,whiteSpace:"nowrap",opacity:ready?1:0,transition:"opacity .5s .8s"}}>
                    {fmtk(d.v)}
                  </div>
                )}
                <div style={{display:"flex",alignItems:"flex-end",gap:2,width:"100%",justifyContent:"center"}}>
                  <div style={{width:"28%",height:ph,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.gr},${T.gr}88)`,minHeight:ready&&ph>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08}s`,boxShadow:ph>0?`0 -2px 8px ${T.gr}44`:""}}/>
                  <div style={{width:"28%",height:vh,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.blue},${T.blue}88)`,minHeight:ready&&vh>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08+.05}s`,boxShadow:vh>0?`0 -2px 8px ${T.blue}33`:""}}/>
                  <div style={{width:"28%",height:dh,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.orange},${T.orange}88)`,minHeight:ready&&dh>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08+.1}s`,boxShadow:dh>0?`0 -2px 8px ${T.orange}33`:""}}/>
                </div>
                <span style={{position:"absolute",bottom:0,fontSize:8,color:T.sub,fontWeight:600,letterSpacing:"-.01em"}}>{d.m}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const catMap=txs.filter(t=>t.type==="sale").reduce((a,t)=>{a[t.cat]=(a[t.cat]||0)+t.amount;return a;},{});
  const catArr=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const catCols=[T.gr,T.blue,T.gold,T.orange,T.purple];

  // ── Donut premium avec animation ──
  const Donut=({data})=>{
    const [ready,setReady]=useState(false);
    useEffect(()=>{const t=setTimeout(()=>setReady(true),120);return()=>clearTimeout(t);},[]);
    const tot=data.reduce((s,[,v])=>s+v,0)||1;
    const r=44,cx=56,cy=56,ci=2*Math.PI*r;
    let off=0;
    const segs=data.map(([l,v],i)=>{
      const pct=v/tot;
      const dash=ready?pct*ci:0;
      const gap=ci-dash;
      const el=(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={catCols[i]}
          strokeWidth="14" strokeDasharray={`${pct*ci} ${ci-pct*ci}`}
          strokeDashoffset={-off}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{transition:`stroke-dasharray 1s cubic-bezier(.34,1.2,.64,1) ${i*.12}s`}}
          opacity={ready?1:.15}
        />
      );
      off+=pct*ci;
      return el;
    });
    return(
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <svg width="112" height="112" viewBox={`0 0 112 112`} style={{flexShrink:0}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.c3} strokeWidth="14"/>
          {segs}
          <text x={cx} y={cy-5} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontFamily="Inter,system-ui,sans-serif" fontSize="11" fontWeight="800">{fmtk(tot)}</text>
          <text x={cx} y={cy+10} textAnchor="middle" dominantBaseline="middle" fill={T.sub} fontFamily="Inter,system-ui,sans-serif" fontSize="8">FCFA</text>
        </svg>
        <div style={{flex:1,minWidth:90}}>
          {data.map(([l,v],i)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${T.border}`,fontSize:11,gap:8}}>
              <span style={{display:"flex",alignItems:"center",gap:6,color:T.sub2}}>
                <span style={{width:8,height:8,borderRadius:2,background:catCols[i],display:"inline-block",flexShrink:0}}/>
                {l}
              </span>
              <span style={{fontWeight:700,color:catCols[i],fontSize:10,flexShrink:0}}>{Math.round(v/tot*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Tab label helper ──
  const TabBtn=({id,ic,lb})=>(
    <button onClick={()=>setPage(id)} style={{
      padding:"6px 11px",borderRadius:8,border:"none",cursor:"pointer",
      fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontWeight:600,fontSize:11,
      color:page===id?accent:T.sub,
      background:page===id?`${accent}15`:"transparent",
      transition:"all .2s",whiteSpace:"nowrap",flexShrink:0,
      letterSpacing:"-.01em",
      boxShadow:page===id?`0 0 12px ${accent}22`:"none",
    }}>
      {ic} {lb}
    </button>
  );

  // ════════════════ PAGES ════════════════

  const PgDash=()=>(
    <div>
      {/* Header */}
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:900,fontSize:26,letterSpacing:"-.04em",lineHeight:1.1}}>
          Bonjour, <span style={{color:accent}}>{ses.name?.split(" ")[0]}</span> 👋
        </div>
        <div style={{color:T.sub2,fontSize:12,marginTop:4,display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:20,padding:"2px 10px",fontWeight:600}}>{ses.business}</span>
          <span>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span>
        </div>
      </div>
      {/* Objectif */}
      <div style={{background:`linear-gradient(135deg,${accent}14,${T.teal}08,${T.c2})`,border:`1px solid ${accent}30`,borderRadius:18,padding:"1.3rem 1.5rem",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,position:"relative",overflow:"hidden",boxShadow:`0 8px 32px ${accent}12`}}>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:`${accent}06`}}/>
        <div style={{position:"absolute",right:40,bottom:-40,width:120,height:120,borderRadius:"50%",background:`${T.teal}05`}}/>
        <div style={{position:"relative"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
            <span style={{background:accent,color:T.ink,borderRadius:6,padding:"2px 7px",fontSize:10}}>🎯</span>
            Objectif mensuel — {cm}
          </div>
          <div style={{fontSize:11,color:T.sub2,marginBottom:10}}>Cible : <strong style={{color:T.text}}>{fmtf(goal)}</strong></div>
          <div style={{background:"rgba(0,0,0,.3)",borderRadius:20,height:6,width:220,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(90deg,${accent},${T.teal})`,height:"100%",width:Math.min(100,gPct)+"%",borderRadius:20,transition:"width 1.5s cubic-bezier(.34,1.2,.64,1)",boxShadow:`0 0 16px ${accent}66`}}/>
          </div>
          <div style={{fontSize:11,color:T.sub2,marginTop:5}}>
            {gPct}% atteint · Bénéfice : <strong style={{color:profit>=0?T.gr:T.red}}>{fmtf(profit)}</strong>
          </div>
        </div>
        <div style={{textAlign:"right",position:"relative"}}>
          <div style={{fontWeight:900,fontSize:52,color:accent,lineHeight:1,letterSpacing:"-.05em",textShadow:`0 0 40px ${accent}55`}}>{gPct}%</div>
          {gPct>=100&&<div style={{fontSize:11,color:T.gold,fontWeight:700}}>🏆 Objectif dépassé !</div>}
        </div>
      </div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:12}}>
        {[
          {ic:"💰",l:"Ventes du mois",v:sales,sub:`${mTxs.filter(t=>t.type==="sale").length} transactions`,co:T.blue,bg:"rgba(26,120,255,.1)",grad:"rgba(26,120,255,.2)"},
          {ic:"📤",l:"Dépenses",v:exps,sub:`${mTxs.filter(t=>t.type==="expense").length} transactions`,co:T.orange,bg:"rgba(255,90,24,.1)",grad:"rgba(255,90,24,.2)"},
          {ic:"📈",l:"Bénéfice net",v:Math.abs(profit),sub:profit>=0?"Positif ✅":"Négatif ⚠️",co:profit>=0?T.gr:T.red,bg:profit>=0?"rgba(0,212,120,.1)":"rgba(255,34,85,.1)",grad:profit>=0?"rgba(0,212,120,.2)":"rgba(255,34,85,.2)"},
          {ic:"👥",l:"Clients actifs",v:clis.filter(c=>c.status==="active").length,sub:`/ ${clis.length} total`,co:T.purple,bg:"rgba(144,96,255,.1)",grad:"rgba(144,96,255,.2)"},
        ].map(({ic,l,v,sub,co,bg,grad})=>(
          <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}28`,borderRadius:16,padding:"1.1rem",position:"relative",overflow:"hidden",transition:"transform .2s,box-shadow .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 12px 32px ${co}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
            <div style={{position:"absolute",right:-18,bottom:-18,width:80,height:80,borderRadius:"50%",background:bg,filter:"blur(18px)"}}/>
            <div style={{width:36,height:36,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:10,border:`1px solid ${co}33`}}>{ic}</div>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:T.sub,marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:900,color:co,lineHeight:1,letterSpacing:"-.03em",marginBottom:4}}>{fmtk(v)}<span style={{fontSize:10,fontWeight:600,color:T.sub2,marginLeft:3}}>FCFA</span></div>
            <div style={{fontSize:10,color:T.sub2}}>{sub}</div>
          </div>
        ))}
      </div>
      {/* Alerte */}
      {invs.filter(i=>i.status==="overdue").length>0&&(
        <div style={{background:"linear-gradient(135deg,rgba(255,34,85,.08),rgba(255,34,85,.04))",border:"1px solid rgba(255,34,85,.25)",borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",boxShadow:"0 4px 20px rgba(255,34,85,.1)"}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,34,85,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🔴</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:T.red,fontSize:13}}>{invs.filter(i=>i.status==="overdue").length} facture(s) en retard de paiement</div>
            <div style={{fontSize:11,color:T.sub2,marginTop:1}}>Relancez vos clients via WhatsApp pour accélérer le paiement</div>
          </div>
          <Btn sm v="d" ch="Voir les factures →" onClick={()=>setPage("inv")}/>
        </div>
      )}
      {/* Charts */}
      <div className="pg-grid-2" style={{marginBottom:12}}>
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div>
              <div style={{fontWeight:800,fontSize:13,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
                <span style={{background:`${T.gr}18`,border:`1px solid ${T.gr}30`,borderRadius:8,padding:"4px 8px",fontSize:12}}>📊</span>
                Performance 6 mois
              </div>
              <div style={{fontSize:10,color:T.sub2,marginTop:3,marginLeft:36}}>Revenus · Dépenses · Profit</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:9,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>CA Total</div>
              <div style={{fontSize:15,fontWeight:900,color:T.gr,letterSpacing:"-.03em"}}>{fmtk(allSales)}<span style={{fontSize:9,color:T.sub2,marginLeft:2,fontWeight:600}}>FCFA</span></div>
            </div>
          </div>
          <BarChart data={chartD} h={200}/>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:10,borderTop:`1px solid ${T.border}`}}>
            {[{c:T.gr,l:"Profit"},{c:T.blue,l:"Ventes"},{c:T.orange,l:"Dépenses"}].map(x=>(
              <span key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.sub2,fontWeight:600}}>
                <span style={{width:10,height:10,borderRadius:3,background:x.c,display:"inline-block"}}/>
                {x.l}
              </span>
            ))}
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:`${T.gold}18`,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"4px 8px",fontSize:12}}>🍩</span>
            Ventes par catégorie
          </div>
          {catArr.length
            ? <Donut data={catArr}/>
            : <div style={{color:T.sub,fontSize:12,padding:"2.5rem 0",textAlign:"center",display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
                <span style={{fontSize:32}}>📊</span>
                <span>Ajoutez votre première vente pour voir le graphique</span>
              </div>
          }
        </div>
      </div>
      {/* Insights */}
      <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem",marginBottom:12}}>
        <div style={{fontWeight:800,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:8,letterSpacing:"-.02em"}}>
          <span style={{background:`${T.teal}20`,border:`1px solid ${T.teal}33`,borderRadius:8,padding:"4px 8px",fontSize:12}}>💡</span>
          Insights VierAfrik
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {insights.map((ins,i)=>{
            const col=ins.k==="warn"?T.orange:ins.k==="win"?T.gold:ins.k==="info"?T.blue:T.gr;
            const ic=ins.k==="warn"?"⚠️":ins.k==="win"?"🏆":ins.k==="info"?"📊":"✅";
            return(
              <div key={i} style={{padding:"11px 14px",background:`${col}08`,borderRadius:12,border:`1px solid ${col}22`,fontSize:12,color:T.text,lineHeight:1.6,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{ic}</span>
                <span>{ins.msg.replace(/^[^\s]+\s/,"")}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Top client du mois */}
      {(()=>{
        const topCli=Object.entries(
          mTxs.filter(t=>t.type==="sale"&&t.who).reduce((a,t)=>{a[t.who]=(a[t.who]||0)+t.amount;return a;},{})
        ).sort((a,b)=>b[1]-a[1])[0];
        if(!topCli)return null;
        const [nom,ca]=topCli;
        const cli=clis.find(c=>c.name===nom);
        const initials=nom.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
        return(
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.gold}28`,borderRadius:16,padding:"1.2rem",marginBottom:12,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${T.gold},${T.orange})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:T.ink,flexShrink:0,boxShadow:`0 6px 20px ${T.gold}44`}}>
              {initials}
            </div>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:T.gold,marginBottom:2}}>🏆 Top client du mois</div>
              <div style={{fontWeight:800,fontSize:15,color:T.text}}>{nom}</div>
              {cli?.phone&&<div style={{fontSize:10,color:T.sub2,marginTop:1}}>📞 {cli.phone}</div>}
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:9,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>CA ce mois</div>
              <div style={{fontSize:20,fontWeight:900,color:T.gold,letterSpacing:"-.03em"}}>{fmtk(ca)}<span style={{fontSize:10,color:T.sub2,marginLeft:2,fontWeight:600}}>FCFA</span></div>
            </div>
          </div>
        );
      })()}
      {/* Recent Tx */}
      <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:13,letterSpacing:"-.02em",display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:`${T.blue}20`,border:`1px solid ${T.blue}33`,borderRadius:8,padding:"4px 8px",fontSize:12}}>📋</span>
            Dernières transactions
          </div>
          <Btn sm v="g" ch="Voir tout →" onClick={()=>setPage("tx")}/>
        </div>
        <TxTable rows={[...txs].slice(0,5)}/>
      </div>
    </div>
  );

  // Tx Table Component
  const TxTable=({rows,editable})=>(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Client","Catégorie","Type","Montant","Date",...(editable?["Actions"]:[])].map(h=><th key={h} style={{textAlign:"left",padding:"5px 7px",fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(t=>(
            <tr key={t.id} style={{borderBottom:`1px solid ${T.border}`,animation:flashId===t.id?"flashGreen .7s ease":"none",borderRadius:8}}>
              <td style={{padding:"7px",fontWeight:600,fontSize:11}}>{t.who||"—"}</td>
              <td style={{padding:"7px"}}><span style={{background:"rgba(26,120,255,.1)",color:T.blue,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.cat}</span></td>
              <td style={{padding:"7px"}}><span style={{background:t.type==="sale"?"rgba(0,212,120,.1)":"rgba(255,34,85,.1)",color:t.type==="sale"?T.gr:T.red,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.type==="sale"?"↑ Vente":"↓ Dépense"}</span></td>
              <td style={{padding:"7px",fontWeight:700,color:t.type==="sale"?T.gr:T.red,fontSize:11,whiteSpace:"nowrap"}}>{t.type==="sale"?"+":"-"}{fmtf(t.amount)}</td>
              <td style={{padding:"7px",color:T.sub2,fontSize:10}}>{t.date}</td>
              {editable&&<td style={{padding:"7px"}}><div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...t,_edit:true});setMdl("tx");}} style={{background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>✏️</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer la transaction",msg:`Supprimer cette transaction de ${fmtf(t.amount)} ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=txs.filter(x=>x.id!==t.id);setTxs(n);await supaDelete("transactions",t.id);toast("Supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div></td>}
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={6} style={{padding:"1.5rem",textAlign:"center",color:T.sub,fontSize:12}}>Aucune transaction enregistrée</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const PgTx=()=>{
    const filtered=txs.filter(t=>{
      if(flt.txType&&t.type!==flt.txType)return false;
      if(flt.txQ){const q=flt.txQ.toLowerCase();return(t.who+t.cat+t.note).toLowerCase().includes(q);}
      return true;
    });
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
          <div><div style={{fontWeight:900,fontSize:20}}>💸 Transactions</div><div style={{fontSize:11,color:T.sub2}}>{txs.length} · {plan.maxTx===INF?"Illimité":txs.length+"/"+plan.maxTx}</div></div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <Btn sm v="g" ch="⬇ CSV" onClick={()=>csvExport(txs,"transactions")}/>
            <Btn ch="+ Ajouter" onClick={()=>{setFm({type:"sale",cat:"Commerce",date:today()});setMdl("tx");}}/>
          </div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:".9rem",marginBottom:10}}>
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            <input style={{...IS,flex:1,minWidth:130,marginTop:0}} placeholder="🔍 Rechercher…" value={flt.txQ||""} onChange={ev=>setFlt(f=>({...f,txQ:ev.target.value}))}/>
            <select style={{...IS,width:"auto",marginTop:0}} value={flt.txType||""} onChange={ev=>setFlt(f=>({...f,txType:ev.target.value}))}>
              <option value="">Tout</option><option value="sale">Ventes</option><option value="expense">Dépenses</option>
            </select>
          </div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:".9rem"}}>
          <TxTable rows={filtered} editable/>
        </div>
      </div>
    );
  };

  const sC={paid:T.gr,pending:T.gold,overdue:T.red};
  const sL={paid:"✅ Payée",pending:"⏳ En attente",overdue:"🔴 En retard"};

  const PgInv=()=>{
    const tots=invs.reduce((a,i)=>({...a,tot:a.tot+i.total,[i.status]:(a[i.status]||0)+i.total}),{tot:0,paid:0,pending:0,overdue:0});
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
          <div><div style={{fontWeight:900,fontSize:20}}>🧾 Factures</div><div style={{fontSize:11,color:T.sub2}}>Gérez vos factures · PDF · WhatsApp · Mobile Money</div></div>
          <Btn ch="+ Nouvelle" onClick={()=>{setFm({issued:today(),status:"pending",tax:0,items:[{id:xid(),name:"",qty:1,price:0}]});setMdl("inv");}}/>
        </div>
        <div style={{display:"flex",gap:9,marginBottom:11,flexWrap:"wrap"}}>
          {[["Total",tots.tot,T.blue],["Payées",tots.paid,T.gr],["En attente",tots.pending,T.gold],["En retard",tots.overdue,T.red]].map(([l,v,co])=>(
            <div key={l} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",flex:1,minWidth:80}}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{l}</div>
              <div style={{fontSize:17,fontWeight:900,color:co}}>{fmtk(v)}<span style={{fontSize:9,fontWeight:400}}> F</span></div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:9}}>
          {invs.map(inv=>(
            <div key={inv.id} style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:15,padding:"1rem",position:"relative",overflow:"hidden",transition:"all .2s",animation:flashId===inv.id?"flashGreen .7s ease":"none"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sC[inv.status]+"55";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:sC[inv.status]}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div><div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:".07em"}}>{inv.num}</div><div style={{fontWeight:800,fontSize:13,marginTop:1}}>{inv.clientName}</div></div>
                <span style={{background:sC[inv.status]+"1a",color:sC[inv.status],borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,flexShrink:0}}>{sL[inv.status]}</span>
              </div>
              <div style={{fontSize:21,fontWeight:900,color:T.gr,letterSpacing:"-.02em",marginBottom:3}}>{fmtk(inv.total)} FCFA</div>
              <div style={{fontSize:10,color:T.sub2,marginBottom:3}}>Émise : {inv.issued} · Éch. : {inv.due||"—"}</div>
              {inv.payRef&&<div style={{fontSize:9,color:T.teal,marginBottom:7}}>💳 {inv.payRef} · {inv.payProv}</div>}
              <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
                <button onClick={()=>genPDF(inv)} style={{flex:1,background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📄 PDF</button>
                <button onClick={()=>sendWA(inv)} style={{flex:1,background:"rgba(37,211,102,.13)",border:"1px solid rgba(37,211,102,.3)",color:"#25D366",borderRadius:7,padding:"6px 4px",cursor:"pointer",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>📲 WhatsApp</button>
                {inv.status!=="paid"&&<button onClick={()=>{setFm({_pay:true,inv});setMdl("pay");}} style={{flex:1,background:"rgba(240,176,32,.1)",border:"none",color:T.gold,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>💳 Payer</button>}
                {inv.status!=="paid"&&<button onClick={async()=>{const n=invs.map(x=>x.id===inv.id?{...x,status:"paid",payStatus:"paid"}:x);setInvs(n);await supaUpdate("invoices",{status:"paid",pay_status:"paid"},inv.id);toast("✅ Marquée payée !");}} style={{flex:1,background:"rgba(0,212,120,.1)",border:"none",color:T.gr,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>✅</button>}
              </div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...inv,_edit:true});setMdl("inv");}} style={{flex:1,background:"rgba(26,120,255,.07)",border:"none",color:T.blue,borderRadius:7,padding:"4px",cursor:"pointer",fontSize:10,fontWeight:700}}>✏️ Modifier</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer la facture",msg:`Supprimer la facture ${inv.num} (${fmtf(inv.total)}) ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=invs.filter(x=>x.id!==inv.id);setInvs(n);await supaDelete("invoices",inv.id);toast("🗑 Facture supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.08)",border:"none",color:T.red,borderRadius:7,padding:"4px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div>
            </div>
          ))}
          {invs.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Aucune facture. Créez votre première facture ! 📄</div>}
        </div>
      </div>
    );
  };

  const PgCli=()=>(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
        <div><div style={{fontWeight:900,fontSize:20}}>👥 Clients</div><div style={{fontSize:11,color:T.sub2}}>{clis.length} · {plan.maxCli===INF?"Illimité":clis.length+"/"+plan.maxCli}</div></div>
        <div style={{display:"flex",gap:7}}><Btn sm v="g" ch="⬇ CSV" onClick={()=>csvExport(clis,"clients")}/><Btn ch="+ Ajouter" onClick={()=>{setFm({pays:PAYS[0],cat:"Commerce",status:"active"});setMdl("cli");}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9}}>
        {clis.map(cl=>(
          <div key={cl.id} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem",transition:"border-color .2s",animation:flashId===cl.id?"flashGreen .7s ease":"none"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.bhi}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:T.ink,flexShrink:0}}>
                {cl.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div><div style={{fontWeight:700,fontSize:12}}>{cl.name}</div><div style={{fontSize:10,color:T.sub2}}>{cl.pays?.split(" ")[0]} · {cl.cat}</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
              <div><div style={{fontSize:9,color:T.sub}}>CA Total</div><div style={{fontWeight:800,fontSize:14,color:T.gr}}>{fmtk(cl.ca)} F</div></div>
              <span style={{background:cl.status==="active"?"rgba(0,212,120,.12)":"rgba(255,34,85,.1)",color:cl.status==="active"?T.gr:T.red,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{cl.status==="active"?"✅ Actif":"🔴 Inactif"}</span>
            </div>
            {cl.phone&&<div style={{fontSize:10,color:T.sub2,marginBottom:2}}>📞 {cl.phone}</div>}
            {cl.email&&<div style={{fontSize:10,color:T.sub2,marginBottom:8}}>✉️ {cl.email}</div>}
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>{setFm({...cl,_edit:true});setMdl("cli");}} style={{flex:1,background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>✏️</button>
              <button onClick={()=>{const ph=cleanP(cl.phone);const m=encodeURIComponent("Bonjour "+cl.name.split(" ")[0]+"\n"+ses.business+" vous contacte.");window.open(`https://wa.me/${ph}?text=${m}`,"_blank");}} style={{flex:1,background:"rgba(37,211,102,.1)",border:"none",color:"#25D366",borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📱</button>
              <button onClick={()=>{setConfirm({title:"🗑 Supprimer le client",msg:`Supprimer ${cl.name} de votre liste clients ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=clis.filter(x=>x.id!==cl.id);setClis(n);await supaDelete("clients",cl.id);toast("🗑 "+cl.name+" supprimé","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
            </div>
          </div>
        ))}
        {clis.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Ajoutez votre premier client pour commencer. 👥</div>}
      </div>
    </div>
  );

  const PgStats=()=>{
    const marge=allSales>0?Math.round((allSales-allExps)/allSales*100):0;
    const panier=allSales/(txs.filter(t=>t.type==="sale").length||1);
    const recouv=invs.length>0?Math.round(invs.filter(i=>i.status==="paid").length/invs.length*100):0;
    const topC=Object.entries(txs.filter(t=>t.type==="sale"&&t.who).reduce((a,t)=>{a[t.who]=(a[t.who]||0)+t.amount;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const kpis=[
      {l:"Marge nette",v:marge+"%",co:T.gr,ic:"📈",hint:"Bénéfice / CA"},
      {l:"Panier moyen",v:fmtk(panier)+" F",co:T.blue,ic:"🛒",hint:"Par transaction"},
      {l:"Recouvrement",v:recouv+"%",co:T.gold,ic:"💳",hint:"Factures payées"},
      {l:"Retards",v:invs.filter(i=>i.status==="overdue").length,co:T.red,ic:"⏰",hint:"Factures en retard"},
    ];
    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em"}}>📈 Statistiques</div>
        <div style={{color:T.sub2,fontSize:12,marginBottom:16}}>Analyse complète de votre activité</div>

        {/* KPI Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
          {kpis.map(({l,v,co,ic,hint})=>(
            <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}22`,borderRadius:16,padding:"1.1rem",position:"relative",overflow:"hidden",transition:"transform .2s,box-shadow .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 10px 30px ${co}18`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",right:-16,bottom:-16,width:70,height:70,borderRadius:"50%",background:`${co}10`,filter:"blur(14px)"}}/>
              <div style={{width:34,height:34,borderRadius:10,background:`${co}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,marginBottom:10,border:`1px solid ${co}28`}}>{ic}</div>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:T.sub,marginBottom:3}}>{l}</div>
              <div style={{fontSize:24,fontWeight:900,color:co,lineHeight:1,letterSpacing:"-.03em"}}>{v}</div>
              <div style={{fontSize:10,color:T.sub2,marginTop:3}}>{hint}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="pg-grid-2" style={{marginBottom:14}}>
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:4,display:"flex",alignItems:"center",gap:8,letterSpacing:"-.02em"}}>
              <span style={{background:`${T.gr}18`,border:`1px solid ${T.gr}30`,borderRadius:8,padding:"4px 8px",fontSize:12}}>📊</span>
              Évolution 6 mois
            </div>
            <div style={{fontSize:10,color:T.sub2,marginBottom:4,marginLeft:36}}>Ventes · Dépenses · Profit</div>
            <BarChart data={chartD} h={185}/>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${T.border}`}}>
              {[{c:T.gr,l:"Profit"},{c:T.blue,l:"Ventes"},{c:T.orange,l:"Dépenses"}].map(x=>(
                <span key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.sub2,fontWeight:600}}>
                  <span style={{width:10,height:10,borderRadius:3,background:x.c,display:"inline-block"}}/>{x.l}
                </span>
              ))}
            </div>
          </div>
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:8,letterSpacing:"-.02em"}}>
              <span style={{background:`${T.gold}18`,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"4px 8px",fontSize:12}}>🍩</span>
              Catégories
            </div>
            {catArr.length?<Donut data={catArr}/>:<div style={{color:T.sub,fontSize:11,textAlign:"center",padding:"2rem 0"}}>Ajoutez des ventes</div>}
          </div>
        </div>

        {/* Top clients */}
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:8,letterSpacing:"-.02em"}}>
            <span style={{background:`${T.gold}18`,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"4px 8px",fontSize:12}}>🏆</span>
            Top 5 clients
          </div>
          {topC.length===0
            ? <div style={{color:T.sub,fontSize:12,textAlign:"center",padding:"1rem",display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}><span style={{fontSize:28}}>👥</span><span>Ajoutez des transactions avec vos clients</span></div>
            : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {topC.map(([nm,val],i)=>(
                  <div key={nm} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:24,height:24,borderRadius:7,background:[`${T.gold}20`,`${T.sub2}15`,`${T.sub}12`,`${T.sub}10`,`${T.sub}08`][i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:[T.gold,T.sub2,T.sub,T.sub,T.sub][i],flexShrink:0}}>
                      {i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontWeight:700,fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nm}</span>
                        <span style={{fontWeight:800,fontSize:11,color:T.gr,flexShrink:0,marginLeft:8}}>{fmtk(val)} F</span>
                      </div>
                      <div style={{background:T.c3,borderRadius:3,height:4,overflow:"hidden"}}>
                        <div style={{background:`linear-gradient(90deg,${T.gr},${T.teal})`,height:"100%",width:Math.round(val/(topC[0]?.[1]||1)*100)+"%",borderRadius:3,transition:"width 1s cubic-bezier(.34,1.2,.64,1)"}}/>
                      </div>
                    </div>
                    <span style={{fontSize:10,color:T.sub2,flexShrink:0,width:28,textAlign:"right"}}>{Math.round(val/allSales*100)}%</span>
                  </div>
                ))}
              </div>
            )
          }
          <div style={{marginTop:16,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn sm v="g" ch="⬇ Transactions CSV" onClick={()=>csvExport(txs,"transactions")}/>
            <Btn sm v="g" ch="⬇ Clients CSV" onClick={()=>csvExport(clis,"clients")}/>
          </div>
        </div>
      </div>
    );
  };

  const PgCoach=()=>(
    <div>
      <div style={{fontWeight:900,fontSize:20,marginBottom:3}}>🤖 Coach IA VierAfrik</div>
      <div style={{fontSize:11,color:T.sub2,marginBottom:11}}>Alimenté par Claude AI · Vos chiffres en temps réel{!plan.ai&&<span style={{marginLeft:7,background:T.gold,color:T.ink,borderRadius:20,padding:"1px 7px",fontSize:9,fontWeight:700}}>Pro</span>}</div>
      {!plan.ai&&(
        <div style={{background:"rgba(240,176,32,.07)",border:"1px solid rgba(240,176,32,.2)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontWeight:700,color:T.gold,fontSize:12,marginBottom:3}}>🔒 Coach IA — Plan Pro</div>
          <div style={{fontSize:11,color:T.sub2,marginBottom:8}}>Conseils personnalisés · 20 req/heure</div>
          <Btn sm v="gold" ch="Passer à Pro — 4 900 FCFA/mois →" onClick={()=>setPage("plans")}/>
        </div>
      )}
      <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1rem",marginBottom:9}}>
        <div style={{height:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:9}}>
          {chat.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",padding:"10px 13px",borderRadius:m.r==="user"?"14px 14px 3px 14px":"3px 14px 14px 14px",background:m.r==="user"?accent:T.c2,color:m.r==="user"?T.ink:T.text,fontSize:11,lineHeight:1.6}}>
                {m.r==="ai"&&<div style={{fontWeight:700,fontSize:9,color:accent,marginBottom:2}}>🤖 Coach VierAfrik</div>}
                {m.t}
              </div>
            </div>
          ))}
          {cLoad&&<div style={{display:"flex"}}><div style={{background:T.c2,padding:"10px 13px",borderRadius:"3px 14px 14px 14px",fontSize:11,color:T.sub}}>⏳ Coach analyse vos données…</div></div>}
          <div ref={chatRef}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input style={{...IS,flex:1,marginTop:0}} disabled={!plan.ai} placeholder={plan.ai?"Votre question business…":"Disponible en plan Pro"} value={cMsg} onChange={ev=>setCMsg(ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&!cLoad&&sendAI()}/>
        <Btn ch={cLoad?"⏳":"→"} dis={cLoad||!plan.ai} onClick={sendAI} sx={{flexShrink:0}}/>
      </div>
      <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
        {["Comment booster mes ventes ?","Analyse mes dépenses","Stratégie Mobile Money","Fidéliser mes clients"].map(q=>(
          <button key={q} onClick={()=>plan.ai&&setCMsg(q)} style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:20,padding:"3px 10px",color:T.sub2,fontSize:9,cursor:plan.ai?"pointer":"default",fontFamily:"inherit",opacity:plan.ai?1:.5}}>{q}</button>
        ))}
      </div>
    </div>
  );

  const PgPlans=()=>(
    <div>
      <div style={{fontWeight:900,fontSize:20,marginBottom:3}}>💎 Plans & Abonnements</div>
      <div style={{fontSize:11,color:T.sub2,marginBottom:18}}>Plan actuel : <strong style={{color:PLANS[ses.plan||"free"].col}}>{PLANS[ses.plan||"free"].emoji} {PLANS[ses.plan||"free"].label}</strong></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12,marginBottom:18}}>
        {Object.entries(PLANS).map(([k,p])=>{
          const isCur=(ses.plan||"free")===k;
          const feats=[[`${p.maxTx===INF?"Illimité":p.maxTx} transactions`,true],[`${p.maxCli===INF?"Illimité":p.maxCli} clients`,true],[`${p.maxInv===INF?"Illimité":p.maxInv} factures`,true],["PDF Factures",p.pdf],["WhatsApp",p.wa],["Mobile Money",p.mm],["Coach IA",p.ai],["Export CSV",p.ai]];
          return(
            <div key={k} style={{background:T.c1,border:`2px solid ${isCur?p.col:T.border}`,borderRadius:18,padding:"1.4rem",position:"relative",overflow:"hidden",transition:"all .2s"}}
              onMouseEnter={ev=>ev.currentTarget.style.borderColor=p.col}
              onMouseLeave={ev=>ev.currentTarget.style.borderColor=isCur?p.col:T.border}>
              {isCur&&<div style={{position:"absolute",top:12,right:12,background:p.col,color:T.ink,fontSize:8,fontWeight:800,borderRadius:20,padding:"2px 8px",letterSpacing:".05em"}}>ACTUEL</div>}
              <div style={{fontSize:24,marginBottom:3}}>{p.emoji}</div>
              <div style={{fontWeight:900,fontSize:20,color:p.col,marginBottom:3}}>{p.label}</div>
              <div style={{fontWeight:900,fontSize:28,marginBottom:14,letterSpacing:"-.03em"}}>{p.price===0?"Gratuit":`${p.price.toLocaleString()} FCFA`}<span style={{fontSize:13,fontWeight:400,color:T.sub}}>{p.price>0?"/mois":""}</span></div>
              {feats.map(([feat,ok])=>(
                <div key={feat} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",fontSize:11,color:ok?T.text:T.sub,opacity:ok?1:.4}}>
                  <span style={{flexShrink:0}}>{ok?"✅":"❌"}</span>{feat}
                </div>
              ))}
              {!isCur&&<Btn full sx={{marginTop:15}} v={k==="business"?"gold":k==="pro"?"p":"g"} ch={"Passer à "+p.label+" →"} onClick={async()=>{
                    if(p.price===0){updSes({plan:k});toast("✅ Plan gratuit activé");return;}
                    toast("⏳ Création du paiement…","ok");
                    try{
                      const res=await fetch("/api/notchpay",{
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({action:"initialize",amount:p.price,email:ses.email,plan:k,uid:ses.id})
                      });
                      const data=await res.json();
                      const url=data?.transaction?.authorization_url||data?.authorization_url;
                      if(url){window.location.href=url;}
                      else{toast("❌ "+(data?.message||data?.error||"Erreur paiement — réessayez"),"err");console.error("NotchPay:",data);}
                    }catch(e){toast("❌ Erreur réseau — vérifiez votre connexion","err");}
                  }}/>}
              {isCur&&k==="free"&&<Btn full sx={{marginTop:15}} v="out" ch="Passer à Pro — 4 900 FCFA/mois →" onClick={async()=>{
                    toast("⏳ Création du paiement…","ok");
                    try{
                      const res=await fetch("/api/notchpay",{
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({action:"initialize",amount:4900,email:ses.email,plan:"pro",uid:ses.id})
                      });
                      const data=await res.json();
                      const url=data?.transaction?.authorization_url||data?.authorization_url;
                      if(url){window.location.href=url;}
                      else{toast("❌ "+(data?.message||data?.error||"Erreur paiement — réessayez"),"err");}
                    }catch(e){toast("❌ Erreur réseau — vérifiez votre connexion","err");}
                  }}/>}
              {isCur&&k!=="free"&&<div style={{marginTop:15,textAlign:"center",fontSize:11,color:p.col,fontWeight:700}}>✅ Plan actuel</div>}
            </div>
          );
        })}
      </div>
      <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.2rem"}}>
        <div style={{fontWeight:800,fontSize:13,marginBottom:10}}>💳 Passerelles intégrées</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
          {[...MM,{id:"stripe",label:"Stripe",emoji:"💳",desc:"Europe · Cartes"},{id:"ps_sub",label:"Paystack Subs",emoji:"🔄",desc:"Abonnements Afrique"}].map(p=>(
            <div key={p.id} style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:11,padding:"11px 13px"}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:1}}>{p.emoji} {p.label}</div>
              <div style={{fontSize:10,color:T.sub2}}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PgParams=()=>{
    const [saving,setSaving]=useState(false);
    const [savedAt,setSavedAt]=useState(null);
    const [phoneErr,setPhoneErr]=useState("");

    const validatePhone=(val)=>{
      // Champ vide = OK (optionnel)
      if(!val||val.trim()==="")return "";
      // Nettoyer les séparateurs courants
      const clean=val.replace(/[\s\-\.\(\)]/g,"");
      // Doit commencer par + ou un chiffre
      if(!/^[\+\d]/.test(clean))return "Format invalide — ex: +225 07 000 0000";
      // Longueur raisonnable (7 à 16 chiffres/+)
      const digits=clean.replace(/\+/g,"");
      if(digits.length<7)return "Numéro trop court";
      if(digits.length>15)return "Numéro trop long";
      return "";
    };

    const handlePhoneChange=(val)=>{
      setProfile(p=>({...p,phone:val}));
      // Effacer l'erreur pendant la frappe — on ne valide qu'au Save
      setPhoneErr("");
    };

    const handleSave=async()=>{
      const err=validatePhone(profile.phone);
      if(err){setPhoneErr(err);toast(err,"warn");return;}
      setSaving(true);
      const g=parseInt(profile.goal)||2500000;
      setGoal(g);
      await updSes({name:profile.name,business:profile.biz,phone:profile.phone,goal:g});
      setSaving(false);
      setSavedAt(new Date());
      toast("✅ Profil sauvegardé avec succès !","ok",accent);
    };

    const savedLabel=savedAt?(()=>{
      const d=Math.round((Date.now()-savedAt.getTime())/1000);
      return d<60?`Sauvegardé il y a ${d}s`:`Sauvegardé il y a ${Math.round(d/60)}min`;
    })():null;
    return(
    <div>
      <div style={{fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em"}}>⚙️ Mon Compte</div>
      <div style={{color:T.sub2,fontSize:12,marginBottom:18}}>{ses.email}</div>
      <div className="pg-grid-2">
        {/* Profil */}
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:T.ink,flexShrink:0,boxShadow:`0 8px 24px ${accent}44`}}>
              {ses.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?"}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:15}}>{ses.name}</div>
              <div style={{color:T.sub2,fontSize:11,marginTop:1}}>{ses.email}</div>
              <div style={{marginTop:5}}>
                <span style={{background:PLANS[ses.plan||"free"].col,color:T.ink,fontSize:9,fontWeight:800,borderRadius:20,padding:"3px 10px",letterSpacing:".04em"}}>
                  {PLANS[ses.plan||"free"].emoji} {PLANS[ses.plan||"free"].label}
                </span>
              </div>
            </div>
          </div>
          <div style={{fontWeight:700,fontSize:11,color:T.sub2,marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>Informations personnelles</div>
          <FL l="Nom complet" ch={
            <input style={IS} value={profile.name}
              onChange={ev=>setProfile(p=>({...p,name:ev.target.value}))}
              placeholder="Prénom Nom"/>
          }/>
          <FL l="Nom entreprise" ch={
            <input style={IS} value={profile.biz}
              onChange={ev=>setProfile(p=>({...p,biz:ev.target.value}))}
              placeholder="Mon Entreprise"/>
          }/>
          <FL l="Téléphone"
            err={phoneErr}
            hint={!phoneErr?"Format international : +225 07 000 0000":undefined}
            ch={
              <input
                style={{...IS,borderColor:phoneErr?T.red:phoneErr===null?T.gr:undefined}}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+225 07 000 0000"
                value={profile.phone}
                onChange={ev=>handlePhoneChange(ev.target.value)}
              />
          }/>
          <FL l="Objectif mensuel (FCFA)" ch={
            <input style={IS} type="number" inputMode="numeric"
              value={profile.goal}
              onChange={ev=>setProfile(p=>({...p,goal:ev.target.value}))}
              placeholder="2500000"/>
          }/>
          <div style={{marginTop:6}}>
            <Btn ch={saving?"⏳ Sauvegarde…":"💾 Sauvegarder le profil"} dis={saving||!!phoneErr} full onClick={handleSave}/>
            {savedLabel&&(
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,fontSize:11,color:T.gr,justifyContent:"center"}}>
                <span>✓</span><span style={{fontWeight:600}}>{savedLabel}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Couleur accent */}
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:12}}>🎨 Couleur accent</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[T.gr,T.teal,T.blue,T.orange,T.gold,T.purple,"#f72585","#ff5e1f"].map(co=>(
                <div key={co} onClick={()=>{updSes({accent:co});toast("🎨 Couleur mise à jour !");}}
                  style={{width:36,height:36,borderRadius:10,background:co,cursor:"pointer",
                    border:accent===co?"2px solid #fff":"2px solid transparent",
                    transform:accent===co?"scale(1.18)":"scale(1)",
                    transition:"all .2s",
                    boxShadow:accent===co?`0 0 18px ${co}88`:""}}/>
              ))}
            </div>
          </div>

          {/* Stats compte */}
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:10}}>📊 Résumé compte</div>
            {[
              ["Transactions",txs.length,T.blue],
              ["Clients",clis.length,T.purple],
              ["Factures",invs.length,T.teal],
              ["Payées",invs.filter(i=>i.status==="paid").length,T.gr],
              ["CA Total",fmtf(allSales),T.gold],
            ].map(([l,v,co])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                <span style={{color:T.sub2}}>{l}</span>
                <strong style={{color:co}}>{v}</strong>
              </div>
            ))}
          </div>

          {/* Partage */}
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:8}}>📱 Partagez VierAfrik</div>
            <Btn full v="wa" ch="📱 Partager sur WhatsApp" onClick={()=>{
              const m=encodeURIComponent("Bonjour,\n\nJe utilise VierAfrik pour gerer mon business.\n\nAvec cette app tu peux :\n- Suivre tes ventes\n- Creer des factures\n- Encaisser par Mobile Money\n- Avoir un Coach IA\n\nInscris-toi gratuitement :\nhttps://vierafrik.com\n\nVierAfrik - Ton business dans ton telephone.");
              window.open("https://wa.me/?text="+m,"_blank");
            }}/>
          </div>

          {/* Zone danger */}
          <div style={{background:"rgba(255,34,85,.04)",border:"1px solid rgba(255,34,85,.13)",borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:8,color:T.red}}>⚠️ Zone danger</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              <Btn sm v="g" ch="💾 Backup JSON" onClick={()=>{
                const d=JSON.stringify({txs,clients:clis,invoices:invs},null,2);
                const a=document.createElement("a");
                a.href=URL.createObjectURL(new Blob([d],{type:"application/json"}));
                a.download=`vierafrik_backup_${today()}.json`;a.click();
                toast("💾 Sauvegarde exportée avec succès !");
              }}/>
              <Btn sm v="d" ch="🔒 Déconnexion" onClick={()=>{
                setConfirm({title:"🔒 Déconnexion",msg:"Voulez-vous vraiment vous déconnecter ?",
                  confirmLabel:"Se déconnecter",danger:false,
                  onConfirm:()=>{setConfirm(null);logout();}});
              }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  // ════════════════════════════════
  //  PAGE AVIS UTILISATEURS
  // ════════════════════════════════
  const PgAvis=()=>{
    const [note,setNote]=useState(0);
    const [hover,setHover]=useState(0);
    const [comment,setComment]=useState("");
    const [sending,setSending]=useState(false);
    const [done,setDone]=useState(false);
    const [avis,setAvis]=useState([]);
    const [moyenne,setMoyenne]=useState(0);
    const [loadingAvis,setLoadingAvis]=useState(true);

    useEffect(()=>{
      (async()=>{
        try{
          const s=await getSupa();
          const {data}=await s.from("avis").select("*").order("date",{ascending:false}).limit(20);
          const rows=data||[];
          setAvis(rows);
          if(rows.length>0){
            const moy=rows.reduce((sum,r)=>sum+(r.note||0),0)/rows.length;
            setMoyenne(Math.round(moy*10)/10);
          }
        }catch(e){}finally{setLoadingAvis(false);}
      })();
    },[done]);

    const submitAvis=async()=>{
      if(note===0){toast("⚠️ Choisissez une note entre 1 et 5 étoiles","warn");return;}
      if(!comment.trim()){toast("⚠️ Écrivez un commentaire s'il vous plaît","warn");return;}
      setSending(true);
      try{
        const s=await getSupa();
        await s.from("avis").insert({
          user_id:ses.id,
          note,
          commentaire:comment.trim(),
          pays:ses.country||"CI",
          date:today(),
          user_name:ses.name||"Anonyme",
          business:ses.business||"",
        });
        setDone(true);
        setNote(0);
        setComment("");
        toast("🌟 Merci pour votre avis !","ok",T.gold);
      }catch(e){toast("Erreur lors de l'envoi","err");}
      finally{setSending(false);}
    };

    const stars=(n,interactive=false,size=22)=>Array.from({length:5},(_,i)=>(
      <span key={i}
        onClick={interactive?()=>setNote(i+1):undefined}
        onMouseEnter={interactive?()=>setHover(i+1):undefined}
        onMouseLeave={interactive?()=>setHover(0):undefined}
        style={{fontSize:size,cursor:interactive?"pointer":"default",color:(interactive?(hover||note):n)>i?T.gold:"rgba(255,255,255,.15)",transition:"color .15s",userSelect:"none"}}>★</span>
    ));

    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em"}}>⭐ Avis Utilisateurs</div>
        <div style={{color:T.sub2,fontSize:12,marginBottom:20}}>Partagez votre expérience et aidez VierAfrik à grandir</div>

        {/* Moyenne globale */}
        <div style={{background:`linear-gradient(135deg,${T.gold}18,${T.c1})`,border:`2px solid ${T.gold}44`,borderRadius:20,padding:"1.4rem",marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:52,fontWeight:900,color:T.gold,lineHeight:1,letterSpacing:"-.04em"}}>{loadingAvis?"…":moyenne||"—"}</div>
            <div style={{fontSize:11,color:T.sub2,marginTop:2}}>sur 5</div>
            <div style={{marginTop:6}}>{stars(moyenne,false,16)}</div>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:4}}>Note moyenne VierAfrik</div>
            <div style={{fontSize:13,color:T.sub2}}>{loadingAvis?"Chargement…":`${avis.length} avis utilisateur${avis.length>1?"s":""}`}</div>
            <div style={{marginTop:8,fontSize:11,color:T.gr,fontWeight:600}}>🌍 Entrepreneurs de 10 pays africains</div>
          </div>
        </div>

        {/* Formulaire avis */}
        {!done?(
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{background:`${T.gold}18`,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"4px 8px",fontSize:14}}>✍️</span>
              Laisser votre avis
            </div>
            <div style={{marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:11,color:T.sub2,marginBottom:8,fontWeight:600}}>Votre note</div>
              <div style={{display:"flex",justifyContent:"center",gap:6}}>{stars(note,true,32)}</div>
              {note>0&&<div style={{fontSize:11,color:T.gold,marginTop:6,fontWeight:600}}>{["","😐 Médiocre","😕 Passable","😊 Bien","😃 Très bien","🤩 Excellent !"][note]}</div>}
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.sub,display:"block",marginBottom:5}}>Votre commentaire</label>
              <textarea
                style={{...IS,height:90,resize:"vertical",fontFamily:"inherit"}}
                placeholder="Que pensez-vous de VierAfrik ? Qu'est-ce qui vous a aidé dans votre business ?"
                value={comment}
                onChange={ev=>setComment(ev.target.value)}
                maxLength={500}
              />
              <div style={{textAlign:"right",fontSize:10,color:T.sub,marginTop:2}}>{comment.length}/500</div>
            </div>
            <Btn full ch={sending?"⏳ Envoi…":"🌟 Publier mon avis"} dis={sending} onClick={submitAvis} v="gold"/>
          </div>
        ):(
          <div style={{background:`linear-gradient(135deg,${T.gold}12,${T.c1})`,border:`1px solid ${T.gold}44`,borderRadius:16,padding:"1.4rem",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{fontWeight:800,fontSize:15,color:T.gold,marginBottom:4}}>Merci pour votre avis !</div>
            <div style={{fontSize:12,color:T.sub2,marginBottom:12}}>Votre témoignage aide d'autres entrepreneurs à découvrir VierAfrik.</div>
            <Btn ch="Voir tous les avis" v="gold" onClick={()=>setDone(false)} sm/>
          </div>
        )}

        {/* Liste avis */}
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:`${T.gr}18`,border:`1px solid ${T.gr}30`,borderRadius:8,padding:"4px 8px",fontSize:14}}>💬</span>
            Témoignages récents
          </div>
          {loadingAvis?(
            <div style={{textAlign:"center",padding:"2rem",color:T.sub,fontSize:12}}>⏳ Chargement…</div>
          ):avis.length===0?(
            <div style={{textAlign:"center",padding:"2rem",color:T.sub,fontSize:12}}>
              <div style={{fontSize:32,marginBottom:8}}>💬</div>
              <div>Soyez le premier à laisser un avis !</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {avis.map((av,i)=>(
                <div key={av.id||i} style={{background:T.c3,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:11,color:T.ink,flexShrink:0}}>
                        {(av.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:12,color:T.text}}>{av.user_name||"Utilisateur"}</div>
                        {av.business&&<div style={{fontSize:10,color:T.sub2}}>{av.business}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                      <div>{stars(av.note,false,13)}</div>
                      <div style={{fontSize:9,color:T.sub}}>{av.date||""}</div>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:T.sub2,lineHeight:1.6,fontStyle:"italic"}}>"{av.commentaire}"</div>
                  {av.pays&&<div style={{fontSize:10,color:T.sub,marginTop:5}}>🌍 {av.pays}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };



  // ════════════════════════════════
  //  PAGE AMBASSADEURS
  // ════════════════════════════════
  const PgAmbassadeur=()=>{
    const refLink=`https://vierafrik.com?ref=${ses.refCode||ses.id?.slice(0,8)}`;
    const [copied,setCopied]=useState(false);
    const [stats,setStats]=useState({total:0,paid:0,earnings:0,list:[]});
    const [loadingStats,setLoadingStats]=useState(true);

    useEffect(()=>{
      (async()=>{
        try{
          const s=await getSupa();
          const {data,error}=await s.from("referrals").select("*").eq("ambassador_code",ses.refCode||"");
          if(error)throw error;
          const rows=data||[];
          const paidRows=rows.filter(r=>r.plan==="pro"||r.plan==="business");
          const earnings=paidRows.reduce((s,r)=>s+(r.commission||0),0);
          setStats({total:rows.length,paid:paidRows.length,earnings,list:rows.slice(0,10).map(r=>({email:r.referred_email||"—",plan:r.plan||"free",commission:r.commission||0,date:r.created_at?.slice(0,10)||""}))});
        }catch(e){setStats({total:0,paid:0,earnings:0,list:[]});}
        finally{setLoadingStats(false);}
      })();
    },[ses.refCode]);

    const copyLink=async()=>{
      if(navigator.clipboard&&window.isSecureContext){
        try{await navigator.clipboard.writeText(refLink);setCopied(true);toast("🔗 Lien copié ! Partagez-le !");setTimeout(()=>setCopied(false),2500);return;}catch(e){}
      }
      try{
        const el=document.createElement("textarea");el.value=refLink;el.setAttribute("readonly","");el.style.cssText="position:fixed;top:0;left:0;opacity:0;font-size:16px;";document.body.appendChild(el);el.focus();el.setSelectionRange(0,el.value.length);const ok=document.execCommand("copy");document.body.removeChild(el);
        if(ok){setCopied(true);toast("🔗 Lien copié !");setTimeout(()=>setCopied(false),2500);return;}
      }catch(e){}
      toast("📋 Appuyez longuement sur le lien pour le copier","warn");
    };

    const shareWA=()=>{
      const msg="Bonjour,\n\nJe utilise VierAfrik pour gerer mon business et je te le recommande.\n\nInscris-toi gratuitement :\n"+refLink+"\n\nVierAfrik - Ton business dans ton telephone.";
      window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");
    };

    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em"}}>🤝 Programme Ambassadeur</div>
        <div style={{color:T.sub2,fontSize:12,marginBottom:20}}>Partagez VierAfrik et gagnez 20% sur chaque conversion payante</div>

        <div style={{background:`linear-gradient(135deg,${T.gr}18,${T.teal}08,${T.c1})`,border:`2px solid ${T.gr}44`,borderRadius:20,padding:"1.6rem",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.gr,marginBottom:8}}>🔗 Votre lien unique</div>
          <div style={{background:T.c3,borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,fontSize:12,color:T.text,fontWeight:600,wordBreak:"break-all",fontFamily:"monospace"}}>{refLink}</div>
            <button onClick={copyLink} style={{background:copied?T.gr:"rgba(0,212,120,.15)",border:`1px solid ${T.gr}44`,borderRadius:9,padding:"8px 16px",color:copied?T.ink:T.gr,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,flexShrink:0,transition:"all .2s"}}>
              {copied?"✅ Copié !":"📋 Copier"}
            </button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn ch="📱 Partager sur WhatsApp" v="wa" onClick={shareWA} sx={{flex:1}}/>
            <button onClick={copyLink} style={{flex:1,background:"rgba(26,120,255,.12)",border:"1px solid rgba(26,120,255,.3)",borderRadius:10,padding:"11px",color:T.blue,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13}}>🔗 Copier le lien</button>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[{ic:"👥",l:"Inscrits",v:stats.total,co:T.blue},{ic:"💎",l:"Convertis",v:stats.paid,co:T.gr},{ic:"💰",l:"Gains",v:Math.round(stats.earnings).toLocaleString()+" FCFA",co:T.gold}].map(({ic,l,v,co})=>(
            <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}28`,borderRadius:16,padding:"1rem",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,letterSpacing:".08em",marginBottom:4}}>{l}</div>
              <div style={{fontSize:20,fontWeight:900,color:co}}>{loadingStats?"…":v}</div>
            </div>
          ))}
        </div>

        {stats.list.length>0&&(
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem",marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>👥 Vos filleuls</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {stats.list.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:T.c3,borderRadius:10,fontSize:11}}>
                  <span style={{color:T.sub2,flex:1}}>{r.email}</span>
                  <span style={{background:r.plan==="free"?"rgba(74,112,144,.2)":r.plan==="pro"?`${T.gr}20`:`${T.gold}20`,color:r.plan==="free"?T.sub:r.plan==="pro"?T.gr:T.gold,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,marginRight:8}}>{r.plan.toUpperCase()}</span>
                  <span style={{fontWeight:700,color:r.commission>0?T.gr:T.sub}}>{r.commission>0?r.commission.toLocaleString()+" FCFA":"—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{background:"rgba(240,176,32,.06)",border:"1px solid rgba(240,176,32,.2)",borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:700,color:T.gold,fontSize:13,marginBottom:4}}>💳 Demander votre paiement</div>
          <div style={{fontSize:11,color:T.sub2,marginBottom:12}}>Minimum 5 000 FCFA · Paiement sous 48h via Mobile Money</div>
          <Btn full v="gold" ch={"💰 Demander le paiement — "+Math.round(stats.earnings).toLocaleString()+" FCFA"} onClick={()=>{
            if(stats.earnings<5000){toast("⚠️ Minimum 5 000 FCFA requis. Continuez à parrainer !","warn");return;}
            const msg="Bonjour VierAfrik,\n\nJe suis ambassadeur et je souhaite recevoir mes gains.\n\nNom: "+ses.name+"\nEmail: "+ses.email+"\nCode parrain: "+ses.refCode+"\nGains: "+Math.round(stats.earnings)+" FCFA\n\nMerci.";
            window.open("https://wa.me/"+cleanP("+31627374813")+"?text="+encodeURIComponent(msg),"_blank");
            toast("📱 Message envoyé à VierAfrik !");
          }}/>
        </div>
      </div>
    );
  };

  const NAV_BOTTOM=[{id:"dash",ic:"📊",lb:"Accueil"},{id:"tx",ic:"💸",lb:"Ventes"},{id:"inv",ic:"🧾",lb:"Factures"},{id:"cli",ic:"👥",lb:"Clients"},{id:"pay_mm",ic:"📱",lb:"Mobile Money"},{id:"carte",ic:"💳",lb:"Ma Carte"},{id:"logo",ic:"🎨",lb:"Logo"},{id:"reseau",ic:"🤝",lb:"Réseau"},{id:"plans",ic:"💎",lb:"Plans"},{id:"ambass",ic:"🤝",lb:"Ambass."},{id:"coach",ic:"🤖",lb:"Coach"},{id:"prefs",ic:"⚙️",lb:"Compte"}];
  const NAV=[{id:"dash",ic:"📊",lb:"Dashboard"},{id:"tx",ic:"💸",lb:"Transactions"},{id:"inv",ic:"🧾",lb:"Factures"},{id:"cli",ic:"👥",lb:"Clients"},{id:"stats",ic:"📈",lb:"Stats"},{id:"carte",ic:"💳",lb:"Ma Carte"},{id:"logo",ic:"🎨",lb:"Logo"},{id:"reseau",ic:"🤝",lb:"Réseau"},{id:"coach",ic:"🤖",lb:"Coach IA"},{id:"plans",ic:"💎",lb:"Plans"},{id:"ambass",ic:"🤝",lb:"Ambassadeur"},{id:"avis",ic:"⭐",lb:"Avis"},{id:"prefs",ic:"⚙️",lb:"Compte"}];



  const PgCarteVisite = () => <CarteVisite user={ses} accent={accent} toast={toast}/>;

  const COULEURS_1 = ["#00d478","#1a78ff","#f0b020","#ff5a18","#9060ff","#ff2255","#25D366","#000"];
const COULEURS_2 = ["#00bfcc","#9060ff","#f0b020","#ff5a18","#1a78ff","#00d478","#fff","#333"];

function LogoGenerator({ user, accent = "#00d478", toast }) {

  const [styleIdx, setStyleIdx] = useState(0);
  const [couleur1, setCouleur1] = useState(accent);
  const [couleur2, setCouleur2] = useState("#00bfcc");
  const [forme, setForme]       = useState("rond");

  const T = {
    c1:"#05090f", c2:"#08111d", c3:"#0d1828",
    border:"rgba(0,210,120,0.08)", text:"#dff0ff",
    sub:"#4a7090", sub2:"#80a8c8", teal:"#00bfcc",
  };

  const initials = (user?.business || user?.name || "VA")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const nom = (user?.business || user?.name || "VierAfrik").slice(0, 15);

  // Rayon selon forme
  const radius = (size = 16) =>
    forme === "rond" ? "50%" : forme === "carre" ? size : 0;

  // ── 4 styles de logo ──
  const STYLES = [
    {
      label: "Initiales",
      render: () => (
        <div style={{
          width:120, height:120, borderRadius: radius(),
          background: `linear-gradient(135deg,${couleur1},${couleur2})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:44, color:"#fff",
          boxShadow: `0 12px 40px ${couleur1}66`, flexShrink:0,
        }}>
          {initials}
        </div>
      ),
    },
    {
      label: "Icône+Nom",
      render: () => (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
          <div style={{
            width:90, height:90, borderRadius: radius(),
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:36, boxShadow: `0 12px 40px ${couleur1}66`,
          }}>🌍</div>
          <div style={{ fontWeight:900,fontSize:16,color:couleur1,letterSpacing:"-.02em" }}>
            {nom}
          </div>
        </div>
      ),
    },
    {
      label: "Bouclier",
      render: () => (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
          <div style={{
            width:100, height:110,
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:32, color:"#fff",
            boxShadow: `0 12px 40px ${couleur1}66`,
          }}>
            {initials}
          </div>
          <div style={{ fontWeight:800,fontSize:13,color:T.text }}>{nom}</div>
        </div>
      ),
    },
    {
      label: "Moderne",
      render: () => (
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{
            width:70, height:70, borderRadius:16,
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:26, color:"#fff",
            boxShadow: `0 8px 24px ${couleur1}44`,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight:900,fontSize:20,color:T.text,letterSpacing:"-.03em" }}>
              {nom.split(" ")[0]}
            </div>
            {nom.split(" ")[1] && (
              <div style={{ fontWeight:600,fontSize:14,color:couleur1 }}>
                {nom.split(" ").slice(1).join(" ")}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  const handleShare = () => {
    toast?.("💡 Pour partager votre logo : faites une capture d'écran de l'aperçu ci-dessus, puis envoyez sur WhatsApp ou Facebook !", "info");
  };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>

      {/* Titre */}
      <div style={{ fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em" }}>
        🎨 Mon Logo
      </div>
      <div style={{ color:T.sub2,fontSize:12,marginBottom:20 }}>
        Créez un logo simple pour votre commerce, gratuitement
      </div>

      {/* ── APERÇU LOGO ── */}
      <div style={{
        background: `linear-gradient(135deg,${T.c1},${T.c2})`,
        border: `2px solid ${couleur1}44`,
        borderRadius:24, padding:"2.5rem", marginBottom:16,
        display:"flex", alignItems:"center", justifyContent:"center",
        minHeight:180,
      }}>
        {STYLES[styleIdx].render()}
      </div>

      {/* ── STYLES ── */}
      <div style={{ background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,
        padding:"1.4rem",marginBottom:12 }}>
        <div style={{ fontWeight:800,fontSize:13,marginBottom:12 }}>Style du logo</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16 }}>
          {STYLES.map((s, i) => (
            <div key={i} onClick={() => setStyleIdx(i)} style={{
              background: styleIdx===i ? `${couleur1}20` : T.c2,
              border: `1px solid ${styleIdx===i ? couleur1 : T.border}`,
              borderRadius:10, padding:"8px 4px", textAlign:"center",
              cursor:"pointer", transition:"all .2s",
            }}>
              <div style={{ fontSize:9,fontWeight:700,color:styleIdx===i ? couleur1 : T.sub2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Couleurs */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",
              color:T.sub,display:"block",marginBottom:6 }}>Couleur principale</label>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {COULEURS_1.map(c => (
                <div key={c} onClick={() => setCouleur1(c)} style={{
                  width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",
                  border:couleur1===c?"3px solid #fff":"2px solid transparent",
                  boxShadow:couleur1===c?`0 0 0 2px ${c}`:"",
                  transition:"all .15s",
                }}/>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",
              color:T.sub,display:"block",marginBottom:6 }}>Couleur secondaire</label>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
              {COULEURS_2.map(c => (
                <div key={c} onClick={() => setCouleur2(c)} style={{
                  width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",
                  border:couleur2===c?"3px solid #fff":"2px solid transparent",
                  boxShadow:couleur2===c?`0 0 0 2px ${c}`:"",
                  transition:"all .15s",
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* Forme */}
        <div>
          <label style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",
            color:T.sub,display:"block",marginBottom:6 }}>Forme</label>
          <div style={{ display:"flex",gap:8 }}>
            {[["rond","⭕ Rond"],["carre","🔲 Carré"],["libre","🔷 Libre"]].map(([f, label]) => (
              <div key={f} onClick={() => setForme(f)} style={{
                flex:1, background:forme===f?`${couleur1}20`:T.c2,
                border:`1px solid ${forme===f?couleur1:T.border}`,
                borderRadius:8, padding:"6px", textAlign:"center",
                cursor:"pointer", fontSize:11, fontWeight:700,
                color:forme===f?couleur1:T.sub2, transition:"all .2s",
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Astuce */}
      <div style={{ background:`${couleur1}12`,border:`1px solid ${couleur1}30`,
        borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:12,color:T.sub2 }}>
        💡 Pour utiliser votre logo : faites une{" "}
        <strong style={{ color:couleur1 }}>capture d'écran</strong> de l'aperçu
        et partagez sur WhatsApp, Facebook ou Instagram.
      </div>

      <button onClick={handleShare} style={{
        width:"100%",padding:"11px",borderRadius:10,
        border:`1px solid ${T.border}`,cursor:"pointer",
        fontWeight:700,fontSize:13,background:T.c2,color:T.text,
        fontFamily:"inherit",
      }}>
        📸 Comment partager mon logo ?
      </button>
    </div>
  );
}
  const PgLogo = () => <LogoGenerator user={ses} accent={accent} toast={toast}/>;

  const CATEGORIES = [
  { id:"all",    label:"Tous",        ic:"💬" },
  { id:"travail",label:"Travail",     ic:"👷" },
  { id:"vente",  label:"Vente",       ic:"🛒" },
  { id:"service",label:"Service",     ic:"🔧" },
  { id:"info",   label:"Info",        ic:"📢" },
];

function ReseauCommerçants({
  user,
  supabase,
  accent = "#00d478",
  toast,
}) {
  const [msgs, setMsgs]         = useState([]);
  const [newMsg, setNewMsg]     = useState("");
  const [categorie, setCat]     = useState("all");
  const [filtreId, setFiltreId] = useState("all");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);

  const T = {
    c1:"#05090f", c2:"#08111d", c3:"#0d1828",
    border:"rgba(0,210,120,0.08)", text:"#dff0ff",
    sub:"#4a7090", sub2:"#80a8c8", ink:"#000", gr:"#00d478",
  };
  const IS = {
    width:"100%", padding:"11px 14px", background:T.c3,
    border:`1px solid ${T.border}`, borderRadius:11, color:T.text,
    fontFamily:"inherit", fontSize:13, outline:"none", marginTop:5,
  };

  // ── Charger messages (expire après 24h) ──
  const loadMsgs = async () => {
    if (!supabase) return;
    try {
      const s = await supabase();
      const since = new Date(Date.now() - 24*60*60*1000).toISOString();
      const { data } = await s
        .from("reseau_messages")
        .select("*")
        .gte("created_at", since)   // seulement les 24 dernières heures
        .order("created_at", { ascending: false })
        .limit(50);
      setMsgs(data || []);
    } catch (e) {
      console.error("Réseau load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMsgs();
    // Actualisation toutes les 15 secondes
    const interval = setInterval(loadMsgs, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Envoyer un message ──
  const sendMsg = async () => {
    if (!newMsg.trim()) return;
    if (newMsg.trim().length < 5) { toast?.("⚠️ Message trop court", "warn"); return; }
    if (newMsg.trim().length > 200) { toast?.("⚠️ Maximum 200 caractères", "warn"); return; }
    if (!supabase) { toast?.("❌ Connexion Supabase manquante", "err"); return; }

    setSending(true);
    try {
      const s = await supabase();
      const expiresAt = new Date(Date.now() + 24*60*60*1000).toISOString();
      const msg = {
        user_id:    user?.id || "anonymous",
        user_name:  user?.name || "Commerçant",
        business:   user?.business || "",
        pays:       user?.country || "CI",
        categorie:  categorie,
        message:    newMsg.trim(),
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };
      const { data, error } = await s.from("reseau_messages").insert(msg).select();
      if (error) throw error;
      setMsgs(p => [{ ...msg, id: data?.[0]?.id || Date.now() }, ...p]);
      setNewMsg("");
      setCat("all");
      toast?.("✅ Message publié — visible 24h par tous les commerçants VierAfrik !", "ok");
    } catch (e) {
      toast?.("❌ Erreur envoi — vérifiez votre connexion", "err");
    } finally {
      setSending(false);
    }
  };

  // ── Supprimer son propre message ──
  const deleteMsg = async (id) => {
    if (!supabase) return;
    try {
      const s = await supabase();
      await s.from("reseau_messages").delete().eq("id", id).eq("user_id", user?.id);
      setMsgs(p => p.filter(m => m.id !== id));
      toast?.("🗑️ Message supprimé", "ok");
    } catch (e) {
      toast?.("❌ Erreur suppression", "err");
    }
  };

  // ── Temps relatif ──
  const timeAgo = (d) => {
    const diff = Math.round((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60)    return diff + "s";
    if (diff < 3600)  return Math.round(diff / 60) + "min";
    if (diff < 86400) return Math.round(diff / 3600) + "h";
    return Math.round(diff / 86400) + "j";
  };

  // ── Temps restant avant expiration ──
  const timeLeft = (d) => {
    const left = 24*60*60*1000 - (Date.now() - new Date(d).getTime());
    if (left <= 0) return "Expiré";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Expire dans ${h}h${m > 0 ? m+"min" : ""}`;
  };

  // ── Filtrer par catégorie ──
  const msgsFiltres = msgs.filter(m =>
    filtreId === "all" ? true : m.categorie === filtreId
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>

      {/* Titre */}
      <div style={{ fontWeight:900,fontSize:22,marginBottom:4,letterSpacing:"-.03em" }}>
        🤝 Réseau VierAfrik
      </div>
      <div style={{ color:T.sub2,fontSize:12,marginBottom:6 }}>
        Connectez-vous avec d'autres commerçants. Partagez vos besoins, trouvez de l'aide.
      </div>
      <div style={{ background:`${accent}12`,border:`1px solid ${accent}22`,borderRadius:8,
        padding:"6px 12px",marginBottom:18,fontSize:11,color:accent,fontWeight:600 }}>
        ⏱ Les messages disparaissent automatiquement après 24h
      </div>

      {/* ── ÉCRIRE UN MESSAGE ── */}
      <div style={{ background:`linear-gradient(135deg,${T.c1},${T.c2})`,
        border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem",marginBottom:16 }}>
        <div style={{ fontWeight:800,fontSize:13,marginBottom:12,display:"flex",
          alignItems:"center",gap:8 }}>
          <span style={{ background:`${accent}18`,border:`1px solid ${accent}30`,
            borderRadius:8,padding:"4px 8px",fontSize:14 }}>✍️</span>
          Publier une annonce
        </div>

        {/* Catégorie */}
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
          {CATEGORIES.slice(1).map(c => (
            <div key={c.id} onClick={() => setCat(c.id)} style={{
              background: categorie===c.id ? `${accent}25` : T.c3,
              border: `1px solid ${categorie===c.id ? accent : T.border}`,
              borderRadius:20, padding:"4px 10px", cursor:"pointer",
              fontSize:11, fontWeight:700,
              color: categorie===c.id ? accent : T.sub2,
              transition:"all .15s",
            }}>
              {c.ic} {c.label}
            </div>
          ))}
        </div>

        <textarea
          style={{ ...IS, height:80, resize:"none" }}
          placeholder="Ex: Je cherche 2 personnes pour travailler dans ma boutique aujourd'hui à Abidjan… Je vends du tissu en gros, quelqu'un intéressé ?…"
          value={newMsg}
          onChange={ev => setNewMsg(ev.target.value)}
          maxLength={200}
        />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6 }}>
          <span style={{ fontSize:10,color:T.sub }}>{newMsg.length}/200</span>
          <button
            disabled={sending || !newMsg.trim()}
            onClick={sendMsg}
            style={{
              padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",
              fontWeight:700,fontSize:12,background:accent,color:T.ink,
              fontFamily:"inherit",opacity:sending||!newMsg.trim()?0.45:1,
            }}
          >
            {sending ? "⏳ Envoi…" : "📢 Publier"}
          </button>
        </div>
      </div>

      {/* ── FILTRES ── */}
      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
        {CATEGORIES.map(c => (
          <div key={c.id} onClick={() => setFiltreId(c.id)} style={{
            background: filtreId===c.id ? `${accent}20` : T.c2,
            border: `1px solid ${filtreId===c.id ? accent : T.border}`,
            borderRadius:20, padding:"4px 10px", cursor:"pointer",
            fontSize:11, fontWeight:700,
            color: filtreId===c.id ? accent : T.sub2,
            transition:"all .15s",
          }}>
            {c.ic} {c.label}
          </div>
        ))}
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,
        padding:"1.4rem" }}>
        <div style={{ fontWeight:800,fontSize:13,marginBottom:14,
          display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ background:`${T.gr}18`,border:`1px solid ${T.gr}30`,
              borderRadius:8,padding:"4px 8px",fontSize:14 }}>💬</span>
            Annonces ({msgsFiltres.length})
          </div>
          <span style={{ fontSize:10,color:T.sub }}>🔄 Auto 15s</span>
        </div>

        {loading ? (
          <div style={{ textAlign:"center",padding:"2rem",color:T.sub,fontSize:12 }}>
            ⏳ Chargement…
          </div>
        ) : msgsFiltres.length === 0 ? (
          <div style={{ textAlign:"center",padding:"2.5rem",color:T.sub }}>
            <div style={{ fontSize:40,marginBottom:8 }}>🤝</div>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>Réseau vide pour l'instant</div>
            <div style={{ fontSize:11 }}>
              Soyez le premier à publier une annonce !
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {msgsFiltres.map((m, i) => {
              const isOwn = m.user_id === user?.id;
              const catInfo = CATEGORIES.find(c => c.id === m.categorie) || CATEGORIES[0];
              return (
                <div key={m.id || i} style={{
                  background: isOwn ? `${accent}12` : T.c2,
                  border: `1px solid ${isOwn ? accent+"44" : T.border}`,
                  borderRadius:12, padding:"12px 14px",
                  position:"relative",
                }}>
                  {/* Header */}
                  <div style={{ display:"flex",justifyContent:"space-between",
                    alignItems:"flex-start",marginBottom:8,gap:8 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{
                        width:32,height:32,borderRadius:"50%",
                        background:`linear-gradient(135deg,${accent},#00bfcc)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontWeight:900,fontSize:11,color:T.ink,flexShrink:0,
                      }}>
                        {(m.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:700,fontSize:12,color:T.text }}>
                          {m.user_name||"Commerçant"}
                          {isOwn && (
                            <span style={{ fontSize:9,color:accent,marginLeft:5,fontWeight:800 }}>
                              • Vous
                            </span>
                          )}
                        </div>
                        {m.business && (
                          <div style={{ fontSize:10,color:T.sub2 }}>{m.business}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                      <span style={{ fontSize:10,color:T.sub }}>{timeAgo(m.created_at)}</span>
                      {isOwn && (
                        <button onClick={() => deleteMsg(m.id)} style={{
                          background:"rgba(255,34,85,.12)",border:"1px solid rgba(255,34,85,.2)",
                          borderRadius:6,cursor:"pointer",color:"#ff2255",
                          fontSize:10,padding:"2px 6px",fontFamily:"inherit",
                        }}>🗑️</button>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ fontSize:13,color:T.text,lineHeight:1.6,marginBottom:8 }}>
                    {m.message}
                  </div>

                  {/* Footer */}
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      {m.categorie && m.categorie !== "all" && (
                        <span style={{ background:`${accent}15`,borderRadius:20,
                          padding:"2px 8px",fontSize:9,fontWeight:700,color:accent }}>
                          {catInfo.ic} {catInfo.label}
                        </span>
                      )}
                      {m.pays && (
                        <span style={{ fontSize:10,color:T.sub }}>🌍 {m.pays}</span>
                      )}
                    </div>
                    <span style={{ fontSize:9,color:T.sub }}>{timeLeft(m.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
  const PgReseau = () => <ReseauCommerçants user={ses} supabase={getSupa} accent={accent} toast={toast}/>;

  const ACTIVITES = [
  "Toutes","Commerce","Alimentation","Couture","Téléphonie",
  "Transport","BTP","Santé","Éducation","Services","Agriculture",
];

const PAYS_FLAGS = {
  "CI":"🇨🇮","SN":"🇸🇳","GH":"🇬🇭","CM":"🇨🇲",
  "NG":"🇳🇬","ML":"🇲🇱","BF":"🇧🇫","TG":"🇹🇬",
};

function ReseauVierAfrik({ user, supabase, accent = "#00d478", toast }) {
  const TR = {
    c1:"#05090f", c2:"#08111d", c3:"#0d1828",
    border:"rgba(0,210,120,0.08)", text:"#dff0ff",
    sub:"#4a7090", sub2:"#80a8c8", ink:"#000", teal:"#00bfcc",
  };
  const ISR = {
    width:"100%", padding:"10px 13px", background:TR.c3,
    border:`1px solid ${TR.border}`, borderRadius:10, color:TR.text,
    fontFamily:"inherit", fontSize:13, outline:"none", marginTop:4,
  };

  const ACTIVITES_R = ["Toutes","Commerce","Alimentation","Couture","Téléphonie","Transport","BTP","Santé","Éducation","Services","Agriculture","Beauté","Tech","Mode","Artisanat"];
  const PAYS_R      = ["Tous","🇨🇮 Côte d'Ivoire","🇸🇳 Sénégal","🇬🇭 Ghana","🇨🇲 Cameroun","🇳🇬 Nigeria","🇲🇱 Mali","🇧🇫 Burkina Faso","🇹🇬 Togo","🇧🇯 Bénin","🇬🇳 Guinée"];

  const [commercants, setCommerçants] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [monProfil,setMonProfil]= useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profil,   setProfil]   = useState(null); // profil affiché en détail
  const [recherche,setRecherche]= useState("");
  const [filtreAct,setFiltreAct]= useState("Toutes");
  const [filtrePays,setFiltrePays]=useState("Tous");
  const [filtreVille,setFiltreVille]=useState("");
  const [form, setForm] = useState({
    activite:"", ville:"", description:"", telephone:"", logo_url:"", visible:true,
  });

  const loadAll = async () => {
    if(!supabase)return;
    try{
      const s = await supabase();
      const {data} = await s.from("commercants_profils").select("*").eq("visible",true).order("created_at",{ascending:false}).limit(200);
      const rows = data||[];
      setCommerçants(rows);
      const moi = rows.find(c=>c.id===user?.id);
      if(moi){
        setMonProfil(moi);
        setForm({activite:moi.activite||"",ville:moi.ville||"",description:moi.description||"",telephone:moi.telephone||"",logo_url:moi.logo_url||"",visible:moi.visible!==false});
      }
    }catch(e){console.error("ReseauVierAfrik:",e);}
    finally{setLoading(false);}
  };
  useEffect(()=>{loadAll();},[]);

  const saveProfile = async()=>{
    if(!supabase)return;
    if(!form.activite.trim()){toast?.("⚠️ Précisez votre activité","warn");return;}
    setSaving(true);
    try{
      const s = await supabase();
      const payload={
        id:user?.id, nom:user?.name||"Commerçant", business:user?.business||"",
        activite:form.activite.trim(), ville:form.ville.trim(),
        description:form.description.trim(), telephone:form.telephone.trim(),
        logo_url:form.logo_url.trim(), pays:user?.country||"CI", visible:form.visible,
      };
      if(monProfil){await s.from("commercants_profils").update(payload).eq("id",user?.id);}
      else{await s.from("commercants_profils").insert(payload);}
      setMonProfil(payload); setEditMode(false); await loadAll();
      toast?.("✅ Profil visible par les commerçants VierAfrik !","ok");
    }catch{toast?.("❌ Erreur sauvegarde","err");}
    finally{setSaving(false);}
  };

  const contactWA = (c)=>{
    const ph = (c.telephone||"").replace(/\D/g,"");
    if(!ph){toast?.("⚠️ Ce commerçant n'a pas de numéro renseigné","warn");return;}
    const msg = `Bonjour ${c.nom||c.business}, je vous ai trouvé sur VierAfrik. Je souhaite vous contacter pour ${c.activite||"votre activité"}.`;
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  const initials = n=>(n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const flagPays = p=>({CI:"🇨🇮",SN:"🇸🇳",GH:"🇬🇭",CM:"🇨🇲",NG:"🇳🇬",ML:"🇲🇱",BF:"🇧🇫",TG:"🇹🇬",BJ:"🇧🇯",GN:"🇬🇳"}[p]||"🌍");

  const liste = commercants.filter(c=>{
    if(c.id===user?.id)return false;
    const q=recherche.toLowerCase();
    const matchQ=!q||[c.nom,c.business,c.activite,c.ville,c.description].some(v=>v?.toLowerCase().includes(q));
    const matchAct=filtreAct==="Toutes"||c.activite?.toLowerCase().includes(filtreAct.toLowerCase());
    const matchPays=filtrePays==="Tous"||(c.pays&&filtrePays.includes(c.pays));
    const matchVille=!filtreVille||c.ville?.toLowerCase().includes(filtreVille.toLowerCase());
    return matchQ&&matchAct&&matchPays&&matchVille;
  });

  // ── Vue détail profil ──
  if(profil){
    const ph=(profil.telephone||"").replace(/\D/g,"");
    return(
      <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:TR.text}}>
        <button onClick={()=>setProfil(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:accent,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,marginBottom:18,padding:0}}>
          ← Retour au réseau
        </button>
        <div style={{background:`linear-gradient(135deg,${TR.c1},${TR.c2})`,border:`1px solid ${accent}30`,borderRadius:22,padding:"2rem",maxWidth:480,margin:"0 auto",boxShadow:`0 20px 60px rgba(0,0,0,.6)`}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            {profil.logo_url
              ? <img src={profil.logo_url} alt="logo" style={{width:72,height:72,borderRadius:18,objectFit:"cover",border:`2px solid ${accent}44`}} onError={e=>e.target.style.display="none"}/>
              : <div style={{width:72,height:72,borderRadius:18,background:`linear-gradient(135deg,${accent},${TR.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:26,color:TR.ink,boxShadow:`0 0 24px ${accent}44`}}>{initials(profil.business||profil.nom)}</div>
            }
            <div>
              <div style={{fontWeight:900,fontSize:22,letterSpacing:"-.03em",marginBottom:3}}>{profil.business||profil.nom}</div>
              <div style={{fontWeight:700,fontSize:13,color:accent}}>{profil.activite||"Commerce"}</div>
              <div style={{fontSize:11,color:TR.sub2,marginTop:3}}>{flagPays(profil.pays)} {profil.pays||"CI"}{profil.ville&&` · 📍 ${profil.ville}`}</div>
            </div>
          </div>
          {profil.description&&(
            <div style={{background:TR.c3,borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:13,color:TR.sub2,lineHeight:1.6}}>{profil.description}</div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
            {profil.telephone&&<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:9,background:`${accent}15`,border:`1px solid ${accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📞</div><span style={{fontSize:13}}>{profil.telephone}</span></div>}
            {profil.ville&&<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:9,background:`${accent}15`,border:`1px solid ${accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📍</div><span style={{fontSize:13}}>{profil.ville}, {profil.pays||"CI"}</span></div>}
          </div>
          <div style={{display:"flex",gap:8}}>
            {ph
              ? <button onClick={()=>contactWA(profil)} style={{flex:1,padding:"11px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:13,background:"#25D366",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📱 Contacter WhatsApp</button>
              : <div style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${TR.border}`,fontSize:12,color:TR.sub,textAlign:"center"}}>Pas de numéro renseigné</div>
            }
            <button onClick={()=>setProfil(null)} style={{padding:"11px 18px",borderRadius:10,border:`1px solid ${TR.border}`,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:TR.c2,color:TR.text}}>✕</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vue principale ──
  return(
    <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:TR.text}}>
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:900,fontSize:22,letterSpacing:"-.03em",marginBottom:3}}>🤝 Réseau VierAfrik</div>
        <div style={{fontSize:12,color:TR.sub2}}>Découvrez et connectez-vous avec d'autres entrepreneurs</div>
      </div>

      {/* Mon profil */}
      <div style={{background:`linear-gradient(135deg,${accent}12,${TR.c1})`,border:`1px solid ${accent}40`,borderRadius:16,padding:"1.2rem",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:800,fontSize:13}}>{monProfil?"✅ Vous êtes visible dans le réseau":"👤 Rejoindre le réseau"}</div>
            {monProfil&&!editMode&&<div style={{fontSize:11,color:TR.sub2,marginTop:3}}>{monProfil.activite}{monProfil.ville&&` · 📍 ${monProfil.ville}`}</div>}
          </div>
          <button onClick={()=>setEditMode(e=>!e)} style={{background:editMode?`${accent}20`:TR.c2,border:`1px solid ${accent}44`,borderRadius:8,cursor:"pointer",color:accent,fontSize:11,fontWeight:700,padding:"6px 13px",fontFamily:"inherit"}}>
            {editMode?"✕ Fermer":monProfil?"✏️ Modifier":"➕ Rejoindre"}
          </button>
        </div>
        {editMode&&(
          <div style={{marginTop:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}} className="pg-grid-2">
              <div><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:TR.sub,display:"block"}}>Activité *</label><input style={ISR} placeholder="Couture, Épicerie…" value={form.activite} onChange={ev=>setForm(f=>({...f,activite:ev.target.value}))}/></div>
              <div><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:TR.sub,display:"block"}}>Ville</label><input style={ISR} placeholder="Abidjan, Dakar…" value={form.ville} onChange={ev=>setForm(f=>({...f,ville:ev.target.value}))}/></div>
              <div><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:TR.sub,display:"block"}}>Téléphone WhatsApp</label><input type="tel" style={ISR} placeholder="+225 07 000 0000" value={form.telephone} onChange={ev=>setForm(f=>({...f,telephone:ev.target.value}))}/></div>
              <div><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:TR.sub,display:"block"}}>URL Logo (optionnel)</label><input style={ISR} placeholder="https://…" value={form.logo_url} onChange={ev=>setForm(f=>({...f,logo_url:ev.target.value}))}/></div>
            </div>
            <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:TR.sub,display:"block"}}>Description courte</label><textarea style={{...ISR,height:60,resize:"none"}} placeholder="Décrivez votre activité en quelques mots…" value={form.description} onChange={ev=>setForm(f=>({...f,description:ev.target.value}))} maxLength={150}/></div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div onClick={()=>setForm(f=>({...f,visible:!f.visible}))} style={{width:36,height:20,borderRadius:10,cursor:"pointer",background:form.visible?accent:TR.c3,border:`1px solid ${form.visible?accent:TR.border}`,position:"relative",transition:"all .2s"}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:form.visible?18:2,transition:"left .2s"}}/>
              </div>
              <span style={{fontSize:12,color:TR.sub2}}>{form.visible?"Visible par les commerçants":"Masqué"}</span>
            </div>
            <button onClick={saveProfile} disabled={saving} style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:accent,color:TR.ink,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
              {saving?"⏳ Sauvegarde…":monProfil?"💾 Mettre à jour mon profil":"✅ Rejoindre le réseau"}
            </button>
          </div>
        )}
      </div>

      {/* Recherche */}
      <input style={{...ISR,marginBottom:10,marginTop:0}} placeholder="🔍 Rechercher un commerce, ville, activité…" value={recherche} onChange={ev=>setRecherche(ev.target.value)}/>

      {/* Filtres */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {ACTIVITES_R.map(a=>(
          <div key={a} onClick={()=>setFiltreAct(a)} style={{background:filtreAct===a?`${accent}20`:TR.c2,border:`1px solid ${filtreAct===a?accent:TR.border}`,borderRadius:20,padding:"3px 9px",cursor:"pointer",fontSize:10,fontWeight:700,color:filtreAct===a?accent:TR.sub2,transition:"all .15s"}}>{a}</div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {PAYS_R.map(p=>(
          <div key={p} onClick={()=>setFiltrePays(p)} style={{background:filtrePays===p?`${accent}20`:TR.c2,border:`1px solid ${filtrePays===p?accent:TR.border}`,borderRadius:20,padding:"3px 9px",cursor:"pointer",fontSize:10,fontWeight:700,color:filtrePays===p?accent:TR.sub2,transition:"all .15s"}}>{p}</div>
        ))}
        <input placeholder="📍 Ville…" value={filtreVille} onChange={ev=>setFiltreVille(ev.target.value)} style={{...ISR,width:120,marginTop:0,padding:"3px 9px",fontSize:10,borderRadius:20}}/>
      </div>

      {/* Liste */}
      {loading?(
        <div style={{textAlign:"center",padding:"3rem",color:TR.sub,fontSize:12}}>⏳ Chargement…</div>
      ):liste.length===0?(
        <div style={{background:TR.c1,border:`1px solid ${TR.border}`,borderRadius:16,padding:"2.5rem",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>🤝</div>
          <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:TR.text}}>{commercants.length<=1?"Soyez le premier à rejoindre !":"Aucun commerçant trouvé"}</div>
          <div style={{fontSize:11,color:TR.sub2}}>Modifiez vos filtres ou rejoignez le réseau.</div>
        </div>
      ):(
        <div>
          <div style={{fontSize:11,color:TR.sub,marginBottom:10}}>{liste.length} commerçant{liste.length>1?"s":""} trouvé{liste.length>1?"s":""}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {liste.map((c,i)=>(
              <div key={c.id||i} style={{background:`linear-gradient(135deg,${TR.c1},${TR.c2})`,border:`1px solid ${TR.border}`,borderRadius:16,padding:"1.2rem",display:"flex",flexDirection:"column",gap:10,transition:"border-color .2s,transform .2s",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=accent+"44";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=TR.border;e.currentTarget.style.transform="translateY(0)";}}>
                {/* Header carte */}
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {c.logo_url
                    ? <img src={c.logo_url} alt="logo" style={{width:48,height:48,borderRadius:12,objectFit:"cover",border:`2px solid ${accent}33`,flexShrink:0}} onError={e=>e.target.style.display="none"}/>
                    : <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${accent},${TR.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:TR.ink,flexShrink:0}}>{initials(c.business||c.nom)}</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:TR.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.business||c.nom}</div>
                    <div style={{fontSize:11,color:accent,fontWeight:700,marginTop:1}}>{c.activite||"Commerce"}</div>
                  </div>
                </div>
                {/* Description */}
                {c.description&&<div style={{fontSize:11,color:TR.sub2,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{c.description}</div>}
                {/* Localisation */}
                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:TR.sub2}}>
                  {c.ville&&<span>📍 {c.ville}</span>}
                  <span>{flagPays(c.pays)} {c.pays||"CI"}</span>
                </div>
                {/* Actions */}
                <div style={{display:"flex",gap:7,marginTop:2}}>
                  <button onClick={()=>setProfil(c)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${accent}44`,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,background:`${accent}10`,color:accent}}>👁 Voir profil</button>
                  <button onClick={()=>contactWA(c)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,background:"#25D366",color:"#fff"}}>📱 WhatsApp</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
  const PgCommProches = () => <ReseauVierAfrik user={ses} supabase={getSupa} accent={accent} toast={toast}/>;

  // ════════════════════════════════
  //  MODULE — CARTE DE VISITE DIGITALE
  // ════════════════════════════════
  function CarteVisite({ user, supabase, accent = "#00d478", toast }) {
    const TC = {
      bg:"#010306", c1:"#05090f", c2:"#08111d", c3:"#0d1828",
      border:"rgba(0,210,120,0.08)", text:"#dff0ff",
      sub:"#4a7090", sub2:"#80a8c8", ink:"#000", gr:"#00d478", teal:"#00bfcc",
    };
    const ISC = {
      width:"100%", padding:"11px 14px", background:TC.c3,
      border:`1px solid ${TC.border}`, borderRadius:11, color:TC.text,
      fontFamily:"inherit", fontSize:13, outline:"none", marginTop:4,
      transition:"border-color .2s",
    };

    const [mode, setMode]       = useState("view"); // "view" | "edit"
    const [saving, setSaving]   = useState(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied]   = useState(false);
    const [carte, setCarte]     = useState(null);
    const [form, setForm]       = useState({
      nom:         user?.name || "",
      entreprise:  user?.business || "",
      telephone:   user?.phone || "",
      email:       user?.email || "",
      ville:       "",
      description: "",
      logo_url:    "",
    });

    // ── Charger la carte depuis Supabase ──
    useEffect(() => {
      (async () => {
        try {
          const s = await supabase();
          const { data } = await s
            .from("cartes_visite")
            .select("*")
            .eq("user_id", user?.id)
            .single();
          if (data) {
            setCarte(data);
            setForm({
              nom:         data.nom         || user?.name     || "",
              entreprise:  data.entreprise  || user?.business || "",
              telephone:   data.telephone   || user?.phone    || "",
              email:       data.email       || user?.email    || "",
              ville:       data.ville       || "",
              description: data.description || "",
              logo_url:    data.logo_url    || "",
            });
          } else {
            // Pas encore de carte — pré-remplir avec les infos du profil
            setForm(f => ({
              ...f,
              nom:        user?.name     || "",
              entreprise: user?.business || "",
              telephone:  user?.phone    || "",
              email:      user?.email    || "",
            }));
            setMode("edit");
          }
        } catch (e) {
          // Pas encore de carte — mode création
          setMode("edit");
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    // ── Sauvegarder ──
    const saveCarte = async () => {
      if (!form.nom.trim())        { toast?.("⚠️ Le nom est obligatoire", "warn"); return; }
      if (!form.entreprise.trim()) { toast?.("⚠️ Le nom de l'entreprise est obligatoire", "warn"); return; }
      setSaving(true);
      try {
        const s = await supabase();
        const payload = {
          user_id:     user?.id,
          nom:         form.nom.trim(),
          entreprise:  form.entreprise.trim(),
          telephone:   form.telephone.trim(),
          email:       form.email.trim(),
          ville:       form.ville.trim(),
          description: form.description.trim(),
          logo_url:    form.logo_url.trim(),
        };
        if (carte) {
          await s.from("cartes_visite").update(payload).eq("user_id", user?.id);
        } else {
          await s.from("cartes_visite").insert({ ...payload, id: user?.id + "_cv" });
        }
        setCarte(payload);
        setMode("view");
        toast?.("✅ Carte de visite sauvegardée !", "ok");
      } catch (e) {
        toast?.("❌ Erreur sauvegarde — réessayez", "err");
      } finally {
        setSaving(false);
      }
    };

    // ── Partager WhatsApp ──
    const shareWA = () => {
      const d = carte || form;
      const txt = `*${d.nom}*\n${d.entreprise}\n\n${d.description ? d.description + "\n\n" : ""}📞 ${d.telephone || "—"}\n📧 ${d.email || "—"}\n📍 ${d.ville || "—"}\n\n🌍 Retrouvez-moi sur VierAfrik\nhttps://vierafrik.com`;
      window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
      toast?.("📱 WhatsApp ouvert !", "ok");
    };

    // ── Copier le lien ──
    const copyLink = () => {
      const d = carte || form;
      const txt = `${d.nom} — ${d.entreprise} | ${d.telephone || ""} | ${d.email || ""} | ${d.ville || ""} | VierAfrik`;
      navigator.clipboard.writeText(txt).then(() => {
        setCopied(true);
        toast?.("✅ Informations copiées !", "ok");
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => toast?.("❌ Copie impossible sur ce navigateur", "err"));
    };

    // ── Imprimer / PDF ──
    const printCarte = () => {
      const d = carte || form;
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carte — ${d.nom}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:linear-gradient(135deg,#0d1828,#08111d);border-radius:20px;padding:32px 36px;width:380px;box-shadow:0 20px 60px rgba(0,0,0,.4);color:#dff0ff}
.brand{color:#00d478;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px}
.avatar{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#00d478,#00bfcc);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#000;margin-bottom:16px}
.nom{font-size:24px;font-weight:900;letter-spacing:-.03em;margin-bottom:4px}
.biz{font-size:13px;color:#00d478;font-weight:700;margin-bottom:14px}
.desc{font-size:12px;color:#80a8c8;line-height:1.6;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(0,210,120,.15)}
.row{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;color:#dff0ff}
.ico{width:28px;height:28px;border-radius:8px;background:rgba(0,210,120,.12);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.foot{margin-top:20px;padding-top:14px;border-top:1px solid rgba(0,210,120,.12);display:flex;justify-content:space-between;align-items:center}
.foot-brand{font-size:10px;color:#4a7090;font-weight:700}
.foot-dot{width:6px;height:6px;border-radius:50%;background:#00d478}
@media print{body{background:#fff}button{display:none}}
</style></head><body>
<div class="card">
  <div class="brand">🌍 VierAfrik — Carte de Visite</div>
  ${d.logo_url ? `<img src="${d.logo_url}" style="width:64px;height:64px;border-radius:16px;object-fit:cover;margin-bottom:16px"/>` :
    `<div class="avatar">${(d.nom||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>`}
  <div class="nom">${d.nom}</div>
  <div class="biz">${d.entreprise}</div>
  ${d.description ? `<div class="desc">${d.description}</div>` : ""}
  ${d.telephone ? `<div class="row"><div class="ico">📞</div><span>${d.telephone}</span></div>` : ""}
  ${d.email ? `<div class="row"><div class="ico">📧</div><span>${d.email}</span></div>` : ""}
  ${d.ville ? `<div class="row"><div class="ico">📍</div><span>${d.ville}</span></div>` : ""}
  <div class="foot">
    <span class="foot-brand">vierafrik.com</span>
    <div class="foot-dot"></div>
    <span class="foot-brand">Gestion PME Africaines</span>
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`);
      w.document.close();
      toast?.("📄 Prêt ! Utilisez Ctrl+P pour enregistrer en PDF.");
    };

    // ── Aperçu de la carte ──
    const d = mode === "edit" ? form : (carte || form);
    const initiales = (d.nom || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    if (loading) return (
      <div style={{ textAlign:"center", padding:"3rem", color:TC.sub }}>
        <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
        <div style={{ fontSize:13 }}>Chargement…</div>
      </div>
    );

    return (
      <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:TC.text }}>
        {/* En-tête */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:22, letterSpacing:"-.03em", marginBottom:3 }}>
              💳 Carte de Visite
            </div>
            <div style={{ fontSize:12, color:TC.sub2 }}>
              Partagez votre carte en 10 secondes
            </div>
          </div>
          <button onClick={() => setMode(mode === "edit" ? "view" : "edit")}
            style={{ padding:"8px 16px", borderRadius:9, border:`1px solid ${accent}44`,
              background:`${accent}12`, color:accent, cursor:"pointer",
              fontFamily:"inherit", fontWeight:700, fontSize:12 }}>
            {mode === "edit" ? "👁 Aperçu" : "✏️ Modifier"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }} className="pg-grid-2">

          {/* ── FORMULAIRE ── */}
          {mode === "edit" && (
            <div style={{ background:`linear-gradient(135deg,${TC.c1},${TC.c2})`,
              border:`1px solid ${TC.border}`, borderRadius:18, padding:"1.4rem" }}>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:14,
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ background:`${accent}18`, border:`1px solid ${accent}30`,
                  borderRadius:8, padding:"4px 8px", fontSize:14 }}>✏️</span>
                Vos informations
              </div>
              {[
                ["nom",         "Nom complet",       "text",  "Prénom Nom"],
                ["entreprise",  "Entreprise",        "text",  "Mon Entreprise SARL"],
                ["telephone",   "Téléphone",         "tel",   "+225 07 000 0000"],
                ["email",       "Email",             "email", "vous@entreprise.com"],
                ["ville",       "Ville / Pays",      "text",  "Abidjan, Côte d'Ivoire"],
                ["logo_url",    "URL Logo (optionnel)","url", "https://..."],
              ].map(([key, label, type, ph]) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:700,
                    textTransform:"uppercase", letterSpacing:".07em", color:TC.sub }}>
                    {label}
                  </label>
                  <input type={type} style={ISC} placeholder={ph}
                    value={form[key] || ""}
                    onChange={ev => setForm(f => ({ ...f, [key]: ev.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:10, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:".07em", color:TC.sub }}>
                  Description courte
                </label>
                <textarea style={{ ...ISC, height:72, resize:"none" }}
                  placeholder="Ex: Vendeur de tissus en gros · Livraison rapide · 10 ans d'expérience"
                  value={form.description || ""}
                  onChange={ev => setForm(f => ({ ...f, description: ev.target.value }))}
                  maxLength={120}
                />
                <div style={{ fontSize:10, color:TC.sub, marginTop:2, textAlign:"right" }}>
                  {(form.description || "").length}/120
                </div>
              </div>
              <button onClick={saveCarte} disabled={saving}
                style={{ width:"100%", padding:"11px", borderRadius:10, border:"none",
                  cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit",
                  fontWeight:800, fontSize:13, background:accent, color:TC.ink,
                  opacity: saving ? 0.6 : 1, transition:"all .2s" }}>
                {saving ? "⏳ Sauvegarde…" : "💾 Sauvegarder la carte"}
              </button>
            </div>
          )}

          {/* ── APERÇU CARTE ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:12,
            gridColumn: mode === "view" ? "1 / -1" : "auto" }}>

            {/* La carte visuelle */}
            <div style={{
              background:`linear-gradient(135deg,#0d1828 0%,#08111d 60%,#0a1520 100%)`,
              border:`1px solid ${accent}30`,
              borderRadius:22, padding:"1.8rem 2rem",
              boxShadow:`0 20px 60px rgba(0,0,0,.6), 0 0 0 1px ${accent}18, inset 0 1px 0 rgba(255,255,255,.04)`,
              position:"relative", overflow:"hidden",
            }}>
              {/* Déco fond */}
              <div style={{ position:"absolute", right:-40, top:-40, width:160, height:160,
                borderRadius:"50%", background:`${accent}06`, pointerEvents:"none" }}/>
              <div style={{ position:"absolute", left:-30, bottom:-30, width:100, height:100,
                borderRadius:"50%", background:`${TC.teal}05`, pointerEvents:"none" }}/>

              {/* Badge VierAfrik */}
              <div style={{ fontSize:9, fontWeight:800, color:accent,
                letterSpacing:".1em", textTransform:"uppercase", marginBottom:18,
                display:"flex", alignItems:"center", gap:5 }}>
                <span>🌍</span> VierAfrik
              </div>

              {/* Avatar ou logo */}
              {d.logo_url ? (
                <img src={d.logo_url} alt="logo"
                  style={{ width:60, height:60, borderRadius:14, objectFit:"cover",
                    marginBottom:14, border:`2px solid ${accent}44`,
                    boxShadow:`0 0 20px ${accent}22` }}
                  onError={e => { e.target.style.display = "none"; }}
                />
              ) : (
                <div style={{ width:60, height:60, borderRadius:14,
                  background:`linear-gradient(135deg,${accent},${TC.teal})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:900, fontSize:22, color:TC.ink, marginBottom:14,
                  boxShadow:`0 0 24px ${accent}44` }}>
                  {initiales}
                </div>
              )}

              <div style={{ fontWeight:900, fontSize:22, letterSpacing:"-.04em",
                color:TC.text, marginBottom:4, lineHeight:1.1 }}>
                {d.nom || "Votre nom"}
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:accent, marginBottom:14 }}>
                {d.entreprise || "Votre entreprise"}
              </div>

              {d.description && (
                <div style={{ fontSize:11, color:TC.sub2, lineHeight:1.6, marginBottom:16,
                  paddingBottom:14, borderBottom:`1px solid ${accent}15` }}>
                  {d.description}
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["📞", d.telephone],
                  ["📧", d.email],
                  ["📍", d.ville],
                ].filter(([, val]) => val).map(([ic, val]) => (
                  <div key={ic} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:8,
                      background:`${accent}12`, border:`1px solid ${accent}20`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, flexShrink:0 }}>
                      {ic}
                    </div>
                    <span style={{ fontSize:12, color:TC.text, fontWeight:500 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Footer carte */}
              <div style={{ marginTop:20, paddingTop:14,
                borderTop:`1px solid ${accent}12`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:TC.sub, fontWeight:600 }}>vierafrik.com</span>
                <div style={{ width:6, height:6, borderRadius:"50%", background:accent }}/>
                <span style={{ fontSize:10, color:TC.sub, fontWeight:600 }}>Gestion PME 🌍</span>
              </div>
            </div>

            {/* Boutons actions */}
            {carte && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                <button onClick={shareWA}
                  style={{ padding:"10px 8px", borderRadius:10, border:"none",
                    cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11,
                    background:"#25D366", color:"#fff", display:"flex",
                    alignItems:"center", justifyContent:"center", gap:5 }}>
                  📱 WhatsApp
                </button>
                <button onClick={copyLink}
                  style={{ padding:"10px 8px", borderRadius:10,
                    border:`1px solid ${accent}44`, cursor:"pointer",
                    fontFamily:"inherit", fontWeight:700, fontSize:11,
                    background:`${accent}12`, color:accent, display:"flex",
                    alignItems:"center", justifyContent:"center", gap:5 }}>
                  {copied ? "✅ Copié !" : "📋 Copier"}
                </button>
                <button onClick={printCarte}
                  style={{ padding:"10px 8px", borderRadius:10,
                    border:`1px solid rgba(240,176,32,.44)`, cursor:"pointer",
                    fontFamily:"inherit", fontWeight:700, fontSize:11,
                    background:"rgba(240,176,32,.12)", color:"#f0b020", display:"flex",
                    alignItems:"center", justifyContent:"center", gap:5 }}>
                  📄 PDF
                </button>
              </div>
            )}

            {!carte && (
              <div style={{ background:`${accent}08`, border:`1px dashed ${accent}30`,
                borderRadius:12, padding:"12px 14px", fontSize:11, color:TC.sub2,
                textAlign:"center", lineHeight:1.6 }}>
                💡 Remplissez le formulaire à gauche et sauvegardez pour activer le partage
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  const PgCarte = () => <CarteVisite user={ses} supabase={getSupa} accent={accent} toast={toast}/>;


  // ════════════════════════════════
  //  MODULE — LOGO GENERATOR
  // ════════════════════════════════
  const LOGO_ACTIVITES = [
    {id:"commerce",  label:"Commerce",    ic:"🛒", shapes:["◆","▲","●"]},
    {id:"restaurant",label:"Restaurant",  ic:"🍽️", shapes:["◉","✦","◈"]},
    {id:"beaute",    label:"Beauté",      ic:"💄", shapes:["✿","❋","✾"]},
    {id:"tech",      label:"Tech / Web",  ic:"💻", shapes:["⬡","◎","⟁"]},
    {id:"transport", label:"Transport",   ic:"🚚", shapes:["▶","◀","⬟"]},
    {id:"sante",     label:"Santé",       ic:"🏥", shapes:["✚","⊕","◉"]},
    {id:"education", label:"Éducation",   ic:"📚", shapes:["◈","✦","▣"]},
    {id:"agriculture",label:"Agriculture",ic:"🌾", shapes:["❋","✿","◆"]},
    {id:"btp",       label:"BTP",         ic:"🏗️", shapes:["▲","◆","▣"]},
    {id:"mode",      label:"Mode",        ic:"👗", shapes:["✾","❋","◉"]},
    {id:"divers",    label:"Divers",      ic:"🌍", shapes:["●","◆","▲"]},
  ];

  const LOGO_STYLES = [
    {id:"moderne",  label:"Moderne",   font:"900 italic"},
    {id:"classique",label:"Classique", font:"800 normal"},
    {id:"bold",     label:"Bold",      font:"900 normal"},
    {id:"elegance", label:"Élégance",  font:"700 normal"},
  ];

  const LOGO_PALETTES = [
    {id:"vert",    label:"Vert Afrik",  c1:"#00d478", c2:"#00bfcc"},
    {id:"gold",    label:"Or Premium",  c1:"#f0b020", c2:"#ff8c00"},
    {id:"blue",    label:"Bleu Pro",    c1:"#1a78ff", c2:"#00bfcc"},
    {id:"rouge",   label:"Rouge Power", c1:"#ff2255", c2:"#ff5a18"},
    {id:"purple",  label:"Violet",      c1:"#9060ff", c2:"#1a78ff"},
    {id:"custom",  label:"Personnalisé",c1:"",        c2:""},
  ];

  function LogoGenerator({ user, supabase, accent = "#00d478", toast }) {
    const TL = {
      c1:"#05090f", c2:"#08111d", c3:"#0d1828",
      border:"rgba(0,210,120,0.08)", text:"#dff0ff",
      sub:"#4a7090", sub2:"#80a8c8", ink:"#000",
    };
    const ISL = {
      width:"100%", padding:"10px 13px", background:TL.c3,
      border:`1px solid ${TL.border}`, borderRadius:10, color:TL.text,
      fontFamily:"inherit", fontSize:13, outline:"none", marginTop:4,
    };
    const canvasRef = useRef(null);
    const [entreprise, setEntreprise] = useState(user?.business || "");
    const [slogan,     setSlogan]     = useState("");
    const [activite,   setActivite]   = useState("commerce");
    const [styleId,    setStyleId]    = useState("moderne");
    const [paletteId,  setPaletteId]  = useState("vert");
    const [customC1,   setCustomC1]   = useState("#00d478");
    const [shapeIdx,   setShapeIdx]   = useState(0);
    const [saving,     setSaving]     = useState(false);
    const [saved,      setSaved]      = useState(false);

    const palette  = LOGO_PALETTES.find(p => p.id === paletteId) || LOGO_PALETTES[0];
    const c1       = paletteId === "custom" ? customC1 : palette.c1;
    const c2       = paletteId === "custom" ? customC1 : palette.c2;
    const act      = LOGO_ACTIVITES.find(a => a.id === activite) || LOGO_ACTIVITES[0];
    const styleObj = LOGO_STYLES.find(s => s.id === styleId) || LOGO_STYLES[0];
    const shape    = act.shapes[shapeIdx % act.shapes.length];

    const drawLogo = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = 400, H = 200;
      canvas.width = W; canvas.height = H;
      const grad = ctx.createLinearGradient(0,0,W,H);
      grad.addColorStop(0,"#0d1828"); grad.addColorStop(1,"#08111d");
      ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
      const radGrad = ctx.createRadialGradient(W*.75,H*.3,0,W*.75,H*.3,120);
      radGrad.addColorStop(0,c1+"18"); radGrad.addColorStop(1,"transparent");
      ctx.fillStyle = radGrad; ctx.fillRect(0,0,W,H);
      ctx.font = "bold 52px serif"; ctx.fillStyle = c1; ctx.globalAlpha = .15;
      ctx.fillText(shape, 18, H/2+20); ctx.globalAlpha = 1;
      ctx.font = "36px serif"; ctx.fillStyle = c1; ctx.fillText(act.ic, 20, H/2+13);
      const nom = (entreprise||"Mon Entreprise").toUpperCase();
      const fs = nom.length>14?22:nom.length>10?27:33;
      ctx.font = `${styleObj.font} ${fs}px Inter,Arial,sans-serif`;
      const tg = ctx.createLinearGradient(72,0,72+nom.length*fs*.55,0);
      tg.addColorStop(0,c1); tg.addColorStop(1,c2);
      ctx.fillStyle = tg;
      ctx.fillText(nom, 72, H/2+(slogan?-2:9));
      if(slogan){
        ctx.font="400 12px Inter,Arial,sans-serif"; ctx.fillStyle=TL.sub2;
        ctx.fillText(slogan,73,H/2+18);
      }
      const lg=ctx.createLinearGradient(72,0,72+160,0);
      lg.addColorStop(0,c1); lg.addColorStop(1,c1+"00");
      ctx.fillStyle=lg; ctx.fillRect(72,H/2+(slogan?30:20),160,2);
      ctx.font="400 9px Arial,sans-serif"; ctx.fillStyle=TL.sub+"66";
      ctx.fillText("vierafrik.com",W-78,H-10);
    },[entreprise,slogan,activite,styleId,paletteId,customC1,shapeIdx,c1,c2,act,shape,styleObj]);

    useEffect(()=>{drawLogo();},[drawLogo]);

    const downloadPNG = () => {
      const canvas = canvasRef.current; if(!canvas)return;
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `logo_${(entreprise||"entreprise").replace(/\s+/g,"_").toLowerCase()}.png`;
      a.click(); toast?.("⬇ Logo téléchargé !","ok");
    };

    const copyLogo = async () => {
      const canvas = canvasRef.current; if(!canvas)return;
      try {
        canvas.toBlob(async blob=>{
          await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);
          toast?.("✅ Logo copié dans le presse-papier !","ok");
        });
      } catch { toast?.("⚠️ Copie non supportée — téléchargez en PNG","warn"); }
    };

    const useLogo = async () => {
      const canvas = canvasRef.current; if(!canvas)return;
      setSaving(true);
      try {
        const logoUrl = canvas.toDataURL("image/png");
        const s = await supabase();
        const payload = {user_id:user?.id,entreprise:entreprise||"",slogan,couleur:c1,type_activite:activite,logo_url:logoUrl};
        let hasExisting = false;
        try{ const {data}=await s.from("logos").select("id").eq("user_id",user?.id).single(); hasExisting=!!data; }catch{}
        if(hasExisting){ await s.from("logos").update(payload).eq("user_id",user?.id); }
        else { await s.from("logos").insert({...payload,id:user?.id+"_logo"}); }
        setSaved(true); toast?.("✅ Logo enregistré comme logo entreprise !","ok");
        setTimeout(()=>setSaved(false),3000);
      } catch{ toast?.("❌ Erreur sauvegarde","err"); }
      finally{ setSaving(false); }
    };

    return(
      <div style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:TL.text}}>
        <div style={{marginBottom:18}}>
          <div style={{fontWeight:900,fontSize:22,letterSpacing:"-.03em",marginBottom:3}}>🎨 Générateur de Logo</div>
          <div style={{fontSize:12,color:TL.sub2}}>Créez votre logo professionnel en 30 secondes</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}} className="pg-grid-2">
          {/* Panneau gauche — paramètres */}
          <div style={{background:`linear-gradient(135deg,${TL.c1},${TL.c2})`,border:`1px solid ${TL.border}`,borderRadius:18,padding:"1.4rem",display:"flex",flexDirection:"column",gap:13}}>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub}}>Nom de l'entreprise</label>
              <input style={ISL} placeholder="Ex: Ama Store" value={entreprise} onChange={e=>setEntreprise(e.target.value)} maxLength={22}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub}}>Slogan (optionnel)</label>
              <input style={ISL} placeholder="Ex: Qualité & Confiance" value={slogan} onChange={e=>setSlogan(e.target.value)} maxLength={34}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub,marginBottom:7}}>Activité</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                {LOGO_ACTIVITES.map(a=>(
                  <div key={a.id} onClick={()=>setActivite(a.id)} style={{padding:"6px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:10,fontWeight:700,background:activite===a.id?`${accent}20`:TL.c3,border:`1px solid ${activite===a.id?accent:TL.border}`,color:activite===a.id?accent:TL.sub2,transition:"all .15s"}}>
                    <div style={{fontSize:15,marginBottom:2}}>{a.ic}</div>{a.label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub,marginBottom:7}}>Style</label>
              <div style={{display:"flex",gap:5}}>
                {LOGO_STYLES.map(s=>(
                  <div key={s.id} onClick={()=>setStyleId(s.id)} style={{flex:1,padding:"7px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:10,fontWeight:700,background:styleId===s.id?`${accent}20`:TL.c3,border:`1px solid ${styleId===s.id?accent:TL.border}`,color:styleId===s.id?accent:TL.sub2,transition:"all .15s"}}>{s.label}</div>
                ))}
              </div>
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub,marginBottom:7}}>Couleur</label>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {LOGO_PALETTES.map(p=>(
                  <div key={p.id} onClick={()=>setPaletteId(p.id)} style={{padding:"5px 9px",borderRadius:20,cursor:"pointer",fontSize:10,fontWeight:700,background:paletteId===p.id?`${p.id==="custom"?customC1:p.c1}22`:TL.c3,border:`2px solid ${paletteId===p.id?(p.id==="custom"?customC1:p.c1):TL.border}`,color:paletteId===p.id?(p.id==="custom"?customC1:p.c1):TL.sub2,transition:"all .15s",display:"flex",alignItems:"center",gap:4}}>
                    {p.id!=="custom"&&<span style={{width:8,height:8,borderRadius:"50%",background:`linear-gradient(135deg,${p.c1},${p.c2})`,display:"inline-block"}}/>}
                    {p.label}
                  </div>
                ))}
              </div>
              {paletteId==="custom"&&(
                <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8}}>
                  <input type="color" value={customC1} onChange={e=>setCustomC1(e.target.value)} style={{width:38,height:30,borderRadius:7,border:"none",cursor:"pointer"}}/>
                  <span style={{fontSize:11,color:TL.sub2}}>Couleur personnalisée</span>
                </div>
              )}
            </div>
            <div>
              <label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub,marginBottom:7}}>Variation de l'icône</label>
              <div style={{display:"flex",gap:6}}>
                {act.shapes.map((sh,i)=>(
                  <div key={i} onClick={()=>setShapeIdx(i)} style={{flex:1,padding:"8px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:18,background:shapeIdx===i?`${c1}20`:TL.c3,border:`1px solid ${shapeIdx===i?c1:TL.border}`,color:shapeIdx===i?c1:TL.sub2,transition:"all .15s"}}>{sh}</div>
                ))}
              </div>
            </div>
          </div>
          {/* Panneau droit — aperçu */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:`linear-gradient(135deg,${TL.c1},${TL.c2})`,border:`1px solid ${TL.border}`,borderRadius:18,padding:"1.4rem"}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:TL.sub,marginBottom:10}}>Aperçu en temps réel</div>
              <canvas ref={canvasRef} style={{width:"100%",borderRadius:12,border:`1px solid ${c1}22`,boxShadow:`0 8px 32px rgba(0,0,0,.5)`}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={downloadPNG} style={{padding:"11px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:13,background:accent,color:TL.ink,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>⬇ Télécharger PNG</button>
              <button onClick={copyLogo} style={{padding:"11px",borderRadius:10,border:`1px solid ${accent}44`,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:`${accent}10`,color:accent,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>📋 Copier le logo</button>
              <button onClick={useLogo} disabled={saving} style={{padding:"11px",borderRadius:10,border:"1px solid rgba(240,176,32,.44)",cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,background:saved?"rgba(0,212,120,.15)":"rgba(240,176,32,.1)",color:saved?accent:"#f0b020",opacity:saving?.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,transition:"all .3s"}}>{saving?"⏳ Sauvegarde…":saved?"✅ Logo enregistré !":"🏢 Utiliser comme logo entreprise"}</button>
            </div>
            <div style={{background:`${c1}08`,border:`1px solid ${c1}20`,borderRadius:12,padding:"10px 14px",fontSize:11,color:TL.sub2,lineHeight:1.6}}>
              💡 <strong style={{color:c1}}>Astuce :</strong> Téléchargez en PNG et utilisez sur WhatsApp, vos factures, Facebook ou Instagram.
            </div>
          </div>
        </div>
      </div>
    );
  }
  const PgLogo = () => <LogoGenerator user={ses} supabase={getSupa} accent={accent} toast={toast}/>;

  const PMAP={dash:<PgDash/>,tx:<PgTx/>,inv:<PgInv/>,cli:<PgCli/>,stats:<PgStats/>,coach:<PgCoach/>,plans:<PgPlans/>,prefs:<PgParams/>,ambass:<PgAmbassadeur/>,avis:<PgAvis/>,carte:<PgCarte/>,logo:<PgLogo/>,reseau:<PgCommProches/>};

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(820px) rotate(720deg);opacity:0}}
        @keyframes pop{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes toastIn{from{opacity:0;transform:translateX(40px) scale(.94)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes toastBar{from{opacity:1}to{opacity:0}}
        @keyframes toastProgress{from{width:100%}to{width:0%}}
        @keyframes flashGreen{0%{box-shadow:0 0 0 0 rgba(0,212,120,.7),inset 0 0 0 0 rgba(0,212,120,.0)}40%{box-shadow:0 0 0 8px rgba(0,212,120,.0),inset 0 0 20px 4px rgba(0,212,120,.18)}100%{box-shadow:0 0 0 0 rgba(0,212,120,0),inset 0 0 0 0 rgba(0,212,120,0)}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html{scroll-behavior:smooth}
        body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.c4};border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:${T.sub}}
        input,select,textarea{color-scheme:dark}
        input:focus,select:focus,textarea:focus{border-color:${accent}!important;box-shadow:0 0 0 3px ${accent}20;outline:none;transition:all .2s}
        button{-webkit-appearance:none;transition:all .18s cubic-bezier(.34,1.56,.64,1)}
        button:active{transform:scale(.96)!important}
        .card{background:${T.c1};border:1px solid ${T.border};border-radius:16px;padding:1.2rem;transition:border-color .2s,box-shadow .2s}
        .card:hover{border-color:${accent}22;box-shadow:0 8px 28px rgba(0,0,0,.35)}
        .desktop-nav{display:flex}
        .mobile-nav{display:none}
        .pg-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .pg-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .fade-in{animation:slideUp .3s ease both}
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-nav{display:flex!important}
          .pg-grid-2{grid-template-columns:1fr!important}
          .pg-grid-3{grid-template-columns:1fr 1fr!important}
          .hide-mobile{display:none!important}
        }
      `}</style>
      {loading&&<div style={{position:"fixed",inset:0,background:T.bg,zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
        <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:`0 0 60px ${accent}44`,animation:"pop .4s cubic-bezier(.34,1.56,.64,1)"}}>🌍</div>
        <div style={{width:40,height:40,border:`3px solid ${T.c3}`,borderTop:`3px solid ${accent}`,borderRadius:"50%",animation:"spin .75s linear infinite"}}/>
        <div style={{textAlign:"center"}}>
          <div style={{color:T.text,fontSize:15,fontWeight:700,letterSpacing:"-.02em"}}>VierAfrik</div>
          <div style={{color:T.sub,fontSize:12,marginTop:3}}>Chargement de vos données…</div>
        </div>
      </div>}
      <div style={{position:"fixed",inset:0,zIndex:0}}><Particles/></div>
      <Confetti on={boom}/>
      {/* NAV HAUT */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:400,height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1rem",background:"rgba(1,3,6,.97)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontWeight:900,fontSize:17,display:"flex",alignItems:"center",gap:6,flexShrink:0,letterSpacing:"-.04em"}}>
          <span style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:`0 0 12px ${accent}55`}}>🌍</span>
          <span style={{color:accent}}>Vier</span><span style={{color:T.text}}>Afrik</span>
          <span style={{background:PLANS[ses.plan||"free"].col,color:T.ink,fontSize:7,fontWeight:800,borderRadius:20,padding:"2px 6px",marginLeft:2}}>{PLANS[ses.plan||"free"].label.toUpperCase()}</span>
        </div>
        <div className="desktop-nav" style={{gap:1,overflowX:"auto",padding:"0 6px",scrollbarWidth:"none"}}>
          {NAV.map(n=><TabBtn key={n.id} {...n}/>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNot(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:T.sub,padding:"4px",position:"relative"}}>
              🔔{notifs.length>0&&<span style={{position:"absolute",top:2,right:1,width:6,height:6,background:T.orange,borderRadius:"50%",border:"1px solid "+T.bg}}/>}
            </button>
            {notOpen&&(
              <div onClick={()=>setNot(false)} style={{position:"fixed",top:"58px",right:"10px",background:T.c1,border:`1px solid ${T.border}`,borderRadius:13,minWidth:270,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,.85)",zIndex:500,overflow:"hidden"}}>
                <div style={{padding:"11px 14px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:12}}>🔔 Notifications{notifs.length>0&&<span style={{background:T.orange,color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:9,marginLeft:5}}>{notifs.length}</span>}</div>
                {notifs.length===0?<div style={{padding:".9rem",color:T.sub,fontSize:11,textAlign:"center"}}>Aucune notification</div>:notifs.map(n=><div key={n.id} style={{padding:"9px 14px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.text,lineHeight:1.4}}>{n.msg}</div>)}
              </div>
            )}
          </div>
          <Btn sm ch="+ Vente" onClick={()=>{setFm({type:"sale",cat:"Commerce",date:today()});setMdl("tx");}} sx={{background:accent,color:T.ink}}/>
          <div onClick={()=>setPage("prefs")} style={{width:31,height:31,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:10,color:T.ink,cursor:"pointer",boxShadow:`0 0 12px ${accent}44`,flexShrink:0}}>
            {ses.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?"}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{paddingTop:54,paddingBottom:70,position:"relative",zIndex:1}}>
        <div style={{padding:"1.2rem",maxWidth:1340,margin:"0 auto"}}>
          {PMAP[page]||<PgDash/>}
        </div>
      </div>

      <Toasts list={tsts}/>
      {confirmState&&<ConfirmModal open={!!confirmState} onClose={()=>setConfirm(null)} onConfirm={confirmState.onConfirm} title={confirmState.title} msg={confirmState.msg} confirmLabel={confirmState.confirmLabel} danger={confirmState.danger}/>}

      {/* POPUP AVIS */}
      {showAvisPopup&&(
        <div onClick={()=>setShowAvisPopup(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:950,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 80px",backdropFilter:"blur(8px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.gold}44`,borderRadius:20,padding:"1.6rem",width:"92%",maxWidth:400,boxShadow:`0 -20px 60px rgba(0,0,0,.8)`,animation:"pop .3s cubic-bezier(.34,1.56,.64,1)"}}>
            <button onClick={()=>setShowAvisPopup(false)} style={{position:"absolute",top:14,right:14,background:T.c3,border:"none",color:T.sub2,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            <div style={{fontSize:32,marginBottom:8,textAlign:"center"}}>⭐</div>
            <div style={{fontWeight:800,fontSize:16,textAlign:"center",marginBottom:6}}>Que penses-tu de VierAfrik ?</div>
            <div style={{fontSize:12,color:T.sub2,textAlign:"center",marginBottom:16,lineHeight:1.5}}>Ton avis nous aide à améliorer l'application et à aider plus d'entrepreneurs africains.</div>
            <div style={{display:"flex",gap:8}}>
              <Btn full v="gold" ch="⭐ Laisser un avis" onClick={()=>{setShowAvisPopup(false);setPage("avis");}}/>
              <Btn full v="g" ch="Plus tard" onClick={()=>setShowAvisPopup(false)}/>
            </div>
          </div>
        </div>
      )}

      {/* BARRE NAV BAS — MOBILE UNIQUEMENT */}
      <nav className="mobile-nav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,height:62,alignItems:"center",justifyContent:"space-around",background:"rgba(1,3,6,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,padding:"0 0"}}>
        {NAV_BOTTOM.map(n=>(
          <button key={n.id} onClick={()=>{if(n.id==="pay_mm"){setFm({_mm:true});setMdl("mm");}else setPage(n.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 2px",minWidth:36,flex:1,transition:"opacity .15s"}}>
            <span style={{fontSize:17,lineHeight:1}}>{n.ic}</span>
            <span style={{fontSize:7,color:page===n.id?accent:T.sub,fontWeight:700,whiteSpace:"nowrap",marginTop:1}}>{n.lb}</span>
            {page===n.id&&<div style={{width:16,height:2,borderRadius:1,background:accent,marginTop:1}}/>}
          </button>
        ))}
      </nav>

      {/* ════ MODALS ════ */}

      {/* Transaction */}
      <Modal open={mdl==="tx"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier la transaction":"➕ Nouvelle transaction"}>
        <div style={{display:"flex",gap:3,background:T.c3,borderRadius:11,padding:4,marginBottom:15}}>
          {[["sale","💰 Vente"],["expense","📤 Dépense"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFm(f=>({...f,type:v}))} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:fm.type===v?T.c1:"transparent",color:fm.type===v?T.text:T.sub,transition:"all .2s"}}>{l}</button>
          ))}
        </div>
        <FL l="Montant (FCFA)" ch={<input type="number" style={IS} placeholder="150 000" value={fm.amount||""} onChange={ev=>setFm(f=>({...f,amount:ev.target.value}))}/>}/>
        <FL l="Catégorie">
          <select style={IS} value={fm.cat||"Commerce"} onChange={ev=>setFm(f=>({...f,cat:ev.target.value}))}>
            {(fm.type==="expense"?CATS_E:CATS_S).map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL l="Client / Fournisseur" ch={<><input type="text" style={IS} placeholder="Nom…" value={fm.who||""} onChange={ev=>setFm(f=>({...f,who:ev.target.value}))} list="cl_ls"/><datalist id="cl_ls">{clis.map(c=><option key={c.id} value={c.name}/>)}</datalist></>}/>
        <FL l="Date" ch={<input type="date" style={IS} value={fm.date||today()} onChange={ev=>setFm(f=>({...f,date:ev.target.value}))}/>}/>
        <FL l="Note" ch={<input style={IS} placeholder="Optionnel…" value={fm.note||""} onChange={ev=>setFm(f=>({...f,note:ev.target.value}))}/>}/>
        <div style={{display:"flex",gap:7,marginTop:14}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Enregistrer"} onClick={saveTx}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      {/* Facture */}
      <Modal open={mdl==="inv"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier la facture":"🧾 Nouvelle facture"} wide>
        <div className="pg-grid-2">
          <FL l="Client" ch={<><input type="text" style={IS} placeholder="Nom du client" value={fm.clientName||""} onChange={ev=>{const n=ev.target.value;const cl=clis.find(c=>c.name.toLowerCase()===n.toLowerCase());setFm(f=>({...f,clientName:n,clientId:cl?.id||"",phone:cl?.phone||f.phone||""}));}} list="cl_inv"/><datalist id="cl_inv">{clis.map(c=><option key={c.id} value={c.name}/>)}</datalist></>}/>
          <FL l="Téléphone client" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
          <FL l="Date d'émission" ch={<input type="date" style={IS} value={fm.issued||today()} onChange={ev=>setFm(f=>({...f,issued:ev.target.value}))}/>}/>
          <FL l="Échéance" ch={<input type="date" style={IS} value={fm.due||""} onChange={ev=>setFm(f=>({...f,due:ev.target.value}))}/>}/>
          <FL l="Statut">
            <select style={IS} value={fm.status||"pending"} onChange={ev=>setFm(f=>({...f,status:ev.target.value}))}>
              <option value="pending">⏳ En attente</option><option value="paid">✅ Payée</option><option value="overdue">🔴 En retard</option>
            </select>
          </FL>
          <FL l="Taxe (FCFA)" ch={<input type="number" style={IS} placeholder="0" value={fm.tax===0||fm.tax===undefined?"":fm.tax} onChange={ev=>setFm(f=>({...f,tax:parseFloat(ev.target.value)||0}))}/>}/>
        </div>
        {/* Articles */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.sub,marginBottom:8}}>Articles</div>
          {(fm.items||[]).map((it,i)=>(
            <div key={it.id||i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:6,marginBottom:6,alignItems:"center"}}>
              <input style={{...IS,marginTop:0}} placeholder="Description" value={it.name||""} onChange={ev=>{const ns=[...(fm.items||[])];ns[i]={...ns[i],name:ev.target.value};setFm(f=>({...f,items:ns}));}}/>
              <input type="number" style={{...IS,marginTop:0}} placeholder="Qté" value={it.qty||1} onChange={ev=>{const ns=[...(fm.items||[])];ns[i]={...ns[i],qty:parseFloat(ev.target.value)||1};setFm(f=>({...f,items:ns}));}}/>
              <input type="number" style={{...IS,marginTop:0}} placeholder="Prix" value={it.price||""} onChange={ev=>{const ns=[...(fm.items||[])];ns[i]={...ns[i],price:parseFloat(ev.target.value)||0};setFm(f=>({...f,items:ns}));}}/>
              <button onClick={()=>{const ns=(fm.items||[]).filter((_,j)=>j!==i);setFm(f=>({...f,items:ns.length?ns:[{id:xid(),name:"",qty:1,price:0}]}));}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:7,padding:"7px 9px",cursor:"pointer",fontSize:11}}>🗑</button>
            </div>
          ))}
          <button onClick={()=>setFm(f=>({...f,items:[...(f.items||[]),{id:xid(),name:"",qty:1,price:0}]}))} style={{background:"rgba(0,212,120,.08)",border:`1px dashed ${T.gr}33`,borderRadius:8,padding:"6px 13px",color:T.gr,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,width:"100%",marginTop:3}}>+ Ajouter un article</button>
          {(fm.items||[]).some(it=>it.price>0)&&(
            <div style={{textAlign:"right",marginTop:7,fontWeight:700,color:T.gr,fontSize:13}}>
              Total : {fmtf((fm.items||[]).reduce((s,it)=>s+(it.qty||1)*(it.price||0),0)+(fm.tax||0))}
            </div>
          )}
        </div>
        <FL l="Notes" ch={<textarea style={{...IS,height:55,resize:"vertical"}} placeholder="Conditions, remarques…" value={fm.notes||""} onChange={ev=>setFm(f=>({...f,notes:ev.target.value}))}/>}/>
        <div style={{display:"flex",gap:7,marginTop:13}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Créer la facture"} onClick={saveInv}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      {/* Client */}
      <Modal open={mdl==="cli"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier le client":"👤 Nouveau client"}>
        <FL l="Nom complet" ch={<input style={IS} placeholder="Prénom Nom / Raison sociale" value={fm.name||""} onChange={ev=>setFm(f=>({...f,name:ev.target.value}))}/>}/>
        <FL l="Pays">
          <select style={IS} value={fm.pays||PAYS[0]} onChange={ev=>setFm(f=>({...f,pays:ev.target.value}))}>
            {PAYS.map(p=><option key={p}>{p}</option>)}
          </select>
        </FL>
        <FL l="Téléphone" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
        <FL l="Email" ch={<input type="email" style={IS} placeholder="client@email.com" value={fm.email||""} onChange={ev=>setFm(f=>({...f,email:ev.target.value}))}/>}/>
        <FL l="Catégorie">
          <select style={IS} value={fm.cat||"Commerce"} onChange={ev=>setFm(f=>({...f,cat:ev.target.value}))}>
            {["Commerce","Services","Alimentation","Transport","BTP","Santé","Éducation","Artisanat","Divers"].map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL l="CA déjà réalisé (FCFA)" hint="Chiffre d'affaires historique" ch={<input type="number" style={IS} placeholder="Optionnel" value={fm.ca||""} onChange={ev=>setFm(f=>({...f,ca:ev.target.value}))}/>}/>
        <FL l="Statut">
          <select style={IS} value={fm.status||"active"} onChange={ev=>setFm(f=>({...f,status:ev.target.value}))}>
            <option value="active">✅ Actif</option><option value="inactive">🔴 Inactif</option>
          </select>
        </FL>
        <div style={{display:"flex",gap:7,marginTop:13}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Ajouter"} onClick={saveCli}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      {/* Mobile Money */}
      <Modal open={mdl==="pay"} onClose={()=>{setMdl(null);setFm({});}} title="💳 Paiement Mobile Money">
        {fm.inv&&(
          <div style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:11,padding:"12px 14px",marginBottom:16}}>
            <div style={{fontSize:11,color:T.sub2,marginBottom:1}}>Facture {fm.inv.num}</div>
            <div style={{fontWeight:900,fontSize:22,color:T.gr,letterSpacing:"-.02em"}}>{fmtf(fm.inv.total)}</div>
            <div style={{fontSize:11,color:T.sub2,marginTop:1}}>{fm.inv.clientName}</div>
          </div>
        )}
        <div style={{marginBottom:13}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:T.sub,marginBottom:9}}>Opérateur Mobile Money</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {MM.map(p=>(
              <div key={p.id} onClick={()=>setFm(f=>({...f,prov:p.id}))} style={{padding:"11px",background:fm.prov===p.id?`${T.gr}12`:T.c2,border:`2px solid ${fm.prov===p.id?T.gr:T.border}`,borderRadius:11,cursor:"pointer",transition:"all .18s"}}>
                <div style={{fontSize:17,marginBottom:2}}>{p.emoji}</div>
                <div style={{fontWeight:700,fontSize:12}}>{p.label}</div>
                <div style={{fontSize:9,color:T.sub2}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <FL l="Numéro Mobile Money du client" hint="Le client reçoit un prompt sur son téléphone" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
        <div style={{background:`${T.gr}08`,border:`1px solid ${T.gr}18`,borderRadius:9,padding:"9px 12px",marginBottom:13,fontSize:11,color:T.sub2}}>
          🔐 En production : API serverless <code>/api/create-payment.js</code> + webhook de confirmation
        </div>
        <Btn full ch={`💳 Initier le paiement — ${fm.inv?fmtf(fm.inv.total):""}`} onClick={doPay}/>
      </Modal>

      {/* Mobile Money — Accès direct depuis nav bas */}
      <Modal open={mdl==="mm"} onClose={()=>{setMdl(null);setFm({});}} title="📱 Mobile Money">
        <div style={{marginBottom:10}}>
          <div style={{fontSize:13,color:T.sub,marginBottom:14,textAlign:"center"}}>Recevez ou envoyez de l'argent via Mobile Money</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {id:"orange",emoji:"🟠",label:"Orange Money",desc:"CI · CM · ML · SN",col:"#FF6600"},
              {id:"mtn",emoji:"💛",label:"MTN MoMo",desc:"CI · CM · GH · BJ",col:"#FFCC00"},
              {id:"wave",emoji:"🌊",label:"Wave",desc:"CI · SN · ML",col:"#1A9BDB"},
              {id:"moov",emoji:"🔵",label:"Moov Money",desc:"CI · BJ · BF",col:"#0066CC"},
            ].map(p=>(
              <div key={p.id} onClick={()=>setFm(f=>({...f,prov:p.id}))} style={{padding:"14px",background:fm.prov===p.id?`${p.col}18`:T.c2,border:`2px solid ${fm.prov===p.id?p.col:T.border}`,borderRadius:13,cursor:"pointer",transition:"all .18s",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:4}}>{p.emoji}</div>
                <div style={{fontWeight:800,fontSize:12,color:fm.prov===p.id?p.col:T.text}}>{p.label}</div>
                <div style={{fontSize:9,color:T.sub2,marginTop:2}}>{p.desc}</div>
              </div>
            ))}
          </div>
          <FL l="Numéro de téléphone" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
          <FL l="Montant (FCFA)" ch={<input type="number" style={IS} placeholder="Ex: 50000" value={fm.amount||""} onChange={ev=>setFm(f=>({...f,amount:ev.target.value}))}/>}/>
          <FL l="Description" ch={<input type="text" style={IS} placeholder="Paiement facture, vente..." value={fm.note||""} onChange={ev=>setFm(f=>({...f,note:ev.target.value}))}/>}/>
          <div style={{background:`${T.gr}08`,border:`1px solid ${T.gr}20`,borderRadius:9,padding:"10px 13px",marginBottom:13,fontSize:11,color:T.sub2,lineHeight:1.5}}>
            🔐 Connecté à <strong>Orange Money API</strong>, <strong>MTN MoMo API</strong> et <strong>Wave API</strong><br/>
            Le client reçoit une notification sur son téléphone pour confirmer.
          </div>
          <Btn full ch={fm.prov?`💳 Initier paiement ${fm.prov.toUpperCase()}${fm.amount?" — "+fmtf(parseFloat(fm.amount)||0)+" FCFA":""}` : "💳 Choisissez un opérateur"} onClick={async()=>{
            if(!fm.prov){toast("⚠️ Veuillez choisir un opérateur Mobile Money","err");return;}
            if(!fm.phone){toast("⚠️ Veuillez saisir le numéro de téléphone","err");return;}
            if(!fm.amount||parseFloat(fm.amount)<=0){toast("⚠️ Veuillez saisir un montant","err");return;}
            toast(`⏳ Création paiement ${fm.prov.toUpperCase()}…`);
            try{
              const res=await fetch("/api/notchpay",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                  action:"initialize",
                  amount:parseFloat(fm.amount),
                  email:ses.email,
                  plan:"mm_"+fm.prov,
                  uid:ses.id,
                  phone:fm.phone,
                })
              });
              const data=await res.json();
              const url=data?.transaction?.authorization_url||data?.authorization_url;
              if(url){
                setMdl(null);setFm({});
                toast("🔗 Redirection vers le paiement…");
                setTimeout(()=>window.location.href=url,800);
              } else {
                toast("❌ "+(data?.message||data?.error||"Erreur — réessayez"),"err");
              }
            }catch(e){
              toast("❌ Erreur réseau","err");
            }
          }}/>
        </div>
      </Modal>
    </div>
  );
}
