import { useState, useEffect } from "react";
import { COUNTRIES, getCitiesForCountry, OTHER_CITY } from "../data/locations.js";

// ══════════════════════════════════════════════════════════════
//  📍 LocationPicker, sélecteur pays → ville réutilisable
//  Parcours : 1) choisir le pays  2) choisir la ville
//             3) si absente : "Autre ville / village" → texte libre
// ──────────────────────────────────────────────────────────────
//  Props:
//    countryCode , code ISO courant ("CI") ou "" si non défini
//    city        , nom de ville courant (texte brut)
//    onChange    , ({countryCode, city}) => void
//    theme       , objet couleurs (c3, border, text, sub, sub2), optionnel
//    labels      , {country, city, other}, optionnel (i18n)
//    required    , bool, ajoute une option vide "Sélectionner…"
// ══════════════════════════════════════════════════════════════
export default function LocationPicker({
  countryCode = "",
  city = "",
  onChange,
  theme,
  labels,
  required = false,
}) {
  const T = theme || { c3:"#0d1828", border:"rgba(0,210,120,0.08)", text:"#dff0ff", sub:"#4a7090", sub2:"#80a8c8", gr:"#00d478" };
  const L = { country:"Pays", city:"Ville", other:"Autre ville / village", ...labels };

  const cities = getCitiesForCountry(countryCode);
  const isKnownCity = city && cities.includes(city);
  const [showOther, setShowOther] = useState(city && !isKnownCity ? true : false);

  // Si le pays change et que la ville active n'existe plus dans la nouvelle liste, on réinitialise.
  useEffect(() => {
    if (city && !cities.includes(city) && city !== "" && !showOther) {
      // ville héritée d'un autre pays, on laisse l'utilisateur re-choisir
    }
  }, [countryCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectStyle = {
    width:"100%", padding:"11px 14px", background:T.c3,
    border:`1px solid ${T.border}`, borderRadius:11, color:T.text,
    fontFamily:"inherit", fontSize:13, outline:"none", marginTop:5,
  };
  const labelStyle = { fontSize:11, fontWeight:700, color:T.sub2, textTransform:"uppercase", letterSpacing:".04em" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div>
        <div style={labelStyle}>{L.country}</div>
        <select
          style={selectStyle}
          value={countryCode}
          onChange={(ev) => {
            const next = ev.target.value;
            setShowOther(false);
            onChange?.({ countryCode: next, city: "" });
          }}
        >
          {required && <option value="">Sélectionner un pays…</option>}
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
      </div>

      {countryCode && (
        <div>
          <div style={labelStyle}>{L.city}</div>
          {!showOther ? (
            <select
              style={selectStyle}
              value={isKnownCity ? city : ""}
              onChange={(ev) => {
                if (ev.target.value === OTHER_CITY) { setShowOther(true); onChange?.({ countryCode, city:"" }); return; }
                onChange?.({ countryCode, city: ev.target.value });
              }}
            >
              <option value="">Sélectionner une ville…</option>
              {cities.map((v) => <option key={v} value={v}>{v}</option>)}
              <option value={OTHER_CITY}>✏️ {L.other}</option>
            </select>
          ) : (
            <div style={{ display:"flex", gap:7 }}>
              <input
                style={{ ...selectStyle, flex:1 }}
                placeholder={L.other}
                value={city}
                onChange={(ev) => onChange?.({ countryCode, city: ev.target.value })}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setShowOther(false); onChange?.({ countryCode, city:"" }); }}
                style={{ marginTop:5, padding:"0 12px", borderRadius:11, border:`1px solid ${T.border}`, background:"transparent", color:T.sub2, cursor:"pointer", fontSize:12 }}
                title="Choisir dans la liste"
              >↩</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
