import { useState, useEffect } from "react";
import { useViewport } from "../../hooks/useMediaQuery.js";
import { countryLabel } from "../../data/locations.js";
import { FORUM_CATEGORIES } from "../../data/networkCategories.js";
import MyStoriesBar from "./MyStoriesBar.jsx";
import StoryDetailModal, { MAX_MSG_LEN } from "./StoryDetailModal.jsx";
import { deleteNetworkMedia } from "../../utils/networkMedia.js";

// ══════════════════════════════════════════════════════════════
//  🤝  Forum annonces, messages courts, expirent après 24h
//  (anciennement ReseauCommerçants, extrait + refonte desktop)
//
//  IMPORTANT, Composer/CategoryFilter/MessagesList/MessageCard sont des
//  composants top-level (pas définis dans le corps de NetworkForum) :
//  sinon chaque frappe clavier (setNewMsg) redéclenche un render de
//  NetworkForum, qui recréerait ces fonctions à chaque fois → React les
//  traite comme un composant différent et démonte/remonte le textarea,
//  ce qui fait perdre le focus (et le clavier mobile) à chaque lettre.
// ══════════════════════════════════════════════════════════════

const Composer = ({ accent, T, IS, categorie, setCat, newMsg, setNewMsg, sending, sendMsg }) => (
  <div style={{ background:`linear-gradient(135deg,${T.c1},${T.c2})`, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.2rem" }}>
    <div style={{ fontWeight:800, fontSize:12.5, marginBottom:11, display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ background:`${accent}18`, border:`1px solid ${accent}30`, borderRadius:8, padding:"4px 8px", fontSize:14 }}>✍️</span>
      Publier une annonce
    </div>
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
      {FORUM_CATEGORIES.slice(1).map(c => (
        <div key={c.id} onClick={() => setCat(c.id)} style={{
          background: categorie===c.id ? `${accent}25` : T.c3,
          border: `1px solid ${categorie===c.id ? accent : T.border}`,
          borderRadius:20, padding:"4px 10px", cursor:"pointer",
          fontSize:11, fontWeight:700,
          color: categorie===c.id ? accent : T.sub2,
        }}>
          {c.ic} {c.label}
        </div>
      ))}
    </div>
    <textarea
      style={{ ...IS, height:110, resize:"none" }}
      placeholder="Ex: Je cherche 2 personnes pour travailler dans ma boutique aujourd'hui à Abidjan…"
      value={newMsg}
      onChange={ev => setNewMsg(ev.target.value)}
      maxLength={MAX_MSG_LEN}
    />
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
      <span style={{ fontSize:10, fontWeight:700, color: newMsg.length>=MAX_MSG_LEN ? "#ff2255" : newMsg.length>MAX_MSG_LEN-50 ? "#f0b020" : T.sub }}>
        {newMsg.length}/{MAX_MSG_LEN}
      </span>
      <button disabled={sending || !newMsg.trim()} onClick={sendMsg} style={{
        padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer",
        fontWeight:700, fontSize:12, background:accent, color:T.ink,
        fontFamily:"inherit", opacity:sending||!newMsg.trim()?0.45:1,
      }}>
        {sending ? "⏳ Envoi…" : "📢 Publier"}
      </button>
    </div>
  </div>
);

const CategoryFilter = ({ accent, T, isDesktop, filtreId, setFiltreId }) => (
  <div style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.1rem" }}>
    <div style={{ fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:T.sub, marginBottom:10 }}>Filtrer</div>
    <div style={{ display:"flex", flexDirection: isDesktop ? "column" : "row", flexWrap: isDesktop ? "nowrap" : "wrap", gap:7, overflowX: isDesktop ? "visible" : "auto" }}>
      {FORUM_CATEGORIES.map(c => (
        <div key={c.id} onClick={() => setFiltreId(c.id)} style={{
          background: filtreId===c.id ? `${accent}20` : T.c2,
          border: `1px solid ${filtreId===c.id ? accent : T.border}`,
          borderRadius:10, padding:"7px 12px", cursor:"pointer",
          fontSize:11.5, fontWeight:700, flexShrink:0,
          color: filtreId===c.id ? accent : T.sub2,
        }}>
          {c.ic} {c.label}
        </div>
      ))}
    </div>
  </div>
);

const MessageCard = ({ m, i, accent, T, user, timeAgo, timeLeft, onSelect, onDelete }) => {
  const isOwn = m.user_id === user?.id;
  const catInfo = FORUM_CATEGORIES.find(c => c.id === m.categorie) || FORUM_CATEGORIES[0];
  const isTruncated = (m.message||"").length > 90;
  return (
    <div key={m.id || i} onClick={() => onSelect(m)} style={{
      background: isOwn ? `${accent}12` : T.c2,
      border: `1px solid ${isOwn ? accent+"44" : T.border}`,
      borderRadius:14, padding:"14px 15px", cursor:"pointer",
      display:"flex", flexDirection:"column", height:"100%",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#00bfcc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:11, color:T.ink, flexShrink:0 }}>
            {(m.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:12, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {m.user_name||"Commerçant"}
              {isOwn && <span style={{ fontSize:9, color:accent, marginLeft:5, fontWeight:800 }}>• Vous</span>}
            </div>
            {m.business && <div style={{ fontSize:10, color:T.sub2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.business}</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <span style={{ fontSize:10, color:T.sub }}>{timeAgo(m.created_at)}</span>
          {isOwn && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} style={{ background:"rgba(255,34,85,.12)", border:"1px solid rgba(255,34,85,.2)", borderRadius:6, cursor:"pointer", color:"#ff2255", fontSize:10, padding:"2px 6px", fontFamily:"inherit" }}>🗑️</button>
          )}
        </div>
      </div>
      <div style={{ fontSize:13, color:T.text, lineHeight:1.6, marginBottom:10, flex:1 }}>
        {isTruncated ? (m.message||"").slice(0,90)+"…" : m.message}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {m.categorie && m.categorie !== "all" && (
            <span style={{ background:`${accent}15`, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, color:accent }}>{catInfo.ic} {catInfo.label}</span>
          )}
          {m.pays && <span style={{ fontSize:10, color:T.sub }}>{countryLabel(m.pays)||("🌍 "+m.pays)}</span>}
        </div>
        <span style={{ fontSize:9, color:T.sub }}>{timeLeft(m.created_at)}</span>
      </div>
    </div>
  );
};

const cardsGrid = { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14, alignItems:"stretch" };

const MessagesList = ({ msgsFiltres, loading, T, accent, user, timeAgo, timeLeft, onSelect, onDelete }) => (
  <div>
    <div style={{ fontWeight:800, fontSize:13, marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ background:`${T.gr}18`, border:`1px solid ${T.gr}30`, borderRadius:8, padding:"4px 8px", fontSize:14 }}>💬</span>
        Annonces ({msgsFiltres.length})
      </div>
      <span style={{ fontSize:10, color:T.sub }}>🔄 Auto 15s</span>
    </div>
    {loading ? (
      <div style={{ textAlign:"center", padding:"2rem", color:T.sub, fontSize:12 }}>⏳ Chargement…</div>
    ) : msgsFiltres.length === 0 ? (
      <div style={{ textAlign:"center", padding:"2.5rem", color:T.sub, background:T.c1, border:`1px solid ${T.border}`, borderRadius:16 }}>
        <div style={{ fontSize:40, marginBottom:8 }}>🤝</div>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>Réseau vide pour l'instant</div>
        <div style={{ fontSize:11 }}>Soyez le premier à publier une annonce !</div>
      </div>
    ) : (
      <div style={cardsGrid}>
        {msgsFiltres.map((m, i) => (
          <MessageCard key={m.id||i} m={m} i={i} accent={accent} T={T} user={user} timeAgo={timeAgo} timeLeft={timeLeft} onSelect={onSelect} onDelete={onDelete}/>
        ))}
      </div>
    )}
  </div>
);

export default function NetworkForum({ user, supabase, accent = "#00d478", toast }) {
  const [msgs, setMsgs]         = useState([]);
  const [newMsg, setNewMsg]     = useState("");
  const [categorie, setCat]     = useState("all");
  const [filtreId, setFiltreId] = useState("all");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [justPublished, setJustPublished] = useState(null);

  const viewport = useViewport();
  const isDesktop = viewport === "desktop";

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
        .gte("created_at", since)
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
    const interval = setInterval(loadMsgs, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Envoyer un message ──
  const sendMsg = async () => {
    if (!newMsg.trim()) return;
    if (newMsg.trim().length < 5) { toast?.("⚠️ Message trop court", "warn"); return; }
    if (newMsg.trim().length > MAX_MSG_LEN) { toast?.(`⚠️ Maximum ${MAX_MSG_LEN} caractères`, "warn"); return; }
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
      const saved = { ...msg, id: data?.[0]?.id || Date.now() };
      setMsgs(p => [saved, ...p]);
      setNewMsg("");
      setCat("all");
      // Réinitialiser le filtre, sinon un message publié dans une catégorie
      // différente du filtre actif reste invisible pour son propre auteur,
      // même si tout le monde d'autre le voit (c'est ce qui donnait
      // l'impression que la publication avait disparu).
      setFiltreId("all");
      setJustPublished(saved);
    } catch (e) {
      toast?.("❌ Erreur envoi, vérifiez votre connexion", "err");
    } finally {
      setSending(false);
    }
  };

  // ── Supprimer son propre message ──
  const deleteMsg = async (id) => {
    if (!supabase) return;
    const target = msgs.find(m => m.id === id);
    try {
      const s = await supabase();
      const { error } = await s.from("reseau_messages").delete().eq("id", id).eq("user_id", user?.id);
      if (error) throw error;
      setMsgs(p => p.filter(m => m.id !== id));
      // Nettoyage immédiat du média associé, pas besoin d'attendre le
      // passage automatique côté serveur pour une suppression volontaire.
      if (target?.image_url) deleteNetworkMedia(s, target.image_url);
      if (target?.video_url) deleteNetworkMedia(s, target.video_url);
      if (target?.thumbnail_url) deleteNetworkMedia(s, target.thumbnail_url);
      toast?.("🗑️ Message supprimé", "ok");
    } catch (e) {
      toast?.("❌ Erreur suppression", "err");
    }
  };

  // ── Modifier son propre message ──
  const updateMsg = async (id, updates) => {
    if (!supabase) return false;
    try {
      const s = await supabase();
      const { error } = await s.from("reseau_messages").update(updates).eq("id", id).eq("user_id", user?.id);
      if (error) throw error;
      setMsgs(p => p.map(m => m.id === id ? { ...m, ...updates } : m));
      toast?.("✅ Story modifiée !", "ok");
      return true;
    } catch (e) {
      toast?.("❌ Modification échouée, réessaie", "err");
      return false;
    }
  };

  const timeAgo = (d) => {
    const diff = Math.round((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60)    return diff + "s";
    if (diff < 3600)  return Math.round(diff / 60) + "min";
    if (diff < 86400) return Math.round(diff / 3600) + "h";
    return Math.round(diff / 86400) + "j";
  };

  const timeLeft = (d) => {
    const left = 24*60*60*1000 - (Date.now() - new Date(d).getTime());
    if (left <= 0) return "Expiré";
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    return `Expire dans ${h}h${m > 0 ? m+"min" : ""}`;
  };

  const isExpired = (m) => {
    const ref = m.expires_at ? new Date(m.expires_at).getTime() : (new Date(m.created_at).getTime() + 24*60*60*1000);
    return Date.now() >= ref;
  };

  const msgsFiltres = msgs.filter(m => filtreId === "all" ? true : m.categorie === filtreId);
  const myMsgs = msgs.filter(m => m.user_id === user?.id && !isExpired(m));

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      <div style={{ background:`${accent}12`, border:`1px solid ${accent}22`, borderRadius:8, padding:"6px 12px", marginBottom:18, fontSize:11, color:accent, fontWeight:600 }}>
        ⏱ Les messages disparaissent automatiquement après 24h
      </div>

      {/* ── Confirmation post-publication ── */}
      {justPublished && (
        <div style={{ background:`linear-gradient(135deg,${accent}20,${T.c1})`, border:`1px solid ${accent}55`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:accent }}>✅ Story publiée, visible par tous les commerçants VierAfrik !</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { setSelectedMsg(justPublished); setJustPublished(null); }} style={{ padding:"7px 14px", borderRadius:9, border:"none", background:accent, color:T.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:11 }}>
              👁️ Voir ma story
            </button>
            <button onClick={() => setJustPublished(null)} style={{ padding:"7px 10px", borderRadius:9, border:`1px solid ${T.border}`, background:"transparent", color:T.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:11 }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Vos stories, toujours en premier, jamais masqué par le filtre ── */}
      <MyStoriesBar myMsgs={myMsgs} accent={accent} T={T} timeLeft={timeLeft} onOpen={setSelectedMsg}/>

      {isDesktop ? (
        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
          <div style={{ width:280, flexShrink:0, position:"sticky", top:78, display:"flex", flexDirection:"column", gap:16 }}>
            <Composer accent={accent} T={T} IS={IS} categorie={categorie} setCat={setCat} newMsg={newMsg} setNewMsg={setNewMsg} sending={sending} sendMsg={sendMsg}/>
            <CategoryFilter accent={accent} T={T} isDesktop={isDesktop} filtreId={filtreId} setFiltreId={setFiltreId}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <MessagesList msgsFiltres={msgsFiltres} loading={loading} T={T} accent={accent} user={user} timeAgo={timeAgo} timeLeft={timeLeft} onSelect={setSelectedMsg} onDelete={deleteMsg}/>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom:16 }}>
            <Composer accent={accent} T={T} IS={IS} categorie={categorie} setCat={setCat} newMsg={newMsg} setNewMsg={setNewMsg} sending={sending} sendMsg={sendMsg}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <CategoryFilter accent={accent} T={T} isDesktop={isDesktop} filtreId={filtreId} setFiltreId={setFiltreId}/>
          </div>
          <MessagesList msgsFiltres={msgsFiltres} loading={loading} T={T} accent={accent} user={user} timeAgo={timeAgo} timeLeft={timeLeft} onSelect={setSelectedMsg} onDelete={deleteMsg}/>
        </div>
      )}

      {/* ── MODALE DÉTAIL / GESTION D'UNE STORY ── */}
      {selectedMsg && (
        <StoryDetailModal
          msg={selectedMsg}
          isDesktop={isDesktop}
          accent={accent}
          T={T}
          user={user}
          timeAgo={timeAgo}
          timeLeft={timeLeft}
          isExpired={isExpired}
          onClose={() => setSelectedMsg(null)}
          onDelete={deleteMsg}
          onUpdate={updateMsg}
          supabase={supabase}
          toast={toast}
        />
      )}
    </div>
  );
}
