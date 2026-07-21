import { useState, useEffect, useCallback, useRef } from "react";
import LessonCard from "./LessonCard.jsx";
import { COACH_CATEGORIES, COACH_LESSONS, WELCOME_LESSON, getRecommendedLessonId, estimateReadingTime } from "../../data/coachLessons.js";

const T = {
  bg:"#010306",c1:"#05090f",c2:"#08111d",c3:"#0d1828",c4:"#121f34",
  border:"rgba(0,210,120,0.08)",
  gr:"#00d478",teal:"#00bfcc",blue:"#1a78ff",gold:"#f0b020",
  orange:"#ff5a18",red:"#ff2255",purple:"#9060ff",
  text:"#dff0ff",sub:"#4a7090",sub2:"#80a8c8",ink:"#000",
};

const viewedKey = (uid) => `viera_coach_viewed_${uid || "anon"}`;
const loadViewed = (uid) => { try { return new Set(JSON.parse(localStorage.getItem(viewedKey(uid)) || "[]")); } catch(e) { return new Set(); } };
const saveViewed = (uid, set) => { try { localStorage.setItem(viewedKey(uid), JSON.stringify([...set])); } catch(e) {} };

// ══════════════════════════════════════════════════════════════
//  🎥 Coach VierAfrik, leçons catégorisées + Coach IA (chat)
//  (refonte, remplace l'ancien système "vidéo" qui n'affichait
//  jamais de vraie vidéo)
// ══════════════════════════════════════════════════════════════
export default function CoachIA({ ses, accent, clis, invs, sales, exps, profit, gPct, goal, setPage, plan="free" }) {
  const isPro = plan === "pro" || plan === "business";

  const [view, setView] = useState({ mode:"menu", lesson:null }); // "menu" | "lesson"
  const [viewed, setViewed] = useState(() => loadViewed(ses?.id));
  const [localMsg,   setLocalMsg]   = useState("");
  const [localChat,  setLocalChat]  = useState([{
    r:"ai",
    t:`Bonjour ${ses?.name?.split(" ")[0] || "entrepreneur"} 👋 Je suis votre Coach VierAfrik. Je suis là pour vous aider à gagner de l'argent ! Posez votre question.`,
  }]);
  const [localCLoad, setLocalCL]    = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [localChat]);

  const activeClientsCount = clis.filter(c => c.status === "active").length;
  const overdueCount = invs.filter(i => i.status === "overdue").length;
  const recommendedId = getRecommendedLessonId({ profit, overdueCount, activeClientsCount, sales });

  const openLesson = (lesson) => {
    setView({ mode:"lesson", lesson });
    const isLocked = lesson.locked && !isPro;
    if (!isLocked) {
      setViewed(prev => { const next = new Set(prev); next.add(lesson.id); saveViewed(ses?.id, next); return next; });
    }
  };
  const backToMenu = () => setView({ mode:"menu", lesson:null });
  const goAction = (lesson) => { if (lesson.action?.page) setPage(lesson.action.page); };

  // ── handleSend, appel sécurisé vers /api/coach ──
  const handleSend = useCallback(async () => {
    if (!localMsg.trim() || localCLoad) return;
    const msg = localMsg.trim();
    setLocalMsg("");
    setLocalChat(h => [...h, { r:"user", t:msg }]);
    setLocalCL(true);
    const newUserMsg = { role:"user", content:msg };
    const updatedHistory = [...chatHistory, newUserMsg];

    try {
      const res = await fetch("/api/coach", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          message: msg,
          history: chatHistory,
          userData: {
            name: ses?.name?.split(" ")[0] || "entrepreneur",
            business: ses?.business || "mon business",
            sales, expenses: exps, profit,
            clients: activeClientsCount,
            invoices: invs.length,
            overdueInv: overdueCount,
            goal, gPct, currency:"FCFA",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Réponse invalide");
      const reply = data.reply;
      setLocalChat(h => [...h, { r:"ai", t:reply }]);
      setChatHistory([...updatedHistory, { role:"assistant", content:reply }]);
    } catch (err) {
      console.error("[CoachIA] Erreur appel /api/coach:", err);
      const fallbackReply = (() => {
        if (sales > 0) return `💰 Ce mois tu as ${new Intl.NumberFormat("fr-FR").format(Math.round(sales))} FCFA de ventes. ${overdueCount > 0 ? `⚠️ ${overdueCount} facture(s) en retard à relancer.` : "Continue sur cette lancée 🚀"}`;
        if (activeClientsCount > 0) return `👥 Tu as ${activeClientsCount} client(s) actif(s). Relance-les aujourd'hui pour générer des ventes 📱`;
        return `🌍 Bienvenue ! Commence par ajouter une vente ou un client pour que je puisse analyser ta situation.`;
      })();
      setLocalChat(h => [...h, { r:"ai", t:fallbackReply }]);
    } finally {
      setLocalCL(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMsg, localCLoad, chatHistory, ses, sales, exps, profit, activeClientsCount, invs, overdueCount, goal, gPct]);

  const totalLessons = COACH_LESSONS.length;
  const viewedCount = COACH_LESSONS.filter(l => viewed.has(l.id)).length;

  // ── Vue détail d'une leçon (ou aperçu verrouillé) ──
  if (view.mode === "lesson" && view.lesson) {
    const v = view.lesson;
    const cat = COACH_CATEGORIES.find(c => c.id === v.category);
    const col = cat?.col || accent;
    const isLocked = v.locked && !isPro;
    const readMin = estimateReadingTime(v.script);

    return (
      <div style={{ animation:"slideUp .3s ease both" }}>
        <button onClick={backToMenu} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.sub2, padding:"5px 14px", cursor:"pointer", fontFamily:"inherit", fontSize:11, marginBottom:16, display:"inline-flex", alignItems:"center", gap:5 }}>← Retour</button>
        <div style={{ background:`linear-gradient(135deg,${T.c1},${T.c2})`, border:`2px solid ${col}44`, borderRadius:20, padding:"1.6rem" }}>
          <div style={{ fontSize:44, marginBottom:10, textAlign:"center" }}>{v.icon}</div>
          <div style={{ fontWeight:900, fontSize:18, letterSpacing:"-.03em", textAlign:"center", marginBottom:4 }}>{v.label}</div>
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
            <span style={{ fontSize:10, color:T.sub2, background:T.c3, borderRadius:20, padding:"3px 10px", fontWeight:700 }}>💬 Leçon texte</span>
            <span style={{ fontSize:10, color:T.sub2, background:T.c3, borderRadius:20, padding:"3px 10px", fontWeight:700 }}>📖 {readMin}s de lecture</span>
          </div>

          {isLocked ? (
            <>
              <div style={{ background:T.c3, borderRadius:14, padding:"16px 18px", marginBottom:18, position:"relative", overflow:"hidden" }}>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.7 }}>{v.script.split("\n")[0]}</div>
                <div style={{ position:"absolute", inset:0, top:"40%", background:`linear-gradient(to bottom, transparent, ${T.c3} 90%)`, backdropFilter:"blur(3px)" }}/>
              </div>
              <div style={{ textAlign:"center", marginBottom:14 }}>
                <span style={{ fontSize:28 }}>🔒</span>
                <div style={{ fontWeight:800, fontSize:14, color:T.gold, marginTop:6 }}>Leçon réservée au plan Pro</div>
                <div style={{ fontSize:11, color:T.sub2, marginTop:4, lineHeight:1.5 }}>Débloque cette leçon et tout le Coach IA en passant à Pro.</div>
              </div>
              <button onClick={()=>setPage("plans")} style={{ width:"100%", padding:"13px", borderRadius:13, border:"none", background:`linear-gradient(135deg,${T.gold},#ffcf5c)`, color:"#000", fontFamily:"inherit", fontWeight:900, fontSize:14, cursor:"pointer", boxShadow:`0 8px 24px ${T.gold}44` }}>
                💎 Débloquer avec Pro →
              </button>
            </>
          ) : (
            <>
              <div style={{ background:T.c3, borderRadius:14, padding:"16px 18px", marginBottom:18 }}>
                {v.script.split("\n").map((l,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"6px 0", borderBottom: i < v.script.split("\n").length-1 ? `1px solid ${T.border}` : "none" }}>
                    {l && <span style={{ color:col, fontSize:16, flexShrink:0, lineHeight:1 }}>›</span>}
                    <span style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{l || ""}</span>
                  </div>
                ))}
              </div>
              {v.action && (
                <button onClick={()=>goAction(v)} style={{ width:"100%", padding:"13px", borderRadius:13, border:"none", background:`linear-gradient(135deg,${col},${col}cc)`, color:T.ink, fontFamily:"inherit", fontWeight:900, fontSize:14, cursor:"pointer", boxShadow:`0 8px 24px ${col}44` }}>
                  {v.action.label} →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Menu principal ──
  return (
    <div style={{ animation:"slideUp .3s ease both" }}>
      <div style={{ textAlign:"center", marginBottom:"1.4rem" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${accent},${T.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 12px", boxShadow:`0 0 40px ${accent}44` }}>🎓</div>
        <div style={{ fontWeight:900, fontSize:22, letterSpacing:"-.04em", marginBottom:4 }}>Coach <span style={{ color:accent }}>VierAfrik</span></div>
        <div style={{ fontSize:12, color:T.sub2 }}>Je te montre → tu comprends → tu gagnes</div>
      </div>

      {/* ── Progression ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, background:T.c1, border:`1px solid ${T.border}`, borderRadius:12, padding:"10px 14px" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10.5, color:T.sub2, fontWeight:700 }}>{viewedCount}/{totalLessons} leçons consultées</div>
          <div style={{ marginTop:5, background:T.c3, borderRadius:20, height:5, overflow:"hidden" }}>
            <div style={{ background:`linear-gradient(90deg,${accent},${T.teal})`, height:"100%", borderRadius:20, width:`${Math.round(viewedCount/totalLessons*100)}%`, transition:"width .4s" }}/>
          </div>
        </div>
      </div>

      {/* ── Bienvenue (grande carte) ── */}
      <div style={{ marginBottom:18 }}>
        <LessonCard lesson={WELCOME_LESSON} big col={accent} T={T} viewed={viewed.has("welcome")} isLocked={false} recommended={false} onOpen={openLesson}/>
      </div>

      {/* ── Catégories ── */}
      {COACH_CATEGORIES.map(cat => {
        const lessons = COACH_LESSONS.filter(l => l.category === cat.id);
        if (!lessons.length) return null;
        return (
          <div key={cat.id} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
              <span style={{ fontSize:14 }}>{cat.icon}</span>
              <span style={{ fontSize:10.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color:T.sub }}>{cat.label}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {lessons.map(l => (
                <LessonCard key={l.id} lesson={l} col={cat.col} T={T}
                  viewed={viewed.has(l.id)} isLocked={l.locked && !isPro}
                  recommended={l.id === recommendedId} onOpen={openLesson}/>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Coach IA, conversation ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, marginTop:24 }}>
        <div style={{ flex:1, height:1, background:T.border }}/>
        <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>🤖 Discussion avec le Coach IA</div>
        <div style={{ flex:1, height:1, background:T.border }}/>
      </div>
      <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:14, padding:"1rem", marginBottom:9 }}>
        <div style={{ height:240, overflowY:"auto", display:"flex", flexDirection:"column", gap:9, marginBottom:9 }}>
          {localChat.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent: m.r==="user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth:"82%", padding:"9px 12px", borderRadius: m.r==="user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px", background: m.r==="user" ? accent : T.c2, color: m.r==="user" ? T.ink : T.text, fontSize:11, lineHeight:1.6 }}>
                {m.r==="ai" && <div style={{ fontWeight:700, fontSize:9, color:accent, marginBottom:2 }}>🤖 Coach VierAfrik</div>}
                {m.t}
              </div>
            </div>
          ))}
          {localCLoad && (
            <div style={{ display:"flex" }}>
              <div style={{ background:T.c2, padding:"9px 12px", borderRadius:"3px 14px 14px 14px", fontSize:11, color:T.sub, display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:accent, animation:"pulse .8s infinite" }}/>⏳ Analyse en cours…
              </div>
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          <input
            style={{ flex:1, padding:"10px 13px", borderRadius:9, border:`1px solid ${T.border}`, background:T.c2, color:T.text, fontFamily:"inherit", fontSize:12, outline:"none" }}
            placeholder="Posez une question…"
            value={localMsg}
            onChange={ev => setLocalMsg(ev.target.value)}
            onKeyDown={ev => { if (ev.key === "Enter" && !localCLoad) { ev.preventDefault(); handleSend(); } }}
          />
          <button onClick={handleSend} disabled={localCLoad} style={{ flexShrink:0, padding:"0 16px", borderRadius:9, border:"none", background:accent, color:T.ink, fontFamily:"inherit", fontWeight:800, fontSize:12, cursor:localCLoad?"not-allowed":"pointer", opacity:localCLoad?.6:1 }}>
            {localCLoad ? "⏳" : "Envoyer"}
          </button>
        </div>
        <div style={{ display:"flex", gap:5, marginTop:7, flexWrap:"wrap" }}>
          {[
            "Comment augmenter mes ventes ?",
            "Analyse ma situation ce mois",
            "Comment trouver plus de clients ?",
            "Conseille-moi sur mes dépenses",
          ].map(q => (
            <button key={q} onClick={() => setLocalMsg(q)}
              style={{ background:T.c2, border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 10px", color:T.sub2, fontSize:9, cursor:"pointer", fontFamily:"inherit" }}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
