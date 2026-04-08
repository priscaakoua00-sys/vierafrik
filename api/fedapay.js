// /api/fedapay.js — Version avec message d'erreur FedaPay complet

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
  // Log COMPLET pour voir le vrai message FedaPay
  console.log(`[FedaPay] ${method} ${path} → HTTP ${res.status}`);
  console.log(`[FedaPay] Response FULL: ${text}`);
  try { return { httpStatus: res.status, data: JSON.parse(text) }; }
  catch { return { httpStatus: res.status, data: null, raw: text }; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")    return res.status(405).json({ error: "Method not allowed" });

  if (!FEDAPAY_SECRET) {
    return res.status(500).json({ error: "FEDAPAY_SECRET_KEY manquante dans Vercel" });
  }

  console.log("[FedaPay] Secret key prefix:", FEDAPAY_SECRET.slice(0, 15) + "...");

  const { action, amount, description, customer_email, customer_phone,
          invoice_id, uid, plan, callback_url } = req.body || {};

  if (action === "initialize") {
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    try {
      const txPayload = {
        description:  description || "Paiement VierAfrik",
        amount:       Math.round(amount),
        currency:     { iso: "XOF" },
        callback_url: callback_url || "https://vierafrik.com/?pay_success=1",
      };
      if (customer_email) txPayload.customer = { email: customer_email };
      if (uid || invoice_id) txPayload.metadata = { uid, invoice_id, plan };

      const txResult = await fedaFetch("/transactions", "POST", txPayload);

      // Si erreur HTTP — retourner le message complet à l'app
      if (txResult.httpStatus !== 200 && txResult.httpStatus !== 201) {
        const errMsg = txResult.data?.message
          || txResult.data?.error
          || txResult.raw
          || "Erreur FedaPay inconnue";
        return res.status(500).json({
          error:      errMsg,
          httpStatus: txResult.httpStatus,
          raw:        txResult.data,
        });
      }

      const tx = txResult.data?.v1 || txResult.data?.transaction || txResult.data;
      const transactionId = tx?.id;

      if (!transactionId) {
        return res.status(500).json({ error: "ID transaction non reçu", raw: txResult.data });
      }

      // Token — POST
      const tokenResult = await fedaFetch(`/transactions/${transactionId}/token`, "POST");
      const token = tokenResult.data?.v1?.token
        || tokenResult.data?.token
        || tx?.token;

      if (!token) {
        return res.status(500).json({
          error:      "Token non reçu",
          tokenRaw:   tokenResult.data,
        });
      }

      const paymentUrl = `https://checkout.fedapay.com/${token}`;
      return res.status(200).json({ payment_url: paymentUrl, url: paymentUrl, transaction_id: transactionId });

    } catch (err) {
      console.error("[FedaPay] Exception:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Action "${action}" non reconnue` });
}
