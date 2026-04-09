// /api/fedapay.js — Vercel Serverless Function
// ══════════════════════════════════════════════════════════════
//  VierAfrik — FedaPay v3 (fix clé "v1/transaction")
// ══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.VITE_APP_URL || "https://vierafrik.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
  const APP_URL    = process.env.VITE_APP_URL || "https://vierafrik.com";

  if (!SECRET_KEY) {
    console.error("❌ [FedaPay] FEDAPAY_SECRET_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const { action, amount, email, description, plan, uid, phone, reference } = req.body || {};
  const FEDAPAY_BASE = "https://api.fedapay.com/v1";
  const headers = {
    "Authorization": `Bearer ${SECRET_KEY}`,
    "Content-Type":  "application/json",
  };

  // ════════════════════════════════════════════════════
  //  INITIALIZE
  // ════════════════════════════════════════════════════
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

      // ── LOG COMPLET ──
      console.log("📥 [FedaPay] HTTP status:", r.status);
      console.log("📥 [FedaPay] Réponse complète:", JSON.stringify(data, null, 2));

      if (!r.ok) {
        console.error("❌ [FedaPay] Erreur HTTP:", r.status, data);
        return res.status(r.status || 400).json({
          error:   data?.message || data?.error || `Erreur HTTP ${r.status}`,
          details: data,
        });
      }

      // ── PARSING CORRECT — FedaPay retourne { "v1/transaction": { id, ... } } ──
      const transaction =
        data["v1/transaction"] ||
        data["transaction"]    ||
        data["v1"]             ||
        data;

      console.log("🔍 [FedaPay] transaction extraite:", JSON.stringify(transaction));

      if (!transaction?.id) {
        console.error("❌ [FedaPay] Transaction ID manquant. Réponse brute:", JSON.stringify(data));
        return res.status(500).json({
          error: "Transaction ID manquant dans la réponse FedaPay",
          raw:   data,
        });
      }

      const txId = transaction.id;

      // ── Récupérer le token de paiement via endpoint dédié ──
      let paymentUrl;
      try {
        const tokenRes  = await fetch(`${FEDAPAY_BASE}/transactions/${txId}/token`, {
          method: "GET", headers,
        });
        const tokenData = await tokenRes.json();
        console.log("🔑 [FedaPay] Token réponse:", JSON.stringify(tokenData));

        const token =
          tokenData?.token ||
          tokenData["v1/transaction/token"]?.token ||
          tokenData["v1/token"]?.token;

        if (token) {
          paymentUrl = `https://checkout.fedapay.com/checkout/v1/token/${token}`;
        }
      } catch(te) {
        console.warn("⚠️ [FedaPay] Token endpoint échoué:", te.message);
      }

      // Fallback si token non obtenu
      if (!paymentUrl) {
        paymentUrl =
          transaction.payment_url        ||
          transaction.authorization_url  ||
          `https://checkout.fedapay.com/pay/${txId}`;
      }

      console.log("✅ [FedaPay] Succès → id:", txId, "| url:", paymentUrl);

      return res.status(200).json({
        transaction_id: txId,
        payment_url:    paymentUrl,
        url:            paymentUrl,
      });

    } catch (e) {
      console.error("❌ [FedaPay] Exception:", e.message);
      return res.status(500).json({ error: "Erreur serveur: " + e.message });
    }
  }

  // ════════════════════════════════════════════════════
  //  VERIFY
  // ════════════════════════════════════════════════════
  if (action === "verify") {
    if (!reference) return res.status(400).json({ error: "Référence requise" });

    try {
      console.log("🔍 [FedaPay] verify →", reference);
      const r    = await fetch(`${FEDAPAY_BASE}/transactions/${reference}`, { headers });
      const data = await r.json();
      console.log("📥 [FedaPay] verify réponse:", JSON.stringify(data, null, 2));

      const tx     = data["v1/transaction"] || data.transaction || data.v1 || data;
      const status = tx?.status;
      const isPaid = ["approved", "complete", "success", "paid"].includes(status);

      return res.status(200).json({ status, paid: isPaid, transaction: tx });

    } catch (e) {
      console.error("❌ [FedaPay] verify exception:", e);
      return res.status(500).json({ error: "Erreur vérification" });
    }
  }

  return res.status(400).json({ error: `Action inconnue: "${action}"` });
}
