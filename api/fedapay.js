// ════════════════════════════════════════════════════════════════════
//  /api/fedapay.js — Route Vercel Serverless
//  Gère la création et la vérification de transactions FedaPay
//
//  Variables d'environnement à configurer dans Vercel Dashboard :
//  FEDAPAY_SECRET_KEY = sk_live_xxxxxxxxxxxxxxxxxxxx  ← colle ta clé secrète ici dans Vercel
//  FEDAPAY_BASE_URL   = https://api.fedapay.com/v1
//
//  JAMAIS mettre la clé secrète dans le frontend — uniquement ici.
// ════════════════════════════════════════════════════════════════════

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY;
const FEDAPAY_BASE   = process.env.FEDAPAY_BASE_URL || "https://api.fedapay.com/v1";

// ── Helper : appel FedaPay API ──
async function fedaFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${FEDAPAY_SECRET}`,
      "Content-Type":  "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${FEDAPAY_BASE}${path}`, opts);
  return res.json();
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  if (!FEDAPAY_SECRET) {
    return res.status(500).json({ error: "FEDAPAY_SECRET_KEY non configurée dans les variables d'environnement Vercel" });
  }

  const {
    action,
    amount,
    description,
    customer_email,
    customer_phone,
    invoice_id,
    uid,
    plan,
    callback_url,
    transaction_id,  // pour action=verify
  } = req.body || {};

  // ────────────────────────────────
  // ACTION : initialize — créer une transaction
  // ────────────────────────────────
  if (action === "initialize") {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    try {
      // Étape 1 : Créer le customer FedaPay
      let customerId = null;
      if (customer_email || customer_phone) {
        const customerPayload = {};
        if (customer_email) customerPayload.email = customer_email;
        if (customer_phone) customerPayload.phone_number = {
          number:  customer_phone.replace(/\s/g, ""),
          country: "BJ",  // Bénin par défaut (FedaPay est béninois, couvre CI/SN/CM aussi)
        };

        const customerRes = await fedaFetch("/customers", "POST", customerPayload);
        customerId = customerRes?.v1?.id || customerRes?.customer?.id || null;
      }

      // Étape 2 : Créer la transaction
      const txPayload = {
        description: description || "Paiement VierAfrik",
        amount:      Math.round(amount),  // FCFA entier
        currency:    { iso: "XOF" },
        callback_url: callback_url || "https://vierafrik.com/?pay_success=1",
      };

      // Ajouter métadonnées utiles pour le webhook
      if (uid)        txPayload.custom_metadata = { uid, plan, invoice_id };
      if (customerId) txPayload.customer         = { id: customerId };

      const txRes = await fedaFetch("/transactions", "POST", txPayload);

      if (txRes?.error || txRes?.status === "error") {
        console.error("[FedaPay] Transaction creation error:", txRes);
        return res.status(400).json({
          error:   txRes?.message || "Erreur création transaction FedaPay",
          details: txRes,
        });
      }

      const transactionId = txRes?.v1?.id || txRes?.transaction?.id;
      if (!transactionId) {
        return res.status(500).json({ error: "ID transaction FedaPay non reçu", raw: txRes });
      }

      // Étape 3 : Générer le lien de paiement
      const tokenRes = await fedaFetch(`/transactions/${transactionId}/token`, "GET");
      const token    = tokenRes?.v1?.token || tokenRes?.token;

      if (!token) {
        return res.status(500).json({ error: "Token paiement FedaPay non reçu", raw: tokenRes });
      }

      const paymentUrl = `https://checkout.fedapay.com/${token}`;

      return res.status(200).json({
        payment_url:    paymentUrl,
        url:            paymentUrl,   // alias pour compatibilité
        transaction_id: transactionId,
        token,
      });

    } catch (err) {
      console.error("[FedaPay] Exception:", err);
      return res.status(500).json({ error: "Erreur serveur FedaPay", message: err.message });
    }
  }

  // ────────────────────────────────
  // ACTION : verify — vérifier statut d'une transaction
  // ────────────────────────────────
  if (action === "verify") {
    if (!transaction_id) {
      return res.status(400).json({ error: "transaction_id requis pour la vérification" });
    }

    try {
      const txRes = await fedaFetch(`/transactions/${transaction_id}`, "GET");
      const status = txRes?.v1?.status || txRes?.transaction?.status || txRes?.status;

      return res.status(200).json({
        transaction: {
          id:     transaction_id,
          status: status || "unknown",
        },
        status,
        approved: status === "approved",
      });

    } catch (err) {
      return res.status(500).json({ error: "Erreur vérification", message: err.message });
    }
  }

  return res.status(400).json({ error: `Action "${action}" non reconnue. Actions valides: initialize, verify` });
}
