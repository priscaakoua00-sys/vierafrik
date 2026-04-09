// /api/fedapay.js — Vercel Serverless Function v5 FINAL
// ══════════════════════════════════════════════════════
//  Fix confirmé via logs :
//  FedaPay retourne dans "v1/transaction" :
//    - payment_token : "eyJ..."
//    - payment_url   : "https://process.fedapay.com/eyJ..."
// ══════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.VITE_APP_URL || "https://vierafrik.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
  const APP_URL    = process.env.VITE_APP_URL || "https://vierafrik.com";

  if (!SECRET_KEY) {
    console.error("❌ FEDAPAY_SECRET_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const { action, amount, email, description, plan, uid, phone, reference } = req.body || {};
  const FEDAPAY_BASE = "https://api.fedapay.com/v1";
  const headers = {
    "Authorization": `Bearer ${SECRET_KEY}`,
    "Content-Type":  "application/json",
  };

  // ══════════════════════════════════════════
  //  INITIALIZE
  // ══════════════════════════════════════════
  if (action === "initialize") {
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ error: "Montant invalide" });
    if (!email)
      return res.status(400).json({ error: "Email requis" });

    const callbackUrl = `${APP_URL}/?pay_success=1&plan=${encodeURIComponent(plan||"")}&uid=${encodeURIComponent(uid||"")}`;

    const body = {
      description:  description || "Paiement VierAfrik",
      amount:       Number(amount),
      currency:     { iso: "XOF" },
      callback_url: callbackUrl,
      customer: {
        email,
        ...(phone ? { phone_number: { number: String(phone).replace(/\D/g,""), country:"CI" } } : {}),
      },
    };

    try {
      console.log("📤 [FedaPay] initialize →", { amount, email, plan, uid });

      const r    = await fetch(`${FEDAPAY_BASE}/transactions`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await r.json();

      console.log("📥 [FedaPay] HTTP:", r.status);
      console.log("📥 [FedaPay] Réponse complète:", JSON.stringify(data, null, 2));

      if (!r.ok) {
        console.error("❌ [FedaPay] Erreur HTTP", r.status);
        return res.status(r.status || 400).json({
          error: data?.message || `Erreur HTTP ${r.status}`,
          details: data,
        });
      }

      // ── Extraction transaction ──
      // FedaPay retourne : { "v1/transaction": { id, payment_token, payment_url, ... } }
      const transaction =
        data["v1/transaction"] ||
        data["transaction"]    ||
        data;

      console.log("🔍 [FedaPay] transaction.id:", transaction?.id);
      console.log("🔍 [FedaPay] transaction.payment_url:", transaction?.payment_url);
      console.log("🔍 [FedaPay] transaction.payment_token:", transaction?.payment_token ? "présent" : "absent");

      if (!transaction?.id) {
        console.error("❌ [FedaPay] Pas d'ID. Réponse:", JSON.stringify(data));
        return res.status(500).json({ error: "Pas d'ID transaction", raw: data });
      }

      // ── URL de paiement — directement dans la transaction ──
      // Confirmé dans les logs : payment_url = "https://process.fedapay.com/eyJ..."
      const paymentUrl =
        transaction.payment_url        ||
        transaction.authorization_url  ||
        (transaction.payment_token
          ? `https://process.fedapay.com/${transaction.payment_token}`
          : null)                       ||
        `https://checkout.fedapay.com/pay/${transaction.id}`;

      console.log("✅ [FedaPay] Succès → id:", transaction.id, "| url:", paymentUrl);

      return res.status(200).json({
        transaction_id: transaction.id,
        payment_url:    paymentUrl,
        url:            paymentUrl,
      });

    } catch (e) {
      console.error("❌ [FedaPay] Exception:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // ══════════════════════════════════════════
  //  VERIFY
  // ══════════════════════════════════════════
  if (action === "verify") {
    if (!reference) return res.status(400).json({ error: "Référence requise" });
    try {
      const r    = await fetch(`${FEDAPAY_BASE}/transactions/${reference}`, { headers });
      const data = await r.json();
      console.log("📥 [FedaPay] verify:", JSON.stringify(data, null, 2));
      const tx     = data["v1/transaction"] || data.transaction || data;
      const status = tx?.status;
      return res.status(200).json({
        status,
        paid: ["approved","complete","success","paid"].includes(status),
        transaction: tx,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: `Action inconnue: "${action}"` });
}
