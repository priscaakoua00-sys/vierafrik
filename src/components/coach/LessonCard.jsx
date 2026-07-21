import { estimateReadingTime } from "../../data/coachLessons.js";

// ══════════════════════════════════════════════════════════════
//  LessonCard, vignette animée (CSS pur, aucune image externe)
// ══════════════════════════════════════════════════════════════
export default function LessonCard({ lesson, big, viewed, isLocked, recommended, col, T, onOpen }) {
  const readMin = estimateReadingTime(lesson.script);

  return (
    <div
      onClick={() => onOpen(lesson)}
      style={{
        background:`linear-gradient(135deg,${T.c1},${T.c2})`,
        border:`2px solid ${recommended ? col+"88" : col+"33"}`,
        borderRadius: big ? 20 : 16, overflow:"hidden", cursor:"pointer",
        transition:"all .22s cubic-bezier(.34,1.56,.64,1)", position:"relative",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = col+"aa"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = (recommended?col+"88":col+"33"); e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* ── Vignette animée ── */}
      <div style={{ position:"relative", height: big ? 176 : 120, background:`linear-gradient(120deg,${col}22,${col}08,${col}18)`, backgroundSize:"200% 200%", animation:"coachGradientDrift 6s ease infinite", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 30% 30%, ${col}22, transparent 60%)` }}/>
        <div style={{ fontSize: big ? 46 : 36, animation:"coachFloat 3.2s ease-in-out infinite", filter:`drop-shadow(0 4px 18px ${col}55)` }}>
          {lesson.icon}
        </div>
        {/* Badge type, jamais "vidéo" si ce n'est pas une vraie vidéo */}
        <div style={{ position:"absolute", top:10, left:10, background:"rgba(0,0,0,.62)", backdropFilter:"blur(6px)", borderRadius:20, padding:"3px 9px", fontSize:9.5, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}>
          {lesson.type === "video" ? "🎥 Vidéo" : "💬 Texte"}
        </div>
        <div style={{ position:"absolute", bottom:10, right:12, background:"rgba(0,0,0,.62)", backdropFilter:"blur(6px)", borderRadius:8, padding:"2px 8px", fontSize:9, color:"#fff", fontWeight:700 }}>
          📖 {readMin}s
        </div>
        {viewed && (
          <div style={{ position:"absolute", top:10, right:10, background:T.gr, borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#000" }}>✓</div>
        )}
        {isLocked && (
          <div style={{ position:"absolute", inset:0, background:"rgba(5,9,15,.72)", backdropFilter:"blur(2px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
            <span style={{ fontSize:22 }}>🔒</span>
            <span style={{ background:T.gold, color:"#000", fontSize:9, fontWeight:800, borderRadius:20, padding:"2px 9px" }}>PRO</span>
          </div>
        )}
      </div>

      <div style={{ padding: big ? "14px 16px" : "11px 13px" }}>
        {recommended && (
          <div style={{ fontSize:9, fontWeight:800, color:col, marginBottom:4, letterSpacing:".04em", textTransform:"uppercase" }}>✨ Recommandé pour toi</div>
        )}
        <div style={{ fontWeight:800, fontSize: big ? 15 : 12.5, color:T.text, marginBottom:4 }}>{lesson.label}</div>
        {big && (
          <div style={{ fontSize:10.5, color:T.sub2, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {lesson.script.split("\n")[0]}
          </div>
        )}
      </div>
    </div>
  );
}
