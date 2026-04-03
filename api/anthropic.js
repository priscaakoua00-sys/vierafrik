/**
 * /api/anthropic.js — Proxy serverless Vercel pour l'API Anthropic
 *
 * Pourquoi ce proxy ?
 * - L'API Anthropic ne peut pas être appelée directement depuis le navigateur
 *   (CORS bloqué + la clé API ne doit JAMAIS être exposée côté client)
 * - Ce fichier tourne sur Vercel (Node.js Edge Function)
 * - La clé ANTHROPIC_API_KEY est stockée dans les variables d'environnement Vercel
 *
 * Usage côté client :
 *   POST /api/anthropic
 *   Body : { model, max_tokens, messages, system? }
 *
 * Configuration Vercel :
 *   Dashboard → Settings → Environment Variables
 *   Ajouter : ANTHROPIC_API_KEY = sk-ant-...
 */

export const config = {
  // Augmenter le timeout max pour les réponses IA (défaut 10s trop court)
  maxDuration: 30,
};

export default async function handler(req, res) {
  // ── CORS — autoriser uniquement vierafrik.com (et localhost pour le dev) ──
  const allowedOrigins = [
    "https://vierafrik.com",
    "https://www.vierafrik.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Répondre aux pre-flight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Seules les requêtes POST sont acceptées
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Vérifier que la clé API est configurée ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[anthropic proxy] ANTHROPIC_API_KEY manquante dans les variables d'environnement Vercel");
    return res.status(500).json({
      error: "Configuration serveur manquante. Contactez l'administrateur.",
    });
  }

  // ── Extraire et valider le body ──
  const { model, max_tokens, messages, system } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Paramètre 'messages' manquant ou invalide" });
  }

  // Sécurité : limiter la taille des messages pour éviter l'abus
  const totalChars = JSON.stringify(messages).length;
  if (totalChars > 20000) {
    return res.status(400).json({ error: "Messages trop longs (max 20 000 caractères)" });
  }

  // ── Appel à l'API Anthropic ──
  try {
    const anthropicBody = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: Math.min(max_tokens || 500, 2000), // Plafonner à 2000 tokens
      messages,
    };
    // Ajouter le system prompt si fourni
    if (system) {
      anthropicBody.system = system;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    // Relayer la réponse exacte de l'API (succès ou erreur)
    const data = await response.json();

    if (!response.ok) {
      console.error("[anthropic proxy] Erreur API:", response.status, data);
      return res.status(response.status).json({
        error: data?.error?.message || "Erreur API Anthropic",
        type: data?.error?.type,
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("[anthropic proxy] Erreur réseau:", err.message);
    return res.status(502).json({
      error: "Erreur de connexion à l'API Anthropic. Réessayez.",
    });
  }
}
