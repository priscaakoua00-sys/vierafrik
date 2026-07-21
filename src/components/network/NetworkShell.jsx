import { useState } from "react";
import NetworkFeed from "./NetworkFeed.jsx";
import NetworkForum from "./NetworkForum.jsx";
import { useViewport } from "../../hooks/useMediaQuery.js";

// ══════════════════════════════════════════════════════════════
//  Réseau, page conteneur : en-tête + onglets Feed/Forum
//  (anciennement PgCommProches, extrait pour cohérence desktop)
// ══════════════════════════════════════════════════════════════
export default function NetworkShell({ ses, accent, toast, getSupa, plan, onAddClient, onCreateInvoice, onPayment }) {
  const [onglet, setOnglet] = useState("feed"); // "feed" | "forum"
  const viewport = useViewport();
  const isDesktop = viewport === "desktop";

  const T = { c2:"#08111d", border:"rgba(0,210,120,0.08)", text:"#dff0ff", sub2:"#80a8c8", ink:"#000", teal:"#00bfcc" };

  const TABS = [
    { id:"feed",  ic:"🗺️", label:"Réseau visuel" },
    { id:"forum", ic:"🤝", label:"Forum annonces" },
  ];

  return (
    <div>
      {/* ── EN-TÊTE, compact, jamais démesuré même en grand écran ── */}
      <div style={{ display:"flex", alignItems: isDesktop ? "flex-end" : "center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:18 }}>
        <div style={{ textAlign: isDesktop ? "left" : "center", width: isDesktop ? "auto" : "100%" }}>
          <div style={{ fontWeight:900, fontSize: isDesktop ? 22 : 22, letterSpacing:"-.03em" }}>
            🗺️ Réseau <span style={{ color:accent }}>VierAfrik</span>
          </div>
          <div style={{ fontSize:12, color:T.sub2, marginTop:2 }}>
            Je vois → je choisis → je <strong style={{ color:"#00d478" }}>contacte</strong>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, background:T.c2, borderRadius:14, padding:4, border:`1px solid ${T.border}`, width: isDesktop ? "auto" : "100%" }}>
          {TABS.map(o=>(
            <button key={o.id} onClick={()=>setOnglet(o.id)} style={{
              flex: isDesktop ? "0 0 auto" : 1,
              padding: isDesktop ? "9px 20px" : "10px 8px",
              borderRadius:11, border:"none",
              background:onglet===o.id?`linear-gradient(135deg,${accent},${T.teal})`:"transparent",
              color:onglet===o.id?T.ink:T.sub2,
              fontFamily:"inherit", fontWeight:800, fontSize:12, cursor:"pointer",
              transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6, whiteSpace:"nowrap",
            }}>
              {o.ic} {o.label}
            </button>
          ))}
        </div>
      </div>

      {onglet==="feed" && (
        <NetworkFeed
          user={ses} supabase={getSupa} accent={accent} toast={toast} plan={plan}
          onAddClient={onAddClient} onCreateInvoice={onCreateInvoice} onPayment={onPayment}
        />
      )}
      {onglet==="forum" && (
        <NetworkForum user={ses} supabase={getSupa} accent={accent} toast={toast}/>
      )}
    </div>
  );
}
