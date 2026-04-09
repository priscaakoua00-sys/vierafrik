// /api/fedapay.js — Vercel Serverless Function
// ══════════════════════════════════════════════════════════════
//  VierAfrik — Intégration FedaPay (Mobile Money Afrique)
//  Variables d'environnement requises dans Vercel :
//    FEDAPAY_SECRET_KEY = sk_live_...
//    VITE_APP_URL       = https://vierafrik.com
// ══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // CORS — autoriser vierafrik.com
  res.setHeader("Access-Control-Allow-Origin", process.env.VITE_APP_URL || "https://vierafrik.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
  const APP_URL    = process.env.VITE_APP_URL || "https://vierafrik.com";

  if (!SECRET_KEY) {
    console.error("❌ [FedaPay] FEDAPAY_SECRET_KEY manquante dans les variables Vercel");
    return res.status(500).json({ error: "Configuration serveur manquante — contactez l'admin" });
  }

  const { action, amount, email, description, plan, uid, phone, reference } = req.body || {};

  const FEDAPAY_BASE = "https://api.fedapay.com/v1";
  const headers = {
    "Authorization": `Bearer ${SECRET_KEY}`,
    "Content-Type":  "application/json",
  };

  // ══════════════════════════════════════════════════════
  //  ACTION : initialize — Créer une transaction FedaPay
  // ══════════════════════════════════════════════════════
  if (action === "initialize") {
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Montant invalide ou manquant" });
    }
    if (!email) {
      return res.status(400).json({ error: "Email client requis" });
    }

    // URL de retour après paiement
    const callbackUrl = `${APP_URL}/?pay_success=1&plan=${encodeURIComponent(plan || "")}&uid=${encodeURIComponent(uid || "")}`;

    // Construction du body FedaPay
    const body = {
      description: description || "Paiement VierAfrik",
      amount:      Number(amount),
      currency:    { iso: "XOF" },
      callback_url: callbackUrl,
      customer: {
        email,
        ...(phone
          ? { phone_number: { number: String(phone).replace(/\D/g, ""), country: "CI" } }
          : {}),
      },
    };

    try {
      console.log("📤 [FedaPay] initialize →", { amount, email, description, plan, uid });

      const r = await fetch(`${FEDAPAY_BASE}/transactions`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await r.json();
      console.log("📥 [FedaPay] Réponse brute initialize:", JSON.stringify(data));

      if (!r.ok || data.error || data.message?.toLowerCase().includes("error")) {
        console.error("❌ [FedaPay] Erreur API:", { status: r.status, body: data });
        return res.status(r.status || 400).json({
          error:   data?.message || data?.error || "Erreur FedaPay",
          details: data,
        });
      }

      // FedaPay retourne la transaction sous data.v1 ou data.transaction
      const tx      = data?.v1 || data?.transaction || data;
      const txId    = tx?.id;
      const txToken = tx?.token;

      if (!txId || !txToken) {
        console.error("❌ [FedaPay] transaction_id ou token manquant dans la réponse:", data);
        return res.status(500).json({
          error: "Réponse FedaPay invalide — transaction_id ou token absent",
          raw:   data,
        });
      }

      const paymentUrl = `https://checkout.fedapay.com/checkout/v1/token/${txToken}`;
      console.log("✅ [FedaPay] Succès — transaction_id:", txId, "| URL:", paymentUrl);

      return res.status(200).json({
        transaction_id: txId,
        token:          txToken,
        payment_url:    paymentUrl,
        url:            paymentUrl, // alias de compatibilité
      });

    } catch (e) {
      console.error("❌ [FedaPay] Exception réseau:", e);
      return res.status(500).json({ error: "Erreur réseau serveur — réessayez" });
    }
  }

  // ══════════════════════════════════════════════════════
  //  ACTION : verify — Vérifier le statut d'une transaction
  // ══════════════════════════════════════════════════════
  if (action === "verify") {
    if (!reference) {
      return res.status(400).json({ error: "Référence de transaction requise" });
    }

    try {
      console.log("🔍 [FedaPay] verify →", reference);

      const r    = await fetch(`${FEDAPAY_BASE}/transactions/${reference}`, { headers });
      const data = await r.json();
      console.log("📥 [FedaPay] verify réponse:", JSON.stringify(data));

      const tx     = data?.v1 || data?.transaction || data;
      const status = tx?.status;

      // Statuts FedaPay approuvés : "approved", "complete", "success", "paid"
      const isPaid = ["approved", "complete", "success", "paid"].includes(status);

      return res.status(200).json({
        status,
        paid:        isPaid,
        transaction: tx,
      });

    } catch (e) {
      console.error("❌ [FedaPay] verify exception:", e);
      return res.status(500).json({ error: "Erreur lors de la vérification" });
    }
  }

  // Action inconnue
  return res.status(400).json({ error: `Action inconnue : "${action}"` });
}
