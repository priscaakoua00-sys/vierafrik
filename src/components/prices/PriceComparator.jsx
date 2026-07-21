import { useState, useEffect, useMemo } from "react";
import { COUNTRIES, getCitiesForCountry, countryLabel } from "../../data/locations.js";
import { PRICE_CATEGORIES, PRICE_UNITS } from "../../data/priceCategories.js";
import { DEMO_PRICE_COMPARISONS, DEMO_VISIBLE_THRESHOLD } from "../../data/demoPriceComparisons.js";

const T = {
  bg: "#010306", c1: "#05090f", c2: "#08111d", c3: "#0d1828",
  border: "rgba(0,210,120,0.08)",
  gr: "#00d478", teal: "#00bfcc", blue: "#1a78ff", gold: "#f0b020",
  red: "#ff2255", text: "#dff0ff", sub: "#4a7090", sub2: "#80a8c8", ink: "#000",
};

// Devise usuelle par pays, pré-remplie mais modifiable dans le formulaire.
const COUNTRY_CURRENCY = {
  CI:"XOF", SN:"XOF", ML:"XOF", BF:"XOF", TG:"XOF", BJ:"XOF", NE:"XOF", GW:"XOF",
  CM:"XAF", GA:"XAF", CG:"XAF", TD:"XAF", CF:"XAF", GQ:"XAF",
  GH:"GHS", NG:"NGN", GN:"GNF", GM:"GMD", SL:"SLE", LR:"LRD",
  MA:"MAD", TN:"TND", DZ:"DZD", EG:"EGP",
  KE:"KES", TZ:"TZS", UG:"UGX", RW:"RWF", ET:"ETB",
  ZA:"ZAR", ZM:"ZMW", ZW:"ZWL", MZ:"MZN",
};
const currencyForCountry = (code) => COUNTRY_CURRENCY[code] || "XOF";

const fmtAmount = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

export default function PriceComparator({ user, accent = T.gr, toast, getSupa }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_name:"", category:"alimentation", unit:"unité", country:"CI", city:"", price:"", note:"" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supa = await getSupa();
        const { data, error } = await supa.from("price_comparisons").select("*").order("created_at", { ascending:false });
        if (!cancelled && !error && data) setRows(data);
      } catch (_) {
        // Silencieux : le comparateur reste utilisable avec les exemples le temps que la connexion revienne.
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [getSupa]);

  const allRows = useMemo(() => {
    const demo = rows.length < DEMO_VISIBLE_THRESHOLD ? DEMO_PRICE_COMPARISONS : [];
    return [...rows, ...demo];
  }, [rows]);

  const filtered = useMemo(() => {
    return allRows.filter(r => {
      if (category && r.category !== category) return false;
      if (country && r.country !== country) return false;
      if (search && !normalize(r.product_name).includes(normalize(search))) return false;
      return true;
    });
  }, [allRows, category, country, search]);

  const groups = useMemo(() => {
    const byName = new Map();
    for (const r of filtered) {
      const key = normalize(r.product_name);
      if (!byName.has(key)) byName.set(key, { name: r.product_name, unit: r.unit, category: r.category, entries: [] });
      byName.get(key).entries.push(r);
    }
    return Array.from(byName.values())
      .map(g => ({ ...g, entries: g.entries.sort((a,b) => a.price - b.price) }))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const submitPrice = async () => {
    if (!form.product_name.trim()) { toast?.("⚠️ Indiquez le nom du produit ou du service", "err"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast?.("⚠️ Indiquez un prix valide", "err"); return; }
    setSaving(true);
    try {
      const supa = await getSupa();
      const entry = {
        product_name: form.product_name.trim(),
        category: form.category,
        unit: form.unit,
        country: form.country,
        city: form.city || null,
        price: parseFloat(form.price),
        currency: currencyForCountry(form.country),
        submitted_by: user.id,
        note: form.note.trim() || null,
      };
      const { data, error } = await supa.from("price_comparisons").insert(entry).select().maybeSingle();
      if (error) { toast?.("❌ Erreur d'enregistrement. Réessayez.", "err"); setSaving(false); return; }
      setRows(prev => [data, ...prev]);
      setForm({ product_name:"", category:"alimentation", unit:"unité", country:"CI", city:"", price:"", note:"" });
      setShowForm(false);
      toast?.("✅ Prix ajouté, merci pour votre contribution !", "ok", accent);
    } catch (_) {
      toast?.("❌ Erreur réseau. Réessayez.", "err");
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ fontWeight:900, fontSize:20, marginBottom:3 }}>💱 Comparateur de prix Afrique</div>
      <div style={{ fontSize:11, color:T.sub2, marginBottom:14 }}>Comparez le prix des produits et services entre pays africains, alimenté par la communauté VierAfrik</div>

      {/* Filtres */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:11 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un produit..."
          style={{ flex:"1 1 180px", background:T.c1, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 12px", color:T.text, fontSize:12, fontFamily:"inherit" }}/>
        <select value={country} onChange={e=>setCountry(e.target.value)}
          style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 10px", color:T.text, fontSize:12, fontFamily:"inherit" }}>
          <option value="">Tous les pays</option>
          {COUNTRIES.filter(c => Object.keys(COUNTRY_CURRENCY).includes(c.code)).map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <button onClick={()=>setShowForm(true)} style={{
          background:`linear-gradient(135deg,${accent},${T.teal})`, color:T.ink, border:"none", borderRadius:10,
          padding:"9px 16px", fontFamily:"inherit", fontWeight:800, fontSize:12, cursor:"pointer", whiteSpace:"nowrap",
        }}>+ Ajouter un prix</button>
      </div>

      {/* Catégories */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        <button onClick={()=>setCategory("")} style={{
          background: category===""?`${accent}18`:T.c1, color: category===""?accent:T.sub2,
          border:`1px solid ${category===""?accent+"55":T.border}`, borderRadius:20, padding:"5px 12px",
          fontFamily:"inherit", fontWeight:700, fontSize:11, cursor:"pointer",
        }}>Toutes</button>
        {PRICE_CATEGORIES.map(c => (
          <button key={c.id} onClick={()=>setCategory(c.id)} style={{
            background: category===c.id?`${accent}18`:T.c1, color: category===c.id?accent:T.sub2,
            border:`1px solid ${category===c.id?accent+"55":T.border}`, borderRadius:20, padding:"5px 12px",
            fontFamily:"inherit", fontWeight:700, fontSize:11, cursor:"pointer",
          }}>{c.emoji} {c.label}</button>
        ))}
      </div>

      {/* Liste groupée par produit */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"2rem", color:T.sub, fontSize:12 }}>⏳ Chargement…</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem 1.5rem", background:T.c1, border:`1px solid ${T.border}`, borderRadius:20 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>💱</div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>Aucun prix pour ces filtres</div>
          <div style={{ fontSize:12, color:T.sub2, marginBottom:16, lineHeight:1.6 }}>Soyez la première personne à renseigner un prix pour cette catégorie ou ce pays.</div>
          <button onClick={()=>setShowForm(true)} style={{
            background:`linear-gradient(135deg,${accent},${T.teal})`, color:T.ink, border:"none", borderRadius:12,
            padding:"11px 20px", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor:"pointer",
          }}>+ Ajouter un prix</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {groups.map(g => {
            const min = g.entries[0];
            const max = g.entries[g.entries.length - 1];
            const cat = PRICE_CATEGORIES.find(c => c.id === g.category);
            return (
              <div key={g.name} style={{ background:T.c1, border:`1px solid ${T.border}`, borderRadius:16, padding:"1rem 1.1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:8 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14 }}>{cat?.emoji} {g.name}</div>
                    <div style={{ fontSize:10.5, color:T.sub, marginTop:2 }}>Prix au {g.unit} · {g.entries.length} contribution{g.entries.length>1?"s":""}</div>
                  </div>
                  {g.entries.length > 1 && max.price > min.price && (
                    <div style={{ fontSize:10, fontWeight:700, color:T.gold, background:`${T.gold}12`, borderRadius:20, padding:"3px 10px", whiteSpace:"nowrap" }}>
                      écart {Math.round((max.price/min.price - 1) * 100)}%
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {g.entries.map((e, i) => (
                    <div key={e.id} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                      background:T.c2, borderRadius:10, padding:"8px 11px",
                      border: i===0 ? `1px solid ${T.gr}44` : `1px solid transparent`,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                        <span style={{ fontSize:13 }}>{countryLabel(e.country).split(" ")[0]}</span>
                        <span style={{ fontSize:11.5, color:T.text, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {e.city ? `${e.city}` : countryLabel(e.country).split(" ").slice(1).join(" ")}
                        </span>
                        {e.is_example && (
                          <span style={{ fontSize:8.5, fontWeight:800, color:T.sub, background:T.c3, borderRadius:20, padding:"2px 7px", flexShrink:0 }}>Exemple</span>
                        )}
                        {i===0 && g.entries.length>1 && !e.is_example && (
                          <span style={{ fontSize:8.5, fontWeight:800, color:T.gr, background:`${T.gr}14`, borderRadius:20, padding:"2px 7px", flexShrink:0 }}>Moins cher</span>
                        )}
                      </div>
                      <div style={{ fontWeight:800, fontSize:12.5, color:T.text, flexShrink:0 }}>
                        {fmtAmount(e.price)} <span style={{ fontSize:9.5, color:T.sub, fontWeight:600 }}>{e.currency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div onClick={()=>setShowForm(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:T.c1, border:`1px solid ${T.border}`, borderTopLeftRadius:24, borderTopRightRadius:24,
            padding:"1.4rem 1.3rem 1.8rem", width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto",
          }}>
            <div style={{ fontWeight:900, fontSize:16, marginBottom:14 }}>+ Ajouter un prix</div>

            <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Produit ou service</label>
            <input value={form.product_name} onChange={e=>setForm(p=>({...p, product_name:e.target.value}))} placeholder="Ex : Sac de riz 50kg"
              style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:13, fontFamily:"inherit", margin:"6px 0 14px" }}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Catégorie</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p, category:e.target.value}))}
                  style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:12.5, fontFamily:"inherit", marginTop:6 }}>
                  {PRICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Unité</label>
                <select value={form.unit} onChange={e=>setForm(p=>({...p, unit:e.target.value}))}
                  style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:12.5, fontFamily:"inherit", marginTop:6 }}>
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Pays</label>
                <select value={form.country} onChange={e=>setForm(p=>({...p, country:e.target.value, city:""}))}
                  style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:12.5, fontFamily:"inherit", marginTop:6 }}>
                  {COUNTRIES.filter(c => Object.keys(COUNTRY_CURRENCY).includes(c.code)).map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Ville (optionnel)</label>
                <select value={form.city} onChange={e=>setForm(p=>({...p, city:e.target.value}))}
                  style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:12.5, fontFamily:"inherit", marginTop:6 }}>
                  <option value="">Toute ville</option>
                  {getCitiesForCountry(form.country).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Prix ({currencyForCountry(form.country)})</label>
            <input type="number" min="0" value={form.price} onChange={e=>setForm(p=>({...p, price:e.target.value}))} placeholder="0"
              style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:13, fontFamily:"inherit", margin:"6px 0 14px" }}/>

            <label style={{ fontSize:10.5, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".05em" }}>Note (optionnel)</label>
            <input value={form.note} onChange={e=>setForm(p=>({...p, note:e.target.value}))} placeholder="Ex : prix marché, prix boutique..."
              style={{ width:"100%", background:T.c2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:13, fontFamily:"inherit", margin:"6px 0 18px" }}/>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1, background:T.c3, color:T.text, border:"none", borderRadius:12, padding:"12px", fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }}>Annuler</button>
              <button onClick={submitPrice} disabled={saving} style={{
                flex:2, background:`linear-gradient(135deg,${accent},${T.teal})`, color:T.ink, border:"none", borderRadius:12,
                padding:"12px", fontFamily:"inherit", fontWeight:800, fontSize:13, cursor:saving?"default":"pointer", opacity:saving?.7:1,
              }}>{saving ? "Enregistrement…" : "Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
