// ══════════════════════════════════════════════════════════════
//  ✨ Contenu de démonstration — Réseau visuel
// ──────────────────────────────────────────────────────────────
//  Ces profils ne sont JAMAIS écrits en base de données : ils sont
//  injectés côté client uniquement, dans NetworkFeed, pour que le
//  Réseau ne paraisse jamais vide à un nouvel utilisateur.
//
//  Règles de sécurité (voir FeedCard.jsx) :
//  - is_demo:true sur chaque entrée → badge "✨ Exemple" visible,
//    tous les boutons d'action réels (appel/WhatsApp/MM/client/
//    facture) sont désactivés et remplacés par un message explicatif.
//  - phone:null → aucun numéro, réel ou fictif, ne peut jamais être
//    composé/contacté par erreur.
//  - jamais comptées comme activité réelle : aucune ligne Supabase,
//    donc aucune fuite possible dans les analytics ou la facturation.
//  - disparaissent automatiquement dès que le réseau réel dépasse
//    DEMO_VISIBLE_THRESHOLD profils visibles.
// ══════════════════════════════════════════════════════════════

export const DEMO_VISIBLE_THRESHOLD = 8;

export const DEMO_NETWORK_POSTS = [
  {
    id: "demo-mecanicien", is_demo: true, phone: null,
    nom: "Ibrahim Koné", business: "Garage Koné & Fils",
    activite: "Mécanicien auto — pannes, vidange, diagnostic",
    category: "reparation", pays: "CI", ville: "Abidjan", rating: 5,
  },
  {
    id: "demo-coiffeuse", is_demo: true, phone: null,
    nom: "Adjoa Mensah", business: "Adjoa Beauté",
    activite: "Coiffeuse — tresses, tissages, soins capillaires",
    category: "beaute", pays: "GH", ville: "Accra", rating: 5,
  },
  {
    id: "demo-restaurant", is_demo: true, phone: null,
    nom: "Fatoumata Cissé", business: "Chez Fatou",
    activite: "Restauratrice — plats traditionnels, livraison midi",
    category: "resto", pays: "SN", ville: "Dakar", rating: 4,
  },
  {
    id: "demo-photographe", is_demo: true, phone: null,
    nom: "Chidi Okafor", business: "Chidi Lens Studio",
    activite: "Photographe — mariages, portraits, évènements",
    category: "services", pays: "NG", ville: "Lagos", rating: 5,
  },
  {
    id: "demo-livraison", is_demo: true, phone: null,
    nom: "Moussa Traoré", business: "Rapido Livraison",
    activite: "Livreur — colis et repas, moto rapide",
    category: "transport", pays: "ML", ville: "Bamako", rating: 4,
  },
  {
    id: "demo-electricien", is_demo: true, phone: null,
    nom: "Kwame Boateng", business: "Boateng Électricité",
    activite: "Électricien — installation, dépannage domicile",
    category: "reparation", pays: "GH", ville: "Kumasi", rating: 5,
  },
  {
    id: "demo-batiment", is_demo: true, phone: null,
    nom: "Yaya Diallo", business: "Diallo BTP",
    activite: "Entreprise de construction — gros œuvre, rénovation",
    category: "batiment", pays: "SN", ville: "Thiès", rating: 4,
  },
  {
    id: "demo-menage", is_demo: true, phone: null,
    nom: "Aïcha Ouédraogo", business: "Aïcha Ménage Pro",
    activite: "Service de nettoyage — maisons et bureaux",
    category: "services", pays: "BF", ville: "Ouagadougou", rating: 5,
  },
  {
    id: "demo-mode", is_demo: true, phone: null,
    nom: "Zainab Bello", business: "Bello Couture",
    activite: "Créatrice de mode — tenues sur-mesure, wax",
    category: "business", pays: "TG", ville: "Lomé", rating: 5,
  },
];
