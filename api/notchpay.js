// api/notchpay.js — Vercel Serverless Function
// Proxy sécurisé vers NotchPay API — évite CORS + cache la clé privée

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://vierafrik.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PK = process.env.VITE_NOTCHPAY_PK || "pk.sAM1JD0mJGWiNlPbwwuxTVfnrz3U7tRIrvDcaeQMm7btmZEuBwNeUKLLWmRWGavgynKMGbh3WhHJUX5VeRGueBwPkjBF9aF2vI7v0v0o5iL1HL2q7TMq5TtoxnS4q";

  try {
    const { action, reference } = req.body;

    // Action : initialiser un paiement
    if (action === "initialize") {
      const { amount, email, plan, uid } = req.body;

      if (!amount || !email || !plan || !uid) {
        return res.status(400).json({ error: "Paramètres manquants" });
      }

      const ref = "VA-" + uid.slice(0, 8) + "-" + Date.now();

      const payload = {
        amount: parseInt(amount),
        currency: "XOF",
        email: email,
        reference: ref,
        description: "VierAfrik Plan " + plan + " — " + parseInt(amount).toLocaleString("fr-FR") + " FCFA/mois",
        callback: "https://vierafrik.com?pay_success=1&plan=" + plan + "&uid=" + uid + "&trxref=" + ref,
        return_url: "https://vierafrik.com?pay_success=1&plan=" + plan + "&uid=" + uid + "&trxref=" + ref,
      };

      const notchRes = await fetch("https://api.notchpay.co/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": PK,
          "X-Grant": PK,
        },
        body: JSON.stringify(payload),
      });

      const data = await notchRes.json();
      return res.status(200).json(data);
    }

    // Action : vérifier statut d'un paiement
    if (action === "verify" && reference) {
      const notchRes = await fetch("https://api.notchpay.co/payments/" + reference, {
        headers: {
          "Authorization": PK,
          "X-Grant": PK,
        },
      });
      const data = await notchRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Action non reconnue" });

  } catch (err) {
    console.error("NotchPay proxy error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
