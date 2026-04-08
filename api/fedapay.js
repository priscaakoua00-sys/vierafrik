// ════════════════════════════════════════════════════════════════════
//  /api/fedapay.js — Route Vercel Serverless
//  Variables d'environnement Vercel :
//  FEDAPAY_SECRET_KEY = sk_live_...  (ta clé secrète FedaPay)
// ════════════════════════════════════════════════════════════════════

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY;
const FEDAPAY_BASE   = "https://api.fedapay.com/v1";

async function fedaFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${FEDAPAY_SECRET}`,
      "Content-Type":  "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${FEDAPAY_BASE}${path}`, opts);
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { error: "JSON invalide", raw: text }; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  if (!FEDAPAY_SECRET) {
    return res.status(500).json({ error: "FEDAPAY_SECRET_KEY manquante dans Vercel Environment Variables" });
  }

  const {
    action, amount, description,
    customer_email, customer_phone,
    invoice_id, uid, plan, callback_url,
    transaction_id,
  } = req.body || {};

  // ── INITIALIZE ──────────────────────────────────────────
  if (action === "initialize") {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    try {
      // FedaPay attend le montant en centimes pour XOF
      const txPayload = {
        description:  description || "Paiement VierAfrik",
        amount:       Math.round(amount) * 100,
        currency:     { iso: "XOF" },
        callback_url: callback_url || "https://vierafrik.com/?pay_success=1",
      };

      if (customer_email || customer_phone) {
        txPayload.customer = {};
        if (customer_email) txPayload.customer.email = customer_email;
        if (customer_phone) txPayload.customer.phone_number = customer_phone.replace(/\s/g, "");
      }

      if (uid || invoice_id || plan) {
        txPayload.metadata = JSON.stringify({ uid, invoice_id, plan });
      }

      const txRes = await fedaFetch("/transactions", "POST", txPayload);
      console.log("[FedaPay] TX response:", JSON.stringify(txRes).slice(0, 400));

      // FedaPay peut retourner { v1: {...} } ou { transaction: {...} } ou directement l'objet
      const tx = txRes?.v1 || txRes?.transaction || txRes;
      const transactionId = tx?.id;

      if (!transactionId) {
        return res.status(500).json({ error: "ID transaction FedaPay non reçu", raw: txRes });
      }

      // Générer le token — FedaPay utilise POST pour /token
      const tokenRes = await fedaFetch(`/transactions/${transactionId}/token`, "POST");
      console.log("[FedaPay] Token response:", JSON.stringify(tokenRes).slice(0, 400));

      const token = tokenRes?.v1?.token || tokenRes?.token || tx?.token;

      if (!token) {
        return res.status(500).json({ error: "Token paiement FedaPay non reçu", raw: tokenRes });
      }

      const paymentUrl = `https://checkout.fedapay.com/${token}`;

      return res.status(200).json({
        payment_url:    paymentUrl,
        url:            paymentUrl,
        transaction_id: transactionId,
        token,
      });

    } catch (err) {
      console.error("[FedaPay] Exception:", err);
      return res.status(500).json({ error: "Erreur serveur", message: err.message });
    }
  }

  // ── VERIFY ──────────────────────────────────────────────
  if (action === "verify") {
    if (!transaction_id) {
      return res.status(400).json({ error: "transaction_id requis" });
    }
    try {
      const txRes  = await fedaFetch(`/transactions/${transaction_id}`, "GET");
      const tx     = txRes?.v1 || txRes?.transaction || txRes;
      const status = tx?.status || "unknown";
      return res.status(200).json({
        transaction: { id: transaction_id, status },
        status,
        approved: status === "approved",
      });
    } catch (err) {
      return res.status(500).json({ error: "Erreur vérification", message: err.message });
    }
  }

  return res.status(400).json({ error: `Action "${action}" non reconnue` });
}
