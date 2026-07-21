// ══════════════════════════════════════════════════════════════
//  💎 Configuration des plans, Free / Pro / Business
// ──────────────────────────────────────────────────────────────
//  Business n'est plus une simple copie de Pro : au-delà des
//  limites, il ajoute des avantages concrets, équipe illimitée
//  avec rôles, mise en avant + badge vérifié dans le Réseau,
//  statistiques avancées, support prioritaire.
// ══════════════════════════════════════════════════════════════

export const INF = Number.POSITIVE_INFINITY;

export const PLANS = {
  free: {
    label:"Free", emoji:"🌱", price:0, col:"#80a8c8",
    maxTx:10, maxCli:3, maxInv:2, maxEmp:1,
    pdf:false, wa:false, mm:false, ai:false,
    roles:false, featured:false, verified:false, advancedStats:false, prioritySupport:false,
  },
  pro: {
    label:"Pro", emoji:"⚡", price:4900, col:"#00d478",
    maxTx:INF, maxCli:INF, maxInv:INF, maxEmp:5,
    pdf:true, wa:true, mm:true, ai:true,
    roles:false, featured:false, verified:false, advancedStats:false, prioritySupport:false,
  },
  business: {
    label:"Business", emoji:"🏆", price:9900, col:"#f0b020",
    maxTx:INF, maxCli:INF, maxInv:INF, maxEmp:INF,
    pdf:true, wa:true, mm:true, ai:true,
    roles:true, featured:true, verified:true, advancedStats:true, prioritySupport:true,
  },
};

// ── Mode paiement ──
// Actif (aucun paiement réel déclenché) tant que VITE_PAYMENTS_TEST_MODE
// n'est pas explicitement défini à "false" côté build (Vercel env vars).
const _envFlag = (typeof globalThis !== "undefined" && globalThis.__VITE_ENV__?.VITE_PAYMENTS_TEST_MODE)
  || (typeof window !== "undefined" && window.__ENV__?.VITE_PAYMENTS_TEST_MODE)
  || "";
export const TEST_MODE = String(_envFlag).toLowerCase() !== "false";

// ── Essai gratuit à l'inscription ──
export const TRIAL_DAYS = 14;
export const TRIAL_PLAN = "pro";

export const ROLE_LABELS = ["Propriétaire", "Manager", "Employé"];
