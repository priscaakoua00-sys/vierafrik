import { useState } from "react";
import { FEED_CATEGORY_IMAGES } from "../../data/networkCategories.js";

// Vrai logo WhatsApp (SVG), remplace l'émoji 💬 ambigu sur l'action WhatsApp.
const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.79.469 3.53 1.36 5.062L2.02 22l5.062-1.328A9.958 9.958 0 0012 22c5.523 0 10-4.477 10-10S17.524 2 12.001 2zm5.507 14.144c-.229.646-1.34 1.234-1.848 1.31-.472.07-1.06.1-1.71-.108-.394-.126-.9-.294-1.55-.575-2.728-1.178-4.508-3.92-4.645-4.102-.137-.183-1.11-1.475-1.11-2.814 0-1.338.7-1.994.949-2.267.248-.274.542-.342.722-.342.18 0 .361.002.518.01.166.008.39-.063.61.465.229.548.777 1.892.845 2.03.069.137.114.297.023.48-.09.183-.137.297-.271.457-.137.16-.286.357-.408.48-.137.137-.28.286-.12.56.16.274.712 1.174 1.528 1.9 1.05.936 1.936 1.226 2.209 1.363.274.137.434.115.594-.069.16-.183.686-.8.869-1.075.183-.274.366-.229.617-.137.252.091 1.593.751 1.867.888.275.137.457.206.526.32.069.114.069.663-.16 1.309z"/>
  </svg>
);

// ══════════════════════════════════════════════════════════════
//  FeedCard, carte profil du Réseau visuel
//  Défini hors de NetworkFeed pour éviter le re-mount React.
//  Dimensionnement en aspect-ratio (pas de hauteur fixe) pour
//  rester propre dans une grille 1, 2 ou 3 colonnes.
// ══════════════════════════════════════════════════════════════
export default function FeedCard({
  c, i, accent, Tc, ratingMap, onRate, doCall, doWA,
  onAddClient, onCreateInvoice, onPayment, CATS_VIS,
  CAT_IMG = FEED_CATEGORY_IMAGES,
}) {
  const isDemo = !!c.is_demo;
  const img = c.image_url || CAT_IMG[c.category] || CAT_IMG.default;
  const note = ratingMap[c.id] || c.rating || 0;
  const catObj = CATS_VIS.find(x => x.id === c.category);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div style={{
      background:`linear-gradient(135deg,${Tc.c1},${Tc.c2})`,
      border:`1px solid ${c.featured ? accent+"55" : Tc.border}`,
      borderRadius:18,
      overflow:"hidden",
      boxShadow: c.featured ? `0 4px 28px ${accent}22` : "0 4px 20px rgba(0,0,0,.4)",
      animation:`slideUp .3s ease ${Math.min(i,10)*0.04}s both`,
      display:"flex",
      flexDirection:"column",
      height:"100%",
    }}>
      {/* ── IMAGE ── */}
      <div style={{ position:"relative", aspectRatio:"16/11", background:`linear-gradient(135deg,${accent}18,${Tc.c3})`, overflow:"hidden" }}>
        {!imgErr ? (
          <img src={img} alt={c.activite||"service"} onError={()=>setImgErr(true)} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:56 }}>
            {catObj?.emoji || "🌍"}
          </div>
        )}
        <div style={{ position:"absolute", top:10, left:10, right:10, display:"flex", gap:6, flexWrap:"wrap" }}>
          {catObj && catObj.id && (
            <span style={{ background:"rgba(0,0,0,.72)", backdropFilter:"blur(6px)", borderRadius:20, padding:"4px 10px", fontSize:10.5, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:5 }}>
              {catObj.emoji} {catObj.label}
            </span>
          )}
          {c.featured && !isDemo && (
            <span style={{ background:Tc.gold, borderRadius:20, padding:"4px 10px", fontSize:10.5, fontWeight:800, color:"#000" }}>
              ⭐ En avant
            </span>
          )}
          {isDemo && (
            <span style={{ background:"rgba(240,176,32,.85)", backdropFilter:"blur(6px)", borderRadius:20, padding:"4px 10px", fontSize:10.5, fontWeight:800, color:"#000" }}>
              ✨ Exemple
            </span>
          )}
          {!isDemo && (c.reliability_tier === "🌟 Excellent" || c.reliability_tier === "✅ Fiable") && (
            <span title="Calculé à partir de la ponctualité des paiements et de l'activité réelle sur VierAfrik"
              style={{ background:"rgba(0,212,120,.85)", backdropFilter:"blur(6px)", borderRadius:20, padding:"4px 10px", fontSize:10.5, fontWeight:800, color:"#000" }}>
              {c.reliability_tier}
            </span>
          )}
        </div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:82, background:"linear-gradient(to top,rgba(5,9,15,.96),transparent)" }}/>
        <div style={{ position:"absolute", bottom:11, left:14, right:14 }}>
          <div style={{ fontWeight:900, fontSize:16.5, color:"#fff", letterSpacing:"-.02em", textShadow:"0 2px 8px rgba(0,0,0,.8)", lineHeight:1.2, display:"flex", alignItems:"center", gap:6 }}>
            {c.business || c.nom || "Commerçant"}
            {c.is_verified && !isDemo && (
              <span title="Entreprise vérifiée" style={{ fontSize:13 }}>✅</span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:accent, fontWeight:700, textShadow:"0 1px 4px rgba(0,0,0,.9)" }}>
              {c.activite || "Service"}
            </span>
            {c.ville && (
              <span style={{ fontSize:11, color:"#dff0ff", fontWeight:600, textShadow:"0 1px 4px rgba(0,0,0,.9)", display:"flex", alignItems:"center", gap:3 }}>
                📍 {c.ville}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── INFOS + ACTIONS ── */}
      <div style={{ padding:"13px 15px", display:"flex", flexDirection:"column", flex:1 }}>
        {c.description && (
          <div style={{ fontSize:11.5, color:Tc.sub2, lineHeight:1.5, marginBottom:11, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>
            {c.description}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:11 }}>
          <div style={{ display:"flex", gap:2 }}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>!isDemo && onRate(c.id,n)}
                disabled={isDemo}
                style={{ background:"none", border:"none", cursor:isDemo?"default":"pointer", fontSize:15, padding:0, color:n<=note?Tc.gold:Tc.c4 }}>★</button>
            ))}
          </div>
          {note>0 && <span style={{ fontSize:11, color:Tc.gold, fontWeight:700 }}>{note}/5</span>}
        </div>

        {isDemo ? (
          <button onClick={()=>c.__onDemoBlocked?.()} style={{
            marginTop:"auto", width:"100%", padding:"11px", borderRadius:11, border:`1px dashed ${Tc.gold}55`,
            background:`${Tc.gold}10`, color:Tc.gold, cursor:"pointer", fontFamily:"inherit",
            fontWeight:700, fontSize:12,
          }}>
            ✨ Profil d'exemple, rejoins le réseau pour être visible
          </button>
        ) : (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:11 }}>
              {[
                { ic:"📞", label:"Appeler",  col:Tc.gr,    fn:()=>doCall(c.phone) },
                { icon:<WhatsAppIcon size={19}/>, label:"WhatsApp", col:"#25D366", fn:()=>doWA(c.phone,c.business||c.nom,c.activite) },
                { ic:"➕", label:"Client",   col:Tc.blue,   fn:()=>onAddClient?.({name:c.business||c.nom||"",phone:c.phone||"",cat:c.activite||"Commerce",status:"active"}) },
                { ic:"🧾", label:"Facture",  col:Tc.gold,   fn:()=>onCreateInvoice?.({clientName:c.business||c.nom||"",phone:c.phone||""}) },
              ].map(b=>(
                <button key={b.label} onClick={b.fn} style={{
                  padding:"11px 4px", borderRadius:10, border:`1px solid ${b.col}44`,
                  background:`${b.col}15`, color:b.col, cursor:"pointer",
                  fontFamily:"inherit", fontWeight:700, fontSize:10.5,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                }}>
                  <span style={{ fontSize:18, display:"flex" }}>{b.icon || b.ic}</span>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
            {c.phone && (
              <button onClick={()=>onPayment?.({phone:c.phone,name:c.business||c.nom})}
                style={{ marginTop:"auto", width:"100%", padding:"9px", borderRadius:10, border:`1px solid ${Tc.teal}44`, background:`${Tc.teal}10`, color:Tc.teal, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                📱 Payer via Mobile Money
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
