// ════════════════════════════════════════════════════════════════════
//  /api/fedapay-webhook.js — Webhook FedaPay pour Vercel
//
//  Configurer dans FedaPay Dashboard → Webhooks :
//  URL : https://vierafrik.com/api/fedapay-webhook
//  Événements : transaction.approved, transaction.declined
//
//  Variables d'environnement Vercel :
//  FEDAPAY_SECRET_KEY     = sk_live_xxxxxxxxxxxxxxxxxxxx  ← dans Vercel uniquement
//  FEDAPAY_WEBHOOK_SECRET = (dans FedaPay Dashboard → Webhooks → Secret)
//  SUPABASE_URL           = https://oexzpfygeunehkcpoukv.supabase.co
//  SUPABASE_SERVICE_KEY   = (clé service_role depuis Supabase → Settings → API)
// ════════════════════════════════════════════════════════════════════

import crypto from "crypto";

const FEDAPAY_SECRET    = process.env.FEDAPAY_SECRET_KEY;
const WEBHOOK_SECRET    = process.env.FEDAPAY_WEBHOOK_SECRET;
const SUPABASE_URL      = process.env.SUPABASE_URL      || "https://oexzpfygeunehkcpoukv.supabase.co";
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_KEY; // service_role key — accès total

// ── Helper : appel Supabase REST ──
async function supaRest(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=representation",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json().catch(() => null);
}

// ── Vérifier la signature FedaPay (HMAC-SHA256) ──
function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return true; // skip si pas configuré
  const hmac = crypto.createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(hmac,      "hex"),
  );
}

export const config = { api: { bodyParser: false } }; // raw body pour vérification signature

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST uniquement" });

  // Lire le body brut
  const rawBody = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end",  () => resolve(data));
    req.on("error", reject);
  });

  // Vérifier la signature FedaPay
  const signature = req.headers["x-fedapay-signature"] || req.headers["x-webhook-signature"];
  if (WEBHOOK_SECRET && !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
    console.error("[Webhook] Signature invalide");
    return res.status(401).json({ error: "Signature invalide" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "JSON invalide" });
  }

  const event       = payload?.name || payload?.event;
  const transaction = payload?.data?.object || payload?.transaction || payload?.data;

  console.log("[Webhook FedaPay] Event:", event, "| Transaction:", transaction?.id, "| Status:", transaction?.status);

  // ── Seulement traiter les paiements approuvés ──
  if (event !== "transaction.approved" && transaction?.status !== "approved") {
    return res.status(200).json({ received: true, action: "ignored", event });
  }

  const transactionId = transaction?.id;
  const status        = transaction?.status; // "approved"
  const metadata      = transaction?.custom_metadata || transaction?.metadata || {};
  const { uid, plan, invoice_id } = metadata;

  if (!uid && !invoice_id) {
    console.warn("[Webhook] Pas de métadonnées uid/invoice_id — impossible de mettre à jour");
    return res.status(200).json({ received: true, action: "skipped_no_metadata" });
  }

  if (!SUPABASE_KEY) {
    console.error("[Webhook] SUPABASE_SERVICE_KEY manquante");
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  try {
    const actions = [];

    // ── CAS 1 : Paiement d'une facture ──
    if (invoice_id) {
      // Récupérer l'état actuel de la facture pour cumuler correctement
      // (paiement partiel) et éviter un double-comptage si FedaPay renvoie
      // le même événement plusieurs fois (retries webhook).
      const invRows = await supaRest(`/invoices?id=eq.${invoice_id}&select=total,amt_paid,status,client_name,number,user_id,pay_ref`).catch(() => []);
      const invRow  = invRows?.[0];

      if (!invRow) {
        console.warn("[Webhook] Facture introuvable:", invoice_id);
        return res.status(200).json({ received: true, action: "invoice_not_found" });
      }
      if (invRow.status === "paid" || String(invRow.pay_ref) === String(transactionId)) {
        console.warn("[Webhook] Facture déjà traitée — ignoré (idempotence):", invoice_id);
        return res.status(200).json({ received: true, action: "already_processed" });
      }

      const paidAmount = Number(transaction?.amount || 0);
      const newAmtPaid = Number(invRow.amt_paid || 0) + paidAmount;
      const newStatus  = newAmtPaid >= Number(invRow.total || 0) ? "paid" : "partial";

      await supaRest(
        `/invoices?id=eq.${invoice_id}`,
        "PATCH",
        {
          status:   newStatus,
          amt_paid: newAmtPaid,
          pay_ref:  String(transactionId),
        }
      );
      actions.push(`invoice ${invoice_id} → ${newStatus} (${newAmtPaid}/${invRow.total})`);

      // Créer une transaction de vente correspondante — on utilise le
      // user_id du marchand propriétaire de la facture (invRow.user_id),
      // pas les métadonnées uid : un client public qui paie sa facture
      // n'a pas de compte et n'envoie jamais de uid.
      const ownerId = invRow.user_id || uid;
      if (ownerId && paidAmount) {
        const inv = invRow;
        await supaRest("/transactions", "POST", {
          id:       `fedapay_${transactionId}`,
          user_id:  ownerId,
          type:     "sale",
          amount:   paidAmount,
          category: "Services",
          who:      inv?.client_name || "Paiement FedaPay",
          date:     new Date().toISOString().slice(0, 10),
          note:     `Paiement facture ${inv?.number || invoice_id} via FedaPay`,
        }).catch(() => {}); // pas bloquant si doublon
        actions.push(`transaction créée pour facture ${invoice_id}`);
      }
    }

    // ── CAS 2 : Activation d'un plan d'abonnement ──
    if (uid && plan && plan !== "free" && !invoice_id) {
      // FIX — l'app lit exclusivement la table "subscriptions" (voir loadSubscription
      // côté client) pour savoir si un utilisateur est actif. L'ancien code mettait à
      // jour /auth/users/{uid} via /rest/v1, un endpoint qui n'existe pas (l'API Admin
      // Auth de Supabase vit sous /auth/v1/admin/users, pas /rest/v1/auth/users), donc
      // l'abonnement n'était jamais réellement activé après un paiement webhook.
      const paidAt    = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const existingSubs = await supaRest(`/subscriptions?user_id=eq.${uid}&select=id`).catch(() => []);
      const existingSub  = existingSubs?.[0];

      if (existingSub?.id) {
        await supaRest(`/subscriptions?id=eq.${existingSub.id}`, "PATCH", {
          plan, paid_at: paidAt, expires_at: expiresAt, status: "active", updated_at: paidAt,
        });
      } else {
        await supaRest("/subscriptions", "POST", {
          id: `fedapay_sub_${transactionId}`,
          user_id: uid,
          plan,
          paid_at: paidAt,
          expires_at: expiresAt,
          status: "active",
          created_at: paidAt,
          updated_at: paidAt,
        });
      }
      actions.push(`subscription ${uid} → ${plan} (active jusqu'au ${expiresAt})`);

      // Best-effort : garder aussi user_metadata.plan synchronisé via la RPC existante
      // (non bloquant — la table subscriptions ci-dessus est la source de vérité)
      await supaRest("/rpc/update_user_plan", "POST", { user_id: uid, new_plan: plan }).catch(() => {});

      // Mettre à jour commission ambassadeur si referral
      const refRows = await supaRest(
        `/referrals?referred_user_id=eq.${uid}&select=id,ambassador_code,created_at`
      ).catch(() => []);

      if (refRows?.length > 0) {
        const ref = refRows[0];
        const ageHours = (Date.now() - new Date(ref.created_at).getTime()) / 3600000;
        const comm = plan === "pro" ? 980 : 1980;

        // Anti-fraude : compte > 24h
        if (ageHours >= 24) {
          const actRows = await supaRest(
            `/user_activity?user_id=eq.${uid}&select=user_active,action_count`
          ).catch(() => []);
          const activity = actRows?.[0];

          if (activity?.user_active && (activity?.action_count || 0) >= 2) {
            await supaRest(
              `/referrals?id=eq.${ref.id}`,
              "PATCH",
              {
                plan,
                commission: comm,
                verified:   true,
                converted_at: new Date().toISOString(),
              }
            ).catch(() => {});
            actions.push(`commission ambassadeur ${ref.ambassador_code} → ${comm} FCFA`);
          }
        }
      }
    }

    console.log("[Webhook FedaPay] Actions:", actions.join(" | "));
    return res.status(200).json({ received: true, actions });

  } catch (err) {
    console.error("[Webhook FedaPay] Erreur:", err);
    // Retourner 200 pour éviter les retries FedaPay
    return res.status(200).json({ received: true, error: err.message });
  }
}
