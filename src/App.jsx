import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Notchpay — Clé publique live
const NOTCHPAY_PK="pk.sAM1JD0mJGWiNlPbwwuxTVfnrz3U7tRIrvDcaeQMm7btmZEuBwNeUKLLWmRWGavgynKMGbh3WhHJUX5VeRGueBwPkjBF9aF2vI7v0v0o5iL1HL2q7TMq5TtoxnS4q";


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

const SUPA_URL = "https://oexzpfygeunehkcpoukv.supabase.co";
const SUPA_KEY = "sb_publishable_Lv5dex98pKdLnq1Sz_XvZQ_oz3vJaL6";
let _supa = null;
const getSupa = async () => {
  if(_supa) return _supa;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2');
  _supa = createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true}});
  return _supa;
};

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

const markUserActive = async (userId) => {
  try {
    const s = await getSupa();
    const {data} = await s
      .from("user_activity")
      .select("action_count, user_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      await s.from("user_activity").update({
        user_active: true,
        action_count: (data.action_count||0) + 1,
        last_action_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      await s.from("user_activity").insert({
        user_id: userId,
        user_active: true,
        action_count: 1,
        last_action_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
  } catch(e) {
    console.error("markUserActive error:", e);
  }
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
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}88)`,
        animation:"toastBar 3.2s linear forwards",borderRadius:"16px 16px 0 0"}}/>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px 13px"}}>
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
//  AUTH PAGE
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
      if(tab==="reset"){
        const {error}=await supa.auth.resetPasswordForEmail(f.email.toLowerCase(),{redirectTo:"https://vierafrik.com"});
        if(error){setE({email:"Erreur : "+error.message});setL(false);return;}
        setD(true);setL(false);return;
      }
      if(tab==="signup"){
        const {data,error}=await supa.auth.signUp({
          email:f.email.toLowerCase(),password:f.password,
          options:{emailRedirectTo:"https://vierafrik.com",data:{name:f.name.trim(),business:f.business||"Mon Entreprise",plan:"free",accent:T.gr,goal:2500000,phone:"",country:"CI",ref_code:f.name.trim().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12)||"user"+Date.now().toString(36),ref_by:new URLSearchParams(window.location.search).get("ref")||""}}
        });
        if(error){
          if(error.message.includes("already registered")||error.message.includes("already exists")){setE({email:"Email déjà utilisé — connectez-vous"});}
          else{setE({email:"Erreur : "+error.message});}
          setL(false);return;
        }
        const user=data.user;
        if(!user){setE({email:"Erreur inscription. Réessayez."});setL(false);return;}
        if(!data.session){setD(true);setL(false);return;}
        const refBy=new URLSearchParams(window.location.search).get("ref")||"";
        if(refBy&&user){try{const s=await getSupa();await s.from("referrals").insert({ambassador_code:refBy,referred_user_id:user.id,referred_email:f.email.trim(),plan:"free",commission:0,paid:false,verified:false,created_at:new Date().toISOString()});}catch(e){}}
        const refCodeGen=f.name.trim().toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12)||"user"+Date.now().toString(36);
        const u={id:user.id,email:user.email,name:user.user_metadata?.name||f.name.trim(),business:user.user_metadata?.business||f.business||"Mon Entreprise",plan:user.user_metadata?.plan||"free",accent:user.user_metadata?.accent||T.gr,goal:user.user_metadata?.goal||2500000,phone:user.user_metadata?.phone||"",country:user.user_metadata?.country||"CI",refCode:user.user_metadata?.ref_code||refCodeGen,refBy:user.user_metadata?.ref_by||new URLSearchParams(window.location.search).get("ref")||""};
        await seed(u.id);onLogin(u);return;
      }
      const {data,error}=await supa.auth.signInWithPassword({email:f.email.toLowerCase(),password:f.password});
      if(error){
        if(error.message.includes("Invalid login")||error.message.includes("invalid_credentials")||error.message.includes("password")){setE({password:"Email ou mot de passe incorrect."});}
        else if(error.message.includes("Email not confirmed")||error.message.includes("not confirmed")){setE({email:"📧 Email non confirmé. Vérifiez votre boîte mail."});}
        else{setE({email:"Erreur : "+error.message});}
        setL(false);return;
      }
      const user=data.user;
      if(!user){setE({email:"Erreur de connexion. Réessayez."});setL(false);return;}
      const u={id:user.id,email:user.email,name:user.user_metadata?.name||user.email,business:user.user_metadata?.business||"Mon Entreprise",plan:user.user_metadata?.plan||"free",accent:user.user_metadata?.accent||T.gr,goal:user.user_metadata?.goal||2500000,phone:user.user_metadata?.phone||"",country:user.user_metadata?.country||"CI",refCode:user.user_metadata?.ref_code||(user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g,"")||user.id.slice(0,8)),refBy:user.user_metadata?.ref_by||""};
      onLogin(u);
    } catch(err){setE({email:"Erreur réseau. Vérifiez votre connexion."});}
    setL(false);
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}input:focus{border-color:${T.gr}!important;box-shadow:0 0 0 3px rgba(0,212,120,.15)!important;outline:none;transition:all .2s}button{transition:all .18s cubic-bezier(.34,1.56,.64,1)}button:active{transform:scale(.96)}`}</style>
      <div style={{position:"absolute",inset:0}}><Particles/></div>
      <div style={{position:"relative",zIndex:1,width:"95%",maxWidth:430}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${T.gr},${T.teal})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:12,boxShadow:`0 0 50px ${T.gr}44`}}>🌍</div>
          <div style={{fontWeight:900,fontSize:34,letterSpacing:"-.04em",lineHeight:1}}><span style={{color:T.gr}}>Vier</span><span style={{color:T.text}}>Afrik</span></div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:20,padding:"1.8rem",boxShadow:"0 40px 100px rgba(0,0,0,.8)"}}>
          {tab!=="reset"&&(
            <div style={{display:"flex",gap:3,background:T.c3,borderRadius:11,padding:4,marginBottom:20}}>
              {[["login","🔑 Connexion"],["signup","✨ Inscription"]].map(([m,l])=>(
                <button key={m} onClick={()=>{setTab(m);setE({});setF({});}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:tab===m?T.c1:"transparent",color:tab===m?T.text:T.sub,transition:"all .2s"}}>{l}</button>
              ))}
            </div>
          )}
          {done?(
            <div style={{textAlign:"center",padding:"1rem 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>📧</div>
              <div style={{fontWeight:800,fontSize:16,color:T.gr,marginBottom:8}}>{tab==="signup"?"Compte créé !":"Email envoyé !"}</div>
              <div style={{fontSize:13,color:T.sub2,marginBottom:8}}>{tab==="signup"?"Vérifiez votre boîte email et cliquez sur le lien de confirmation.":"Consultez votre boîte mail pour réinitialiser votre mot de passe."}</div>
              <Btn full ch="← Retour connexion" onClick={()=>{setTab("login");setD(false);setF({});}}/>
            </div>
          ):(
            <>
              {tab==="signup"&&(<><FL l="Nom complet" err={e.name} ch={<input style={IS} placeholder="Prénom Nom" value={f.name||""} onChange={s("name")}/>}/><FL l="Nom entreprise" ch={<input style={IS} placeholder="Mon Entreprise SARL" value={f.business||""} onChange={s("business")}/>}/></>)}
              <FL l="Email" err={e.email} ch={<input type="email" style={IS} placeholder="vous@entreprise.com" value={f.email||""} onChange={s("email")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>
              {tab!=="reset"&&(<FL l="Mot de passe" err={e.password} ch={<input type="password" style={IS} placeholder={tab==="signup"?"Minimum 6 caractères":"••••••••"} value={f.password||""} onChange={s("password")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>)}
              {tab==="signup"&&(<FL l="Confirmer le mot de passe" err={e.confirm} ch={<input type="password" style={IS} placeholder="Répétez" value={f.confirm||""} onChange={s("confirm")} onKeyDown={ev=>ev.key==="Enter"&&go()}/>}/>)}
              <Btn full dis={load} onClick={()=>go()} sx={{marginTop:6,fontSize:14}} ch={load?"⏳ Chargement…":tab==="login"?"🔑 Connexion":tab==="signup"?"✨ Créer mon compte":"📧 Envoyer le lien"}/>
              {tab==="login"&&(<div style={{textAlign:"center",marginTop:12}}><button onClick={()=>{setTab("reset");setE({});}} style={{background:"none",border:"none",color:T.sub2,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Mot de passe oublié ?</button></div>)}
              {tab==="reset"&&(<button onClick={()=>{setTab("login");setE({});}} style={{display:"block",margin:"10px auto 0",background:"none",border:"none",color:T.sub2,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>← Retour</button>)}
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
      </div>
    </div>
  );
}

// ════════════════════════════════
//  ROOT
// ════════════════════════════════
export default function App(){
  const [ses,setSes]=useState(undefined);

  const buildUser=(user)=>({
    id:user.id,email:user.email,
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
      const {data:{session}}=await supa.auth.getSession();
      if(session?.user){setSes(buildUser(session.user));}else{setSes(null);}
      const {data}=supa.auth.onAuthStateChange((event,session)=>{
        if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED"){if(session?.user)setSes(buildUser(session.user));}
        else if(event==="SIGNED_OUT"){setSes(null);}
      });
      sub=data.subscription;
    })();
    return()=>{sub?.unsubscribe();};
  },[]);

  const logout=async()=>{const supa=await getSupa();await supa.auth.signOut();setSes(null);};

  const updSes=useCallback(async(upd)=>{
    setSes(prev=>{
      const ns={...prev,...upd};
      getSupa().then(supa=>{supa.auth.updateUser({data:{name:ns.name,business:ns.business,plan:ns.plan,accent:ns.accent,goal:ns.goal,phone:ns.phone,country:ns.country}});});
      return ns;
    });
  },[]);

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
  if(!ses){return <AuthPage onLogin={u=>setSes(u)}/>;}
  return <Dashboard ses={ses} logout={logout} updSes={updSes}/>;
}

// ════════════════════════════════
//  ACTIVITY NOTIF WIDGET (isolé)
// ════════════════════════════════
const ACTIVITY_NOTIFS=[
  {emoji:"👩🏾",msg:"Mariam vient de rejoindre VierAfrik"},
  {emoji:"👨🏿",msg:"Koffi a ajouté sa première vente"},
  {emoji:"🚛",msg:"Moussa a trouvé un client Transport"},
  {emoji:"👩🏿",msg:"Aminata a publié son service Beauté"},
  {emoji:"👨🏾",msg:"Jean a créé sa première facture"},
  {emoji:"🌍",msg:"Fatou a encaissé via Mobile Money"},
  {emoji:"⭐",msg:"Awa est passée en plan Pro"},
  {emoji:"👨🏿",msg:"Kwame a rejoint le Réseau VierAfrik"},
];
function ActivityNotifWidget(){
  const [notif,setNotif]=useState(null);
  useEffect(()=>{
    let idx=0;
    const show=()=>{const n=ACTIVITY_NOTIFS[idx%ACTIVITY_NOTIFS.length];setNotif(n);setTimeout(()=>setNotif(null),3800);idx++;};
    const t1=setTimeout(show,8000);const iv=setInterval(show,18000);
    return()=>{clearTimeout(t1);clearInterval(iv);};
  },[]);
  if(!notif)return null;
  return(
    <div style={{position:"fixed",bottom:76,left:14,zIndex:350,maxWidth:260,animation:"slideUp .4s cubic-bezier(.34,1.56,.64,1)",pointerEvents:"none",userSelect:"none",touchAction:"none"}}>
      <div style={{background:"linear-gradient(135deg,#05090f,#08111d)",border:"1px solid rgba(0,210,120,0.08)",borderRadius:14,padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,.7)",display:"flex",alignItems:"center",gap:10,pointerEvents:"none",userSelect:"none"}}>
        <div style={{width:34,height:34,borderRadius:10,background:"rgba(0,212,120,0.1)",border:"1px solid rgba(0,212,120,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,pointerEvents:"none"}}>{notif.emoji}</div>
        <div style={{pointerEvents:"none"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#dff0ff",lineHeight:1.4}}>{notif.msg}</div>
          <div style={{fontSize:10,color:"#00d478",marginTop:1,fontWeight:600}}>VierAfrik · maintenant</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FIX 1 — PgParams extrait en composant STABLE
// Défini HORS de Dashboard → ne se remonte jamais
// Props stables passées par référence (useCallback/useMemo)
// ══════════════════════════════════════════
const PgParams = React.memo(function PgParams({ ses, txs, clis, invs, allSales, accent, updSes, setConfirm, logout, toast }) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [phoneErr, setPhoneErr] = useState("");

  // État local STABLE — ne dépend PAS du parent
  const [name, setName] = useState(ses.name || "");
  const [biz, setBiz] = useState(ses.business || "");
  const [phone, setPhone] = useState(ses.phone || "");
  const [goal, setGoal] = useState(String(ses.goal || 2500000));

  // Sync si session change (connexion, refresh token)
  useEffect(() => {
    setName(ses.name || "");
    setBiz(ses.business || "");
    setPhone(ses.phone || "");
    setGoal(String(ses.goal || 2500000));
  }, [ses.id]); // uniquement si l'utilisateur change, PAS à chaque keystroke

  const validatePhone = (val) => {
    if (!val || val.trim() === "") return "";
    const clean = val.replace(/[\s\-\.\(\)]/g, "");
    if (!/^[\+\d]/.test(clean)) return "Format invalide — ex: +225 07 000 0000";
    const digits = clean.replace(/\+/g, "");
    if (digits.length < 7) return "Numéro trop court";
    if (digits.length > 15) return "Numéro trop long";
    return "";
  };

  const handleSave = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneErr(err); toast(err, "warn"); return; }
    setSaving(true);
    const g = parseInt(goal) || 2500000;
    await updSes({ name, business: biz, phone, goal: g });
    setSaving(false);
    setSavedAt(new Date());
    toast("✅ Profil sauvegardé avec succès !", "ok", accent);
  };

  const savedLabel = savedAt ? (()=>{
    const d = Math.round((Date.now() - savedAt.getTime()) / 1000);
    return d < 60 ? `Sauvegardé il y a ${d}s` : `Sauvegardé il y a ${Math.round(d/60)}min`;
  })() : null;

  return (
    <div>
      <div style={{ fontWeight:900, fontSize:22, marginBottom:4, letterSpacing:"-.03em" }}>⚙️ Mon Compte</div>
      <div style={{ color:T.sub2, fontSize:12, marginBottom:18 }}>{ses.email}</div>
      <div className="pg-grid-2">
        {/* Profil */}
        <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.4rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${T.border}` }}>
            <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${accent},${T.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:T.ink, flexShrink:0, boxShadow:`0 8px 24px ${accent}44` }}>
              {(ses.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15 }}>{ses.name}</div>
              <div style={{ color:T.sub2, fontSize:11, marginTop:1 }}>{ses.email}</div>
              <div style={{ marginTop:5 }}>
                <span style={{ background:PLANS[ses.plan||"free"].col, color:T.ink, fontSize:9, fontWeight:800, borderRadius:20, padding:"3px 10px" }}>
                  {PLANS[ses.plan||"free"].emoji} {PLANS[ses.plan||"free"].label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontWeight:700, fontSize:11, color:T.sub2, marginBottom:12, textTransform:"uppercase", letterSpacing:".06em" }}>Informations personnelles</div>

          {/* Nom */}
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:T.sub }}>Nom complet</label>
            <input
              style={{ ...IS }}
              placeholder="Prénom Nom"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Business */}
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:T.sub }}>Nom entreprise</label>
            <input
              style={{ ...IS }}
              placeholder="Mon Entreprise"
              value={biz}
              onChange={e => setBiz(e.target.value)}
              autoComplete="organization"
            />
          </div>

          {/* Téléphone */}
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:phoneErr ? T.red : T.sub }}>Téléphone</label>
            <input
              style={{ ...IS, borderColor: phoneErr ? T.red : undefined }}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+225 07 000 0000"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneErr(""); }}
            />
            {phoneErr && <div style={{ fontSize:11, color:T.red, marginTop:2 }}>⚠ {phoneErr}</div>}
            {!phoneErr && <div style={{ fontSize:11, color:T.sub2, marginTop:2 }}>ℹ Format international : +225 07 000 0000</div>}
          </div>

          {/* Objectif */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:T.sub }}>Objectif mensuel (FCFA)</label>
            <input
              style={{ ...IS }}
              type="number"
              inputMode="numeric"
              placeholder="2500000"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            />
          </div>

          <Btn ch={saving ? "⏳ Sauvegarde…" : "💾 Sauvegarder le profil"} dis={saving || !!phoneErr} full onClick={handleSave} />
          {savedLabel && (
            <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:8, fontSize:11, color:T.gr, justifyContent:"center" }}>
              <span>✓</span><span style={{ fontWeight:600 }}>{savedLabel}</span>
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Couleur accent */}
          <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.2rem" }}>
            <div style={{ fontWeight:800, fontSize:12, marginBottom:12 }}>🎨 Couleur accent</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[T.gr,T.teal,T.blue,T.orange,T.gold,T.purple,"#f72585","#ff5e1f"].map(co=>(
                <div key={co} onClick={()=>{updSes({accent:co});toast("🎨 Couleur mise à jour !");}}
                  style={{width:36,height:36,borderRadius:10,background:co,cursor:"pointer",border:accent===co?"2px solid #fff":"2px solid transparent",transform:accent===co?"scale(1.18)":"scale(1)",transition:"all .2s",boxShadow:accent===co?`0 0 18px ${co}88`:""}}/>
              ))}
            </div>
          </div>

          {/* Stats compte */}
          <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.2rem" }}>
            <div style={{ fontWeight:800, fontSize:12, marginBottom:10 }}>📊 Résumé compte</div>
            {[
              ["Transactions", txs.length, T.blue],
              ["Clients", clis.length, T.purple],
              ["Factures", invs.length, T.teal],
              ["Payées", invs.filter(i=>i.status==="paid").length, T.gr],
              ["CA Total", fmtf(allSales), T.gold],
            ].map(([l,v,co])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <span style={{ color:T.sub2 }}>{l}</span>
                <strong style={{ color:co }}>{v}</strong>
              </div>
            ))}
          </div>

          {/* Partage */}
          <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.2rem" }}>
            <div style={{ fontWeight:800, fontSize:12, marginBottom:8 }}>📱 Partagez VierAfrik</div>
            <Btn full v="wa" ch="📱 Partager sur WhatsApp" onClick={()=>{
              const m=encodeURIComponent("Bonjour,\n\nJ'utilise VierAfrik pour gagner de l'argent.\n\nInscris-toi gratuitement :\nhttps://vierafrik.com\n\nVierAfrik - Gagne de l'argent en Afrique 🌍");
              window.open("https://wa.me/?text="+m,"_blank");
            }}/>
          </div>

          {/* Zone danger */}
          <div style={{ background:"rgba(255,34,85,.04)", border:"1px solid rgba(255,34,85,.13)", borderRadius:16, padding:"1.2rem" }}>
            <div style={{ fontWeight:800, fontSize:12, marginBottom:8, color:T.red }}>⚠️ Zone danger</div>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              <Btn sm v="g" ch="💾 Backup JSON" onClick={()=>{
                const d=JSON.stringify({txs,clients:clis,invoices:invs},null,2);
                const a=document.createElement("a");
                a.href=URL.createObjectURL(new Blob([d],{type:"application/json"}));
                a.download=`vierafrik_backup_${today()}.json`;a.click();
                toast("💾 Sauvegarde exportée !");
              }}/>
              <Btn sm v="d" ch="🔒 Déconnexion" onClick={()=>{
                setConfirm({title:"🔒 Déconnexion",msg:"Voulez-vous vraiment vous déconnecter ?",confirmLabel:"Se déconnecter",danger:false,onConfirm:()=>{setConfirm(null);logout();}});
              }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════
// FIX 3 — LogoGenerator avec forme corrigée
// Défini HORS de Dashboard pour stabilité
// ══════════════════════════════════
const COULEURS_1 = ["#00d478","#1a78ff","#f0b020","#ff5a18","#9060ff","#ff2255","#25D366","#000"];
const COULEURS_2 = ["#00bfcc","#9060ff","#f0b020","#ff5a18","#1a78ff","#00d478","#fff","#333"];

const LogoGenerator = React.memo(function LogoGenerator({ user, accent = "#00d478", toast }) {
  const [styleIdx, setStyleIdx] = useState(0);
  const [couleur1, setCouleur1] = useState(accent);
  const [couleur2, setCouleur2] = useState("#00bfcc");
  const [forme, setForme] = useState("rond");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // FIX 3 : borderRadius unifié et correct
  // "rond" → "50%" (cercle parfait)
  // "carre" → "16px" (carré arrondi)
  // "libre" → "0px" (carré strict)
  const getBorderRadius = useCallback(() => {
    if (forme === "rond") return "50%";
    if (forme === "carre") return "16px";
    return "0px";
  }, [forme]);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSupa();
        const { data } = await s.from("logos").select("*").eq("user_id", user.id).maybeSingle();
        if (data) {
          setStyleIdx(data.style_idx ?? 0);
          setCouleur1(data.couleur1 || accent);
          setCouleur2(data.couleur2 || "#00bfcc");
          setForme(data.forme || "rond");
          setSaved(true);
        }
      } catch(e) {}
    })();
  }, [user.id]);

  const saveLogo = async () => {
    setSaving(true);
    try {
      const s = await getSupa();
      const payload = { user_id: user.id, style_idx: styleIdx, couleur1, couleur2, forme, updated_at: new Date().toISOString() };
      const { data: existing } = await s.from("logos").select("id").eq("user_id", user.id).maybeSingle();
      if (existing?.id) { await s.from("logos").update(payload).eq("id", existing.id); }
      else { await s.from("logos").insert({ ...payload, created_at: new Date().toISOString() }); }
      setSaved(true);
      toast?.("✅ Logo sauvegardé !", "ok");
    } catch(e) { toast?.("❌ Erreur sauvegarde", "err"); }
    setSaving(false);
  };

  const initials = (user?.business || user?.name || "VA").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const nom = (user?.business || user?.name || "VierAfrik").slice(0, 15);
  const br = getBorderRadius();

  const STYLES_LOGO = [
    {
      label: "Initiales",
      render: () => (
        <div style={{
          width: 120, height: 120,
          borderRadius: br,  // FIX : appliqué ici proprement
          background: `linear-gradient(135deg,${couleur1},${couleur2})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 44, color: "#fff",
          boxShadow: `0 12px 40px ${couleur1}66`, flexShrink: 0,
          overflow: "hidden",  // garantit le clip du contenu
          transition: "border-radius .3s ease",
        }}>
          {initials}
        </div>
      ),
    },
    {
      label: "Icône+Nom",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 90, height: 90,
            borderRadius: br,
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: `0 12px 40px ${couleur1}66`,
            overflow: "hidden", transition: "border-radius .3s ease",
          }}>🌍</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: couleur1, letterSpacing: "-.02em" }}>{nom}</div>
        </div>
      ),
    },
    {
      label: "Bouclier",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 100, height: 110,
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 32, color: "#fff",
            boxShadow: `0 12px 40px ${couleur1}66`,
          }}>
            {initials}
          </div>
          <div style={{ fontWeight: 800, fontSize: 13, color: T.text }}>{nom}</div>
        </div>
      ),
    },
    {
      label: "Moderne",
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 70, height: 70,
            borderRadius: br,
            background: `linear-gradient(135deg,${couleur1},${couleur2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 26, color: "#fff",
            boxShadow: `0 8px 24px ${couleur1}44`,
            overflow: "hidden", transition: "border-radius .3s ease",
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, color: T.text, letterSpacing: "-.03em" }}>{nom.split(" ")[0]}</div>
            {nom.split(" ")[1] && <div style={{ fontWeight: 600, fontSize: 14, color: couleur1 }}>{nom.split(" ").slice(1).join(" ")}</div>}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: T.text }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4, letterSpacing: "-.03em" }}>🎨 Mon Logo</div>
      <div style={{ color: T.sub2, fontSize: 12, marginBottom: 20 }}>Créez un logo simple pour votre commerce, gratuitement</div>

      {/* Aperçu */}
      <div style={{
        background: `linear-gradient(135deg,${T.c1},${T.c2})`,
        border: `2px solid ${couleur1}44`, borderRadius: 24,
        padding: "2.5rem", marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180,
      }}>
        {STYLES_LOGO[styleIdx].render()}
      </div>

      {/* Styles */}
      <div style={{ background: T.c1, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.4rem", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Style du logo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {STYLES_LOGO.map((s, i) => (
            <div key={i} onClick={() => { setStyleIdx(i); setSaved(false); }} style={{
              background: styleIdx===i ? `${couleur1}20` : T.c2,
              border: `2px solid ${styleIdx===i ? couleur1 : T.border}`,
              borderRadius: 10, padding: "12px 4px", textAlign: "center",
              cursor: "pointer", transition: "border .1s,background .1s",
              minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: styleIdx===i ? couleur1 : T.sub2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Couleurs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: T.sub, display: "block", marginBottom: 6 }}>Couleur principale</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COULEURS_1.map(c => (
                <div key={c} onClick={() => { setCouleur1(c); setSaved(false); }} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: couleur1===c ? "3px solid #fff" : "2px solid transparent", boxShadow: couleur1===c ? `0 0 0 2px ${c}` : "", transition: "border .1s" }}/>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: T.sub, display: "block", marginBottom: 6 }}>Couleur secondaire</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {COULEURS_2.map(c => (
                <div key={c} onClick={() => { setCouleur2(c); setSaved(false); }} style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: couleur2===c ? "3px solid #fff" : "2px solid transparent", boxShadow: couleur2===c ? `0 0 0 2px ${c}` : "", transition: "border .1s" }}/>
              ))}
            </div>
          </div>
        </div>

        {/* FIX 3 : Forme avec borderRadius string explicite */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: T.sub, display: "block", marginBottom: 6 }}>Forme</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "rond",  label: "⭕ Rond",   br: "50%"  },
              { id: "carre", label: "🔲 Carré",  br: "16px" },
              { id: "libre", label: "🔷 Libre",  br: "0px"  },
            ].map(({ id, label, br: brOpt }) => (
              <div key={id} onClick={() => { setForme(id); setSaved(false); }} style={{
                flex: 1,
                background: forme===id ? `${couleur1}20` : T.c2,
                border: `2px solid ${forme===id ? couleur1 : T.border}`,
                borderRadius: 8, padding: "10px 6px", textAlign: "center",
                cursor: "pointer", fontSize: 11, fontWeight: 700,
                color: forme===id ? couleur1 : T.sub2,
                transition: "border .1s,background .1s",
              }}>
                {/* Prévisualisation mini de la forme */}
                <div style={{
                  width: 24, height: 24, borderRadius: brOpt,
                  background: forme===id ? couleur1 : T.c3,
                  margin: "0 auto 6px", transition: "all .2s",
                }}/>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: `${couleur1}12`, border: `1px solid ${couleur1}30`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: T.sub2 }}>
        💡 Pour utiliser votre logo : faites une <strong style={{ color: couleur1 }}>capture d'écran</strong> de l'aperçu et partagez sur WhatsApp, Facebook ou Instagram.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={saveLogo} disabled={saving} style={{
          padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
          fontWeight: 800, fontSize: 13,
          background: saving ? T.c3 : `linear-gradient(135deg,${couleur1},${couleur2})`,
          color: saving ? T.sub : "#000", fontFamily: "inherit",
          boxShadow: saving ? "none" : `0 6px 20px ${couleur1}44`,
        }}>
          {saving ? "⏳..." : saved ? "✅ Sauvegardé" : "💾 Sauvegarder"}
        </button>
        <button onClick={async () => {
          try {
            toast?.("⏳ Préparation...");
            const size = 400;
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#05090f"; ctx.fillRect(0, 0, size, size);
            const logoSize = 200;
            const x = (size-logoSize)/2, y = (size-logoSize)/2;
            const grad = ctx.createLinearGradient(x, y, x+logoSize, y+logoSize);
            grad.addColorStop(0, couleur1); grad.addColorStop(1, couleur2);
            ctx.fillStyle = grad;
            // FIX 3 : borderRadius canvas selon forme
            const canvasR = forme === "rond" ? logoSize/2 : forme === "carre" ? 24 : 0;
            ctx.beginPath();
            if (ctx.roundRect) { ctx.roundRect(x, y, logoSize, logoSize, canvasR); } else { ctx.rect(x, y, logoSize, logoSize); }
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = `bold ${Math.round(logoSize*0.38)}px Arial`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(initials, size/2, size/2);
            const link = document.createElement("a");
            link.download = `logo-${(nom||"business").toLowerCase().replace(/\s+/g,"-")}.png`;
            const logoUrl = canvas.toDataURL("image/png");
            link.href = logoUrl;
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) { window.open(logoUrl, "_blank"); toast?.("✅ Appuie longuement → Enregistrer !"); }
            else { link.click(); toast?.("✅ Logo téléchargé !"); }
          } catch(e) { toast?.("📸 Fais une capture d'écran de l'aperçu !"); }
        }} style={{
          padding: "12px", borderRadius: 10, border: `1px solid ${couleur1}44`,
          cursor: "pointer", fontWeight: 800, fontSize: 13,
          background: `${couleur1}12`, color: couleur1, fontFamily: "inherit",
        }}>
          ⬇️ Télécharger
        </button>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════
// CarteVisite — composant STABLE hors Dashboard
// Extrait pour éviter remontage à chaque re-render
// ══════════════════════════════════════════
const STYLES_C_CARTE = [
  {label:"Sombre Pro", bg:"linear-gradient(135deg,#0a1628,#0d1f3c)"},
  {label:"Vert Afrik",  bg:"linear-gradient(135deg,#021a0e,#0d2e1a)"},
  {label:"Or Premium",  bg:"linear-gradient(135deg,#1a1200,#2a1e00)"},
  {label:"Violet",      bg:"linear-gradient(135deg,#100820,#1a0e30)"},
];

const CarteVisite = React.memo(function CarteVisite({ user, accent = "#00d478", toast }) {
  const [carte, setCarte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [styleIdx, setStyleIdx] = useState(0);
  const [form, setForm] = useState({
    nom: user?.name || "",
    business: user?.business || "",
    phone: user?.phone || "",
    activite: "",
    ville: "",
    couleur: accent,
    couleur2: "#00bfcc",
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await getSupa();
        const { data } = await s.from("cartes_visite").select("*").eq("user_id", user.id).maybeSingle();
        if (data) {
          setCarte(data);
          setForm({
            nom: data.nom || user?.name || "",
            business: data.business || user?.business || "",
            phone: data.phone || user?.phone || "",
            activite: data.activite || "",
            ville: data.ville || "",
            couleur: data.couleur || accent,
            couleur2: data.couleur2 || "#00bfcc",
          });
          setStyleIdx(data.style_idx || 0);
        }
      } catch(e) {}
      setLoading(false);
    })();
  }, [user.id]);

  const initials = (form.business || form.nom || "VA").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const saveCarte = async () => {
    if (!form.nom || !form.business) { toast("⚠️ Nom et business requis", "err"); return; }
    setSaving(true);
    try {
      const s = await getSupa();
      const payload = { ...form, style_idx: styleIdx, user_id: user.id, updated_at: new Date().toISOString() };
      if (carte?.id) {
        await s.from("cartes_visite").update(payload).eq("id", carte.id);
        setCarte({ ...carte, ...payload });
      } else {
        const { data } = await s.from("cartes_visite").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        setCarte(data);
      }
      toast("✅ Carte sauvegardée !");
    } catch(e) { toast("❌ Erreur", "err"); }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: T.sub }}>⏳ Chargement...</div>;

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>📇 Carte de Visite</div>
      <div style={{ background: STYLES_C_CARTE[styleIdx].bg, border: `2px solid ${form.couleur}55`, borderRadius: 20, padding: "1.4rem", marginBottom: 14, boxShadow: "0 20px 60px rgba(0,0,0,.7)", position: "relative", overflow: "hidden", minHeight: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: `linear-gradient(135deg,${form.couleur},${form.couleur2})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: "#000", boxShadow: `0 6px 20px ${form.couleur}55` }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#fff" }}>{form.business || "Business"}</div>
            <div style={{ fontSize: 12, color: form.couleur, fontWeight: 600, marginTop: 2 }}>{form.activite || "Activité"}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {form.nom && <div style={{ fontSize: 13, color: "#dff0ff" }}>👤 {form.nom}</div>}
          {form.phone && <div style={{ fontSize: 13, color: "#dff0ff" }}>📱 {form.phone}</div>}
          {form.ville && <div style={{ fontSize: 13, color: "#dff0ff" }}>📍 {form.ville}</div>}
        </div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${form.couleur}22`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: form.couleur, fontWeight: 700 }}>vierafrik.com</div>
          <div style={{ fontSize: 9, color: "#4a7090" }}>🌍 VierAfrik</div>
        </div>
      </div>
      <div style={{ background: T.c1, border: `1px solid ${T.border}`, borderRadius: 14, padding: "1rem", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>✏️ Vos informations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["Nom complet", "nom",      "text", "Prénom Nom"],
            ["Business",    "business", "text", "Nom entreprise"],
            ["Téléphone",   "phone",    "tel",  "+225 07 000 0000"],
            ["Activité",    "activite", "text", "Coiffure, Commerce..."],
            ["Ville",       "ville",    "text", "Abidjan, Dakar..."],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
              <input
                type={type}
                placeholder={ph}
                value={form[key] || ""}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", padding: "7px 9px", background: T.c2, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={saveCarte} disabled={saving} style={{ padding: "11px", borderRadius: 10, border: "none", background: saving ? T.c3 : `linear-gradient(135deg,${form.couleur},${form.couleur2})`, color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          {saving ? "⏳..." : "💾 Sauvegarder"}
        </button>
        <button onClick={() => {
          const txt = `📇 *${form.business}*\n👤 ${form.nom}\n📱 ${form.phone}${form.ville ? "\n📍 " + form.ville : ""}\n🌍 vierafrik.com`;
          window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
        }} style={{ padding: "11px", borderRadius: 10, border: "none", background: "#25D366", color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          💬 WhatsApp
        </button>
      </div>
    </div>
  );
});

// ════════════════════════════════
//  DASHBOARD PRINCIPAL
// ════════════════════════════════
const COULEURS = ["#00d478","#1a78ff","#f0b020","#ff5a18","#9060ff","#00bfcc","#ff2255","#25D366"];

function Dashboard({ ses, logout, updSes }) {
  const uid = ses.id;
  const plan = PLANS[ses.plan||"free"];
  const accent = ses.accent || T.gr;

  const [page, setPage] = useState("dash");
  const [txs, setTxs] = useState([]);
  const [clis, setClis] = useState([]);
  const [invs, setInvs] = useState([]);
  const [goal, setGoal] = useState(ses.goal||2500000);
  const [loading, setLoading] = useState(true);
  const [mdl, setMdl] = useState(null);
  const [fm, setFm] = useState({});
  const [tsts, setTsts] = useState([]);
  const [boom, setBoom] = useState(false);
  const [flt, setFlt] = useState({});
  const [notOpen, setNot] = useState(false);
  const [chat, setChat] = useState([{r:"ai",t:`Bonjour ${ses.name?.split(" ")[0]||"entrepreneur"} 👋 Je suis votre Coach VierAfrik. Je suis là pour vous aider à gagner de l'argent ! Posez votre question.`}]);
  const [cMsg, setCMsg] = useState("");
  const [cLoad, setCL] = useState(false);
  const [confirmState, setConfirm] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [showAvisPopup, setShowAvisPopup] = useState(false);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const chatRef = useRef(null);

  const toast = useCallback((msg, k="ok", col) => {
    const id = xid();
    setTsts(p => [...p, {id, msg, k, col: col||(k==="ok"?accent:undefined)}]);
    setTimeout(() => setTsts(p => p.filter(x => x.id!==id)), 3500);
  }, [accent]);

  useEffect(() => { chatRef.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  // Sync goal quand session change
  useEffect(() => { setGoal(ses.goal||2500000); }, [ses.goal]);

  // Chargement données
  useEffect(() => {
    if (!uid) return;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [rawTxs, rawClis, rawInvs] = await Promise.all([
          supaSelect("transactions", uid),
          supaSelect("clients", uid),
          supaSelect("invoices", uid),
        ]);
        const normTx = r => ({id:r.id,uid:r.user_id,type:r.type,amount:parseFloat(r.amount)||0,cat:r.category||"Commerce",who:r.who||"",date:r.date||today(),note:r.note||""});
        const normCli = r => ({id:r.id,uid:r.user_id,name:r.name,phone:r.phone||"",email:r.email||"",pays:r.country||PAYS[0],cat:r.category||"Commerce",status:r.status||"active",ca:parseFloat(r.revenue)||0});
        const normInv = r => ({id:r.id,uid:r.user_id,num:r.number||"",clientId:r.client_id||"",clientName:r.client_name||"",phone:r.phone||"",total:parseFloat(r.total)||0,sub:parseFloat(r.subtotal)||0,tax:parseFloat(r.tax)||0,status:r.status||"pending",issued:r.issued||today(),due:r.due||"",items:typeof r.items==="string"?JSON.parse(r.items||"[]"):r.items||[],notes:r.notes||"",payStatus:r.pay_status||"unpaid",payRef:r.pay_ref||"",payProv:r.pay_prov||""});
        setTxs(rawTxs.map(normTx));
        setClis(rawClis.map(normCli));
        setInvs(rawInvs.map(normInv));
        if (rawTxs.length===0 && rawClis.length===0 && rawInvs.length===0) {
          await seed(uid);
          const [t2,c2,i2] = await Promise.all([supaSelect("transactions",uid),supaSelect("clients",uid),supaSelect("invoices",uid)]);
          setTxs(t2.map(normTx)); setClis(c2.map(normCli)); setInvs(i2.map(normInv));
        }
      } catch(e) { console.error("Erreur chargement:", e); }
      finally { setLoading(false); }
    };
    loadAll();
  }, [uid]);

  // Handler retour paiement NotchPay
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paySuccess = params.get("pay_success");
    const trxRef = params.get("trxref")||params.get("reference")||params.get("ref");
    const planParam = params.get("plan");
    const uidParam = params.get("uid");
    if (paySuccess==="1" && planParam && uidParam && ses?.id && uidParam===ses.id) {
      (async () => {
        try {
          updSes({plan: planParam});
          toast("🎉 Plan "+planParam.charAt(0).toUpperCase()+planParam.slice(1)+" activé !","ok",planParam==="business"?"#f0b020":"#00d478");
          window.history.replaceState({},"",window.location.pathname);
          setPage("dash");
        } catch(e) {}
      })();
    }
  }, [ses?.id]);

  // Popup avis
  useEffect(() => {
    if (txs.length >= 3) {
      const key = `avis_shown_${ses.id}`;
      if (!sessionStorage.getItem(key)) {
        setTimeout(() => { setShowAvisPopup(true); sessionStorage.setItem(key,"1"); }, 3000);
      }
    }
  }, [txs.length]);

  // Welcome video
  useEffect(() => {
    if (!loading) {
      const key = `welcome_video_${ses.id}`;
      if (!sessionStorage.getItem(key)) {
        setTimeout(() => { setShowWelcomeVideo(true); sessionStorage.setItem(key,"1"); }, 1200);
      }
    }
  }, [loading]);

  const cm = mkey();
  const mTxs = txs.filter(t => mkey(t.date)===cm);
  const sales = mTxs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const exps = mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const profit = sales - exps;
  const allSales = txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const allExps = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const gPct = goal>0 ? Math.min(100,Math.round(profit/goal*100)) : 0;

  const insights = useMemo(() => {
    const tips = [];
    const l7 = txs.filter(t=>Date.now()-new Date(t.date).getTime()<7*864e5);
    const s7 = l7.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
    const e7 = l7.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    if (e7>s7&&s7>0) tips.push({k:"warn",msg:"⚠️ Dépenses > ventes sur 7 jours. Attention à la trésorerie."});
    if (gPct>=100) tips.push({k:"win",msg:"🏆 Objectif mensuel atteint ! Excellent travail !"});
    else if (gPct>60) tips.push({k:"info",msg:`📈 ${gPct}% de l'objectif. Encore un effort !`});
    const ov = invs.filter(i=>i.status==="overdue");
    if (ov.length>0) tips.push({k:"warn",msg:`🔴 ${ov.length} facture(s) en retard. Relancez via WhatsApp.`});
    if (tips.length===0) tips.push({k:"ok",msg:"✅ Situation saine ! Continuez 🌍"});
    return tips;
  }, [txs, invs, gPct]);

  const notifs = [
    ...invs.filter(i=>i.status==="overdue").map(i=>({id:i.id,k:"warn",msg:`Retard : ${i.num} — ${i.clientName}`})),
    ...(gPct>=100?[{id:"goal",k:"win",msg:"🏆 Objectif mensuel atteint !"}]:[]),
  ];

  const canAdd = type => {
    if (type==="tx" && txs.length>=plan.maxTx) return false;
    if (type==="cli" && clis.length>=plan.maxCli) return false;
    if (type==="inv" && invs.length>=plan.maxInv) return false;
    return true;
  };
  const nextNum = () => `VAF-${new Date().getFullYear()}-${String(invs.length+1).padStart(4,"0")}`;

  const flashNew = (id) => { setFlashId(id); setTimeout(()=>setFlashId(null),700); };

  const saveTx = async () => {
    const amt = parseFloat(fm.amount);
    if (!amt||amt<=0) { toast("⚠️ Veuillez saisir un montant valide","err"); return; }
    const isEdit = !!fm._edit;
    const t = {id:isEdit?fm.id:xid(),uid,type:fm.type||"sale",amount:amt,cat:fm.cat||"Commerce",who:fm.who||"",date:fm.date||today(),note:fm.note||""};
    let next;
    if (isEdit) {
      next = txs.map(x=>x.id===t.id?t:x);
      await supaUpdate("transactions",{type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note,user_id:uid},t.id);
    } else {
      if (!canAdd("tx")) { toast(`🔒 Limite plan Free (${plan.maxTx} transactions). Passez à Pro ! 🚀`,"warn"); return; }
      next = [t,...txs]; flashNew(t.id);
      const ns = next.filter(x=>x.type==="sale"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0)-next.filter(x=>x.type==="expense"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0);
      if (ns>=goal&&profit<goal) { setBoom(true); setTimeout(()=>setBoom(false),5000); toast("🎉 Objectif mensuel atteint !"); }
      else toast(fm.type==="sale"?"💰 Vente enregistrée !":"📤 Dépense enregistrée !");
      await supaInsert("transactions",{id:t.id,user_id:uid,type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note});
      markUserActive(uid);
    }
    setTxs(next);
    if (isEdit) toast("✅ Transaction modifiée !");
    setMdl(null); setFm({});
  };

  const saveCli = async () => {
    if (!fm.name) { toast("⚠️ Le nom du client est obligatoire","err"); return; }
    const c = {id:fm._edit?fm.id:xid(),uid,name:fm.name,phone:fm.phone||"",email:fm.email||"",pays:fm.pays||PAYS[0],cat:fm.cat||"Commerce",status:fm.status||"active",ca:parseFloat(fm.ca)||0};
    let next;
    if (fm._edit) {
      next = clis.map(x=>x.id===c.id?c:x);
      await supaUpdate("clients",{name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca,user_id:uid},c.id);
    } else {
      if (!canAdd("cli")) { toast(`🔒 Limite plan Free (${plan.maxCli} clients). Passez à Pro ! 🚀`,"warn"); return; }
      next = [c,...clis]; flashNew(c.id); toast(`👤 ${c.name} ajouté !`);
      await supaInsert("clients",{id:c.id,user_id:uid,name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca});
      markUserActive(uid);
    }
    setClis(next);
    if (fm._edit) toast("✅ Client modifié !");
    setMdl(null); setFm({});
  };

  const saveInv = async () => {
    if (!fm.clientName) { toast("⚠️ Le nom du client est obligatoire","err"); return; }
    const items = (fm.items||[]).filter(it=>it.name&&it.price>0);
    if (!items.length) { toast("⚠️ Ajoutez au moins un article avec un prix > 0","err"); return; }
    const sub = items.reduce((s,it)=>s+(it.qty||1)*(it.price||0),0);
    const tax = parseFloat(fm.tax)||0;
    const total = sub + tax;
    const inv = {id:fm._edit?fm.id:xid(),uid,num:fm._edit?fm.num:nextNum(),clientId:fm.clientId||"",clientName:fm.clientName,phone:fm.phone||"",total,sub,tax,status:fm.status||"pending",issued:fm.issued||today(),due:fm.due||"",items:items.map(it=>({...it,id:it.id||xid(),line:(it.qty||1)*(it.price||0)})),notes:fm.notes||"",payStatus:"unpaid",payRef:"",payProv:""};
    let next;
    if (fm._edit) {
      next = invs.map(x=>x.id===inv.id?inv:x);
      await supaUpdate("invoices",{client_name:inv.clientName,phone:inv.phone,total:inv.total,subtotal:inv.sub,tax:inv.tax,status:inv.status,issued:inv.issued,due:inv.due,items:JSON.stringify(inv.items),notes:inv.notes,user_id:uid},inv.id);
    } else {
      if (!canAdd("inv")) { toast(`🔒 Limite plan Free (${plan.maxInv} factures). Passez à Pro ! 🚀`,"warn"); return; }
      next = [inv,...invs]; flashNew(inv.id); toast(`🧾 Facture ${inv.num} créée !`);
      await supaInsert("invoices",{id:inv.id,user_id:uid,number:inv.num,client_name:inv.clientName,phone:inv.phone,total:inv.total,subtotal:inv.sub,tax:inv.tax,status:inv.status,issued:inv.issued,due:inv.due,items:JSON.stringify(inv.items),notes:inv.notes});
      markUserActive(uid);
    }
    setInvs(next);
    if (fm._edit) toast("✅ Facture modifiée !");
    setMdl(null); setFm({});
  };

  const genPDF = inv => {
    if (!plan.pdf) { toast("PDF disponible en plan Pro 🚀","warn"); return; }
    const w = window.open("","_blank"); if (!w) return;
    const sC = {paid:"#d4fde8",pending:"#fff8cc",overdue:"#ffe0e6"};
    const sT = {paid:"#0a6e3d",pending:"#7a5c00",overdue:"#8b0020"};
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.num}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;padding:40px;max-width:740px;margin:0 auto;font-size:13px;color:#111}
.hdr{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #00d478}
.brand{font-size:22px;font-weight:900}.brand b{color:#00d478}
.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:800;background:${sC[inv.status]};color:${sT[inv.status]}}
table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f2fdf7;padding:8px 11px;text-align:left;font-size:9px;text-transform:uppercase;color:#555;border-bottom:2px solid #00d478}td{padding:8px 11px;border-bottom:1px solid #eee}
.grand{font-weight:900;font-size:19px;color:#00a85e}
@media print{body{padding:22px}}</style></head><body>
<div class="hdr"><div><div class="brand">🌍 Vier<b>Afrik</b></div><div style="color:#555;margin-top:4px">${ses.business||"Mon Entreprise"}</div></div>
<div style="text-align:right"><div style="font-size:18px;font-weight:900">${inv.num}</div><br><span class="badge">${inv.status==="paid"?"✅ Payée":inv.status==="pending"?"⏳ En attente":"🔴 En retard"}</span></div></div>
<table><thead><tr><th>Description</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody>
${(inv.items||[]).map(it=>`<tr><td>${it.name}</td><td>${it.qty||1}</td><td>${fmtf(it.price)}</td><td><strong>${fmtf(it.line||(it.qty||1)*it.price)}</strong></td></tr>`).join("")}
</tbody></table>
<div style="text-align:right"><div class="grand">TOTAL : ${fmtf(inv.total)}</div></div>
<script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
    toast("📄 PDF prêt ! Utilisez Ctrl+P pour imprimer.");
  };

  const sendWA = inv => {
    const ph = cleanP(inv.phone||clis.find(c=>c.id===inv.clientId)?.phone||"");
    if (!ph) { toast("⚠️ Numéro introuvable.","warn"); return; }
    const desc = (inv.items&&inv.items.length&&inv.items[0].name) ? inv.items.map(it=>it.name).join(", ") : "Prestation";
    const msg = "Bonjour,\nVoici votre facture.\n\nMontant : "+fmtf(inv.total)+"\nService : "+desc+"\nDate : "+inv.issued+"\n\nMerci.\n— "+(ses.business||"VierAfrik");
    window.open("https://wa.me/"+ph+"?text="+encodeURIComponent(msg),"_blank");
    toast("📱 WhatsApp ouvert !");
  };

  const doPay = async () => {
    const {inv,prov,phone} = fm;
    if (!prov) { toast("⚠️ Choisissez un opérateur","err"); return; }
    if (!phone) { toast("⚠️ Saisissez le numéro","err"); return; }
    if (!inv?.total||inv.total<=0) { toast("⚠️ Montant invalide","err"); return; }
    toast(`⏳ Création paiement ${prov.toUpperCase()}…`);
    try {
      const res = await fetch("/api/notchpay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"initialize",amount:inv.total,email:ses.email,plan:"invoice_"+inv.id.slice(0,6),uid:ses.id,phone})});
      const data = await res.json();
      const url = data?.transaction?.authorization_url||data?.authorization_url;
      if (url) {
        setInvs(invs.map(x=>x.id===inv.id?{...x,payStatus:"pending",payProv:prov}:x));
        await supaUpdate("invoices",{pay_status:"pending",pay_prov:prov},inv.id);
        setMdl(null); setFm({});
        toast("🔗 Redirection…");
        setTimeout(()=>window.location.href=url,800);
      } else { toast("❌ "+(data?.message||"Erreur paiement"),"err"); }
    } catch(e) { toast("❌ Erreur réseau","err"); }
  };

  const sendAI = async () => {
    if (!cMsg.trim()) return;
    if (!plan.ai) { toast("Coach IA disponible en plan Pro 🚀","warn"); return; }
    const msg = cMsg.trim(); setCMsg(""); setChat(h=>[...h,{r:"user",t:msg}]); setCL(true);
    try {
      const systemPrompt = `Tu es Coach VierAfrik, expert PME africaines. Concis, motivant, actionnable. Données: Ventes=${fmtf(sales)}, Dépenses=${fmtf(exps)}, Bénéfice=${fmtf(profit)}, Objectif=${gPct}%. Clients actifs: ${clis.filter(c=>c.status==="active").length}/${clis.length}. Réponds en 2-3 phrases max. Français uniquement.`;
      const res = await fetch("/.netlify/functions/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:systemPrompt,messages:[{role:"user",content:msg}]})});
      if (!res.ok) { setChat(h=>[...h,{r:"ai",t:"Continuez, vous êtes sur la bonne voie ! 💪🌍"}]); return; }
      const data = await res.json();
      const text = data.content?.map(c=>c.text||"").join("")||"Continuez ! 💪🌍";
      setChat(h=>[...h,{r:"ai",t:text}]);
    } catch { setChat(h=>[...h,{r:"ai",t:"🔄 Service indisponible. Vérifiez votre connexion !"}]); }
    finally { setCL(false); }
  };

  const csvExport = (data, name) => {
    if (!data.length) { toast("⚠️ Aucune donnée à exporter","warn"); return; }
    const keys = Object.keys(data[0]).filter(k=>k!=="uid"&&k!=="password");
    const csv = [keys.join(","),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??(""))).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download = `vierafrik_${name}_${today()}.csv`; a.click();
    toast(`⬇ ${name}.csv exporté !`);
  };

  const chartD = useMemo(() => {
    const months = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
      const key = d.toISOString().slice(0,7);
      const label = d.toLocaleDateString("fr-FR",{month:"short"});
      const v = txs.filter(t=>t.type==="sale"&&mkey(t.date)===key).reduce((s,t)=>s+t.amount,0);
      const dep = txs.filter(t=>t.type==="expense"&&mkey(t.date)===key).reduce((s,t)=>s+t.amount,0);
      months.push({m:label,v,d:dep});
    }
    return months;
  }, [txs]);
  const cMax = Math.max(...chartD.map(d=>Math.max(d.v,d.d)))*1.2||1;

  const BarChart = ({data,h=160}) => {
    const [ready,setReady] = useState(false);
    useEffect(()=>{const t=setTimeout(()=>setReady(true),80);return()=>clearTimeout(t);},[]);
    const pad = 16;
    const chartH = h - pad;
    return(
      <div style={{position:"relative",height:h,marginTop:8}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}} viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none">
          {[0,25,50,75,100].map(pct=>(
            <line key={pct} x1="0" y1={chartH*(1-pct/100)} x2="100" y2={chartH*(1-pct/100)} stroke={T.border} strokeWidth=".35" vectorEffect="non-scaling-stroke"/>
          ))}
          {ready&&data.length>1&&(
            <polyline points={data.map((d,i)=>`${(i/(data.length-1))*100},${chartH*(1-Math.min(d.v/cMax,1))}`).join(' ')} fill="none" stroke={T.blue} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity=".55" style={{strokeDasharray:700,strokeDashoffset:ready?0:700,transition:"stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)"}}/>
          )}
          {ready&&data.length>1&&(
            <polyline points={data.map((d,i)=>`${(i/(data.length-1))*100},${chartH*(1-Math.max(0,Math.min((d.v-d.d)/cMax,1)))}`).join(' ')} fill="none" stroke={T.gr} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity=".7" style={{strokeDasharray:700,strokeDashoffset:ready?0:700,transition:"stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1) .2s"}}/>
          )}
          {ready&&data.map((d,i)=>{const x=(i/(data.length-1||1))*100;const y=chartH*(1-Math.max(0,Math.min((d.v-d.d)/cMax,1)));return<circle key={i} cx={x} cy={y} r="1.8" fill={T.gr} opacity={ready?.85:0} style={{transition:`opacity .3s ${.5+i*.1}s`}}/>;})}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",gap:3,paddingBottom:pad}}>
          {data.map((d,i)=>{
            const maxH = chartH;
            const vh = ready?Math.max(4,(d.v/cMax)*maxH):0;
            const dh = ready?Math.max(4,(d.d/cMax)*maxH):0;
            const ph = ready?Math.max(0,((d.v-d.d)/cMax)*maxH):0;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative",height:"100%",justifyContent:"flex-end",gap:2}}>
                {d.v>0&&<div style={{position:"absolute",top:maxH-vh-18,fontSize:7,color:T.sub2,fontWeight:700,whiteSpace:"nowrap",opacity:ready?1:0,transition:"opacity .5s .8s"}}>{fmtk(d.v)}</div>}
                <div style={{display:"flex",alignItems:"flex-end",gap:2,width:"100%",justifyContent:"center"}}>
                  <div style={{width:"28%",height:ph,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.gr},${T.gr}88)`,minHeight:ready&&ph>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08}s`}}/>
                  <div style={{width:"28%",height:vh,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.blue},${T.blue}88)`,minHeight:ready&&vh>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08+.05}s`}}/>
                  <div style={{width:"28%",height:dh,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${T.orange},${T.orange}88)`,minHeight:ready&&dh>0?4:0,transition:`height 0.9s cubic-bezier(.34,1.2,.64,1) ${i*.08+.1}s`}}/>
                </div>
                <span style={{position:"absolute",bottom:0,fontSize:8,color:T.sub,fontWeight:600}}>{d.m}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const catMap = txs.filter(t=>t.type==="sale").reduce((a,t)=>{a[t.cat]=(a[t.cat]||0)+t.amount;return a;},{});
  const catArr = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const catCols = [T.gr,T.blue,T.gold,T.orange,T.purple];

  const Donut = ({data}) => {
    const [ready,setReady] = useState(false);
    useEffect(()=>{const t=setTimeout(()=>setReady(true),120);return()=>clearTimeout(t);},[]);
    const tot = data.reduce((s,[,v])=>s+v,0)||1;
    const r=44,cx=56,cy=56,ci=2*Math.PI*r;
    let off=0;
    const segs = data.map(([l,v],i)=>{
      const pct = v/tot;
      const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={catCols[i]} strokeWidth="14" strokeDasharray={`${pct*ci} ${ci-pct*ci}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:`stroke-dasharray 1s cubic-bezier(.34,1.2,.64,1) ${i*.12}s`}} opacity={ready?1:.15}/>;
      off += pct*ci; return el;
    });
    return(
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <svg width="112" height="112" viewBox="0 0 112 112" style={{flexShrink:0}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.c3} strokeWidth="14"/>
          {segs}
          <text x={cx} y={cy-5} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontFamily="Inter,system-ui,sans-serif" fontSize="11" fontWeight="800">{fmtk(tot)}</text>
          <text x={cx} y={cy+10} textAnchor="middle" dominantBaseline="middle" fill={T.sub} fontFamily="Inter,system-ui,sans-serif" fontSize="8">FCFA</text>
        </svg>
        <div style={{flex:1,minWidth:90}}>
          {data.map(([l,v],i)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${T.border}`,fontSize:11,gap:8}}>
              <span style={{display:"flex",alignItems:"center",gap:6,color:T.sub2}}><span style={{width:8,height:8,borderRadius:2,background:catCols[i],display:"inline-block",flexShrink:0}}/>{l}</span>
              <span style={{fontWeight:700,color:catCols[i],fontSize:10,flexShrink:0}}>{Math.round(v/tot*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TabBtn = ({id,ic,lb}) => (
    <button onClick={()=>setPage(id)} style={{padding:"6px 11px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",fontWeight:600,fontSize:11,color:page===id?accent:T.sub,background:page===id?`${accent}15`:"transparent",transition:"all .2s",whiteSpace:"nowrap",flexShrink:0,letterSpacing:"-.01em",boxShadow:page===id?`0 0 12px ${accent}22`:"none"}}>
      {ic} {lb}
    </button>
  );

  // ════════ PAGES ════════

  const TxTable = ({rows,editable}) => (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Client","Catégorie","Type","Montant","Date",...(editable?["Actions"]:[])].map(h=><th key={h} style={{textAlign:"left",padding:"5px 7px",fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map(t=>(
            <tr key={t.id} style={{borderBottom:`1px solid ${T.border}`,animation:flashId===t.id?"flashGreen .7s ease":"none"}}>
              <td style={{padding:"7px",fontWeight:600,fontSize:11}}>{t.who||"—"}</td>
              <td style={{padding:"7px"}}><span style={{background:"rgba(26,120,255,.1)",color:T.blue,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.cat}</span></td>
              <td style={{padding:"7px"}}><span style={{background:t.type==="sale"?"rgba(0,212,120,.1)":"rgba(255,34,85,.1)",color:t.type==="sale"?T.gr:T.red,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.type==="sale"?"↑ Vente":"↓ Dépense"}</span></td>
              <td style={{padding:"7px",fontWeight:700,color:t.type==="sale"?T.gr:T.red,fontSize:11,whiteSpace:"nowrap"}}>{t.type==="sale"?"+":"-"}{fmtf(t.amount)}</td>
              <td style={{padding:"7px",color:T.sub2,fontSize:10}}>{t.date}</td>
              {editable&&<td style={{padding:"7px"}}><div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...t,_edit:true});setMdl("tx");}} style={{background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>✏️</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer",msg:`Supprimer cette transaction de ${fmtf(t.amount)} ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=txs.filter(x=>x.id!==t.id);setTxs(n);await supaDelete("transactions",t.id);toast("Supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div></td>}
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={6} style={{padding:"1.5rem",textAlign:"center",color:T.sub,fontSize:12}}>Aucune transaction</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const PgDash = () => (
    <div>
      <div style={{marginBottom:18}}>
        <div style={{fontWeight:900,fontSize:26,letterSpacing:"-.04em",lineHeight:1.1}}>Bonjour, <span style={{color:accent}}>{ses.name?.split(" ")[0]}</span> 👋</div>
        <div style={{color:T.sub2,fontSize:12,marginTop:4,display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:20,padding:"2px 10px",fontWeight:600}}>{ses.business}</span>
          <span>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span>
        </div>
      </div>
      {/* Objectif */}
      <div style={{background:`linear-gradient(135deg,${accent}14,${T.teal}08,${T.c2})`,border:`1px solid ${accent}30`,borderRadius:18,padding:"1.3rem 1.5rem",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,boxShadow:`0 8px 32px ${accent}12`}}>
        <div>
          <div style={{fontWeight:800,fontSize:13,marginBottom:3}}>🎯 Objectif mensuel — {cm}</div>
          <div style={{fontSize:11,color:T.sub2,marginBottom:10}}>Cible : <strong style={{color:T.text}}>{fmtf(goal)}</strong></div>
          <div style={{background:"rgba(0,0,0,.3)",borderRadius:20,height:6,width:220,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(90deg,${accent},${T.teal})`,height:"100%",width:Math.min(100,gPct)+"%",borderRadius:20,transition:"width 1.5s cubic-bezier(.34,1.2,.64,1)"}}/>
          </div>
          <div style={{fontSize:11,color:T.sub2,marginTop:5}}>{gPct}% · Bénéfice : <strong style={{color:profit>=0?T.gr:T.red}}>{fmtf(profit)}</strong></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:52,color:accent,lineHeight:1,letterSpacing:"-.05em"}}>{gPct}%</div></div>
      </div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:12}}>
        {[
          {ic:"💰",l:"Ventes du mois",v:sales,sub:`${mTxs.filter(t=>t.type==="sale").length} tx`,co:T.blue},
          {ic:"📤",l:"Dépenses",v:exps,sub:`${mTxs.filter(t=>t.type==="expense").length} tx`,co:T.orange},
          {ic:"📈",l:"Bénéfice net",v:Math.abs(profit),sub:profit>=0?"Positif ✅":"Négatif ⚠️",co:profit>=0?T.gr:T.red},
          {ic:"👥",l:"Clients actifs",v:clis.filter(c=>c.status==="active").length,sub:`/ ${clis.length} total`,co:T.purple},
        ].map(({ic,l,v,sub,co})=>(
          <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}28`,borderRadius:16,padding:"1.1rem",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-18,bottom:-18,width:80,height:80,borderRadius:"50%",background:`${co}10`,filter:"blur(18px)"}}/>
            <div style={{width:36,height:36,borderRadius:10,background:`${co}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:10}}>{ic}</div>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:T.sub,marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:900,color:co,lineHeight:1,letterSpacing:"-.03em",marginBottom:4}}>{fmtk(v)}<span style={{fontSize:10,fontWeight:600,color:T.sub2,marginLeft:3}}>FCFA</span></div>
            <div style={{fontSize:10,color:T.sub2}}>{sub}</div>
          </div>
        ))}
      </div>
      {/* Alerte retards */}
      {invs.filter(i=>i.status==="overdue").length>0&&(
        <div style={{background:"linear-gradient(135deg,rgba(255,34,85,.08),rgba(255,34,85,.04))",border:"1px solid rgba(255,34,85,.25)",borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:T.red,fontSize:13}}>{invs.filter(i=>i.status==="overdue").length} facture(s) en retard</div>
            <div style={{fontSize:11,color:T.sub2,marginTop:1}}>Relancez via WhatsApp</div>
          </div>
          <Btn sm v="d" ch="Voir →" onClick={()=>setPage("inv")}/>
        </div>
      )}
      {/* Charts */}
      <div className="pg-grid-2" style={{marginBottom:12}}>
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>📊 Performance 6 mois</div>
          <BarChart data={chartD} h={200}/>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:10,borderTop:`1px solid ${T.border}`}}>
            {[{c:T.gr,l:"Profit"},{c:T.blue,l:"Ventes"},{c:T.orange,l:"Dépenses"}].map(x=>(
              <span key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:T.sub2,fontWeight:600}}><span style={{width:10,height:10,borderRadius:3,background:x.c,display:"inline-block"}}/>{x.l}</span>
            ))}
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>🍩 Ventes par catégorie</div>
          {catArr.length ? <Donut data={catArr}/> : <div style={{color:T.sub,fontSize:12,padding:"2.5rem 0",textAlign:"center"}}>Ajoutez des ventes</div>}
        </div>
      </div>
      {/* Insights */}
      <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem",marginBottom:12}}>
        <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>💡 Insights VierAfrik</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {insights.map((ins,i)=>{
            const col=ins.k==="warn"?T.orange:ins.k==="win"?T.gold:ins.k==="info"?T.blue:T.gr;
            return<div key={i} style={{padding:"11px 14px",background:`${col}08`,borderRadius:12,border:`1px solid ${col}22`,fontSize:12,color:T.text,lineHeight:1.6}}>{ins.msg}</div>;
          })}
        </div>
      </div>
      {/* Transactions récentes */}
      <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:13}}>📋 Dernières transactions</div>
          <Btn sm v="g" ch="Voir tout →" onClick={()=>setPage("tx")}/>
        </div>
        <TxTable rows={[...txs].slice(0,5)}/>
      </div>
    </div>
  );

  const PgTx = () => {
    const filtered = txs.filter(t=>{
      if (flt.txType&&t.type!==flt.txType) return false;
      if (flt.txQ) {const q=flt.txQ.toLowerCase();return(t.who+t.cat+t.note).toLowerCase().includes(q);}
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

  const PgInv = () => {
    const tots = invs.reduce((a,i)=>({...a,tot:a.tot+i.total,[i.status]:(a[i.status]||0)+i.total}),{tot:0,paid:0,pending:0,overdue:0});
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
          <div><div style={{fontWeight:900,fontSize:20}}>🧾 Factures</div><div style={{fontSize:11,color:T.sub2}}>PDF · WhatsApp · Mobile Money</div></div>
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
            <div key={inv.id} style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:15,padding:"1rem",position:"relative",overflow:"hidden",animation:flashId===inv.id?"flashGreen .7s ease":"none"}}>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:sC[inv.status]}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div><div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase"}}>{inv.num}</div><div style={{fontWeight:800,fontSize:13,marginTop:1}}>{inv.clientName}</div></div>
                <span style={{background:sC[inv.status]+"1a",color:sC[inv.status],borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{sL[inv.status]}</span>
              </div>
              <div style={{fontSize:21,fontWeight:900,color:T.gr,marginBottom:3}}>{fmtk(inv.total)} FCFA</div>
              <div style={{fontSize:10,color:T.sub2,marginBottom:8}}>Émise : {inv.issued} · Éch. : {inv.due||"—"}</div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
                <button onClick={()=>genPDF(inv)} style={{flex:1,background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📄 PDF</button>
                <button onClick={()=>sendWA(inv)} style={{flex:1,background:"rgba(37,211,102,.13)",border:"1px solid rgba(37,211,102,.3)",color:"#25D366",borderRadius:7,padding:"6px 4px",cursor:"pointer",fontSize:10,fontWeight:700}}>📲 WA</button>
                {inv.status!=="paid"&&<button onClick={()=>{setFm({_pay:true,inv});setMdl("pay");}} style={{flex:1,background:"rgba(240,176,32,.1)",border:"none",color:T.gold,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>💳</button>}
                {inv.status!=="paid"&&<button onClick={async()=>{const n=invs.map(x=>x.id===inv.id?{...x,status:"paid",payStatus:"paid"}:x);setInvs(n);await supaUpdate("invoices",{status:"paid",pay_status:"paid"},inv.id);toast("✅ Marquée payée !");}} style={{flex:1,background:"rgba(0,212,120,.1)",border:"none",color:T.gr,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>✅</button>}
              </div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...inv,_edit:true});setMdl("inv");}} style={{flex:1,background:"rgba(26,120,255,.07)",border:"none",color:T.blue,borderRadius:7,padding:"4px",cursor:"pointer",fontSize:10,fontWeight:700}}>✏️ Modifier</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer",msg:`Supprimer ${inv.num} ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=invs.filter(x=>x.id!==inv.id);setInvs(n);await supaDelete("invoices",inv.id);toast("🗑 Supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.08)",border:"none",color:T.red,borderRadius:7,padding:"4px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div>
            </div>
          ))}
          {invs.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Aucune facture. Créez la première ! 📄</div>}
        </div>
      </div>
    );
  };

  const PgCli = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
        <div><div style={{fontWeight:900,fontSize:20}}>👥 Clients</div><div style={{fontSize:11,color:T.sub2}}>{clis.length} · {plan.maxCli===INF?"Illimité":clis.length+"/"+plan.maxCli}</div></div>
        <div style={{display:"flex",gap:7}}><Btn sm v="g" ch="⬇ CSV" onClick={()=>csvExport(clis,"clients")}/><Btn ch="+ Ajouter" onClick={()=>{setFm({pays:PAYS[0],cat:"Commerce",status:"active"});setMdl("cli");}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9}}>
        {clis.map(cl=>(
          <div key={cl.id} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem",animation:flashId===cl.id?"flashGreen .7s ease":"none"}}>
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
              <button onClick={()=>{const ph=cleanP(cl.phone);const m=encodeURIComponent("Bonjour "+cl.name.split(" ")[0]);window.open(`https://wa.me/${ph}?text=${m}`,"_blank");}} style={{flex:1,background:"rgba(37,211,102,.1)",border:"none",color:"#25D366",borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📱</button>
              <button onClick={()=>{setConfirm({title:"🗑 Supprimer",msg:`Supprimer ${cl.name} ?`,confirmLabel:"Supprimer",danger:true,onConfirm:async()=>{const n=clis.filter(x=>x.id!==cl.id);setClis(n);await supaDelete("clients",cl.id);toast("🗑 Supprimé","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
            </div>
          </div>
        ))}
        {clis.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Ajoutez votre premier client 👥</div>}
      </div>
    </div>
  );

  // FIX 2 — NAV BOTTOM : "reseau" ajouté, "cli" conservé, navigation mobile complète
  // 7 items pour couvrir tous les modules importants
  const NAV_BOTTOM = [
    {id:"action", ic:"⚡", lb:"Action"},
    {id:"dash",   ic:"📊", lb:"Accueil"},
    {id:"tx",     ic:"💸", lb:"Ventes"},
    {id:"inv",    ic:"🧾", lb:"Factures"},
    {id:"reseau", ic:"🗺️", lb:"Réseau"},   // ← FIX 2 : Réseau maintenant accessible sur mobile
    {id:"cli",    ic:"👥", lb:"Clients"},
    {id:"prefs",  ic:"⚙️", lb:"Compte"},
  ];

  const NAV = [
    {id:"action",  ic:"⚡",  lb:"Action Rapide"},
    {id:"dash",    ic:"📊",  lb:"Dashboard"},
    {id:"tx",      ic:"💸",  lb:"Transactions"},
    {id:"inv",     ic:"🧾",  lb:"Factures"},
    {id:"cli",     ic:"👥",  lb:"Clients"},
    {id:"carte",   ic:"📇",  lb:"Carte de visite"},
    {id:"logo",    ic:"🎨",  lb:"Mon Logo"},
    {id:"reseau",  ic:"🗺️",  lb:"Réseau"},
    {id:"stats",   ic:"📈",  lb:"Stats"},
    {id:"coach",   ic:"🎥",  lb:"Coach IA"},
    {id:"plans",   ic:"💎",  lb:"Plans"},
    {id:"ambass",  ic:"🤝",  lb:"Ambassadeur"},
    {id:"avis",    ic:"⭐",  lb:"Avis"},
    {id:"prefs",   ic:"⚙️",  lb:"Compte"},
  ];

  // Composants pages simples (non extraits car stables — ne causent pas de re-render problème)
  const PgStats = () => {
    const marge = allSales>0?Math.round((allSales-allExps)/allSales*100):0;
    const panier = allSales/(txs.filter(t=>t.type==="sale").length||1);
    const recouv = invs.length>0?Math.round(invs.filter(i=>i.status==="paid").length/invs.length*100):0;
    const topC = Object.entries(txs.filter(t=>t.type==="sale"&&t.who).reduce((a,t)=>{a[t.who]=(a[t.who]||0)+t.amount;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:16}}>📈 Statistiques</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
          {[{l:"Marge nette",v:marge+"%",co:T.gr,ic:"📈"},{l:"Panier moyen",v:fmtk(panier)+" F",co:T.blue,ic:"🛒"},{l:"Recouvrement",v:recouv+"%",co:T.gold,ic:"💳"},{l:"Retards",v:invs.filter(i=>i.status==="overdue").length,co:T.red,ic:"⏰"}].map(({l,v,co,ic})=>(
            <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}22`,borderRadius:16,padding:"1.1rem"}}>
              <div style={{width:34,height:34,borderRadius:10,background:`${co}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,marginBottom:10}}>{ic}</div>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:3}}>{l}</div>
              <div style={{fontSize:24,fontWeight:900,color:co,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>
        <div className="pg-grid-2" style={{marginBottom:14}}>
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>📊 Évolution 6 mois</div>
            <BarChart data={chartD} h={185}/>
          </div>
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>🍩 Catégories</div>
            {catArr.length?<Donut data={catArr}/>:<div style={{color:T.sub,fontSize:11,textAlign:"center",padding:"2rem 0"}}>Ajoutez des ventes</div>}
          </div>
        </div>
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>🏆 Top 5 clients</div>
          {topC.length===0?<div style={{color:T.sub,fontSize:12,textAlign:"center",padding:"1rem"}}>Ajoutez des transactions</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {topC.map(([nm,val],i)=>(
                <div key={nm} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:24,height:24,borderRadius:7,background:[`${T.gold}20`,`${T.sub2}15`,`${T.sub}12`,`${T.sub}10`,`${T.sub}08`][i],display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:[T.gold,T.sub2,T.sub,T.sub,T.sub][i],flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:12}}>{nm}</span>
                      <span style={{fontWeight:800,fontSize:11,color:T.gr}}>{fmtk(val)} F</span>
                    </div>
                    <div style={{background:T.c3,borderRadius:3,height:4,overflow:"hidden"}}>
                      <div style={{background:`linear-gradient(90deg,${T.gr},${T.teal})`,height:"100%",width:Math.round(val/(topC[0]?.[1]||1)*100)+"%",borderRadius:3}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PgPlans = () => (
    <div>
      <div style={{fontWeight:900,fontSize:20,marginBottom:3}}>💎 Plans & Abonnements</div>
      <div style={{fontSize:11,color:T.sub2,marginBottom:18}}>Plan actuel : <strong style={{color:PLANS[ses.plan||"free"].col}}>{PLANS[ses.plan||"free"].emoji} {PLANS[ses.plan||"free"].label}</strong></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
        {Object.entries(PLANS).map(([k,p])=>{
          const isCur=(ses.plan||"free")===k;
          const feats=[[`${p.maxTx===INF?"Illimité":p.maxTx} transactions`,true],[`${p.maxCli===INF?"Illimité":p.maxCli} clients`,true],[`${p.maxInv===INF?"Illimité":p.maxInv} factures`,true],["PDF Factures",p.pdf],["WhatsApp",p.wa],["Mobile Money",p.mm],["Coach IA",p.ai]];
          return(
            <div key={k} style={{background:T.c1,border:`2px solid ${isCur?p.col:T.border}`,borderRadius:18,padding:"1.4rem"}}>
              {isCur&&<div style={{position:"absolute",top:12,right:12,background:p.col,color:T.ink,fontSize:8,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>ACTUEL</div>}
              <div style={{fontSize:24,marginBottom:3}}>{p.emoji}</div>
              <div style={{fontWeight:900,fontSize:20,color:p.col,marginBottom:3}}>{p.label}</div>
              <div style={{fontWeight:900,fontSize:28,marginBottom:14}}>{p.price===0?"Gratuit":`${p.price.toLocaleString()} FCFA`}<span style={{fontSize:13,fontWeight:400,color:T.sub}}>{p.price>0?"/mois":""}</span></div>
              {feats.map(([feat,ok])=>(<div key={feat} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",fontSize:11,color:ok?T.text:T.sub,opacity:ok?1:.4}}><span style={{flexShrink:0}}>{ok?"✅":"❌"}</span>{feat}</div>))}
              {!isCur&&<Btn full sx={{marginTop:15}} v={k==="business"?"gold":k==="pro"?"p":"g"} ch={"Passer à "+p.label+" →"} onClick={async()=>{
                if(p.price===0){updSes({plan:k});toast("✅ Plan gratuit activé");return;}
                toast("⏳ Création du paiement…");
                try{const res=await fetch("/api/notchpay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"initialize",amount:p.price,email:ses.email,plan:k,uid:ses.id})});const data=await res.json();const url=data?.transaction?.authorization_url||data?.authorization_url;if(url)window.location.href=url;else toast("❌ Erreur paiement","err");}catch(e){toast("❌ Erreur réseau","err");}
              }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const PgAmbassadeur = () => {
    const refLink=`https://vierafrik.com?ref=${ses.refCode||ses.id?.slice(0,8)}`;
    const [copied,setCopied]=useState(false);
    const [stats,setStats]=useState({total:0,paid:0,earnings:0,list:[]});
    const [loadingStats,setLoadingStats]=useState(true);
    useEffect(()=>{
      (async()=>{
        try{const s=await getSupa();const{data}=await s.from("referrals").select("*").eq("ambassador_code",ses.refCode||"");const rows=data||[];const paidRows=rows.filter(r=>r.plan==="pro"||r.plan==="business");const earnings=paidRows.reduce((s,r)=>s+(r.commission||0),0);setStats({total:rows.length,paid:paidRows.length,earnings,list:rows.slice(0,10).map(r=>({email:r.referred_email||"—",plan:r.plan||"free",commission:r.commission||0}))});}catch(e){}finally{setLoadingStats(false);}
      })();
    },[ses.refCode]);
    const copyLink=async()=>{if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(refLink);setCopied(true);toast("🔗 Lien copié !");setTimeout(()=>setCopied(false),2500);return;}catch(e){}}toast("📋 Appuyez longuement sur le lien pour le copier","warn");};
    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:4}}>🤝 Programme Ambassadeur</div>
        <div style={{color:T.sub2,fontSize:12,marginBottom:20}}>Partagez VierAfrik et gagnez 20% sur chaque conversion</div>
        <div style={{background:`linear-gradient(135deg,${T.gr}18,${T.teal}08,${T.c1})`,border:`2px solid ${T.gr}44`,borderRadius:20,padding:"1.6rem",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",color:T.gr,marginBottom:8}}>🔗 Votre lien unique</div>
          <div style={{background:T.c3,borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,fontSize:12,color:T.text,fontWeight:600,wordBreak:"break-all",fontFamily:"monospace"}}>{refLink}</div>
            <button onClick={copyLink} style={{background:copied?T.gr:"rgba(0,212,120,.15)",border:`1px solid ${T.gr}44`,borderRadius:9,padding:"8px 16px",color:copied?T.ink:T.gr,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,flexShrink:0}}>
              {copied?"✅ Copié !":"📋 Copier"}
            </button>
          </div>
          <Btn full v="wa" ch="📱 Partager sur WhatsApp" onClick={()=>{const msg="Bonjour,\n\nInscris-toi sur VierAfrik :\n"+refLink;window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[{ic:"👥",l:"Inscrits",v:stats.total,co:T.blue},{ic:"💎",l:"Convertis",v:stats.paid,co:T.gr},{ic:"💰",l:"Gains",v:Math.round(stats.earnings).toLocaleString()+" FCFA",co:T.gold}].map(({ic,l,v,co})=>(
            <div key={l} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${co}28`,borderRadius:16,padding:"1rem",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:4}}>{l}</div>
              <div style={{fontSize:20,fontWeight:900,color:co}}>{loadingStats?"…":v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PgAvis = () => {
    const [note,setNote]=useState(0);const [hover,setHover]=useState(0);const [comment,setComment]=useState("");const [sending,setSending]=useState(false);const [done,setDone]=useState(false);const [avis,setAvis]=useState([]);const [moyenne,setMoyenne]=useState(0);const [loadingAvis,setLoadingAvis]=useState(true);
    useEffect(()=>{
      (async()=>{try{const s=await getSupa();const{data}=await s.from("avis").select("*").order("date",{ascending:false}).limit(20);const rows=data||[];setAvis(rows);if(rows.length>0){setMoyenne(Math.round(rows.reduce((sum,r)=>sum+(r.note||0),0)/rows.length*10)/10);}}catch(e){}finally{setLoadingAvis(false);}})();
    },[done]);
    const submitAvis=async()=>{if(note===0){toast("⚠️ Choisissez une note","warn");return;}if(!comment.trim()){toast("⚠️ Écrivez un commentaire","warn");return;}setSending(true);try{const s=await getSupa();await s.from("avis").insert({user_id:ses.id,note,commentaire:comment.trim(),pays:ses.country||"CI",date:today(),user_name:ses.name||"Anonyme",business:ses.business||""});setDone(true);setNote(0);setComment("");toast("🌟 Merci !","ok",T.gold);}catch(e){toast("Erreur","err");}finally{setSending(false);}};
    const stars=(n,interactive=false,size=22)=>Array.from({length:5},(_,i)=>(<span key={i} onClick={interactive?()=>setNote(i+1):undefined} onMouseEnter={interactive?()=>setHover(i+1):undefined} onMouseLeave={interactive?()=>setHover(0):undefined} style={{fontSize:size,cursor:interactive?"pointer":"default",color:(interactive?(hover||note):n)>i?T.gold:"rgba(255,255,255,.15)",transition:"color .15s",userSelect:"none"}}>★</span>));
    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:20}}>⭐ Avis Utilisateurs</div>
        <div style={{background:`linear-gradient(135deg,${T.gold}18,${T.c1})`,border:`2px solid ${T.gold}44`,borderRadius:20,padding:"1.4rem",marginBottom:16,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{textAlign:"center",flexShrink:0}}><div style={{fontSize:52,fontWeight:900,color:T.gold,lineHeight:1}}>{loadingAvis?"…":moyenne||"—"}</div><div style={{fontSize:11,color:T.sub2,marginTop:2}}>sur 5</div><div style={{marginTop:6}}>{stars(moyenne,false,16)}</div></div>
          <div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>Note moyenne VierAfrik</div><div style={{fontSize:13,color:T.sub2}}>{loadingAvis?"Chargement…":`${avis.length} avis`}</div></div>
        </div>
        {!done?(
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:16}}>✍️ Laisser votre avis</div>
            <div style={{marginBottom:16,textAlign:"center"}}><div style={{fontSize:11,color:T.sub2,marginBottom:8}}>Votre note</div><div style={{display:"flex",justifyContent:"center",gap:6}}>{stars(note,true,32)}</div></div>
            <div style={{marginBottom:12}}><label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,display:"block",marginBottom:5}}>Commentaire</label><textarea style={{...IS,height:90,resize:"vertical",fontFamily:"inherit"}} placeholder="Votre expérience avec VierAfrik…" value={comment} onChange={ev=>setComment(ev.target.value)} maxLength={500}/></div>
            <Btn full ch={sending?"⏳ Envoi…":"🌟 Publier mon avis"} dis={sending} onClick={submitAvis} v="gold"/>
          </div>
        ):(
          <div style={{background:`linear-gradient(135deg,${T.gold}12,${T.c1})`,border:`1px solid ${T.gold}44`,borderRadius:16,padding:"1.4rem",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div><div style={{fontWeight:800,fontSize:15,color:T.gold,marginBottom:4}}>Merci pour votre avis !</div>
            <Btn ch="Voir tous les avis" v="gold" onClick={()=>setDone(false)} sm/>
          </div>
        )}
        <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>💬 Témoignages récents</div>
          {loadingAvis?<div style={{textAlign:"center",padding:"2rem",color:T.sub,fontSize:12}}>⏳ Chargement…</div>:avis.length===0?<div style={{textAlign:"center",padding:"2rem",color:T.sub,fontSize:12}}>Soyez le premier !</div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {avis.map((av,i)=>(
                <div key={av.id||i} style={{background:T.c3,borderRadius:12,padding:"12px 14px",border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:11,color:T.ink,flexShrink:0}}>{(av.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div><div style={{fontWeight:700,fontSize:12}}>{av.user_name||"Utilisateur"}</div>{av.business&&<div style={{fontSize:10,color:T.sub2}}>{av.business}</div>}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}><div>{[1,2,3,4,5].map(n=><span key={n} style={{fontSize:13,color:n<=(av.note||0)?T.gold:"rgba(255,255,255,.15)"}}>★</span>)}</div><div style={{fontSize:9,color:T.sub}}>{av.date||""}</div></div>
                  </div>
                  <div style={{fontSize:12,color:T.sub2,lineHeight:1.6,fontStyle:"italic"}}>"{av.commentaire}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Carte de visite (stable, pas de bug focus car pas de champs de saisie dans Dashboard)
  const PgCarteVisite = () => <CarteVisite user={ses} accent={accent} toast={toast}/>;
  const PgLogo = () => <LogoGenerator user={ses} accent={accent} toast={toast}/>;

  // Réseau — composants simplifiés intégrés
  const PgReseau = () => {
    const [onglet, setOnglet] = useState("forum");
    const ReseauForum = () => {
      const [msgs,setMsgs]=useState([]);const [newMsg,setNewMsg]=useState("");const [sending,setSending]=useState(false);const [loading,setLoading]=useState(true);
      const CATEGORIES=[{id:"all",label:"Tous",ic:"💬"},{id:"travail",label:"Travail",ic:"👷"},{id:"vente",label:"Vente",ic:"🛒"},{id:"service",label:"Service",ic:"🔧"},{id:"info",label:"Info",ic:"📢"}];
      const [categorie,setCat]=useState("all");const [filtreId,setFiltreId]=useState("all");
      const loadMsgs=async()=>{try{const s=await getSupa();const since=new Date(Date.now()-24*60*60*1000).toISOString();const{data}=await s.from("reseau_messages").select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(50);setMsgs(data||[]);}catch(e){}finally{setLoading(false);}};
      useEffect(()=>{loadMsgs();const iv=setInterval(loadMsgs,15000);return()=>clearInterval(iv);},[]);
      const sendMsg=async()=>{if(!newMsg.trim()||newMsg.trim().length<5){toast("⚠️ Message trop court","warn");return;}setSending(true);try{const s=await getSupa();const msg={id:xid(),user_id:ses.id,user_name:ses.name||"Commerçant",business:ses.business||"",pays:ses.country||"CI",categorie,message:newMsg.trim(),expires_at:new Date(Date.now()+24*60*60*1000).toISOString(),created_at:new Date().toISOString()};const{data,error}=await s.from("reseau_messages").insert(msg).select();if(error)throw error;setMsgs(p=>[{...msg,id:data?.[0]?.id||Date.now()},...p]);setNewMsg("");toast("✅ Publié !");}catch(e){toast("❌ Erreur","err");}finally{setSending(false);}};
      const timeAgo=d=>{const diff=Math.round((Date.now()-new Date(d).getTime())/1000);if(diff<60)return diff+"s";if(diff<3600)return Math.round(diff/60)+"min";return Math.round(diff/3600)+"h";};
      const msgsFiltres=msgs.filter(m=>filtreId==="all"?true:m.categorie===filtreId);
      return(
        <div>
          <div style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem",marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>✍️ Publier une annonce</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {CATEGORIES.slice(1).map(c=><div key={c.id} onClick={()=>setCat(c.id)} style={{background:categorie===c.id?`${accent}25`:T.c3,border:`1px solid ${categorie===c.id?accent:T.border}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,color:categorie===c.id?accent:T.sub2}}>{c.ic} {c.label}</div>)}
            </div>
            <textarea style={{...IS,height:80,resize:"none"}} placeholder="Partagez votre annonce…" value={newMsg} onChange={ev=>setNewMsg(ev.target.value)} maxLength={200}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:10,color:T.sub}}>{newMsg.length}/200</span>
              <button disabled={sending||!newMsg.trim()} onClick={sendMsg} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:accent,color:T.ink,fontFamily:"inherit",opacity:sending||!newMsg.trim()?0.45:1}}>📢 Publier</button>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {CATEGORIES.map(c=><div key={c.id} onClick={()=>setFiltreId(c.id)} style={{background:filtreId===c.id?`${accent}20`:T.c2,border:`1px solid ${filtreId===c.id?accent:T.border}`,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,color:filtreId===c.id?accent:T.sub2}}>{c.ic} {c.label}</div>)}
          </div>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:16,padding:"1.4rem"}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>💬 Annonces ({msgsFiltres.length}) · Auto 15s</div>
            {loading?<div style={{textAlign:"center",padding:"2rem",color:T.sub}}>⏳ Chargement…</div>:msgsFiltres.length===0?<div style={{textAlign:"center",padding:"2.5rem",color:T.sub}}><div style={{fontSize:40,marginBottom:8}}>🤝</div><div>Soyez le premier à publier !</div></div>:(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {msgsFiltres.map((m,i)=>{
                  const isOwn=m.user_id===ses.id;
                  return(
                    <div key={m.id||i} style={{background:isOwn?`${accent}12`:T.c2,border:`1px solid ${isOwn?accent+"44":T.border}`,borderRadius:12,padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${accent},#00bfcc)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:11,color:T.ink,flexShrink:0}}>{(m.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                          <div><div style={{fontWeight:700,fontSize:12}}>{m.user_name||"Commerçant"}{isOwn&&<span style={{fontSize:9,color:accent,marginLeft:5}}>• Vous</span>}</div>{m.business&&<div style={{fontSize:10,color:T.sub2}}>{m.business}</div>}</div>
                        </div>
                        <span style={{fontSize:10,color:T.sub,flexShrink:0}}>{timeAgo(m.created_at)}</span>
                      </div>
                      <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{m.message}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    };

    return(
      <div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:16}}>🗺️ Réseau VierAfrik</div>
        <div style={{display:"flex",gap:0,background:T.c2,borderRadius:14,padding:4,marginBottom:20,border:`1px solid ${T.border}`}}>
          {[{id:"forum",ic:"🤝",label:"Forum annonces"}].map(o=>(
            <button key={o.id} onClick={()=>setOnglet(o.id)} style={{flex:1,padding:"10px 8px",borderRadius:11,border:"none",background:onglet===o.id?`linear-gradient(135deg,${accent},${T.teal})`:"transparent",color:onglet===o.id?T.ink:T.sub2,fontFamily:"inherit",fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {o.ic} {o.label}
            </button>
          ))}
        </div>
        {onglet==="forum"&&<ReseauForum/>}
      </div>
    );
  };

  // Action Rapide (simplifié pour stabilité — version complète disponible dans le build original)
  const PgActionRapide = () => {
    const AR_CATS=[{id:"services",label:"Services",emoji:"🧹",col:"#1a78ff"},{id:"resto",label:"Restauration",emoji:"🍽️",col:"#ff5a18"},{id:"beaute",label:"Beauté",emoji:"💅",col:"#9060ff"},{id:"transport",label:"Transport",emoji:"🚛",col:"#f0b020"},{id:"reparation",label:"Réparation",emoji:"🔧",col:"#00bfcc"},{id:"batiment",label:"Bâtiment",emoji:"🏗️",col:"#ff2255"},{id:"sante",label:"Santé",emoji:"🏥",col:"#00d478"},{id:"hotel",label:"Hôtel",emoji:"🏨",col:"#f0b020"},{id:"business",label:"Business",emoji:"💼",col:"#1a78ff"}];
    const [selCat,setSelCat]=useState(null);
    const [mode,setMode]=useState(null);
    const [posts,setPosts]=useState([]);
    const [loadingP,setLoadingP]=useState(false);
    const [propForm,setPropForm]=useState({city:"",phone:"",desc:"",imageUrl:""});
    const [propPreview,setPropPreview]=useState(null);
    const [published,setPublished]=useState(false);
    const [filterCity,setFilterCity]=useState("");
    const AR_VILLES=["Abidjan","Dakar","Douala","Accra","Lagos","Bamako","Ouagadougou","Lomé","Cotonou","Conakry"];
    const catObj=AR_CATS.find(c=>c.id===selCat);
    const IFS={width:"100%",padding:"11px 14px",background:T.c3,border:`1px solid ${T.border}`,borderRadius:11,color:T.text,fontFamily:"inherit",fontSize:13,outline:"none",marginTop:4};

    const loadPosts=useCallback(async()=>{setLoadingP(true);try{const s=await getSupa();let q=s.from("quick_posts").select("*").order("created_at",{ascending:false}).limit(60);if(filterCity)q=q.eq("city",filterCity);if(selCat)q=q.eq("category",selCat);const{data}=await q;setPosts(data||[]);}catch(e){setPosts([]);}finally{setLoadingP(false);};},[filterCity,selCat]);
    useEffect(()=>{if(mode==="search")loadPosts();},[mode,filterCity]);

    const handleImage=e=>{const f=e.target.files[0];if(!f)return;const img=new Image();const url=URL.createObjectURL(f);img.onload=()=>{const MAX=800;let w=img.width,h=img.height;if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r);}const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);const compressed=canvas.toDataURL("image/jpeg",0.72);URL.revokeObjectURL(url);setPropPreview(compressed);setPropForm(p=>({...p,imageUrl:compressed}));};img.src=url;};
    const handlePublish=async()=>{if(!propForm.phone){toast("📞 Numéro obligatoire","err");return;}if(!propPreview){toast("📷 Photo obligatoire","err");return;}if(!propForm.city){toast("📍 Ville obligatoire","err");return;}setLoadingP(true);try{const s=await getSupa();await s.from("quick_posts").insert({id:xid(),user_id:ses?.id||"",category:selCat,city:propForm.city,phone:propForm.phone,description:propForm.desc||"",image_url:propPreview,created_at:new Date().toISOString()});setPublished(true);}catch(e){toast("Erreur — réessayez","err");}finally{setLoadingP(false);}};
    const resetAR=()=>{setSelCat(null);setMode(null);setPropForm({city:"",phone:"",desc:"",imageUrl:""});setPropPreview(null);setPublished(false);};

    if(!selCat)return(
      <div>
        <div style={{textAlign:"center",marginBottom:"1.4rem"}}><div style={{fontWeight:900,fontSize:24,marginBottom:4}}>⚡ Que veux-tu <span style={{color:accent}}>faire ?</span></div><div style={{fontSize:12,color:T.sub2}}>Choisis une catégorie</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {AR_CATS.map(cat=>(
            <div key={cat.id} onClick={()=>setSelCat(cat.id)} style={{background:`${cat.col}12`,border:`2px solid ${cat.col}33`,borderRadius:16,padding:"1.2rem",cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
              <div style={{fontSize:32,marginBottom:6}}>{cat.emoji}</div>
              <div style={{fontWeight:800,fontSize:11,color:cat.col}}>{cat.label}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if(!mode)return(
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <button onClick={resetAR} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub2,padding:"5px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:16}}>← Retour</button>
        <div style={{textAlign:"center",marginBottom:"1.8rem"}}><div style={{fontSize:60,marginBottom:8}}>{catObj?.emoji}</div><div style={{fontWeight:900,fontSize:22,marginBottom:4}}>Tu veux <span style={{color:accent}}>quoi ?</span></div></div>
        <div style={{display:"flex",gap:12}}>
          {[{v:"search",ic:"🔍",label:"Je cherche",col:T.blue,desc:"Trouver un prestataire"},{v:"propose",ic:"📢",label:"Je propose",col:T.gr,desc:"Publier mon service"}].map(({v,ic,label,col,desc})=>(
            <button key={v} onClick={()=>setMode(v)} style={{flex:1,padding:"1.4rem 1rem",borderRadius:18,border:`2px solid ${col}55`,background:`${col}08`,cursor:"pointer",fontFamily:"inherit",color:T.text}}>
              <div style={{fontSize:44,marginBottom:8}}>{ic}</div><div style={{fontWeight:900,fontSize:16,color:col,marginBottom:5}}>{label}</div><div style={{fontSize:11,color:T.sub2,lineHeight:1.4}}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    );

    if(mode==="propose"){
      if(published)return(
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:72,marginBottom:12}}>🎉</div><div style={{fontWeight:900,fontSize:22,marginBottom:6}}>Publié !</div><div style={{color:T.sub2,fontSize:13,marginBottom:24}}>Ton profil est visible.</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {[{l:"👥 Clients →",fn:()=>setPage("cli")},{l:"🧾 Facture →",fn:()=>setPage("inv")}].map(b=><button key={b.l} onClick={b.fn} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${T.gr}44`,background:`${T.gr}10`,color:T.gr,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11}}>{b.l}</button>)}
          </div>
          <button onClick={resetAR} style={{background:"none",border:"none",color:T.sub2,cursor:"pointer",fontSize:12,fontFamily:"inherit",marginTop:12}}>+ Nouvelle publication</button>
        </div>
      );
      return(
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <button onClick={()=>setMode(null)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub2,padding:"5px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:16}}>← Retour</button>
          <div style={{textAlign:"center",marginBottom:"1.4rem"}}><div style={{fontWeight:900,fontSize:22,marginBottom:4}}>📢 Mon <span style={{color:accent}}>service</span></div></div>
          <input id="photo-upload-ar" type="file" accept="image/*" onChange={handleImage} style={{display:"none"}}/>
          <div style={{marginBottom:13}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:5}}>📷 Photo *</div>
            {propPreview?(
              <div style={{position:"relative"}}><img src={propPreview} alt="preview" style={{width:"100%",height:180,objectFit:"cover",borderRadius:14,border:`2px solid ${accent}55`,display:"block"}}/><button type="button" onClick={()=>{setPropPreview(null);setPropForm(p=>({...p,imageUrl:""}));}} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>
            ):(
              <button type="button" onClick={()=>document.getElementById("photo-upload-ar").click()} style={{width:"100%",height:120,borderRadius:14,border:`2px dashed ${T.border}`,background:T.c2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:T.sub,cursor:"pointer",fontFamily:"inherit"}}><span style={{fontSize:36}}>📷</span><span style={{fontSize:12,fontWeight:600}}>Appuyer pour photographier</span></button>
            )}
          </div>
          <div style={{marginBottom:13}}><label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:5}}>📍 Ville *</label><select style={IFS} value={propForm.city} onChange={e=>setPropForm(f=>({...f,city:e.target.value}))}><option value="">Choisir…</option>{AR_VILLES.map(v=><option key={v}>{v}</option>)}</select></div>
          <div style={{marginBottom:13}}><label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:5}}>📞 Téléphone *</label><input type="tel" style={IFS} placeholder="+225 07 000 0000" value={propForm.phone} onChange={e=>setPropForm(f=>({...f,phone:e.target.value}))}/></div>
          <div style={{marginBottom:18}}><label style={{display:"block",fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:5}}>✏️ Description</label><textarea style={{...IFS,height:68,resize:"vertical"}} placeholder="Décrivez votre service…" value={propForm.desc} onChange={e=>setPropForm(f=>({...f,desc:e.target.value}))}/></div>
          <button type="button" onClick={handlePublish} disabled={loadingP} style={{width:"100%",padding:"14px",borderRadius:13,border:"none",background:loadingP?T.c3:`linear-gradient(135deg,${accent},${T.teal})`,color:loadingP?T.sub:T.ink,fontFamily:"inherit",fontWeight:900,fontSize:15,cursor:loadingP?"not-allowed":"pointer"}}>{loadingP?"⏳ Publication…":"🚀 Publier maintenant"}</button>
        </div>
      );
    }

    if(mode==="search")return(
      <div>
        <button onClick={()=>setMode(null)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,color:T.sub2,padding:"5px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:16}}>← Retour</button>
        <div style={{fontWeight:900,fontSize:20,marginBottom:12}}>🔍 Prestataires <span style={{color:T.blue}}>disponibles</span></div>
        <select style={{...IFS,marginBottom:16}} value={filterCity} onChange={e=>setFilterCity(e.target.value)}><option value="">📍 Toutes les villes</option>{AR_VILLES.map(v=><option key={v}>{v}</option>)}</select>
        {loadingP?<div style={{textAlign:"center",padding:"3rem",color:T.sub}}>⏳ Chargement…</div>:posts.length===0?<div style={{textAlign:"center",padding:"3rem",color:T.sub}}><div style={{fontSize:52,marginBottom:12}}>🌍</div><div>Aucun prestataire pour l'instant</div></div>:(
          posts.map(p=>{const c=AR_CATS.find(x=>x.id===p.category);return(
            <div key={p.id} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",marginBottom:12}}>
              {p.image_url&&<img src={p.image_url} alt="service" style={{width:"100%",height:155,objectFit:"cover",display:"block"}}/>}
              <div style={{padding:"12px 14px"}}>
                <div style={{fontWeight:800,fontSize:14,marginBottom:6}}>{c?.emoji} {c?.label||p.category}</div>
                {p.description&&<div style={{fontSize:12,color:T.sub2,marginBottom:8}}>{p.description}</div>}
                <div style={{display:"flex",gap:7}}>
                  <button onClick={()=>window.open(`tel:${cleanP(p.phone)}`,"_blank")} style={{flex:1,padding:"9px",borderRadius:9,border:`1px solid ${T.gr}33`,background:`${T.gr}08`,color:T.gr,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11}}>📞 Appeler</button>
                  <button onClick={()=>window.open(`https://wa.me/${cleanP(p.phone)}`,"_blank")} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid rgba(37,211,102,.3)",background:"rgba(37,211,102,.1)",color:"#25D366",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11}}>💬 WhatsApp</button>
                </div>
              </div>
            </div>
          );})
        )}
      </div>
    );
    return null;
  };

  const PgCoach = () => (
    <div>
      <div style={{textAlign:"center",marginBottom:"1.6rem"}}>
        <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 12px",boxShadow:`0 0 40px ${accent}44`}}>🎥</div>
        <div style={{fontWeight:900,fontSize:22,marginBottom:4}}>Coach <span style={{color:accent}}>VierAfrik</span></div>
        <div style={{fontSize:12,color:T.sub2}}>Je te montre → tu comprends → tu gagnes</div>
      </div>
      <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1rem",marginBottom:9}}>
        {!plan.ai&&<div style={{background:"rgba(240,176,32,.07)",border:"1px solid rgba(240,176,32,.2)",borderRadius:10,padding:"10px 13px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{flex:1}}><div style={{fontWeight:700,color:T.gold,fontSize:11}}>🔒 Coach IA — Plan Pro</div></div><Btn sm v="gold" ch="Passer à Pro →" onClick={()=>setPage("plans")}/></div>}
        <div style={{height:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:9,marginBottom:9}}>
          {chat.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",padding:"9px 12px",borderRadius:m.r==="user"?"14px 14px 3px 14px":"3px 14px 14px 14px",background:m.r==="user"?accent:T.c2,color:m.r==="user"?T.ink:T.text,fontSize:11,lineHeight:1.6}}>{m.r==="ai"&&<div style={{fontWeight:700,fontSize:9,color:accent,marginBottom:2}}>🤖 Coach VierAfrik</div>}{m.t}</div></div>))}
          {cLoad&&<div style={{display:"flex"}}><div style={{background:T.c2,padding:"9px 12px",borderRadius:"3px 14px 14px 14px",fontSize:11,color:T.sub}}>⏳ Analyse…</div></div>}
          <div ref={chatRef}/>
        </div>
        <div style={{display:"flex",gap:7}}>
          <input style={{...IS,flex:1,marginTop:0,fontSize:12}} disabled={!plan.ai} placeholder={plan.ai?"Votre question business…":"Disponible en plan Pro"} value={cMsg} onChange={ev=>setCMsg(ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&!cLoad&&sendAI()}/>
          <Btn ch={cLoad?"⏳":"→"} dis={cLoad||!plan.ai} onClick={sendAI} sx={{flexShrink:0}}/>
        </div>
      </div>
    </div>
  );

  // Map page → composant
  // PgParams reçoit toutes ses dépendances en props → isolation totale
  const PMAP = {
    dash:    <PgDash/>,
    tx:      <PgTx/>,
    inv:     <PgInv/>,
    cli:     <PgCli/>,
    stats:   <PgStats/>,
    coach:   <PgCoach/>,
    plans:   <PgPlans/>,
    prefs:   <PgParams
                ses={ses}
                txs={txs}
                clis={clis}
                invs={invs}
                allSales={allSales}
                accent={accent}
                updSes={updSes}
                setConfirm={setConfirm}
                logout={logout}
                toast={toast}
              />,
    ambass:  <PgAmbassadeur/>,
    avis:    <PgAvis/>,
    action:  <PgActionRapide/>,
    reseau:  <PgReseau/>,
    carte:   <PgCarteVisite/>,
    logo:    <PgLogo/>,
  };

  const FloatingBtns = () => {
    const [showPanel,setShowPanel]=useState(false);
    const [pos,setPos]=useState({bottom:76,right:14});
    const dragging=useRef(false);const startPos=useRef({});const btnRef=useRef(null);
    const onDragStart=e=>{dragging.current=true;const clientX=e.touches?e.touches[0].clientX:e.clientX;const clientY=e.touches?e.touches[0].clientY:e.clientY;startPos.current={startX:clientX,startY:clientY,startRight:pos.right,startBottom:pos.bottom};e.preventDefault();};
    const onDragMove=e=>{if(!dragging.current)return;const clientX=e.touches?e.touches[0].clientX:e.clientX;const clientY=e.touches?e.touches[0].clientY:e.clientY;const dx=clientX-startPos.current.startX;const dy=clientY-startPos.current.startY;setPos({right:Math.max(0,Math.min(window.innerWidth-120,startPos.current.startRight-dx)),bottom:Math.max(10,Math.min(window.innerHeight-60,startPos.current.startBottom-dy))});};
    const onDragEnd=()=>{dragging.current=false;};
    useEffect(()=>{window.addEventListener("mousemove",onDragMove);window.addEventListener("mouseup",onDragEnd);window.addEventListener("touchmove",onDragMove,{passive:false});window.addEventListener("touchend",onDragEnd);return()=>{window.removeEventListener("mousemove",onDragMove);window.removeEventListener("mouseup",onDragEnd);window.removeEventListener("touchmove",onDragMove);window.removeEventListener("touchend",onDragEnd);};},[pos]);
    return(
      <>
        {showPanel&&(<div onClick={()=>setShowPanel(false)} style={{position:"fixed",inset:0,zIndex:590,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"fixed",bottom:140,right:14,zIndex:595,background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`2px solid ${accent}44`,borderRadius:20,padding:"16px",width:250,boxShadow:`0 20px 60px rgba(0,0,0,.8)`,animation:"pop .25s cubic-bezier(.34,1.56,.64,1)",maxHeight:"70vh",overflowY:"auto"}}>
            <div style={{fontWeight:800,fontSize:13,color:T.text,marginBottom:12,textAlign:"center"}}>💰 Que veux-tu faire ?</div>
            {[{ic:"⚡",label:"Action Rapide",col:T.blue,fn:()=>{setPage("action");setShowPanel(false);}},{ic:"📊",label:"Dashboard",col:T.gr,fn:()=>{setPage("dash");setShowPanel(false);}},{ic:"💎",label:"Plans",col:T.gold,fn:()=>{setPage("plans");setShowPanel(false);}},{ic:"🤝",label:"Ambassadeur",col:"#ff5a18",fn:()=>{setPage("ambass");setShowPanel(false);}},{ic:"🗺️",label:"Réseau",col:T.teal,fn:()=>{setPage("reseau");setShowPanel(false);}},].map(({ic,label,col,fn})=>(
              <button key={label} onClick={fn} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"9px 10px",marginBottom:6,background:`${col}12`,border:`1px solid ${col}33`,borderRadius:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                <div style={{width:32,height:32,borderRadius:9,background:`${col}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ic}</div>
                <div style={{fontWeight:800,fontSize:11,color:T.text}}>{label}</div>
                <div style={{marginLeft:"auto",color:col,fontSize:13}}>→</div>
              </button>
            ))}
          </div>
        </div>)}
        <button ref={btnRef} onMouseDown={onDragStart} onTouchStart={onDragStart} onClick={()=>setShowPanel(p=>!p)} style={{position:"fixed",bottom:pos.bottom,right:pos.right,zIndex:600,background:`linear-gradient(135deg,${accent},${T.teal})`,border:"none",borderRadius:28,padding:"11px 18px",color:T.ink,fontFamily:"inherit",fontWeight:900,fontSize:12,cursor:"grab",boxShadow:`0 6px 24px ${accent}55`,display:"flex",alignItems:"center",gap:7,userSelect:"none",touchAction:"none"}}>
          {showPanel?"✕ Fermer":"💰 Gagner"}
        </button>
      </>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(820px) rotate(720deg);opacity:0}}
        @keyframes pop{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes toastIn{from{opacity:0;transform:translateX(40px) scale(.94)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes toastBar{from{opacity:1}to{opacity:0}}
        @keyframes toastProgress{from{width:100%}to{width:0%}}
        @keyframes flashGreen{0%{box-shadow:0 0 0 0 rgba(0,212,120,.7)}40%{box-shadow:0 0 0 8px rgba(0,212,120,.0),inset 0 0 20px 4px rgba(0,212,120,.18)}100%{box-shadow:0 0 0 0 rgba(0,212,120,0)}}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:${T.c4};border-radius:2px}
        input,select,textarea{color-scheme:dark}
        input:focus,select:focus,textarea:focus{border-color:${accent}!important;box-shadow:0 0 0 3px ${accent}20;outline:none}
        button{-webkit-appearance:none}
        button:active{transform:scale(.96)!important}
        .pg-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .desktop-nav{display:flex}
        .mobile-nav{display:none}
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-nav{display:flex!important}
          .pg-grid-2{grid-template-columns:1fr!important}
        }
      `}</style>

      {loading&&<div style={{position:"fixed",inset:0,background:T.bg,zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
        <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:`0 0 60px ${accent}44`,animation:"pop .4s cubic-bezier(.34,1.56,.64,1)"}}>🌍</div>
        <div style={{width:40,height:40,border:`3px solid ${T.c3}`,borderTop:`3px solid ${accent}`,borderRadius:"50%",animation:"spin .75s linear infinite"}}/>
        <div style={{textAlign:"center"}}><div style={{color:T.text,fontSize:15,fontWeight:700}}>VierAfrik</div><div style={{color:T.sub,fontSize:12,marginTop:3}}>Chargement…</div></div>
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
            {notOpen&&(<div onClick={()=>setNot(false)} style={{position:"fixed",top:"58px",right:"10px",background:T.c1,border:`1px solid ${T.border}`,borderRadius:13,minWidth:270,maxWidth:"92vw",boxShadow:"0 20px 60px rgba(0,0,0,.85)",zIndex:500,overflow:"hidden"}}>
              <div style={{padding:"11px 14px",borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:12}}>🔔 Notifications</div>
              {notifs.length===0?<div style={{padding:".9rem",color:T.sub,fontSize:11,textAlign:"center"}}>Aucune notification</div>:notifs.map(n=><div key={n.id} style={{padding:"9px 14px",borderBottom:`1px solid ${T.border}`,fontSize:11,color:T.text}}>{n.msg}</div>)}
            </div>)}
          </div>
          <Btn sm ch="+ Vente" onClick={()=>{setFm({type:"sale",cat:"Commerce",date:today()});setMdl("tx");}} sx={{background:accent,color:T.ink}}/>
          <div onClick={()=>setPage("prefs")} style={{width:31,height:31,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:10,color:T.ink,cursor:"pointer",flexShrink:0}}>
            {(ses.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{paddingTop:54,paddingBottom:80,position:"relative",zIndex:1}}>
        <div style={{padding:"1.2rem",maxWidth:1340,margin:"0 auto"}}>
          {/* FIX 1 : PMAP["prefs"] reçoit ses props directement → composant stable, jamais remonté */}
          {PMAP[page]||<PgDash/>}
        </div>
      </div>

      <Toasts list={tsts}/>
      {confirmState&&<ConfirmModal open={!!confirmState} onClose={()=>setConfirm(null)} onConfirm={confirmState.onConfirm} title={confirmState.title} msg={confirmState.msg} confirmLabel={confirmState.confirmLabel} danger={confirmState.danger}/>}
      <ActivityNotifWidget/>
      <FloatingBtns/>

      {/* Welcome video */}
      {showWelcomeVideo&&(
        <div onClick={()=>setShowWelcomeVideo(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:980,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 72px",backdropFilter:"blur(16px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(160deg,${T.c1},${T.c2})`,border:`2px solid ${accent}44`,borderRadius:24,padding:"1.8rem",width:"92%",maxWidth:420,boxShadow:`0 -30px 80px rgba(0,0,0,.9)`,animation:"pop .35s cubic-bezier(.34,1.56,.64,1)"}}>
            <button onClick={()=>setShowWelcomeVideo(false)} style={{position:"absolute",top:14,right:14,background:T.c3,border:`1px solid ${T.border}`,color:T.sub2,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:60,height:60,borderRadius:18,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🎥</div>
              <div><div style={{fontWeight:900,fontSize:16}}>Coach <span style={{color:accent}}>VierAfrik</span></div><div style={{fontSize:11,color:T.sub2,marginTop:2}}>Je te montre → tu comprends → tu gagnes</div></div>
            </div>
            <div style={{background:T.c3,borderRadius:14,padding:"14px 16px",marginBottom:16,border:`1px solid ${accent}22`}}>
              <div style={{fontSize:13,color:T.text,lineHeight:1.7}}>Bonjour 👋 bienvenue sur <strong style={{color:accent}}>VierAfrik</strong>.<br/>Je vais te montrer comment <strong style={{color:T.gr}}>gagner de l'argent</strong> ici. C'est simple ! 🌍</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setShowWelcomeVideo(false);setPage("coach");}} style={{flex:2,padding:"12px",borderRadius:13,border:"none",background:`linear-gradient(135deg,${accent},${T.teal})`,color:T.ink,fontFamily:"inherit",fontWeight:900,fontSize:13,cursor:"pointer"}}>▶️ Regarder</button>
              <button onClick={()=>setShowWelcomeVideo(false)} style={{flex:1,padding:"12px",borderRadius:13,border:`1px solid ${T.border}`,background:T.c2,color:T.sub2,fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer"}}>⏭️ Passer</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup avis */}
      {showAvisPopup&&(
        <div onClick={()=>setShowAvisPopup(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:950,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0 0 80px",backdropFilter:"blur(8px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(135deg,${T.c1},${T.c2})`,border:`1px solid ${T.gold}44`,borderRadius:20,padding:"1.6rem",width:"92%",maxWidth:400,animation:"pop .3s cubic-bezier(.34,1.56,.64,1)"}}>
            <button onClick={()=>setShowAvisPopup(false)} style={{position:"absolute",top:14,right:14,background:T.c3,border:"none",color:T.sub2,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:12}}>✕</button>
            <div style={{fontSize:32,marginBottom:8,textAlign:"center"}}>⭐</div>
            <div style={{fontWeight:800,fontSize:16,textAlign:"center",marginBottom:6}}>Que penses-tu de VierAfrik ?</div>
            <div style={{fontSize:12,color:T.sub2,textAlign:"center",marginBottom:16}}>Ton avis nous aide à améliorer l'application.</div>
            <div style={{display:"flex",gap:8}}>
              <Btn full v="gold" ch="⭐ Laisser un avis" onClick={()=>{setShowAvisPopup(false);setPage("avis");}}/>
              <Btn full v="g" ch="Plus tard" onClick={()=>setShowAvisPopup(false)}/>
            </div>
          </div>
        </div>
      )}

      {/* FIX 2 — NAV BOTTOM MOBILE — 7 items avec réseau */}
      <nav className="mobile-nav" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,height:62,alignItems:"center",justifyContent:"space-around",background:"rgba(1,3,6,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,padding:"0 0"}}>
        {NAV_BOTTOM.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 1px",minWidth:0,flex:1}}>
            <span style={{fontSize:16,lineHeight:1}}>{n.ic}</span>
            <span style={{fontSize:6,color:page===n.id?accent:T.sub,fontWeight:700,whiteSpace:"nowrap"}}>{n.lb}</span>
            {page===n.id&&<div style={{width:16,height:2,borderRadius:1,background:accent,marginTop:1}}/>}
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <Modal open={mdl==="tx"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier":"➕ Nouvelle transaction"}>
        <div style={{display:"flex",gap:3,background:T.c3,borderRadius:11,padding:4,marginBottom:15}}>
          {[["sale","💰 Vente"],["expense","📤 Dépense"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFm(f=>({...f,type:v}))} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:fm.type===v?T.c1:"transparent",color:fm.type===v?T.text:T.sub}}>{l}</button>
          ))}
        </div>
        <FL l="Montant (FCFA)" ch={<input type="number" style={IS} placeholder="150 000" value={fm.amount||""} onChange={ev=>setFm(f=>({...f,amount:ev.target.value}))}/>}/>
        <FL l="Catégorie"><select style={IS} value={fm.cat||"Commerce"} onChange={ev=>setFm(f=>({...f,cat:ev.target.value}))}>{(fm.type==="expense"?CATS_E:CATS_S).map(c=><option key={c}>{c}</option>)}</select></FL>
        <FL l="Client / Fournisseur" ch={<><input type="text" style={IS} placeholder="Nom…" value={fm.who||""} onChange={ev=>setFm(f=>({...f,who:ev.target.value}))} list="cl_ls"/><datalist id="cl_ls">{clis.map(c=><option key={c.id} value={c.name}/>)}</datalist></>}/>
        <FL l="Date" ch={<input type="date" style={IS} value={fm.date||today()} onChange={ev=>setFm(f=>({...f,date:ev.target.value}))}/>}/>
        <FL l="Note" ch={<input style={IS} placeholder="Optionnel…" value={fm.note||""} onChange={ev=>setFm(f=>({...f,note:ev.target.value}))}/>}/>
        <div style={{display:"flex",gap:7,marginTop:14}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Enregistrer"} onClick={saveTx}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      <Modal open={mdl==="inv"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier facture":"🧾 Nouvelle facture"} wide>
        <div className="pg-grid-2">
          <FL l="Client" ch={<><input type="text" style={IS} placeholder="Nom du client" value={fm.clientName||""} onChange={ev=>{const n=ev.target.value;const cl=clis.find(c=>c.name.toLowerCase()===n.toLowerCase());setFm(f=>({...f,clientName:n,clientId:cl?.id||"",phone:cl?.phone||f.phone||""}));}} list="cl_inv"/><datalist id="cl_inv">{clis.map(c=><option key={c.id} value={c.name}/>)}</datalist></>}/>
          <FL l="Téléphone" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
          <FL l="Date émission" ch={<input type="date" style={IS} value={fm.issued||today()} onChange={ev=>setFm(f=>({...f,issued:ev.target.value}))}/>}/>
          <FL l="Échéance" ch={<input type="date" style={IS} value={fm.due||""} onChange={ev=>setFm(f=>({...f,due:ev.target.value}))}/>}/>
          <FL l="Statut"><select style={IS} value={fm.status||"pending"} onChange={ev=>setFm(f=>({...f,status:ev.target.value}))}><option value="pending">⏳ En attente</option><option value="paid">✅ Payée</option><option value="overdue">🔴 En retard</option></select></FL>
          <FL l="Taxe (FCFA)" ch={<input type="number" style={IS} placeholder="0" value={fm.tax===0||fm.tax===undefined?"":fm.tax} onChange={ev=>setFm(f=>({...f,tax:parseFloat(ev.target.value)||0}))}/>}/>
        </div>
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
          <button onClick={()=>setFm(f=>({...f,items:[...(f.items||[]),{id:xid(),name:"",qty:1,price:0}]}))} style={{background:"rgba(0,212,120,.08)",border:`1px dashed ${T.gr}33`,borderRadius:8,padding:"6px 13px",color:T.gr,cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,width:"100%",marginTop:3}}>+ Ajouter</button>
          {(fm.items||[]).some(it=>it.price>0)&&<div style={{textAlign:"right",marginTop:7,fontWeight:700,color:T.gr,fontSize:13}}>Total : {fmtf((fm.items||[]).reduce((s,it)=>s+(it.qty||1)*(it.price||0),0)+(fm.tax||0))}</div>}
        </div>
        <FL l="Notes" ch={<textarea style={{...IS,height:55,resize:"vertical"}} placeholder="Conditions, remarques…" value={fm.notes||""} onChange={ev=>setFm(f=>({...f,notes:ev.target.value}))}/>}/>
        <div style={{display:"flex",gap:7,marginTop:13}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Créer"} onClick={saveInv}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      <Modal open={mdl==="cli"} onClose={()=>{setMdl(null);setFm({});}} title={fm._edit?"✏️ Modifier client":"👤 Nouveau client"}>
        <FL l="Nom complet" ch={<input style={IS} placeholder="Prénom Nom" value={fm.name||""} onChange={ev=>setFm(f=>({...f,name:ev.target.value}))}/>}/>
        <FL l="Pays"><select style={IS} value={fm.pays||PAYS[0]} onChange={ev=>setFm(f=>({...f,pays:ev.target.value}))}>{PAYS.map(p=><option key={p}>{p}</option>)}</select></FL>
        <FL l="Téléphone" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
        <FL l="Email" ch={<input type="email" style={IS} placeholder="client@email.com" value={fm.email||""} onChange={ev=>setFm(f=>({...f,email:ev.target.value}))}/>}/>
        <FL l="Catégorie"><select style={IS} value={fm.cat||"Commerce"} onChange={ev=>setFm(f=>({...f,cat:ev.target.value}))}>{["Commerce","Services","Alimentation","Transport","BTP","Santé","Éducation","Divers"].map(c=><option key={c}>{c}</option>)}</select></FL>
        <FL l="Statut"><select style={IS} value={fm.status||"active"} onChange={ev=>setFm(f=>({...f,status:ev.target.value}))}><option value="active">✅ Actif</option><option value="inactive">🔴 Inactif</option></select></FL>
        <div style={{display:"flex",gap:7,marginTop:13}}>
          <Btn ch={fm._edit?"✅ Modifier":"✅ Ajouter"} onClick={saveCli}/>
          <Btn v="g" ch="Annuler" onClick={()=>{setMdl(null);setFm({});}}/>
        </div>
      </Modal>

      <Modal open={mdl==="pay"} onClose={()=>{setMdl(null);setFm({});}} title="💳 Paiement Mobile Money">
        {fm.inv&&<div style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:11,padding:"12px 14px",marginBottom:16}}><div style={{fontSize:11,color:T.sub2,marginBottom:1}}>Facture {fm.inv.num}</div><div style={{fontWeight:900,fontSize:22,color:T.gr}}>{fmtf(fm.inv.total)}</div></div>}
        <div style={{marginBottom:13}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:9}}>Opérateur</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {MM.map(p=>(
              <div key={p.id} onClick={()=>setFm(f=>({...f,prov:p.id}))} style={{padding:"11px",background:fm.prov===p.id?`${T.gr}12`:T.c2,border:`2px solid ${fm.prov===p.id?T.gr:T.border}`,borderRadius:11,cursor:"pointer"}}>
                <div style={{fontSize:17,marginBottom:2}}>{p.emoji}</div>
                <div style={{fontWeight:700,fontSize:12}}>{p.label}</div>
                <div style={{fontSize:9,color:T.sub2}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <FL l="Numéro Mobile Money" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
        <Btn full ch={`💳 Initier le paiement`} onClick={doPay}/>
      </Modal>

      <Modal open={mdl==="mm"} onClose={()=>{setMdl(null);setFm({});}} title="📱 Mobile Money">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{id:"orange",emoji:"🟠",label:"Orange Money",col:"#FF6600"},{id:"mtn",emoji:"💛",label:"MTN MoMo",col:"#FFCC00"},{id:"wave",emoji:"🌊",label:"Wave",col:"#1A9BDB"},{id:"moov",emoji:"🔵",label:"Moov Money",col:"#0066CC"}].map(p=>(
            <div key={p.id} onClick={()=>setFm(f=>({...f,prov:p.id}))} style={{padding:"14px",background:fm.prov===p.id?`${p.col}18`:T.c2,border:`2px solid ${fm.prov===p.id?p.col:T.border}`,borderRadius:13,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:4}}>{p.emoji}</div>
              <div style={{fontWeight:800,fontSize:12,color:fm.prov===p.id?p.col:T.text}}>{p.label}</div>
            </div>
          ))}
        </div>
        <FL l="Numéro" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
        <FL l="Montant (FCFA)" ch={<input type="number" style={IS} placeholder="Ex: 50000" value={fm.amount||""} onChange={ev=>setFm(f=>({...f,amount:ev.target.value}))}/>}/>
        <Btn full ch={fm.prov?`💳 ${fm.prov.toUpperCase()}${fm.amount?" — "+fmtf(parseFloat(fm.amount)||0):" "}`:"💳 Choisissez un opérateur"} onClick={async()=>{
          if(!fm.prov){toast("⚠️ Choisissez un opérateur","err");return;}
          if(!fm.phone){toast("⚠️ Saisissez le numéro","err");return;}
          if(!fm.amount||parseFloat(fm.amount)<=0){toast("⚠️ Saisissez un montant","err");return;}
          toast(`⏳ Création paiement ${fm.prov.toUpperCase()}…`);
          try{const res=await fetch("/api/notchpay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"initialize",amount:parseFloat(fm.amount),email:ses.email,plan:"mm_"+fm.prov,uid:ses.id,phone:fm.phone})});const data=await res.json();const url=data?.transaction?.authorization_url||data?.authorization_url;if(url){setMdl(null);setFm({});toast("🔗 Redirection…");setTimeout(()=>window.location.href=url,800);}else{toast("❌ "+(data?.message||"Erreur"),"err");}}catch(e){toast("❌ Erreur réseau","err");}
        }}/>
      </Modal>
    </div>
  );
}
