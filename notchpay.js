// api/notchpay.js — Vercel Serverless Function
// Proxy sécurisé NotchPay — PRODUCTION VierAfrik CI

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://vierafrik.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PK = process.env.VITE_NOTCHPAY_PK;

  try {
    const { action, reference, amount, email, plan, uid, phone } = req.body;

    if (action === "initialize") {
      if (!amount || !email || !plan || !uid) {
        return res.status(400).json({ error: "Paramètres manquants: amount, email, plan, uid requis" });
      }

      const ref = "VA-" + uid.slice(0, 8) + "-" + Date.now();
      const baseUrl = "https://vierafrik.com";

      const payload = {
        amount: parseInt(amount),
        currency: "XOF",
        email: email,
        reference: ref,
        description: "VierAfrik Plan " + plan.charAt(0).toUpperCase() + plan.slice(1) + " - " + parseInt(amount).toLocaleString() + " FCFA",
        callback: baseUrl + "?pay_success=1&plan=" + plan + "&uid=" + uid + "&trxref=" + ref,
        return_url: baseUrl + "?pay_success=1&plan=" + plan + "&uid=" + uid + "&trxref=" + ref,
        // Forcer Côte d'Ivoire
        meta: {
          country: "CI",
          phone_lock: phone || "",
        }
      };

      console.log("NotchPay initialize:", JSON.stringify({ plan, amount, email: email.slice(0,3)+"***" }));

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
      console.log("NotchPay response status:", notchRes.status, "| keys:", Object.keys(data).join(","));

      if (!notchRes.ok) {
        return res.status(notchRes.status).json({ error: data?.message || "Erreur NotchPay", raw: data });
      }

      return res.status(200).json(data);
    }

    if (action === "verify" && reference) {
      const notchRes = await fetch("https://api.notchpay.co/payments/" + reference, {
        headers: { "Authorization": PK, "X-Grant": PK },
      });
      const data = await notchRes.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Action non reconnue. Utilisez: initialize ou verify" });

  } catch (err) {
    console.error("NotchPay handler error:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
