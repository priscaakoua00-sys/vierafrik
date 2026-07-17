// ══════════════════════════════════════════════════════════════
//  📚 Coach VierAfrik — catégories et leçons
// ──────────────────────────────────────────────────────────────
//  Toutes les leçons sont actuellement type:"text" — aucune ne
//  prétend être une vidéo tant qu'aucune URL réelle n'existe.
//  Le jour où une vraie vidéo est disponible, passer son type à
//  "video" et renseigner `url` : le composant s'adapte seul.
// ══════════════════════════════════════════════════════════════

export const COACH_CATEGORIES = [
  { id:"ventes",       label:"Ventes",       icon:"💰", col:"#00d478" },
  { id:"clients",      label:"Clients",      icon:"📢", col:"#1a78ff" },
  { id:"finances",     label:"Finances",     icon:"🧮", col:"#00bfcc" },
  { id:"mobilemoney",  label:"Mobile Money", icon:"📱", col:"#ff5a18" },
  { id:"croissance",   label:"Croissance",   icon:"🚀", col:"#f0b020" },
];

// La leçon "welcome" est affichée à part (grande carte d'intro), pas dans les catégories.
export const WELCOME_LESSON = {
  id:"welcome", type:"text", category:null, icon:"👋",
  label:"Bienvenue",
  script:"Bonjour 👋 bienvenue sur VierAfrik.\nJe vais te montrer comment gagner de l'argent ici.",
  action:{ label:"⚡ Démarrer", page:"action" },
};

export const COACH_LESSONS = [
  {
    id:"earn", type:"text", category:"ventes", icon:"💰",
    label:"Gagner de l'argent",
    script:"Tu veux gagner de l'argent ?\nPublie ton service dans Action Rapide.\nRéponds vite aux clients.\nEt ajoute-les dans ton espace pour bien t'organiser.",
    action:{ label:"⚡ Action Rapide", page:"action" },
  },
  {
    id:"clients", type:"text", category:"clients", icon:"📢",
    label:"Trouver des clients",
    script:"Tu cherches des clients ?\nClique sur Action Rapide, choisis ton activité,\net contacte directement les personnes.\nRejoins aussi le Réseau pour être visible.",
    action:{ label:"🗺️ Voir le Réseau", page:"reseau" },
  },
  {
    id:"app", type:"text", category:"finances", icon:"🧾",
    label:"Suivre clients et factures",
    script:"Ajoute tes clients, crée tes factures,\net gère ton argent facilement ici.\nRelance tes factures en retard régulièrement — c'est souvent là que se cache l'argent qui te manque.",
    action:{ label:"👥 Mes clients", page:"cli" },
  },
  {
    id:"mobilemoney", type:"text", category:"mobilemoney", icon:"📱",
    label:"Encaisser via Mobile Money",
    script:"Tes clients peuvent te payer directement en Mobile Money.\nPartage ton QR code de paiement ou envoie le lien depuis une facture.\nL'argent arrive sans intermédiaire, en quelques minutes.",
    action:{ label:"📱 Mon QR paiement", page:"qr" },
  },
  {
    id:"margins", type:"text", category:"finances", icon:"🧮",
    label:"Comprendre ta marge et ton bénéfice réel",
    locked:true, minPlan:"pro",
    script:"Beaucoup d'entrepreneurs confondent chiffre d'affaires et bénéfice.\nCette leçon Pro t'explique comment calculer ta vraie marge, fixer le bon prix,\net repérer les dépenses qui grignotent ton bénéfice sans que tu le voies.",
    action:{ label:"📊 Voir mes statistiques", page:"stats" },
  },
  {
    id:"pro", type:"text", category:"croissance", icon:"⭐",
    label:"Devenir Pro",
    script:"Passe en mode Pro pour être plus visible\net gagner encore plus de clients.\nEmployés, Coach IA illimité, mise en avant dans le Réseau — tout est débloqué.",
    action:{ label:"💎 Voir les plans", page:"plans" },
  },
];

// ── Recommandation contextuelle — dérivée des données réelles de l'utilisateur ──
export function getRecommendedLessonId({ profit=0, overdueCount=0, activeClientsCount=0, sales=0 } = {}) {
  if (profit <= 0 && sales > 0) return "margins";
  if (overdueCount > 0) return "app";
  if (activeClientsCount === 0) return "clients";
  if (sales === 0) return "earn";
  return "mobilemoney";
}

const READING_WPM = 180;
export function estimateReadingTime(script) {
  const words = (script||"").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_WPM * 60));
}
