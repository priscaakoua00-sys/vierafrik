// ══════════════════════════════════════════════════════════════
//  📍 LOCATION DATA — source unique pays/villes pour toute l'app
// ──────────────────────────────────────────────────────────────
//  Règle de stockage : on stocke TOUJOURS le code ISO du pays
//  (ex: "CI") et le nom de ville en texte brut (ex: "Abidjan").
//  Le drapeau + nom affiché sont générés à l'affichage uniquement,
//  jamais stockés en base.
//
//  Pour ajouter un pays ou une ville : ajouter une entrée dans
//  COUNTRIES ci-dessous. Aucune autre modification nécessaire —
//  tous les sélecteurs (LocationPicker, filtres réseau, etc.)
//  lisent cette liste dynamiquement.
// ══════════════════════════════════════════════════════════════

export const OTHER_CITY = "__other__";

export const COUNTRIES = [
  // ── Afrique ──
  { code:"DZ", flag:"🇩🇿", name:"Algérie",                    cities:["Alger","Oran","Constantine","Annaba","Blida","Batna"] },
  { code:"AO", flag:"🇦🇴", name:"Angola",                     cities:["Luanda","Huambo","Lobito","Benguela","Lubango"] },
  { code:"BJ", flag:"🇧🇯", name:"Bénin",                      cities:["Cotonou","Porto-Novo","Parakou","Abomey-Calavi","Djougou"] },
  { code:"BW", flag:"🇧🇼", name:"Botswana",                   cities:["Gaborone","Francistown","Molepolole","Maun"] },
  { code:"BF", flag:"🇧🇫", name:"Burkina Faso",                cities:["Ouagadougou","Bobo-Dioulasso","Koudougou","Banfora"] },
  { code:"BI", flag:"🇧🇮", name:"Burundi",                    cities:["Bujumbura","Gitega","Ngozi","Muyinga"] },
  { code:"CV", flag:"🇨🇻", name:"Cap-Vert",                   cities:["Praia","Mindelo","Santa Maria"] },
  { code:"CM", flag:"🇨🇲", name:"Cameroun",                    cities:["Douala","Yaoundé","Garoua","Bamenda","Bafoussam","Maroua"] },
  { code:"CF", flag:"🇨🇫", name:"République centrafricaine",  cities:["Bangui","Bimbo","Berbérati"] },
  { code:"TD", flag:"🇹🇩", name:"Tchad",                      cities:["N'Djaména","Moundou","Sarh","Abéché"] },
  { code:"KM", flag:"🇰🇲", name:"Comores",                    cities:["Moroni","Mutsamudu","Fomboni"] },
  { code:"CG", flag:"🇨🇬", name:"Congo-Brazzaville",           cities:["Brazzaville","Pointe-Noire","Dolisie"] },
  { code:"CD", flag:"🇨🇩", name:"RD Congo",                   cities:["Kinshasa","Lubumbashi","Goma","Bukavu","Kisangani","Mbuji-Mayi"] },
  { code:"CI", flag:"🇨🇮", name:"Côte d'Ivoire",               cities:["Abidjan","Yamoussoukro","Bouaké","San-Pédro","Korhogo","Daloa"] },
  { code:"DJ", flag:"🇩🇯", name:"Djibouti",                   cities:["Djibouti","Ali Sabieh","Dikhil"] },
  { code:"EG", flag:"🇪🇬", name:"Égypte",                     cities:["Le Caire","Alexandrie","Gizeh","Louxor","Assouan"] },
  { code:"GQ", flag:"🇬🇶", name:"Guinée équatoriale",          cities:["Malabo","Bata"] },
  { code:"ER", flag:"🇪🇷", name:"Érythrée",                    cities:["Asmara","Keren","Massaoua"] },
  { code:"SZ", flag:"🇸🇿", name:"Eswatini",                   cities:["Mbabane","Manzini"] },
  { code:"ET", flag:"🇪🇹", name:"Éthiopie",                    cities:["Addis-Abeba","Dire Dawa","Bahir Dar","Mekele"] },
  { code:"GA", flag:"🇬🇦", name:"Gabon",                      cities:["Libreville","Port-Gentil","Franceville"] },
  { code:"GM", flag:"🇬🇲", name:"Gambie",                     cities:["Banjul","Serekunda","Brikama"] },
  { code:"GH", flag:"🇬🇭", name:"Ghana",                      cities:["Accra","Kumasi","Tamale","Takoradi","Sekondi"] },
  { code:"GN", flag:"🇬🇳", name:"Guinée",                     cities:["Conakry","Kankan","Labé","N'Zérékoré"] },
  { code:"GW", flag:"🇬🇼", name:"Guinée-Bissau",               cities:["Bissau","Bafatá"] },
  { code:"KE", flag:"🇰🇪", name:"Kenya",                      cities:["Nairobi","Mombasa","Kisumu","Nakuru"] },
  { code:"LS", flag:"🇱🇸", name:"Lesotho",                    cities:["Maseru","Teyateyaneng"] },
  { code:"LR", flag:"🇱🇷", name:"Liberia",                    cities:["Monrovia","Gbarnga","Buchanan"] },
  { code:"LY", flag:"🇱🇾", name:"Libye",                      cities:["Tripoli","Benghazi","Misrata"] },
  { code:"MG", flag:"🇲🇬", name:"Madagascar",                 cities:["Antananarivo","Toamasina","Antsirabe","Mahajanga"] },
  { code:"MW", flag:"🇲🇼", name:"Malawi",                     cities:["Lilongwe","Blantyre","Mzuzu"] },
  { code:"ML", flag:"🇲🇱", name:"Mali",                       cities:["Bamako","Sikasso","Mopti","Kayes"] },
  { code:"MR", flag:"🇲🇷", name:"Mauritanie",                  cities:["Nouakchott","Nouadhibou","Kaédi"] },
  { code:"MU", flag:"🇲🇺", name:"Maurice",                    cities:["Port-Louis","Curepipe","Vacoas"] },
  { code:"MA", flag:"🇲🇦", name:"Maroc",                      cities:["Casablanca","Rabat","Marrakech","Fès","Tanger","Agadir"] },
  { code:"MZ", flag:"🇲🇿", name:"Mozambique",                 cities:["Maputo","Beira","Nampula"] },
  { code:"NA", flag:"🇳🇦", name:"Namibie",                    cities:["Windhoek","Walvis Bay","Swakopmund"] },
  { code:"NE", flag:"🇳🇪", name:"Niger",                      cities:["Niamey","Zinder","Maradi"] },
  { code:"NG", flag:"🇳🇬", name:"Nigeria",                    cities:["Lagos","Abuja","Kano","Port Harcourt","Ibadan","Kaduna"] },
  { code:"RW", flag:"🇷🇼", name:"Rwanda",                     cities:["Kigali","Butare","Gisenyi"] },
  { code:"ST", flag:"🇸🇹", name:"São Tomé-et-Principe",        cities:["São Tomé","Santo António"] },
  { code:"SN", flag:"🇸🇳", name:"Sénégal",                    cities:["Dakar","Thiès","Saint-Louis","Touba","Ziguinchor"] },
  { code:"SC", flag:"🇸🇨", name:"Seychelles",                 cities:["Victoria"] },
  { code:"SL", flag:"🇸🇱", name:"Sierra Leone",                cities:["Freetown","Bo","Kenema"] },
  { code:"SO", flag:"🇸🇴", name:"Somalie",                    cities:["Mogadiscio","Hargeisa","Kismayo"] },
  { code:"ZA", flag:"🇿🇦", name:"Afrique du Sud",              cities:["Johannesburg","Le Cap","Pretoria","Durban"] },
  { code:"SS", flag:"🇸🇸", name:"Soudan du Sud",               cities:["Djouba","Wau"] },
  { code:"SD", flag:"🇸🇩", name:"Soudan",                     cities:["Khartoum","Omdurman","Port-Soudan"] },
  { code:"TZ", flag:"🇹🇿", name:"Tanzanie",                   cities:["Dar es Salaam","Dodoma","Mwanza","Zanzibar"] },
  { code:"TG", flag:"🇹🇬", name:"Togo",                       cities:["Lomé","Sokodé","Kara"] },
  { code:"TN", flag:"🇹🇳", name:"Tunisie",                    cities:["Tunis","Sfax","Sousse"] },
  { code:"UG", flag:"🇺🇬", name:"Ouganda",                     cities:["Kampala","Gulu","Mbarara"] },
  { code:"ZM", flag:"🇿🇲", name:"Zambie",                     cities:["Lusaka","Ndola","Kitwe"] },
  { code:"ZW", flag:"🇿🇼", name:"Zimbabwe",                    cities:["Harare","Bulawayo","Mutare"] },
  // ── Reste du monde (échantillon — architecture extensible) ──
  { code:"NL", flag:"🇳🇱", name:"Pays-Bas",                    cities:["Amsterdam","Rotterdam","Utrecht","Eindhoven","Breda","Roosendaal"] },
  { code:"FR", flag:"🇫🇷", name:"France",                     cities:["Paris","Marseille","Lyon","Toulouse","Lille"] },
  { code:"BE", flag:"🇧🇪", name:"Belgique",                    cities:["Bruxelles","Anvers","Liège"] },
  { code:"US", flag:"🇺🇸", name:"États-Unis",                  cities:["New York","Los Angeles","Houston","Chicago"] },
  { code:"GB", flag:"🇬🇧", name:"Royaume-Uni",                 cities:["Londres","Manchester","Birmingham"] },
  { code:"CA", flag:"🇨🇦", name:"Canada",                     cities:["Toronto","Montréal","Vancouver"] },
];

const BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));

export const getCountry = (code) => BY_CODE[code] || null;

export const getCitiesForCountry = (code) => BY_CODE[code]?.cities || [];

export const countryLabel = (code) => {
  const c = BY_CODE[code];
  return c ? `${c.flag} ${c.name}` : "";
};

// Anciens formats rencontrés en base avant l'unification :
// - chaîne complète "🇨🇮 Côte d'Ivoire" (ancienne liste PAYS, table clients)
// - code ISO déjà correct (commercants_profils, avis, reseau_messages)
const LEGACY_FULL_STRING = {
  "🇨🇮 Côte d'Ivoire":"CI", "🇸🇳 Sénégal":"SN", "🇬🇭 Ghana":"GH", "🇨🇲 Cameroun":"CM",
  "🇳🇬 Nigeria":"NG", "🇲🇱 Mali":"ML", "🇧🇫 Burkina Faso":"BF", "🇹🇬 Togo":"TG",
  "🇧🇯 Bénin":"BJ", "🇬🇳 Guinée":"GN",
};

// Normalise n'importe quelle valeur pays historique vers un code ISO,
// pour affichage sécurisé avant/pendant la migration des données.
export const normalizeLegacyCountry = (value) => {
  if (!value) return "";
  if (BY_CODE[value]) return value; // déjà un code ISO connu
  if (LEGACY_FULL_STRING[value]) return LEGACY_FULL_STRING[value];
  return "";
};
