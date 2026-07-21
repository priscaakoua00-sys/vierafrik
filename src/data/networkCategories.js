// Catégories du "Réseau visuel" (profils commerçants, table commercants_profils)
export const FEED_CATEGORIES = [
  { id:"",           label:"Tous",          emoji:"🌍" },
  { id:"services",   label:"Services",      emoji:"🧹" },
  { id:"resto",      label:"Restauration",  emoji:"🍽️" },
  { id:"beaute",     label:"Beauté",        emoji:"💅" },
  { id:"transport",  label:"Transport",     emoji:"🚛" },
  { id:"reparation", label:"Réparation",    emoji:"🔧" },
  { id:"batiment",   label:"Bâtiment",      emoji:"🏗️" },
  { id:"sante",      label:"Santé",         emoji:"🏥" },
  { id:"business",   label:"Business",      emoji:"💼" },
];

// Images de fallback par catégorie (Unsplash), utilisées quand un profil n'a pas de photo
export const FEED_CATEGORY_IMAGES = {
  services:   "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=75",
  resto:      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=75",
  beaute:     "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=75",
  transport:  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=75",
  reparation: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=75",
  batiment:   "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=75",
  sante:      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=75",
  business:   "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=75",
  default:    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=75",
};

// Catégories du "Forum annonces" (messages courts 24h, table reseau_messages)
export const FORUM_CATEGORIES = [
  { id:"all",     label:"Tous",    ic:"💬" },
  { id:"travail", label:"Travail", ic:"👷" },
  { id:"vente",   label:"Vente",   ic:"🛒" },
  { id:"service", label:"Service", ic:"🔧" },
  { id:"info",    label:"Info",    ic:"📢" },
];
