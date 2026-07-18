// ══════════════════════════════════════════════════════════════
//  cleanup-expired-stories — nettoyage automatique du Forum 24h
//  Déclenchée toutes les 30 min par pg_cron (voir migration SQL).
//  Supprime les messages expirés ET leurs fichiers média associés
//  dans le bucket Storage "network-media", pour qu'aucun fichier
//  orphelin ne reste jamais en stockage après expiration.
// ══════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function extractStoragePath(url: string | null): string | null {
  if (!url) return null;
  const marker = "/network-media/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(url.slice(idx + marker.length));
  } catch {
    return null;
  }
}

Deno.serve(async (_req: Request) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { data: expired, error } = await supabase
      .from("reseau_messages")
      .select("id, image_url, video_url, thumbnail_url")
      .lt("expires_at", new Date().toISOString());

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = expired || [];
    let filesDeleted = 0;
    let fileErrors = 0;

    for (const row of rows) {
      const paths = [row.image_url, row.video_url, row.thumbnail_url]
        .map(extractStoragePath)
        .filter((p): p is string => !!p);
      if (paths.length) {
        const { error: rmErr, data: rmData } = await supabase.storage.from("network-media").remove(paths);
        if (rmErr) fileErrors++;
        else filesDeleted += (rmData?.length || paths.length);
      }
    }

    const ids = rows.map((r) => r.id);
    let rowsDeleted = 0;
    if (ids.length) {
      const { error: delErr, count } = await supabase
        .from("reseau_messages")
        .delete({ count: "exact" })
        .in("id", ids);
      if (!delErr) rowsDeleted = count || ids.length;
    }

    return new Response(
      JSON.stringify({ ok: true, rowsFound: rows.length, rowsDeleted, filesDeleted, fileErrors }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
