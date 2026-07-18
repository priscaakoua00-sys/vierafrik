import { useState } from "react";
import { countryLabel } from "../../data/locations.js";
import { FORUM_CATEGORIES } from "../../data/networkCategories.js";
import CameraCapture from "./CameraCapture.jsx";
import { uploadNetworkMedia, videoExtFromBlob, deleteNetworkMedia } from "../../utils/networkMedia.js";

export const MAX_MSG_LEN = 500;

// ══════════════════════════════════════════════════════════════
//  StoryDetailModal — vue détail d'une story du Forum 24h.
//  Lecture seule pour les autres utilisateurs (appeler/WhatsApp).
//  Pour l'auteur : voir exactement comme les autres la voient,
//  modifier le texte/catégorie, remplacer le média, supprimer.
// ══════════════════════════════════════════════════════════════
export default function StoryDetailModal({
  msg, isDesktop, accent, T, user, timeAgo, timeLeft, isExpired,
  onClose, onDelete, onUpdate, supabase, toast,
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message || "");
  const [editCat, setEditCat] = useState(msg.categorie || "all");
  const [showCapture, setShowCapture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null); // résultat CameraCapture pas encore uploadé

  const isOwn = msg.user_id === user?.id;
  const expired = isExpired(msg);
  const catInfo = FORUM_CATEGORIES.find(c => c.id === msg.categorie) || FORUM_CATEGORIES[0];
  const initials = (msg.user_name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const phone = (msg.phone||"").replace(/\D/g,"");
  const hasMedia = !!(msg.image_url || msg.video_url);

  const saveEdit = async () => {
    const trimmed = editText.trim();
    if (trimmed.length < 5) { toast?.("⚠️ Message trop court", "warn"); return; }
    if (trimmed.length > MAX_MSG_LEN) { toast?.(`⚠️ Maximum ${MAX_MSG_LEN} caractères`, "warn"); return; }
    setSaving(true);
    try {
      const updates = { message: trimmed, categorie: editCat };
      if (pendingMedia) {
        const s = await supabase();
        if (pendingMedia.type === "photo") {
          const url = await uploadNetworkMedia(s, user?.id, pendingMedia.blob, { folder:"stories", ext:"jpg", contentType:"image/jpeg" });
          updates.image_url = url; updates.video_url = null; updates.thumbnail_url = null;
          updates.media_type = "photo"; updates.duration_seconds = null;
        } else {
          const url = await uploadNetworkMedia(s, user?.id, pendingMedia.blob, { folder:"stories", ext:videoExtFromBlob(pendingMedia.blob), contentType:pendingMedia.blob.type||"video/webm" });
          let thumbUrl = null;
          if (pendingMedia.thumbnailBlob) {
            thumbUrl = await uploadNetworkMedia(s, user?.id, pendingMedia.thumbnailBlob, { folder:"stories", ext:"jpg", contentType:"image/jpeg" });
          }
          updates.video_url = url; updates.image_url = null; updates.thumbnail_url = thumbUrl;
          updates.media_type = "video"; updates.duration_seconds = pendingMedia.durationSec;
        }
        // Nettoyage immédiat de l'ancien média — ne pas attendre le passage
        // automatique de l'étape 1 (qui ne traite que les stories expirées).
        if (msg.image_url) await deleteNetworkMedia(s, msg.image_url);
        if (msg.video_url) await deleteNetworkMedia(s, msg.video_url);
        if (msg.thumbnail_url) await deleteNetworkMedia(s, msg.thumbnail_url);
      }
      const ok = await onUpdate(msg.id, updates);
      if (ok) {
        Object.assign(msg, updates); // reflète immédiatement dans la vue "aperçu"
        setEditing(false);
        setPendingMedia(null);
      }
    } catch(e) {
      toast?.("❌ Envoi du média échoué — réessaie", "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{
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
              {msg.user_name||"Commerçant"}
              {isOwn && <span style={{ fontSize:10, color:accent, marginLeft:6, fontWeight:700 }}>• Vous</span>}
            </div>
            {msg.business && <div style={{ fontSize:12, color:"#80a8c8", marginTop:2 }}>🏢 {msg.business}</div>}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5, flexWrap:"wrap" }}>
              {msg.pays && <span style={{ fontSize:10, color:"#4a7090" }}>{countryLabel(msg.pays)||("🌍 "+msg.pays)}</span>}
              {msg.categorie && msg.categorie !== "all" && (
                <span style={{ background:`${accent}20`, borderRadius:20, padding:"2px 8px", fontSize:9, fontWeight:700, color:accent }}>{catInfo.ic} {catInfo.label}</span>
              )}
              <span style={{ fontSize:10, color:"#4a7090" }}>🕒 {timeAgo(msg.created_at)}</span>
            </div>
          </div>
        </div>

        {isOwn && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"8px 12px", borderRadius:10, background: expired?"rgba(255,34,85,.1)":"rgba(0,212,120,.08)", border:`1px solid ${expired?"rgba(255,34,85,.3)":accent+"33"}` }}>
            <span style={{ fontSize:11, fontWeight:700, color: expired?"#ff2255":accent }}>
              {expired ? "🔴 Expirée" : `🟢 Active — ${timeLeft(msg.created_at)}`}
            </span>
          </div>
        )}

        {/* ── Média (photo/vidéo) — si présent ── */}
        {!editing && hasMedia && (
          <div style={{ borderRadius:14, overflow:"hidden", marginBottom:14, background:"#000" }}>
            {msg.media_type === "video" && msg.video_url ? (
              <video src={msg.video_url} poster={msg.thumbnail_url||undefined} controls playsInline style={{ width:"100%", maxHeight:280, display:"block" }}/>
            ) : (
              <img src={msg.image_url} alt="story" style={{ width:"100%", maxHeight:280, objectFit:"cover", display:"block" }}/>
            )}
          </div>
        )}

        {editing ? (
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
              {FORUM_CATEGORIES.slice(1).map(c => (
                <div key={c.id} onClick={() => setEditCat(c.id)} style={{
                  background: editCat===c.id ? `${accent}25` : T.c3,
                  border: `1px solid ${editCat===c.id ? accent : T.border}`,
                  borderRadius:20, padding:"4px 10px", cursor:"pointer",
                  fontSize:11, fontWeight:700, color: editCat===c.id ? accent : T.sub2,
                }}>
                  {c.ic} {c.label}
                </div>
              ))}
            </div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              maxLength={MAX_MSG_LEN}
              style={{ width:"100%", height:100, padding:"11px 14px", background:T.c3, border:`1px solid ${T.border}`, borderRadius:11, color:T.text, fontFamily:"inherit", fontSize:13, outline:"none", resize:"none" }}
            />
            <div style={{ textAlign:"right", fontSize:10, marginTop:4, color: editText.length>=MAX_MSG_LEN ? "#ff2255" : editText.length>MAX_MSG_LEN-50 ? "#f0b020" : T.sub }}>
              {editText.length}/{MAX_MSG_LEN}
            </div>

            {hasMedia && !showCapture && !pendingMedia && (
              <button onClick={() => setShowCapture(true)} style={{ width:"100%", marginTop:8, padding:"9px", borderRadius:10, border:`1px solid ${T.border}`, background:T.c2, color:T.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11 }}>
                🔄 Remplacer le média
              </button>
            )}
            {showCapture && (
              <div style={{ marginTop:8 }}>
                <CameraCapture theme={T} accent={accent} allowVideo={true} maxVideoSec={15}
                  onDone={(result) => { setPendingMedia(result); setShowCapture(false); }}
                  onCancel={() => setShowCapture(false)}
                />
              </div>
            )}
            {pendingMedia && (
              <div style={{ marginTop:8, fontSize:11, color:accent, fontWeight:700 }}>
                ✅ Nouveau {pendingMedia.type === "video" ? "vidéo" : "photo"} prêt — sera envoyé à l'enregistrement.
              </div>
            )}

            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <button onClick={() => { setEditing(false); setEditText(msg.message||""); setEditCat(msg.categorie||"all"); setPendingMedia(null); }}
                style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#4a7090", fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                Annuler
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background: saving ? T.c3 : accent, color: saving ? T.sub : "#000", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor: saving?"not-allowed":"pointer" }}>
                {saving ? "⏳…" : "💾 Enregistrer"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ background:T.c3, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#4a7090", marginBottom:8 }}>📢 Annonce complète</div>
              <div style={{ fontSize:14, lineHeight:1.75, color:"#dff0ff", whiteSpace:"pre-wrap" }}>{msg.message}</div>
            </div>
            {!isOwn && <div style={{ fontSize:11, color:"#4a7090", textAlign:"center", marginBottom:16 }}>⏱ {timeLeft(msg.created_at)}</div>}

            {!isOwn ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {phone ? (
                  <>
                    <a href={`tel:${phone}`} style={{ textDecoration:"none" }}>
                      <button style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${accent},#00bfcc)`, color:"#000", fontFamily:"inherit", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 6px 20px ${accent}44` }}>
                        📞 Appeler {msg.user_name?.split(" ")[0]||""}
                      </button>
                    </a>
                    <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${msg.user_name||""}👋\n\nJ'ai vu votre annonce sur VierAfrik :\n"${(msg.message||"").slice(0,120)}"\n\nJe suis intéressé(e), pouvons-nous discuter ?`)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                      <button style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:"#25D366", color:"#fff", fontFamily:"inherit", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 20px rgba(37,211,102,.4)" }}>
                        💬 WhatsApp {msg.user_name?.split(" ")[0]||""}
                      </button>
                    </a>
                  </>
                ) : (
                  <div style={{ background:"rgba(240,176,32,.08)", border:"1px solid rgba(240,176,32,.22)", borderRadius:12, padding:"12px 14px", fontSize:12, color:"#f0b020", textAlign:"center", lineHeight:1.6 }}>
                    ℹ️ Numéro non renseigné — ce commerçant n'a pas ajouté son téléphone à son profil.
                  </div>
                )}
                <button onClick={onClose} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#4a7090", fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>Fermer</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button onClick={() => setEditing(true)} style={{ width:"100%", padding:"11px", borderRadius:12, border:`1px solid ${accent}44`, background:`${accent}12`, color:accent, fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  ✏️ Modifier
                </button>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { onDelete(msg.id); onClose(); }} style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,34,85,.3)", background:"rgba(255,34,85,.1)", color:"#ff2255", fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }}>🗑️ Supprimer</button>
                  <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"#4a7090", fontFamily:"inherit", fontWeight:600, fontSize:13, cursor:"pointer" }}>Fermer</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
