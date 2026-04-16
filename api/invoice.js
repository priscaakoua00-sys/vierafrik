// ════════════════════════════════════════════════════════
//  /api/invoice.js — VierAfrik · Vercel Serverless
//  Lecture publique d'une facture SANS RLS
//  Utilisé par PublicPayPage quand la policy anon manque
//
//  Variables d'environnement requises (Vercel) :
//    SUPABASE_URL          = https://xxxx.supabase.co
//    SUPABASE_SERVICE_KEY  = eyJ... (service_role — jamais exposée au client)
//
//  Usage : GET /api/invoice?id=<uuid>
// ════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // ── 1. GET uniquement ──
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string" || !id.trim()) {
    return res.status(400).json({ error: "Paramètre id manquant" });
  }

  // ── 2. Variables d'environnement ──
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[invoice] Variables d'environnement manquantes:", {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SERVICE_KEY,
    });
    return res.status(500).json({ error: "Configuration serveur manquante" });
  }

  const invoiceId = id.trim();

  try {
    // ── 3. Recherche par UUID (cas principal) ──
    let data = null;

    const r1 = await fetch(
      `${SUPABASE_URL}/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}&select=*&limit=1`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (r1.ok) {
      const rows = await r1.json();
      if (Array.isArray(rows) && rows.length > 0) {
        data = rows[0];
        console.log("✅ [invoice] Trouvée par id:", invoiceId);
      }
    } else {
      console.error("[invoice] Supabase REST error:", r1.status, await r1.text());
    }

    // ── 4. Fallback : recherche par numéro de facture (QR ancien format) ──
    if (!data) {
      const r2 = await fetch(
        `${SUPABASE_URL}/rest/v1/invoices?number=eq.${encodeURIComponent(invoiceId)}&select=*&limit=1`,
        {
          headers: {
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (r2.ok) {
        const rows2 = await r2.json();
        if (Array.isArray(rows2) && rows2.length > 0) {
          data = rows2[0];
          console.log("✅ [invoice] Trouvée par number:", invoiceId);
        }
      }
    }

    // ── 5. Résultat ──
    if (!data) {
      console.warn("[invoice] NOT FOUND:", invoiceId);
      return res.status(404).json({ error: "Facture introuvable", id: invoiceId });
    }

    // Retourner les données nécessaires uniquement (pas d'info sensible)
    return res.status(200).json({
      id:           data.id,
      number:       data.number || "",
      client_name:  data.client_name || "",
      phone:        data.phone || "",
      total:        parseFloat(data.total) || 0,
      subtotal:     parseFloat(data.subtotal) || 0,
      tax:          parseFloat(data.tax) || 0,
      currency:     data.currency || "XOF",
      status:       data.status || "pending",
      issued:       data.issued || "",
      due:          data.due || "",
      items:        typeof data.items === "string" ? JSON.parse(data.items || "[]") : (data.items || []),
      notes:        data.notes || "",
      amt_paid:     parseFloat(data.amt_paid) || 0,
    });

  } catch (err) {
    console.error("[invoice] Exception:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
