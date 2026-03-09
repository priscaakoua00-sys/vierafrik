import { useState, useEffect, useRef, useCallback, useMemo } from "react";


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
const SUPA_URL = "https://oexzpfygeunehkcpoukv.supabase.co";
const SUPA_KEY = "sb_publishable_Lv5dex98pKdLnq1Sz_XvZQ_oz3vJaL6";
let _supa = null;
const getSupa = async () => {
  if(_supa) return _supa;
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2');
  _supa = createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true}});
  return _supa;
};

// ── Storage local (fallback) ──
const db={
  g:k=>{try{return JSON.parse(localStorage.getItem("va_"+k)||"null")}catch{return null}},
  s:(k,v)=>{try{localStorage.setItem("va_"+k,JSON.stringify(v))}catch{}},
};

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

function seed(uid){
  db.s("tx_"+uid,[
    {id:xid(),uid,type:"sale",  amount:850000, cat:"Commerce",   who:"Ama Owusu",     date:"2025-06-12",note:"Commande hebdo"},
    {id:xid(),uid,type:"expense",amount:125000,cat:"Transport",  who:"Logistique CI", date:"2025-06-11",note:""},
    {id:xid(),uid,type:"sale",  amount:1350000,cat:"Services",   who:"TechLagos Inc", date:"2025-06-10",note:"Consulting 22h"},
    {id:xid(),uid,type:"expense",amount:90000, cat:"Marketing",  who:"AdAfrika",      date:"2025-06-09",note:""},
    {id:xid(),uid,type:"sale",  amount:675000, cat:"Alimentation",who:"Marché Central",date:"2025-06-08",note:""},
    {id:xid(),uid,type:"expense",amount:310000,cat:"Salaires",   who:"Équipe VA",     date:"2025-06-07",note:"Juin"},
    {id:xid(),uid,type:"sale",  amount:450000, cat:"Commerce",   who:"Fatou Diallo",  date:"2025-06-06",note:""},
    {id:xid(),uid,type:"sale",  amount:990000, cat:"Services",   who:"StartupDakar",  date:"2025-06-05",note:"Design sprint"},
  ]);
  db.s("cli_"+uid,[
    {id:"c1",uid,name:"Ama Owusu",    phone:"+233240001111",email:"ama@email.com",     pays:PAYS[2],cat:"Commerce",   status:"active",  ca:1300000},
    {id:"c2",uid,name:"TechLagos Inc",phone:"+234800002222",email:"tech@lagos.ng",     pays:PAYS[4],cat:"Services",   status:"active",  ca:1350000},
    {id:"c3",uid,name:"Marché Central",phone:"+225070003333",email:"",                 pays:PAYS[0],cat:"Alimentation",status:"inactive",ca:675000},
    {id:"c4",uid,name:"Fatou Diallo", phone:"+221770004444",email:"fatou@sn.com",      pays:PAYS[1],cat:"Commerce",   status:"active",  ca:450000},
    {id:"c5",uid,name:"StartupDakar", phone:"+221780005555",email:"hello@startup.sn",  pays:PAYS[1],cat:"Services",   status:"active",  ca:990000},
  ]);
  db.s("inv_"+uid,[
    {id:"i1",uid,num:"VAF-2025-0001",clientId:"c1",clientName:"Ama Owusu",    phone:"+233240001111",total:850000, sub:850000, tax:0,status:"paid",   issued:"2025-06-12",due:"2025-06-28",items:[{id:xid(),name:"Produits commerce",qty:1,price:850000,line:850000}],notes:"",payStatus:"paid",payRef:"PAY_001",payProv:"cinetpay"},
    {id:"i2",uid,num:"VAF-2025-0002",clientId:"c2",clientName:"TechLagos Inc",phone:"+234800002222",total:1350000,sub:1350000,tax:0,status:"pending", issued:"2025-06-10",due:"2025-07-01",items:[{id:xid(),name:"Consulting 22h",qty:22,price:61364,line:1350008}],notes:"",payStatus:"unpaid",payRef:"",payProv:""},
    {id:"i3",uid,num:"VAF-2025-0003",clientId:"c3",clientName:"Marché Central",phone:"+225070003333",total:675000, sub:675000, tax:0,status:"overdue", issued:"2025-06-08",due:"2025-06-18",items:[{id:xid(),name:"Livraison alim.",qty:1,price:675000,line:675000}],notes:"",payStatus:"unpaid",payRef:"",payProv:""},
    {id:"i4",uid,num:"VAF-2025-0004",clientId:"c5",clientName:"StartupDakar",  phone:"+221780005555",total:990000, sub:990000, tax:0,status:"paid",   issued:"2025-06-05",due:"2025-07-05",items:[{id:xid(),name:"Design Sprint 3j",qty:3,price:330000,line:990000}],notes:"",payStatus:"paid",payRef:"PAY_004",payProv:"wave"},
  ]);
  db.s("goal_"+uid,{month:mkey(),target:2500000});
}

// ── UI Atoms ──
const IS={width:"100%",padding:"10px 13px",background:T.c3,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontFamily:"inherit",fontSize:13,outline:"none",marginTop:4};
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
    d:{bg:"rgba(255,34,85,.1)",fg:T.red,bd:"1px solid rgba(255,34,85,.25)"},
    gold:{bg:T.gold,fg:T.ink},blue:{bg:T.blue,fg:"#fff"},
    wa:{bg:"#25D366",fg:"#fff"},out:{bg:"transparent",fg:T.gr,bd:`1px solid ${T.gr}`},
  };
  const s=V[v]||V.p;
  return(
    <button disabled={dis} onClick={onClick} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:sm?"5px 12px":"10px 20px",borderRadius:9,cursor:dis?"not-allowed":"pointer",border:s.bd||"none",fontFamily:"inherit",fontWeight:700,fontSize:sm?11:13,background:s.bg,color:s.fg,transition:"all .17s",width:full?"100%":"auto",opacity:dis?.5:1,...sx}}>
      {ch}
    </button>
  );
}
function Modal({open,onClose,title,ch,wide,children}){
  if(!open)return null;
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(12px)"}}>
      <div style={{background:T.c1,border:`1px solid rgba(0,210,120,.18)`,borderRadius:22,padding:"1.8rem",width:"95%",maxWidth:wide?720:480,position:"relative",maxHeight:"95vh",overflowY:"auto",color:T.text,boxShadow:"0 40px 100px rgba(0,0,0,.9)",animation:"pop .25s cubic-bezier(.34,1.56,.64,1)"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:T.c3,border:"none",color:T.sub,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        {title&&<div style={{fontWeight:900,fontSize:18,marginBottom:18}}>{title}</div>}
        {ch||children}
      </div>
    </div>
  );
}
function Toasts({list}){
  return(
    <div style={{position:"fixed",bottom:20,right:20,zIndex:9000,display:"flex",flexDirection:"column",gap:8}}>
      {list.map(t=>(
        <div key={t.id} style={{background:T.c2,border:`1px solid ${T.border}`,borderLeft:`3px solid ${t.k==="err"?T.red:t.k==="warn"?T.gold:T.gr}`,borderRadius:12,padding:"10px 15px",fontSize:12,minWidth:220,boxShadow:"0 10px 40px rgba(0,0,0,.7)",animation:"slideR .3s ease",color:T.text,display:"flex",alignItems:"center",gap:8}}>
          {t.k==="err"?"❌":t.k==="warn"?"⚠️":"✅"} {t.msg}
        </div>
      ))}
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
          redirectTo:window.location.origin
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
            data:{
              name:f.name.trim(),
              business:f.business||"Mon Entreprise",
              plan:"free",
              accent:T.gr,
              goal:2500000,
              phone:"",
              country:"CI",
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
        // Supabase peut demander confirmation email — on vérifie si session existe
        const user=data.user;
        if(!user){setE({email:"Vérifiez votre email pour confirmer votre compte."});setL(false);return;}
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
        };
        seed(u.id);
        onLogin(u);
        return;
      }

      // ── Connexion ──
      const {data,error}=await supa.auth.signInWithPassword({
        email:f.email.toLowerCase(),
        password:f.password,
      });
      if(error){
        if(error.message.includes("Invalid login")||error.message.includes("password")){
          setE({password:"Email ou mot de passe incorrect"});
        } else {
          setE({email:"Erreur : "+error.message});
        }
        setL(false);return;
      }
      const user=data.user;
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
      };
      onLogin(u);
    } catch(err){
      setE({email:"Erreur réseau. Vérifiez votre connexion."});
    }
    setL(false);
  };

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
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
              <div style={{fontWeight:800,fontSize:16,color:T.gr,marginBottom:8}}>Email envoyé !</div>
              <div style={{fontSize:13,color:T.sub2,marginBottom:18}}>Consultez votre boîte mail pour réinitialiser.</div>
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
      // Écouter les changements d'auth (login / logout / token refresh)
      const {data}=supa.auth.onAuthStateChange((_event,session)=>{
        if(session?.user){
          setSes(buildUser(session.user));
        } else {
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
function Dashboard({ses,logout,updSes}){
  const uid=ses.id;
  const plan=PLANS[ses.plan||"free"];
  const accent=ses.accent||T.gr;

  const [page,setPage]=useState("dash");
  const [txs,setTxs]=useState(()=>db.g("tx_"+uid)||[]);
  const [clis,setClis]=useState(()=>db.g("cli_"+uid)||[]);
  const [invs,setInvs]=useState(()=>db.g("inv_"+uid)||[]);
  const [goal,setGoal]=useState(()=>(db.g("goal_"+uid)||{target:ses.goal||2500000}).target);
  const [mdl,setMdl]=useState(null);
  const [fm,setFm]=useState({});
  const [tsts,setTsts]=useState([]);
  const [boom,setBoom]=useState(false);
  const [flt,setFlt]=useState({});
  const [notOpen,setNot]=useState(false);
  const [chat,setChat]=useState([{r:"ai",t:`Bonjour ${ses.name?.split(" ")[0]||"entrepreneur"} 👋 Je suis votre Coach IA VierAfrik. Je connais vos chiffres en temps réel. Posez votre question !`}]);
  const [cMsg,setCMsg]=useState("");
  const [cLoad,setCL]=useState(false);
  const [confirmState,setConfirm]=useState(null); // {title,msg,onConfirm,danger,confirmLabel}
  const chatRef=useRef(null);

  const save=(key,val)=>{db.s(key,val);};

  const toast=useCallback((msg,k="ok")=>{
    const id=xid();setTsts(p=>[...p,{id,msg,k}]);
    setTimeout(()=>setTsts(p=>p.filter(x=>x.id!==id)),3500);
  },[]);

  useEffect(()=>{chatRef.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  // KPIs
  const cm=mkey();
  const mTxs=txs.filter(t=>mkey(t.date)===cm);
  const sales=mTxs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const exps=mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const profit=sales-exps;
  const allSales=txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.amount,0);
  const allExps=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const gPct=Math.min(100,Math.round(profit/goal*100));

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
    if(!amt||amt<=0){toast("Montant invalide","err");return;}
    const isEdit=!!fm._edit;
    const t={id:isEdit?fm.id:xid(),uid,type:fm.type||"sale",amount:amt,cat:fm.cat||"Commerce",who:fm.who||"",date:fm.date||today(),note:fm.note||""};
    let next;
    if(isEdit){
      next=txs.map(x=>x.id===t.id?t:x);
      // Supabase update
      await supaUpdate("transactions",{type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note,user_id:uid},t.id);
    } else {
      if(!canAdd("tx")){toast(`Plan Free : max ${plan.maxTx} transactions`,"warn");return;}
      next=[t,...txs];
      const ns=next.filter(x=>x.type==="sale"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0)-next.filter(x=>x.type==="expense"&&mkey(x.date)===cm).reduce((s,x)=>s+x.amount,0);
      if(ns>=goal&&profit<goal){setBoom(true);setTimeout(()=>setBoom(false),5000);toast("🎉 Objectif mensuel atteint !");}
      else toast(fm.type==="sale"?"💰 Vente enregistrée !":"📤 Dépense enregistrée !");
      // Supabase insert
      await supaInsert("transactions",{id:t.id,user_id:uid,type:t.type,amount:t.amount,category:t.cat,who:t.who,date:t.date,note:t.note});
    }
    setTxs(next);save("tx_"+uid,next);
    if(isEdit)toast("Transaction modifiée");
    setMdl(null);setFm({});
  };

  // CRUD Cli
  const saveCli=async()=>{
    if(!fm.name){toast("Nom requis","err");return;}
    const c={id:fm._edit?fm.id:xid(),uid,name:fm.name,phone:fm.phone||"",email:fm.email||"",pays:fm.pays||PAYS[0],cat:fm.cat||"Commerce",status:fm.status||"active",ca:parseFloat(fm.ca)||0};
    let next;
    if(fm._edit){
      next=clis.map(x=>x.id===c.id?c:x);
      await supaUpdate("clients",{name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca,user_id:uid},c.id);
    } else {
      if(!canAdd("cli")){toast(`Plan Free : max ${plan.maxCli} clients`,"warn");return;}
      next=[c,...clis];toast(`👤 ${c.name} ajouté !`);
      await supaInsert("clients",{id:c.id,user_id:uid,name:c.name,phone:c.phone,email:c.email,country:c.pays,category:c.cat,status:c.status,revenue:c.ca});
    }
    setClis(next);save("cli_"+uid,next);
    if(fm._edit)toast("Client modifié");
    setMdl(null);setFm({});
  };

  // CRUD Inv
  const saveInv=async()=>{
    if(!fm.clientName){toast("Client requis","err");return;}
    const items=(fm.items||[]).filter(it=>it.name&&it.price>0);
    if(!items.length){toast("Au moins un article avec prix > 0","err");return;}
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
      if(!canAdd("inv")){toast(`Plan Free : max ${plan.maxInv} factures`,"warn");return;}
      next=[inv,...invs];toast(`🧾 Facture ${inv.num} créée !`);
      await supaInsert("invoices",{id:inv.id,user_id:uid,number:inv.num,client_name:inv.clientName,phone:inv.phone,total:inv.total,subtotal:inv.sub,tax:inv.tax,status:inv.status,issued:inv.issued,due:inv.due,items:JSON.stringify(inv.items),notes:inv.notes});
    }
    setInvs(next);save("inv_"+uid,next);
    if(fm._edit)toast("Facture modifiée");
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
<script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();toast("📄 PDF — utilisez Ctrl+P !");
  };

  // WhatsApp
  const sendWA=inv=>{
    if(!plan.wa){toast("WhatsApp disponible en plan Pro 🚀","warn");return;}
    const ph=cleanP(inv.phone||clis.find(c=>c.id===inv.clientId)?.phone||"");
    const link=`https://pay.vierafrik.com/${inv.id}`;
    const msg=`Bonjour ${inv.clientName.split(" ")[0]} 👋\n\nVotre facture *${inv.num}* — ${ses.business}\n📅 Date : ${inv.issued}\n💰 Total : *${fmtf(inv.total)}*\n⏳ Échéance : ${inv.due||"—"}\n\n✅ Payer ici : ${link}\n\nMerci 🙏 — ${ses.business} 🌍`;
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,"_blank");
    toast("📱 WhatsApp ouvert !");
  };

  // Mobile Money
  const doPay=()=>{
    const{inv,prov,phone}=fm;
    if(!prov){toast("Choisissez un opérateur","err");return;}
    if(!phone){toast("Numéro requis","err");return;}
    toast(`⏳ Initialisation ${prov}…`);
    setTimeout(()=>{
      const ref="PAY_"+xid().toUpperCase().slice(0,8);
      const next=invs.map(x=>x.id===inv.id?{...x,status:"paid",payStatus:"paid",payProv:prov,payRef:ref}:x);
      setInvs(next);save("inv_"+uid,next);
      toast(`✅ ${fmtf(inv.total)} confirmé ! Réf: ${ref}`);
      setMdl(null);setFm({});
    },2000);
  };

  // Coach IA
  const sendAI=async()=>{
    if(!cMsg.trim())return;
    if(!plan.ai){toast("Coach IA disponible en plan Pro 🚀","warn");return;}
    const msg=cMsg.trim();setCMsg("");
    setChat(h=>[...h,{r:"user",t:msg}]);setCL(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:400,
          system:`Tu es Coach VierAfrik, expert PME africaines. Concis, motivant, actionnable.
Données: Ventes=${fmtf(sales)}, Dépenses=${fmtf(exps)}, Bénéfice=${fmtf(profit)}, Objectif=${gPct}%.
Clients: ${clis.length}. Factures en retard: ${invs.filter(i=>i.status==="overdue").length}.
Réponds en 2-3 phrases max. Français. Emojis africains.`,
          messages:[{role:"user",content:msg}],
        }),
      });
      const data=await res.json();
      setChat(h=>[...h,{r:"ai",t:data.content?.map(c=>c.text||"").join("")||"Continuez 💪🌍"}]);
    }catch{setChat(h=>[...h,{r:"ai",t:"🔄 Service indisponible. Réessayez !"}]);}
    finally{setCL(false);}
  };

  // CSV Export
  const csvExport=(data,name)=>{
    if(!data.length){toast("Aucune donnée","warn");return;}
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
  const cMax=Math.max(...chartD.map(d=>Math.max(d.v,d.d)))*1.15||1;
  const BarChart=({data,h=120})=>(
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:h,paddingBottom:16,marginTop:6}}>
      {data.map((d,i)=>{
        const vh=Math.max(3,(d.v/cMax)*(h-20)),dh=Math.max(3,(d.d/cMax)*(h-20)),ph=Math.max(0,((d.v-d.d)/cMax)*(h-20));
        return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",position:"relative",gap:2}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:2,width:"100%",justifyContent:"center"}}>
              <div style={{width:"30%",height:ph,borderRadius:"3px 3px 0 0",background:T.gr,minHeight:2}}/>
              <div style={{width:"30%",height:vh,borderRadius:"3px 3px 0 0",background:T.blue,minHeight:2}}/>
              <div style={{width:"30%",height:dh,borderRadius:"3px 3px 0 0",background:T.orange,minHeight:2}}/>
            </div>
            <span style={{position:"absolute",bottom:0,fontSize:8,color:T.sub}}>{d.m}</span>
          </div>
        );
      })}
    </div>
  );
  const catMap=txs.filter(t=>t.type==="sale").reduce((a,t)=>{a[t.cat]=(a[t.cat]||0)+t.amount;return a;},{});
  const catArr=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const catCols=[T.gr,T.blue,T.gold,T.orange,T.purple];
  const Donut=({data})=>{
    const tot=data.reduce((s,[,v])=>s+v,0)||1;
    const r=48,cx=60,cy=60,ci=2*Math.PI*r;let off=0;
    const segs=data.map(([l,v],i)=>{
      const dash=(v/tot)*ci,gap=ci-dash;
      const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={catCols[i]} strokeWidth="13" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`}/>;
      off+=(v/tot)*ci;return el;
    });
    return(
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.c3} strokeWidth="13"/>
          {segs}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={T.text} fontFamily="inherit" fontSize="9" fontWeight="900">{fmtk(tot)}</text>
        </svg>
        <div style={{flex:1,minWidth:80}}>
          {data.map(([l,v],i)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${T.border}`,fontSize:10}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:1,background:catCols[i],display:"inline-block"}}/>{l}</span>
              <span style={{fontWeight:700,color:catCols[i]}}>{Math.round(v/tot*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Tab label helper ──
  const TabBtn=({id,ic,lb})=>(
    <button onClick={()=>setPage(id)} style={{padding:"5px 9px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:10,color:page===id?accent:T.sub,background:page===id?T.c2:"transparent",transition:"all .15s",whiteSpace:"nowrap",flexShrink:0}}>
      {ic} {lb}
    </button>
  );

  // ════════════════ PAGES ════════════════

  const PgDash=()=>(
    <div>
      <div style={{marginBottom:14}}>
        <div style={{fontWeight:900,fontSize:22,letterSpacing:"-.03em"}}>Bonjour, {ses.name?.split(" ")[0]} 👋</div>
        <div style={{color:T.sub2,fontSize:12,marginTop:2}}>{ses.business} · {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>
      {/* Objectif */}
      <div style={{background:`linear-gradient(135deg,${accent}0b,${T.teal}07)`,border:`1px solid ${accent}22`,borderRadius:15,padding:"1.1rem 1.4rem",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-40,top:-40,width:140,height:140,borderRadius:"50%",background:`${accent}06`}}/>
        <div>
          <div style={{fontWeight:800,fontSize:13,marginBottom:2}}>🎯 Objectif mensuel — {cm}</div>
          <div style={{fontSize:11,color:T.sub2}}>Cible : <strong style={{color:T.text}}>{fmtf(goal)}</strong></div>
          <div style={{marginTop:8,background:T.c3,borderRadius:20,height:5,width:200,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(90deg,${accent},${T.teal})`,height:"100%",width:gPct+"%",borderRadius:20,transition:"width 1.5s ease",boxShadow:`0 0 12px ${accent}44`}}/>
          </div>
          <div style={{fontSize:11,color:T.sub2,marginTop:3}}>{gPct}% · Bénéfice : <strong style={{color:profit>=0?T.gr:T.red}}>{fmtf(profit)}</strong></div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:44,color:accent,lineHeight:1,letterSpacing:"-.04em"}}>{gPct}%</div>{gPct>=100&&<div style={{fontSize:11,color:T.gold}}>🏆 Dépassé !</div>}</div>
      </div>
      {/* KPIs */}
      <div style={{display:"flex",gap:9,marginBottom:11,flexWrap:"wrap"}}>
        {[["💰","Ventes",sales,`${mTxs.filter(t=>t.type==="sale").length} trans.`,T.blue,"rgba(26,120,255,.12)"],["📤","Dépenses",exps,`${mTxs.filter(t=>t.type==="expense").length} trans.`,T.orange,"rgba(255,90,24,.12)"],["📈","Bénéfice net",Math.abs(profit),profit>=0?"Positif ✅":"Négatif ⚠️",profit>=0?T.gr:T.red,profit>=0?"rgba(0,212,120,.12)":"rgba(255,34,85,.12)"],["👥","Clients actifs",clis.filter(c=>c.status==="active").length,`/${clis.length} total`,T.purple,"rgba(144,96,255,.12)"]].map(([ic,l,v,sub,co,bg])=>(
          <div key={l} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1rem",flex:"1 0 100px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:10,top:10,width:30,height:30,borderRadius:7,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{ic}</div>
            <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.sub,marginBottom:3}}>{l}</div>
            <div style={{fontSize:20,fontWeight:900,color:co,lineHeight:1,letterSpacing:"-.02em"}}>{fmtk(v)}</div>
            <div style={{fontSize:10,color:T.sub2,marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>
      {/* Alerte */}
      {invs.filter(i=>i.status==="overdue").length>0&&(
        <div style={{background:"rgba(255,34,85,.06)",border:"1px solid rgba(255,34,85,.2)",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
          <span>🔴</span><div style={{flex:1}}><div style={{fontWeight:700,color:T.red,fontSize:12}}>{invs.filter(i=>i.status==="overdue").length} facture(s) en retard</div><div style={{fontSize:10,color:T.sub2}}>Relancez via WhatsApp</div></div>
          <Btn sm v="d" ch="Voir →" onClick={()=>setPage("inv")}/>
        </div>
      )}
      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:1}}>📊 Performance 6 mois</div>
          <BarChart data={chartD}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[{c:T.gr,l:"Profit"},{c:T.blue,l:"Ventes"},{c:T.orange,l:"Dépenses"}].map(x=>(
              <span key={x.l} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:T.sub2}}><span style={{width:6,height:6,borderRadius:1,background:x.c,display:"inline-block"}}/>{x.l}</span>
            ))}
          </div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:8}}>🍩 Ventes par catégorie</div>
          {catArr.length?<Donut data={catArr}/>:<div style={{color:T.sub,fontSize:11,padding:"1rem 0",textAlign:"center"}}>Ajoutez des ventes 👆</div>}
        </div>
      </div>
      {/* Insights */}
      <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem",marginBottom:10}}>
        <div style={{fontWeight:800,fontSize:12,marginBottom:9}}>💡 Insights VierAfrik</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {insights.map((ins,i)=>{const col=ins.k==="warn"?T.orange:ins.k==="win"?T.gr:T.teal;return <div key={i} style={{padding:"9px 12px",background:`${col}09`,borderRadius:9,border:`1px solid ${col}28`,fontSize:11,color:T.text,lineHeight:1.5}}>{ins.msg}</div>;})}
        </div>
      </div>
      {/* Recent Tx */}
      <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <div style={{fontWeight:800,fontSize:12}}>🕐 Dernières transactions</div>
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
            <tr key={t.id} style={{borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:"7px",fontWeight:600,fontSize:11}}>{t.who||"—"}</td>
              <td style={{padding:"7px"}}><span style={{background:"rgba(26,120,255,.1)",color:T.blue,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.cat}</span></td>
              <td style={{padding:"7px"}}><span style={{background:t.type==="sale"?"rgba(0,212,120,.1)":"rgba(255,34,85,.1)",color:t.type==="sale"?T.gr:T.red,borderRadius:20,padding:"1px 6px",fontSize:9}}>{t.type==="sale"?"↑ Vente":"↓ Dép."}</span></td>
              <td style={{padding:"7px",fontWeight:700,color:t.type==="sale"?T.gr:T.red,fontSize:11,whiteSpace:"nowrap"}}>{t.type==="sale"?"+":"-"}{fmtf(t.amount)}</td>
              <td style={{padding:"7px",color:T.sub2,fontSize:10}}>{t.date}</td>
              {editable&&<td style={{padding:"7px"}}><div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...t,_edit:true});setMdl("tx");}} style={{background:"rgba(26,120,255,.1)",border:"none",color:T.blue,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>✏️</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer la transaction",msg:`Supprimer cette transaction de ${fmtf(t.amount)} ?`,confirmLabel:"Supprimer",danger:true,onConfirm:()=>{const n=txs.filter(x=>x.id!==t.id);setTxs(n);save("tx_"+uid,n);toast("Supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div></td>}
            </tr>
          ))}
          {rows.length===0&&<tr><td colSpan={6} style={{padding:"1.5rem",textAlign:"center",color:T.sub,fontSize:12}}>Aucune transaction</td></tr>}
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
  const sL={paid:"✅ Payée",pending:"⏳ Attente",overdue:"🔴 Retard"};

  const PgInv=()=>{
    const tots=invs.reduce((a,i)=>({...a,tot:a.tot+i.total,[i.status]:(a[i.status]||0)+i.total}),{tot:0,paid:0,pending:0,overdue:0});
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11,flexWrap:"wrap",gap:7}}>
          <div><div style={{fontWeight:900,fontSize:20}}>🧾 Factures</div><div style={{fontSize:11,color:T.sub2}}>PDF · WhatsApp · Mobile Money</div></div>
          <Btn ch="+ Nouvelle" onClick={()=>{setFm({issued:today(),status:"pending",tax:0,items:[{id:xid(),name:"",qty:1,price:0}]});setMdl("inv");}}/>
        </div>
        <div style={{display:"flex",gap:9,marginBottom:11,flexWrap:"wrap"}}>
          {[["Total",tots.tot,T.blue],["Payées",tots.paid,T.gr],["Attente",tots.pending,T.gold],["Retard",tots.overdue,T.red]].map(([l,v,co])=>(
            <div key={l} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",flex:1,minWidth:80}}>
              <div style={{fontSize:9,color:T.sub,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{l}</div>
              <div style={{fontSize:17,fontWeight:900,color:co}}>{fmtk(v)}<span style={{fontSize:9,fontWeight:400}}> F</span></div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:9}}>
          {invs.map(inv=>(
            <div key={inv.id} style={{background:T.c2,border:`1px solid ${T.border}`,borderRadius:15,padding:"1rem",position:"relative",overflow:"hidden",transition:"all .2s"}}
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
                <button onClick={()=>sendWA(inv)} style={{flex:1,background:"rgba(37,211,102,.1)",border:"none",color:"#25D366",borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📱 WA</button>
                {inv.status!=="paid"&&<button onClick={()=>{setFm({_pay:true,inv});setMdl("pay");}} style={{flex:1,background:"rgba(240,176,32,.1)",border:"none",color:T.gold,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>💳 Payer</button>}
                {inv.status!=="paid"&&<button onClick={()=>{const n=invs.map(x=>x.id===inv.id?{...x,status:"paid",payStatus:"paid"}:x);setInvs(n);save("inv_"+uid,n);toast("✅ Marquée payée !");}} style={{flex:1,background:"rgba(0,212,120,.1)",border:"none",color:T.gr,borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>✅</button>}
              </div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>{setFm({...inv,_edit:true});setMdl("inv");}} style={{flex:1,background:"rgba(26,120,255,.07)",border:"none",color:T.blue,borderRadius:7,padding:"4px",cursor:"pointer",fontSize:10,fontWeight:700}}>✏️ Modifier</button>
                <button onClick={()=>{setConfirm({title:"🗑 Supprimer la facture",msg:`Supprimer la facture ${inv.num} (${fmtf(inv.total)}) ?`,confirmLabel:"Supprimer",danger:true,onConfirm:()=>{const n=invs.filter(x=>x.id!==inv.id);setInvs(n);save("inv_"+uid,n);toast("Supprimée","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.08)",border:"none",color:T.red,borderRadius:7,padding:"4px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
              </div>
            </div>
          ))}
          {invs.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Aucune facture — créez votre première !</div>}
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
          <div key={cl.id} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem",transition:"border-color .2s"}}
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
              <button onClick={()=>{const ph=cleanP(cl.phone);const m=encodeURIComponent(`Bonjour ${cl.name.split(" ")[0]} 👋\n${ses.business} vous contacte 🌍`);window.open(`https://wa.me/${ph}?text=${m}`,"_blank");}} style={{flex:1,background:"rgba(37,211,102,.1)",border:"none",color:"#25D366",borderRadius:7,padding:"5px",cursor:"pointer",fontSize:10,fontWeight:700}}>📱</button>
              <button onClick={()=>{setConfirm({title:"🗑 Supprimer le client",msg:`Supprimer ${cl.name} de votre liste clients ?`,confirmLabel:"Supprimer",danger:true,onConfirm:()=>{const n=clis.filter(x=>x.id!==cl.id);setClis(n);save("cli_"+uid,n);toast(cl.name+" supprimé","warn");setConfirm(null);}});}} style={{background:"rgba(255,34,85,.1)",border:"none",color:T.red,borderRadius:7,padding:"5px 9px",cursor:"pointer",fontSize:10}}>🗑</button>
            </div>
          </div>
        ))}
        {clis.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"2.5rem",color:T.sub,fontSize:12}}>Ajoutez votre premier client !</div>}
      </div>
    </div>
  );

  const PgStats=()=>{
    const marge=allSales>0?Math.round((allSales-allExps)/allSales*100):0;
    const panier=allSales/(txs.filter(t=>t.type==="sale").length||1);
    const recouv=invs.length>0?Math.round(invs.filter(i=>i.status==="paid").length/invs.length*100):0;
    const topC=Object.entries(txs.filter(t=>t.type==="sale"&&t.who).reduce((a,t)=>{a[t.who]=(a[t.who]||0)+t.amount;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return(
      <div>
        <div style={{fontWeight:900,fontSize:20,marginBottom:11}}>📈 Statistiques</div>
        <div style={{display:"flex",gap:9,marginBottom:11,flexWrap:"wrap"}}>
          {[["Marge nette",marge+"%",T.gr],["Panier moyen",fmtk(panier)+" F",T.blue],["Recouvrement",recouv+"%",T.gold],["Retards",invs.filter(i=>i.status==="overdue").length,T.red]].map(([l,v,co])=>(
            <div key={l} style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:12,padding:".9rem",flex:1,minWidth:90}}>
              <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,marginBottom:3}}>{l}</div>
              <div style={{fontSize:19,fontWeight:900,color:co}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}><div style={{fontWeight:800,fontSize:12,marginBottom:2}}>📊 6 mois</div><BarChart data={chartD}/></div>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}><div style={{fontWeight:800,fontSize:12,marginBottom:7}}>🍩 Catégories</div>{catArr.length?<Donut data={catArr}/>:<div style={{color:T.sub,fontSize:11,textAlign:"center",padding:"1rem"}}>—</div>}</div>
        </div>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
          <div style={{fontWeight:800,fontSize:12,marginBottom:10}}>🏆 Top clients</div>
          {topC.length===0?<div style={{color:T.sub,fontSize:11,textAlign:"center",padding:".5rem"}}>Ajoutez des transactions</div>:(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["#","Client","CA","Part"].map(h=><th key={h} style={{textAlign:"left",padding:"4px 7px",fontSize:9,fontWeight:700,textTransform:"uppercase",color:T.sub,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}</tr></thead>
              <tbody>{topC.map(([nm,val],i)=>(
                <tr key={nm} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"6px 7px",fontWeight:700,color:T.gold,fontSize:10}}>#{i+1}</td>
                  <td style={{padding:"6px 7px",fontWeight:600,fontSize:11}}>{nm}</td>
                  <td style={{padding:"6px 7px",fontWeight:700,color:T.gr,fontSize:11,whiteSpace:"nowrap"}}>{fmtf(val)}</td>
                  <td style={{padding:"6px 7px"}}><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{background:T.c3,borderRadius:2,height:4,width:60,overflow:"hidden"}}><div style={{background:T.blue,height:"100%",width:Math.round(val/(topC[0]?.[1]||1)*100)+"%"}}/></div><span style={{fontSize:9,color:T.sub2}}>{Math.round(val/allSales*100)}%</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          )}
          <div style={{marginTop:12,display:"flex",gap:7,flexWrap:"wrap"}}>
            <Btn sm v="g" ch="⬇ TX CSV" onClick={()=>csvExport(txs,"transactions")}/>
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
          {cLoad&&<div style={{display:"flex"}}><div style={{background:T.c2,padding:"10px 13px",borderRadius:"3px 14px 14px 14px",fontSize:11,color:T.sub}}>⏳ Analyse…</div></div>}
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
              {!isCur&&<Btn full sx={{marginTop:15}} v={k==="business"?"gold":k==="pro"?"p":"g"} ch={"Passer à "+p.label+" →"} onClick={()=>{const title="💎 Passer au plan "+p.label;const msg=p.price>0?"Vous allez activer le plan "+p.label+" à "+p.price.toLocaleString()+" FCFA/mois. En production, le paiement sera requis via Mobile Money.":"Revenir au plan gratuit. Certaines fonctionnalités seront limitées.";setConfirm({title,msg,confirmLabel:"Activer "+p.label,danger:false,onConfirm:()=>{updSes({plan:k});toast("✅ Plan "+p.label+" activé ! 🚀");setConfirm(null);}});}}/>}
              {isCur&&k==="free"&&<Btn full sx={{marginTop:15}} v="out" ch="Passer à Pro — 4 900 FCFA/mois →" onClick={()=>{setConfirm({title:"⚡ Passer au plan Pro",msg:"Vous allez activer le plan Pro à 4 900 FCFA/mois. En production, le paiement sera requis via Mobile Money.",confirmLabel:"Activer Pro",danger:false,onConfirm:()=>{updSes({plan:"pro"});toast("✅ Plan Pro activé !");setConfirm(null);}});}}/>}
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

  const PgParams=()=>(
    <div>
      <div style={{fontWeight:900,fontSize:20,marginBottom:12}}>⚙️ Mon Compte</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.2rem"}}>
          <div style={{fontWeight:800,fontSize:13,marginBottom:14}}>👤 Profil</div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${accent},${T.teal})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:T.ink,flexShrink:0}}>{ses.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?"}</div>
            <div><div style={{fontWeight:800,fontSize:14}}>{ses.name}</div><div style={{color:T.sub2,fontSize:11}}>{ses.email}</div><div style={{marginTop:3}}><span style={{background:PLANS[ses.plan||"free"].col,color:T.ink,fontSize:9,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{PLANS[ses.plan||"free"].emoji} {PLANS[ses.plan||"free"].label}</span></div></div>
          </div>
          <FL l="Nom complet" ch={<input style={IS} value={fm.name!==undefined?fm.name:ses.name||""} onChange={ev=>setFm(f=>({...f,name:ev.target.value}))}/>}/>
          <FL l="Nom entreprise" ch={<input style={IS} value={fm.biz!==undefined?fm.biz:ses.business||""} onChange={ev=>setFm(f=>({...f,biz:ev.target.value}))}/>}/>
          <FL l="Téléphone" ch={<input style={IS} placeholder="+225 07 000 0000" value={fm.phone!==undefined?fm.phone:ses.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
          <FL l="Objectif mensuel (FCFA)" ch={<input type="number" style={IS} value={fm.goal!==undefined?fm.goal:goal} onChange={ev=>setFm(f=>({...f,goal:parseFloat(ev.target.value)||2500000}))}/>}/>
          <Btn ch="💾 Sauvegarder" onClick={()=>{const g=fm.goal||goal;setGoal(g);db.s("goal_"+uid,{month:mkey(),target:g});updSes({name:fm.name??ses.name,business:fm.biz??ses.business,phone:fm.phone??ses.phone,goal:g});toast("✅ Profil mis à jour !");setFm({});}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:11}}>🎨 Couleur accent</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {[T.gr,T.teal,T.blue,T.orange,T.gold,T.purple,"#f72585","#ff5e1f"].map(co=>(
                <div key={co} onClick={()=>{updSes({accent:co});toast("🎨 Thème mis à jour !");}} style={{width:34,height:34,borderRadius:8,background:co,cursor:"pointer",border:accent===co?"2px solid #fff":"2px solid transparent",transform:accent===co?"scale(1.15)":"scale(1)",transition:"all .2s",boxShadow:accent===co?`0 0 15px ${co}`:""}}/>
              ))}
            </div>
          </div>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:8}}>📊 Mon compte</div>
            {[["Transactions",txs.length],["Clients",clis.length],["Factures",invs.length],["Payées",invs.filter(i=>i.status==="paid").length],["CA Total",fmtf(allSales)]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
                <span style={{color:T.sub2}}>{l}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{background:T.c1,border:`1px solid ${T.border}`,borderRadius:14,padding:"1.1rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:7}}>📱 Partagez</div>
            <Btn full v="wa" ch="📱 Partager VierAfrik" onClick={()=>{const m=encodeURIComponent("🌍 Je gère mon business avec *VierAfrik* !\n\n✅ Dashboard\n✅ Factures\n✅ Mobile Money\n✅ Coach IA\n\nEssaie gratuitement 🚀\n\n👉 https://vierafrik.vercel.app");window.open("https://wa.me/?text="+m,"_blank");}}/>
          </div>
          <div style={{background:"rgba(255,34,85,.04)",border:"1px solid rgba(255,34,85,.13)",borderRadius:14,padding:"1.1rem"}}>
            <div style={{fontWeight:800,fontSize:12,marginBottom:7,color:T.red}}>⚠️ Zone danger</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              <Btn sm v="g" ch="💾 Backup JSON" onClick={()=>{const d=JSON.stringify({txs,clients:clis,invoices:invs},null,2);const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([d],{type:"application/json"}));a.download=`vierafrik_backup_${today()}.json`;a.click();toast("💾 Backup exporté !");}}/>
              <Btn sm v="d" ch="🔒 Déconnexion" onClick={()=>{setConfirm({title:"🔒 Déconnexion",msg:"Voulez-vous vraiment vous déconnecter ?",confirmLabel:"Se déconnecter",danger:false,onConfirm:()=>{setConfirm(null);logout();}});}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NAV=[{id:"dash",ic:"📊",lb:"Dashboard"},{id:"tx",ic:"💸",lb:"Transactions"},{id:"inv",ic:"🧾",lb:"Factures"},{id:"cli",ic:"👥",lb:"Clients"},{id:"stats",ic:"📈",lb:"Stats"},{id:"coach",ic:"🤖",lb:"Coach IA"},{id:"plans",ic:"💎",lb:"Plans"},{id:"prefs",ic:"⚙️",lb:"Compte"}];
  const PMAP={dash:<PgDash/>,tx:<PgTx/>,inv:<PgInv/>,cli:<PgCli/>,stats:<PgStats/>,coach:<PgCoach/>,plans:<PgPlans/>,prefs:<PgParams/>};

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Segoe UI',system-ui,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes fall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(800px) rotate(720deg);opacity:0}}
        @keyframes pop{from{opacity:0;transform:scale(.84) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.c4};border-radius:2px}
        input,select,textarea{color-scheme:dark}
        input:focus,select:focus{border-color:${accent}!important;box-shadow:0 0 0 2px ${accent}18;outline:none}
      `}</style>
      <div style={{position:"fixed",inset:0,zIndex:0}}><Particles/></div>
      <Confetti on={boom}/>
      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:400,height:54,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1rem",background:"rgba(1,3,6,.97)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${T.border}`}}>
        <div style={{fontWeight:900,fontSize:17,display:"flex",alignItems:"center",gap:6,flexShrink:0,letterSpacing:"-.04em"}}>
          <span style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${accent},${T.teal})`,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:`0 0 12px ${accent}55`}}>🌍</span>
          <span style={{color:accent}}>Vier</span><span style={{color:T.text}}>Afrik</span>
          <span style={{background:PLANS[ses.plan||"free"].col,color:T.ink,fontSize:7,fontWeight:800,borderRadius:20,padding:"2px 6px",marginLeft:2}}>{PLANS[ses.plan||"free"].label.toUpperCase()}</span>
        </div>
        <div style={{display:"flex",gap:1,overflowX:"auto",padding:"0 6px",scrollbarWidth:"none"}}>
          {NAV.map(n=><TabBtn key={n.id} {...n}/>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setNot(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:T.sub,padding:"4px",position:"relative"}}>
              🔔{notifs.length>0&&<span style={{position:"absolute",top:2,right:1,width:6,height:6,background:T.orange,borderRadius:"50%",border:"1px solid "+T.bg}}/>}
            </button>
            {notOpen&&(
              <div onClick={()=>setNot(false)} style={{position:"absolute",top:"130%",right:0,background:T.c1,border:`1px solid ${T.border}`,borderRadius:13,minWidth:270,boxShadow:"0 20px 60px rgba(0,0,0,.85)",zIndex:500,overflow:"hidden"}}>
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

      {/* BARRE NAV BAS — MOBILE */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,height:60,display:"flex",alignItems:"center",justifyContent:"space-around",background:"rgba(1,3,6,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,padding:"0 4px"}}>
        {[
          {id:"dash",ic:"📊",lb:"Accueil"},
          {id:"tx",ic:"💸",lb:"Ventes"},
          {id:"inv",ic:"🧾",lb:"Factures"},
          {id:"cli",ic:"👥",lb:"Clients"},
          {id:"pay_mm",ic:"📱",lb:"Mobile Money"},
          {id:"plans",ic:"💎",lb:"Plans"},
          {id:"prefs",ic:"⚙️",lb:"Compte"},
        ].map(n=>(
          <button key={n.id} onClick={()=>{if(n.id==="pay_mm"){setFm({_mm:true});setMdl("mm");}else setPage(n.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 2px",minWidth:40,opacity:page===n.id?1:0.5,transition:"opacity .15s"}}>
            <span style={{fontSize:18}}>{n.ic}</span>
            <span style={{fontSize:8,color:page===n.id?accent:T.sub,fontWeight:700,whiteSpace:"nowrap"}}>{n.lb}</span>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FL l="Client" ch={<><input type="text" style={IS} placeholder="Nom du client" value={fm.clientName||""} onChange={ev=>{const n=ev.target.value;const cl=clis.find(c=>c.name.toLowerCase()===n.toLowerCase());setFm(f=>({...f,clientName:n,clientId:cl?.id||"",phone:cl?.phone||f.phone||""}));}} list="cl_inv"/><datalist id="cl_inv">{clis.map(c=><option key={c.id} value={c.name}/>)}</datalist></>}/>
          <FL l="Téléphone client" ch={<input type="tel" style={IS} placeholder="+225 07 000 0000" value={fm.phone||""} onChange={ev=>setFm(f=>({...f,phone:ev.target.value}))}/>}/>
          <FL l="Date d'émission" ch={<input type="date" style={IS} value={fm.issued||today()} onChange={ev=>setFm(f=>({...f,issued:ev.target.value}))}/>}/>
          <FL l="Échéance" ch={<input type="date" style={IS} value={fm.due||""} onChange={ev=>setFm(f=>({...f,due:ev.target.value}))}/>}/>
          <FL l="Statut">
            <select style={IS} value={fm.status||"pending"} onChange={ev=>setFm(f=>({...f,status:ev.target.value}))}>
              <option value="pending">⏳ En attente</option><option value="paid">✅ Payée</option><option value="overdue">🔴 En retard</option>
            </select>
          </FL>
          <FL l="Taxe (FCFA)" ch={<input type="number" style={IS} placeholder="0" value={fm.tax||0} onChange={ev=>setFm(f=>({...f,tax:parseFloat(ev.target.value)||0}))}/>}/>
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
        <FL l="CA déjà réalisé (FCFA)" hint="Chiffre d'affaires historique" ch={<input type="number" style={IS} placeholder="0" value={fm.ca||""} onChange={ev=>setFm(f=>({...f,ca:ev.target.value}))}/>}/>
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
          <Btn full ch={fm.prov?`💳 Initier paiement ${fm.prov.toUpperCase()}${fm.amount?" — "+fmtf(parseFloat(fm.amount)||0)+" FCFA":""}` : "💳 Choisissez un opérateur"} onClick={()=>{
            if(!fm.prov){toast("Choisissez un opérateur","err");return;}
            if(!fm.phone){toast("Numéro requis","err");return;}
            if(!fm.amount||parseFloat(fm.amount)<=0){toast("Montant requis","err");return;}
            toast(`⏳ Initialisation ${fm.prov.toUpperCase()}…`);
            setTimeout(()=>{
              const ref="PAY_"+xid().toUpperCase().slice(0,8);
              toast(`✅ ${fmtf(parseFloat(fm.amount))} FCFA envoyé ! Réf: ${ref}`);
              setMdl(null);setFm({});
            },2000);
          }}/>
        </div>
      </Modal>
    </div>
  );
}
