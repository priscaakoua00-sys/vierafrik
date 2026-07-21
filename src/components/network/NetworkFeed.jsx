import { useState, useEffect, useCallback } from "react";
import LocationPicker from "../LocationPicker.jsx";
import FeedCard from "./FeedCard.jsx";
import SkeletonCard from "./SkeletonCard.jsx";
import CameraCapture from "./CameraCapture.jsx";
import { useViewport } from "../../hooks/useMediaQuery.js";
import { COUNTRIES, getCitiesForCountry, normalizeLegacyCountry } from "../../data/locations.js";
import { FEED_CATEGORIES, FEED_CATEGORY_IMAGES } from "../../data/networkCategories.js";
import { DEMO_NETWORK_POSTS, DEMO_VISIBLE_THRESHOLD } from "../../data/demoNetworkPosts.js";
import { uploadNetworkMedia } from "../../utils/networkMedia.js";

// ══════════════════════════════════════════════════════════════
//  🗺️  Réseau visuel, feed de profils commerçants
//  (anciennement CommerçantsProches, extrait + refonte desktop)
//  "Je vois → je choisis → je contacte"
// ══════════════════════════════════════════════════════════════

// ── Carte "Mon profil", compacte, vit dans la sidebar en desktop ──
// Top-level (pas défini dans le corps de NetworkFeed) : sinon chaque
// changement d'état (filtre, note, etc.) redéclenche un render de
// NetworkFeed qui recréerait cette fonction à chaque fois → React la
// traite comme un composant différent et démonte/remonte tout son
// sous-arbre à chaque interaction (voir même bug corrigé dans NetworkForum).
const ProfileCard = ({ accent, Tc, myProfile, userName, onEdit }) => (
  <div style={{ background:`linear-gradient(135deg,${accent}12,${Tc.c1})`, border:`1px solid ${accent}33`, borderRadius:16, padding:"1.1rem" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:12, flexShrink:0, background:`linear-gradient(135deg,${accent},${Tc.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:Tc.ink }}>
        {(userName||myProfile?.nom||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontWeight:800, fontSize:12.5 }}>{myProfile ? "Profil visible" : "Pas encore visible"}</div>
        {myProfile ? (
          <div style={{ fontSize:11, color:Tc.sub2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{myProfile.activite}{myProfile.ville?` · ${myProfile.ville}`:""}</div>
        ) : (
          <div style={{ fontSize:11, color:Tc.sub2 }}>Sois vu par des milliers d'entrepreneurs</div>
        )}
      </div>
    </div>
    <button onClick={onEdit} style={{ marginTop:12, width:"100%", padding:"9px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${accent},${Tc.teal})`, color:Tc.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:12 }}>
      {myProfile ? "✏️ Modifier mon profil" : "➕ Rejoindre le réseau"}
    </button>
  </div>
);

// ── Filtres (catégorie + pays + ville) ──, layout vertical (sidebar desktop) ou horizontal (mobile)
const FiltersPanel = ({ accent, Tc, IS2, isDesktop, filterCat, setFilterCat, filterPays, setFilterPays, filterVille, setFilterVille }) => (
  <div style={{ background:Tc.c1, border:`1px solid ${Tc.border}`, borderRadius:16, padding:"1.1rem" }}>
    <div style={{ fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:Tc.sub, marginBottom:10 }}>Filtrer</div>
    <div style={{ display:"flex", flexDirection: isDesktop ? "column" : "row", flexWrap: isDesktop ? "nowrap" : "wrap", gap:7, marginBottom:12, overflowX: isDesktop ? "visible" : "auto", paddingBottom: isDesktop ? 0 : 4 }}>
      {FEED_CATEGORIES.map(c => (
        <button key={c.id} onClick={()=>setFilterCat(c.id)}
          style={{ flexShrink:0, textAlign:"left", padding:"7px 12px", borderRadius:10, border:`1px solid ${filterCat===c.id?accent:Tc.border}`, background:filterCat===c.id?`${accent}20`:Tc.c2, color:filterCat===c.id?accent:Tc.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:11.5, whiteSpace:"nowrap" }}>
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
    <div style={{ display:"grid", gap:8 }}>
      <select value={filterPays} onChange={e=>{setFilterPays(e.target.value);setFilterVille("");}} style={IS2}>
        <option value="">🌍 Tous les pays</option>
        {COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
      </select>
      <select value={filterVille} onChange={e=>setFilterVille(e.target.value)} style={IS2}>
        <option value="">📍 Toutes les villes</option>
        {(filterPays ? getCitiesForCountry(filterPays) : Array.from(new Set(COUNTRIES.flatMap(c=>c.cities))).sort()).map(v=><option key={v} value={v}>{v}</option>)}
      </select>
      {(filterCat||filterPays||filterVille) && (
        <button onClick={()=>{setFilterCat("");setFilterPays("");setFilterVille("");}}
          style={{ padding:"8px", borderRadius:10, border:`1px solid ${Tc.border}`, background:Tc.c2, color:Tc.sub2, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:600 }}>
          ✕ Réinitialiser les filtres
        </button>
      )}
    </div>
  </div>
);

const cardsGrid = { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16, alignItems:"stretch" };

const Feed = ({ Tc, accent, isDesktop, loading, visiblePosts, realPosts, ratingMap, ratePost, doCall, doWA, onAddClient, onCreateInvoice, onPayment, onEdit }) => (
  <>
    <div style={{ fontSize:12, color:Tc.sub, marginBottom:14, fontWeight:600 }}>
      {realPosts.length} commerçant{realPosts.length>1?"s":""} · Réseau VierAfrik
    </div>
    {loading ? (
      <div style={cardsGrid}>{Array.from({length: isDesktop?6:3}).map((_,k)=><SkeletonCard key={k} Tc={Tc}/>)}</div>
    ) : visiblePosts.length === 0 ? (
      <div style={{ textAlign:"center", padding:"3rem 1.5rem", background:Tc.c1, border:`1px solid ${Tc.border}`, borderRadius:20, maxWidth:440, margin:"0 auto" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🌍</div>
        <div style={{ fontWeight:800, fontSize:16, marginBottom:6 }}>Sois le premier !</div>
        <div style={{ fontSize:12, color:Tc.sub2, marginBottom:16, lineHeight:1.5 }}>
          Rejoins le réseau pour être visible par des milliers d'entrepreneurs africains.
        </div>
        <button onClick={onEdit}
          style={{ padding:"11px 22px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${accent},${Tc.teal})`, color:Tc.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:13 }}>
          ➕ Rejoindre le réseau
        </button>
      </div>
    ) : (
      <div style={cardsGrid}>
        {visiblePosts.map((c,i)=>(
          <FeedCard key={c.id||i} c={c} i={i} accent={accent} Tc={Tc} ratingMap={ratingMap} onRate={ratePost}
            doCall={doCall} doWA={doWA} onAddClient={onAddClient} onCreateInvoice={onCreateInvoice} onPayment={onPayment}
            CATS_VIS={FEED_CATEGORIES} CAT_IMG={FEED_CATEGORY_IMAGES}/>
        ))}
      </div>
    )}
  </>
);

export default function NetworkFeed({ user, supabase, accent="#00d478", toast, plan="free", onAddClient, onCreateInvoice, onPayment }) {

  const Tc = {
    c1:"#05090f",c2:"#08111d",c3:"#0d1828",c4:"#121f34",
    border:"rgba(0,210,120,0.08)",bhi:"rgba(0,210,120,0.22)",
    gr:"#00d478",teal:"#00bfcc",blue:"#1a78ff",gold:"#f0b020",
    orange:"#ff5a18",red:"#ff2255",purple:"#9060ff",
    text:"#dff0ff",sub:"#4a7090",sub2:"#80a8c8",ink:"#000",
  };

  const viewport = useViewport();
  const isDesktop = viewport === "desktop";

  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterCat,   setFilterCat]   = useState("");
  const [filterPays,  setFilterPays]  = useState("");
  const [filterVille, setFilterVille] = useState("");
  const [ratingMap,   setRatingMap]   = useState({});   // id → note locale
  const [myProfile,   setMyProfile]   = useState(null);
  const [editOpen,    setEditOpen]    = useState(false);
  const [editForm,    setEditForm]    = useState({ activite:"", ville:"", pays:normalizeLegacyCountry(user?.country)||"CI", visible:true, phone:"", image_url:"", category:"" });
  const [saving,      setSaving]      = useState(false);
  const [previewImg,  setPreviewImg]  = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const isBusiness = plan === "business";

  // ── Charger les profils ──
  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const s = await supabase();
      let q = s.from("commercants_profils").select("*").eq("visible", true).limit(80);
      if (filterCat)   q = q.eq("category", filterCat);
      if (filterPays)  q = q.eq("pays", filterPays);
      if (filterVille) q = q.eq("ville", filterVille);
      const { data } = await q;
      // Profils Business mis en avant en premier, puis les plus récents
      const sorted = (data||[]).slice().sort((a,b) => {
        const fa = a.plan==="business" ? 1 : 0, fb = b.plan==="business" ? 1 : 0;
        if (fa !== fb) return fb - fa;
        return new Date(b.created_at||0) - new Date(a.created_at||0);
      });
      setPosts(sorted);
      const moi = sorted.find(c => c.id === user?.id);
      if (moi) { setMyProfile(moi); setEditForm({ activite:moi.activite||"", ville:moi.ville||"", pays:normalizeLegacyCountry(moi.pays)||"CI", visible:moi.visible!==false, phone:moi.phone||"", image_url:moi.image_url||"", category:moi.category||"" }); }
    } catch(e) { setPosts([]); }
    finally { setLoading(false); }
  }, [filterCat, filterPays, filterVille]);

  useEffect(() => { load(); }, [filterCat, filterPays, filterVille]);

  // ── Sauvegarder profil ──
  const saveProfile = async () => {
    if (!editForm.activite.trim()) { toast?.("⚠️ Précisez votre activité","warn"); return; }
    setSaving(true);
    try {
      const s = await supabase();
      const row = {
        id:user?.id, nom:user?.name||"Commerçant", business:user?.business||"",
        activite:editForm.activite.trim(), ville:editForm.ville.trim(),
        pays:editForm.pays||normalizeLegacyCountry(user?.country)||"CI",
        visible:editForm.visible, phone:editForm.phone||"",
        image_url:previewImg||editForm.image_url||"", category:editForm.category||"",
        plan, is_verified: isBusiness,
      };
      if (myProfile) { await s.from("commercants_profils").update(row).eq("id",user?.id); }
      else           { await s.from("commercants_profils").insert(row); }
      setMyProfile(row); setEditOpen(false); await load();
      toast?.("✅ Profil visible dans le réseau !","ok");
    } catch(e) { toast?.("❌ Erreur sauvegarde","err"); }
    finally { setSaving(false); }
  };

  // ── Photo de profil, caméra intégrée (ou galerie) + envoi Storage ──
  // CameraCapture fournit déjà un blob compressé (photo seule ici, un
  // profil n'a pas besoin de vidéo) ; on l'envoie tel quel dans le bucket
  // "network-media" et on ne stocke que l'URL publique en base.
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const handleProfilePhoto = async (result) => {
    setShowPhotoCapture(false);
    setUploadingImg(true);
    try {
      const s = await supabase();
      const url = await uploadNetworkMedia(s, user?.id, result.blob, { folder:"profile", ext:"jpg", contentType:"image/jpeg" });
      setPreviewImg(url);
    } catch(err) {
      toast?.("❌ Envoi de la photo échoué, réessaie","err");
    } finally {
      setUploadingImg(false);
    }
  };

  // ── Noter ──
  const ratePost = (id, note) => {
    setRatingMap(m => ({...m, [id]:note}));
    toast?.(`⭐ Note ${note}/5 enregistrée !`,"ok");
  };

  // ── Actions contact ──
  const doCall = (phone) => { if (!phone) { toast?.("📞 Numéro non disponible","warn"); return; } window.open(`tel:${(phone||"").replace(/\D/g,"")}`, "_blank"); };
  const doWA   = (p, name, act) => { const ph=(p||"").replace(/\D/g,""); if (!ph) { toast?.("💬 Numéro non disponible","warn"); return; } window.open(`https://wa.me/${ph}?text=${encodeURIComponent(`Bonjour ${name||""} 👋 Je vous ai trouvé sur VierAfrik pour ${act||"votre activité"}. Êtes-vous disponible ?`)}`, "_blank"); };
  const demoBlocked = () => toast?.("✨ Ceci est un exemple pour t'inspirer, rejoins le réseau pour être visible et contacté !","ok",Tc.gold);

  const IS2 = { width:"100%", padding:"10px 14px", background:Tc.c3, border:`1px solid ${Tc.border}`, borderRadius:11, color:Tc.text, fontFamily:"inherit", fontSize:13, outline:"none", marginTop:4 };

  const realPosts = posts.filter(c=>c.id!==user?.id);
  const showDemo = realPosts.length < DEMO_VISIBLE_THRESHOLD;
  const demoPosts = showDemo ? DEMO_NETWORK_POSTS.map(d => ({...d, __onDemoBlocked:demoBlocked})) : [];
  const visiblePosts = [...realPosts, ...demoPosts];

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:Tc.text }}>
      {isDesktop ? (
        <div style={{ display:"flex", gap:24, alignItems:"flex-start" }}>
          <div style={{ width:280, flexShrink:0, position:"sticky", top:78, display:"flex", flexDirection:"column", gap:16 }}>
            <ProfileCard accent={accent} Tc={Tc} myProfile={myProfile} userName={user?.name} onEdit={()=>setEditOpen(true)}/>
            <FiltersPanel accent={accent} Tc={Tc} IS2={IS2} isDesktop={isDesktop} filterCat={filterCat} setFilterCat={setFilterCat} filterPays={filterPays} setFilterPays={setFilterPays} filterVille={filterVille} setFilterVille={setFilterVille}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <Feed Tc={Tc} accent={accent} isDesktop={isDesktop} loading={loading} visiblePosts={visiblePosts} realPosts={realPosts} ratingMap={ratingMap} ratePost={ratePost} doCall={doCall} doWA={doWA} onAddClient={onAddClient} onCreateInvoice={onCreateInvoice} onPayment={onPayment} onEdit={()=>setEditOpen(true)}/>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom:16 }}><ProfileCard accent={accent} Tc={Tc} myProfile={myProfile} userName={user?.name} onEdit={()=>setEditOpen(true)}/></div>
          <div style={{ marginBottom:16 }}><FiltersPanel accent={accent} Tc={Tc} IS2={IS2} isDesktop={isDesktop} filterCat={filterCat} setFilterCat={setFilterCat} filterPays={filterPays} setFilterPays={setFilterPays} filterVille={filterVille} setFilterVille={setFilterVille}/></div>
          <Feed Tc={Tc} accent={accent} isDesktop={isDesktop} loading={loading} visiblePosts={visiblePosts} realPosts={realPosts} ratingMap={ratingMap} ratePost={ratePost} doCall={doCall} doWA={doWA} onAddClient={onAddClient} onCreateInvoice={onCreateInvoice} onPayment={onPayment} onEdit={()=>setEditOpen(true)}/>
        </div>
      )}

      {/* ── ÉDITION PROFIL, dialogue centré (desktop) / bottom-sheet (mobile) ── */}
      {editOpen && (
        <div onClick={()=>setEditOpen(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.82)", zIndex:950,
          display:"flex", alignItems: isDesktop ? "center" : "flex-end", justifyContent:"center",
          backdropFilter:"blur(10px)", padding: isDesktop ? "2rem" : 0,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:`linear-gradient(160deg,${Tc.c1},${Tc.c2})`, border:`1px solid ${accent}33`,
            borderRadius: isDesktop ? 20 : "20px 20px 0 0", padding:"1.6rem",
            width: isDesktop ? 460 : "100%", maxWidth: isDesktop ? 460 : "100%",
            maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 20px 70px rgba(0,0,0,.85)",
            animation: isDesktop ? "pop .25s cubic-bezier(.34,1.56,.64,1)" : "slideUp .28s cubic-bezier(.34,1.56,.64,1)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontWeight:900, fontSize:16 }}>{myProfile ? "✏️ Modifier mon profil" : "➕ Rejoindre le réseau"}</div>
              <button onClick={()=>setEditOpen(false)} style={{ background:Tc.c3, border:`1px solid ${Tc.border}`, color:Tc.sub2, width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:13 }}>✕</button>
            </div>
            {/* Photo profil */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:Tc.sub, marginBottom:5 }}>📷 Photo de votre commerce</div>
              {showPhotoCapture ? (
                <CameraCapture
                  theme={Tc} accent={accent} allowVideo={false}
                  onDone={handleProfilePhoto}
                  onCancel={() => setShowPhotoCapture(false)}
                />
              ) : uploadingImg ? (
                <div style={{ width:"100%", height:150, borderRadius:14, border:`2px dashed ${accent}55`, background:Tc.c2, display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:accent, fontSize:12, fontWeight:600 }}>
                  ⏳ Envoi de la photo…
                </div>
              ) : (
                <div onClick={() => setShowPhotoCapture(true)} style={{ cursor:"pointer" }}>
                  {previewImg||editForm.image_url ? (
                    <img src={previewImg||editForm.image_url} alt="preview" style={{ width:"100%", height:150, objectFit:"cover", borderRadius:14, border:`2px solid ${accent}55` }}/>
                  ) : (
                    <div style={{ width:"100%", height:110, borderRadius:14, border:`2px dashed ${Tc.border}`, background:Tc.c2, display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:Tc.sub, fontSize:12, fontWeight:600 }}>
                      📷 Ajouter une photo
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:Tc.sub, display:"block", marginBottom:2 }}>Activité *</label>
              <input style={IS2} placeholder="Coiffure, Épicerie…" value={editForm.activite} onChange={e=>setEditForm(f=>({...f,activite:e.target.value}))}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:Tc.sub, display:"block", marginBottom:2 }}>Localisation</label>
              <LocationPicker theme={Tc} countryCode={editForm.pays} city={editForm.ville}
                onChange={({countryCode,city})=>setEditForm(f=>({...f,pays:countryCode,ville:city}))}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:Tc.sub, display:"block", marginBottom:2 }}>Catégorie</label>
                <select style={IS2} value={editForm.category} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}>
                  <option value="">Sélectionner…</option>
                  {FEED_CATEGORIES.filter(c=>c.id).map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", color:Tc.sub, display:"block", marginBottom:2 }}>Téléphone</label>
                <input type="tel" style={IS2} placeholder="+225 07 000 0000" value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div onClick={()=>setEditForm(f=>({...f,visible:!f.visible}))} style={{ width:38, height:22, borderRadius:11, cursor:"pointer", background:editForm.visible?accent:Tc.c3, border:`1px solid ${editForm.visible?accent:Tc.border}`, position:"relative", transition:"all .2s", flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:1, left:editForm.visible?18:2, transition:"left .2s" }}/>
              </div>
              <span style={{ fontSize:12, color:Tc.sub2 }}>{editForm.visible ? "Visible dans le réseau" : "Masqué"}</span>
            </div>
            <button onClick={saveProfile} disabled={saving||uploadingImg} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:(saving||uploadingImg)?Tc.c3:`linear-gradient(135deg,${accent},${Tc.teal})`, color:(saving||uploadingImg)?Tc.sub:Tc.ink, fontFamily:"inherit", fontWeight:900, fontSize:14, cursor:(saving||uploadingImg)?"not-allowed":"pointer", boxShadow:(saving||uploadingImg)?"none":`0 6px 20px ${accent}44` }}>
              {uploadingImg ? "⏳ Envoi de la photo…" : saving ? "⏳ Sauvegarde…" : myProfile ? "💾 Mettre à jour" : "✅ Rejoindre le réseau"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
