// ══════════════════════════════════════════════════════════════
//  ✨ Contenu de démonstration — Comparateur de prix
// ──────────────────────────────────────────────────────────────
//  Comme pour le Réseau (voir demoNetworkPosts.js), ces exemples ne
//  sont JAMAIS écrits en base de données : ils sont injectés côté
//  client uniquement, pour que le comparateur ne paraisse jamais
//  vide au lancement, le temps que les premières contributions
//  réelles arrivent.
//
//  Règles de sécurité :
//  - is_example:true sur chaque entrée → badge "Exemple" visible et
//    non retirable, jamais confondu avec un prix réel vérifié.
//  - Ce sont des ordres de grandeur plausibles, pas des prix
//    vérifiés à une date donnée : ne jamais les présenter comme des
//    données de marché fiables.
//  - disparaissent automatiquement dès que le nombre de contributions
//    réelles pour un même produit dépasse DEMO_VISIBLE_THRESHOLD.
// ══════════════════════════════════════════════════════════════

export const DEMO_VISIBLE_THRESHOLD = 3;

export const DEMO_PRICE_COMPARISONS = [
  { id: "demo-riz-ci", is_example: true, product_name: "Riz importé", category: "alimentation", unit: "sac 50kg", country: "CI", city: "Abidjan", price: 22500, currency: "XOF" },
  { id: "demo-riz-sn", is_example: true, product_name: "Riz importé", category: "alimentation", unit: "sac 50kg", country: "SN", city: "Dakar", price: 21000, currency: "XOF" },
  { id: "demo-ciment-ci", is_example: true, product_name: "Ciment", category: "btp", unit: "sac 50kg", country: "CI", city: "Abidjan", price: 5200, currency: "XOF" },
  { id: "demo-ciment-cm", is_example: true, product_name: "Ciment", category: "btp", unit: "sac 50kg", country: "CM", city: "Douala", price: 5900, currency: "XOF" },
  { id: "demo-essence-ci", is_example: true, product_name: "Essence", category: "transport", unit: "litre", country: "CI", city: "Abidjan", price: 775, currency: "XOF" },
  { id: "demo-essence-tg", is_example: true, product_name: "Essence", category: "transport", unit: "litre", country: "TG", city: "Lomé", price: 750, currency: "XOF" },
  { id: "demo-smartphone-ml", is_example: true, product_name: "Smartphone entrée de gamme", category: "electronique", unit: "unité", country: "ML", city: "Bamako", price: 55000, currency: "XOF" },
  { id: "demo-pagne-bf", is_example: true, product_name: "Pagne wax (6 yards)", category: "habillement", unit: "unité", country: "BF", city: "Ouagadougou", price: 12000, currency: "XOF" },
];
