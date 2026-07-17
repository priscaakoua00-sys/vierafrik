import { useState, useEffect } from "react";
import { useViewport } from "../../hooks/useMediaQuery.js";
import { countryLabel } from "../../data/locations.js";
import { FORUM_CATEGORIES } from "../../data/networkCategories.js";

// ══════════════════════════════════════════════════════════════
//  🤝  Forum annonces — messages courts, expirent après 24h
//  (anciennement ReseauCommerçants, extrait + refonte desktop)
// ══════════════════════════════════════════════════════════════
export default function NetworkForum({ user, supabase, accent = "#00d478", toast }) {
  const [msgs, setMsgs]         = useState([]);
  const [newMsg, setNewMsg]     = useState("");
  const [categorie, setCat]     = useState("all");
  const [filtreId, setFiltreId] = useState("all");
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);

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

  const msgsFiltres = msgs.filter(m => filtreId === "all" ? true : m.categorie === filtreId);

  // ── Composer une annonce ──
  const Composer = () => (
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
        style={{ ...IS, height:80, resize:"none" }}
        placeholder="Ex: Je cherche 2 personnes pour travailler dans ma boutique aujourd'hui à Abidjan…"
        value={newMsg}
        onChange={ev => setNewMsg(ev.target.value)}
        maxLength={200}
      />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
        <span style={{ fontSize:10, color:T.sub }}>{newMsg.length}/200</span>
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

  // ── Filtre catégorie ──
  const CategoryFilter = () => (
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

  const MessageCard = ({ m, i }) => {
    const isOwn = m.user_id === user?.id;
    const catInfo = FORUM_CATEGORIES.find(c => c.id === m.categorie) || FORUM_CATEGORIES[0];
    const isTruncated = (m.message||"").length > 90;
    return (
      <div key={m.id || i} onClick={() => setSelectedMsg(m)} style={{
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
              <button onClick={(e) => { e.stopPropagation(); deleteMsg(m.id); }} style={{ background:"rgba(255,34,85,.12)", border:"1px solid rgba(255,34,85,.2)", borderRadius:6, cursor:"pointer", color:"#ff2255", fontSize:10, padding:"2px 6px", fontFamily:"inherit" }}>🗑️</button>
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

  const MessagesList = () => (
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
          {msgsFiltres.map((m, i) => <MessageCard key={m.id||i} m={m} i={i}/>)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:T.text }}>
      <div style={{ background:`${accent}12`, border:`1px solid ${accent}22`, borderRadius:8, padding:"6px 12px", marginBottom:18, fontSize:11, color:accent, fontWeight:600 }}>
        ⏱ Les messages disparaissent automatiquement après 24h
      </div>

      {isDesktop ? (
        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
          <div style={{ width:280, flexShrink:0, position:"sticky", top:78, display:"flex", flexDirection:"column", gap:16 }}>
            <Composer/>
            <CategoryFilter/>
          </div>
          <div style={{ flex:1, minWidth:0 }}><MessagesList/></div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom:16 }}><Composer/></div>
          <div style={{ marginBottom:16 }}><CategoryFilter/></div>
          <MessagesList/>
        </div>
      )}

      {/* ── MODALE DÉTAIL ANNONCE ── */}
      {selectedMsg && (() => {
        const m = selectedMsg;
        const isOwn = m.user_id === user?.id;
        const catInfo = FORUM_CATEGORIES.find(c => c.id === m.categorie) || FORUM_CATEGORIES[0];
        const initials = (m.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
        const phone = (m.phone||"").replace(/\D/g,"");
        return (
          <div onClick={() => setSelectedMsg(null)} style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:950,
            display:"flex", alignItems: isDesktop ? "center" : "flex-end", justifyContent:"center",
            backdropFilter:"blur(14px)", padding: isDesktop ? "2rem" : 0,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background:`linear-gradient(160deg,${T.c1},${T.c2})`, border:`1px solid ${accent}33`,
              borderRadius: isDesktop ? 22 : "24px 24px 0 0",
              padding:"1.6rem 1.4rem 2rem", width:"100%", maxWidth: isDesktop ? 480 : 520,
              maxHeight:"88vh", overflowY:"auto", boxShadow:"0 -20px 60px rgba(0,0,0,.9)",
              animation: isDesktop ? "pop .25s cubic-bezier(.34,1.56,.64,1)" : "slideUp .28s cubic-bezier(.34,1.56,.64,1)",
              color:"#dff0ff", fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
            }}>
              {!isDesktop && (
                <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                  <div style={{ width:40, height:4, borderRadius:4, background:"rgba(255,255,255,.15)" }}/>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:T.c3, border:`1px solid ${T.border}`, borderRadius:16, padding:"14px" }}>
                <div style={{ width:52, height:52, borderRadius:16, flexShrink:0, background:`linear-gradient(135deg,${accent},#00bfcc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#000", boxShadow:`0 0 20px ${accent}44` }}>
                  {initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:16, letterSpacing:"-.02em" }}>
                    {m.user_name||"Commerçant"}
                    {isOwn && <span style={{ fontSize:10, color:accent, marginLeft:6, fontWeight:700 }}>• Vous</span>}
                  </div>
                  {m.business && <div style={{ fontSize:12, color:"#80a8c8", marginTop:2 }}>🏢 {m.business}</div>}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5, flexWrap:"wrap" }}>
                    {m.pays && <span style={{ fontSize:10, color:"#4a7090" }}>{countryLabel(m.pays)||("🌍 "+m.pays)}</span>}
                    {m.categorie && m.categorie !== "all" && (
                      <span style={{ background:`${accent}20`, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, color:accent }}>{catInfo.ic} {catInfo.label}</span>
                    )}
                    <span style={{ fontSize:10, color:"#4a7090" }}>🕒 {timeAgo(m.created_at)}</span>
                  </div>
                </div>
              </div>
              <div style={{ background:T.c3, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#4a7090", marginBottom:8 }}>📢 Annonce complète</div>
                <div style={{ fontSize:14, lineHeight:1.75, color:"#dff0ff", whiteSpace:"pre-wrap" }}>{m.message}</div>
              </div>
              <div style={{ fontSize:11, color:"#4a7090", textAlign:"center", marginBottom:16 }}>⏱ {timeLeft(m.created_at)}</div>
              {!isOwn ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {phone ? (
                    <>
                      <a href={`tel:${phone}`} style={{ textDecoration:"none" }}>
                        <button style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${accent},#00bfcc)`, color:"#000", fontFamily:"inherit", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 6px 20px ${accent}44` }}>
                          📞 Appeler {m.user_name?.split(" ")[0]||""}
                        </button>
                      </a>
                      <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${m.user_name||""}👋\n\nJ'ai vu votre annonce sur VierAfrik :\n"${(m.message||"").slice(0,120)}"\n\nJe suis intéressé(e), pouvons-nous discuter ?`)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                        <button style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:"#25D366", color:"#fff", fontFamily:"inherit", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 20px rgba(37,211,102,.4)" }}>
                          💬 WhatsApp {m.user_name?.split(" ")[0]||""}
                        </button>
                      </a>
                    </>
                  ) : (
                    <div style={{ background:"rgba(240,176,32,.08)", border:"1px solid rgba(240,176,32,.22)", borderRadius:12, padding:"12px 14px", fontSize:12, color:"#f0b020", textAlign:"center", lineHeight:1.6 }}>
                      ℹ️ Numéro non renseigné — ce commerçant n'a pas ajouté son téléphone à son profil.
                    </div>
                  )}
                  <button onClick={() => setSelectedMsg(null)} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#4a7090", fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>Fermer</button>
                </div>
              ) : (
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { deleteMsg(m.id); setSelectedMsg(null); }} style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,34,85,.3)", background:"rgba(255,34,85,.1)", color:"#ff2255", fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }}>🗑️ Supprimer</button>
                  <button onClick={() => setSelectedMsg(null)} style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#4a7090", fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>Fermer</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
