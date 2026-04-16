// ════════════════════════════════════════════════════════
//  /api/coach.js — Coach VierAfrik · Vercel Serverless
//  Proxy sécurisé vers l'API Anthropic (Claude)
//
//  Clé requise dans Vercel Environment Variables :
//    ANTHROPIC_API_KEY = sk-ant-...
//
//  Appelé par le frontend via : POST /api/coach
//  Body attendu :
//    { message: string, userData: { sales, expenses, profit,
//      clients, invoices, goal, gPct, name, business } }
// ════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // ── 1. Méthode POST uniquement ──
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ── 2. Lecture du body ──
  const { message, userData = {}, history = [] } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message manquant ou invalide" });
  }

  // ── 3. Clé API Anthropic — jamais exposée au frontend ──
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    console.error("[coach] ANTHROPIC_API_KEY manquante dans les variables d'environnement");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  // ── 4. Construction du system prompt avec données utilisateur ──
  const {
    name       = "entrepreneur",
    business   = "mon business",
    sales      = 0,
    expenses   = 0,
    profit     = 0,
    clients    = 0,
    invoices   = 0,
    overdueInv = 0,
    goal       = 2500000,
    gPct       = 0,
    currency   = "FCFA",
  } = userData;

  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

  const systemPrompt = `Tu es le Coach VierAfrik, un mentor business chaleureux et direct pour entrepreneurs africains. Tu parles comme un ami de confiance qui s'y connaît vraiment en business. Tu es motivant, pragmatique, tu utilises des emojis avec modération (1-2 max par réponse). Tu réponds TOUJOURS en français, en 3-4 phrases courtes maximum. Jamais de longues listes. Jamais de blabla.

Voici les données actuelles de ${name} (business : ${business}) :
- Ventes ce mois : ${fmt(sales)} ${currency}
- Dépenses ce mois : ${fmt(expenses)} ${currency}
- Bénéfice ce mois : ${fmt(profit)} ${currency}
- Objectif mensuel : ${fmt(goal)} ${currency} (${gPct}% atteint)
- Clients actifs : ${clients}
- Factures totales : ${invoices}${overdueInv > 0 ? ` dont ${overdueInv} en retard` : ""}

Utilise ces données pour personnaliser tes réponses. Sois concis, humain et orienté action.`;

  // ── 5. Construction des messages (historique + nouveau message) ──
  // On garde les 10 derniers échanges max pour garder le contexte sans exploser les tokens
  const recentHistory = (Array.isArray(history) ? history : [])
    .slice(-10)
    .filter(m => m.role && m.content);

  const messages = [
    ...recentHistory,
    { role: "user", content: message.trim() },
  ];

  // ── 6. Appel API Anthropic ──
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[coach] Anthropic API error:", response.status, errBody);
      return res.status(502).json({ error: "Erreur API Anthropic", status: response.status });
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text?.trim();

    if (!reply) {
      console.error("[coach] Réponse vide d'Anthropic:", data);
      return res.status(502).json({ error: "Réponse vide du modèle" });
    }

    // ── 7. Retourner uniquement le texte ──
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("[coach] Exception réseau:", err);
    return res.status(500).json({ error: "Erreur réseau — réessayez" });
  }
}
