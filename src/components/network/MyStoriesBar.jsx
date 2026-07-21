// ══════════════════════════════════════════════════════════════
//  📌 MyStoriesBar, bandeau "Vos stories" (Forum 24h)
//  Toujours visible en premier, indépendamment du filtre de
//  catégorie actif, pour que l'auteur retrouve toujours ses propres
//  publications même si elles ne correspondent pas au filtre choisi.
// ══════════════════════════════════════════════════════════════
export default function MyStoriesBar({ myMsgs, accent, T, timeLeft, onOpen }) {
  if (!myMsgs || myMsgs.length === 0) return null;

  return (
    <div style={{ background:`linear-gradient(135deg,${accent}10,${T.c1})`, border:`1px solid ${accent}33`, borderRadius:16, padding:"1rem", marginBottom:16 }}>
      <div style={{ fontWeight:800, fontSize:12.5, marginBottom:10, display:"flex", alignItems:"center", gap:8, color:accent }}>
        <span>📌</span> Vos stories actives ({myMsgs.length})
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
        {myMsgs.map((m) => (
          <button key={m.id} onClick={() => onOpen(m)} style={{
            flexShrink:0, width:150, textAlign:"left", padding:"10px 12px", borderRadius:12,
            border:`1px solid ${accent}44`, background:T.c2, cursor:"pointer", fontFamily:"inherit",
            display:"flex", flexDirection:"column", gap:4,
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {(m.message||"").slice(0,40) || "(sans texte)"}
            </div>
            <div style={{ fontSize:9.5, color:accent, fontWeight:700 }}>⏱ {timeLeft(m.created_at)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
