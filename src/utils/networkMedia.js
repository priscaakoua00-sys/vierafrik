// ══════════════════════════════════════════════════════════════
//  Upload d'un média (photo/vidéo/miniature) déjà compressé vers le
//  bucket Supabase Storage "network-media" (voir migration Étape 1).
//  Ne fait aucune compression, le blob doit déjà être prêt à l'emploi
//  (CameraCapture s'en charge à la capture).
// ══════════════════════════════════════════════════════════════
export async function uploadNetworkMedia(supabaseClient, userId, blob, { folder = "", ext = "jpg", contentType } = {}) {
  const safeUid = userId || "anonymous";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${safeUid}/${folder ? folder + "/" : ""}${Date.now()}-${rand}.${ext}`;
  const { error } = await supabaseClient.storage
    .from("network-media")
    .upload(path, blob, { contentType: contentType || blob.type || "application/octet-stream", upsert: true });
  if (error) throw error;
  const { data } = supabaseClient.storage.from("network-media").getPublicUrl(path);
  return data.publicUrl;
}

// Déduit une extension de fichier raisonnable depuis le type MIME d'un blob vidéo.
export function videoExtFromBlob(blob) {
  const type = blob?.type || "";
  if (type.includes("mp4")) return "mp4";
  return "webm";
}

// Supprime un fichier du bucket "network-media" à partir de son URL publique
// (utilisé quand on remplace ou supprime un média AVANT son expiration
// naturelle, le nettoyage automatique à 24h est géré séparément côté
// serveur, ceci couvre les actions immédiates de l'utilisateur).
export async function deleteNetworkMedia(supabaseClient, publicUrl) {
  if (!publicUrl) return;
  const marker = "/network-media/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
  try { await supabaseClient.storage.from("network-media").remove([path]); } catch(_) {}
}
