// ══════════════════════════════════════════════════════════════
//  Upload d'un média (photo/vidéo/miniature) déjà compressé vers le
//  bucket Supabase Storage "network-media" (voir migration Étape 1).
//  Ne fait aucune compression — le blob doit déjà être prêt à l'emploi
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
