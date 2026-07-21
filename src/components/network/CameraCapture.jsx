import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
//  📸 CameraCapture, composant caméra réutilisable (photo + vidéo courte)
// ──────────────────────────────────────────────────────────────
//  Ne fait AUCUN upload, il renvoie juste un blob prêt à l'emploi via
//  onDone({ type:"photo"|"video", blob, previewUrl, thumbnailBlob,
//  durationSec, width, height }). C'est à l'appelant (étape 3 : profil
//  Réseau, annonces, stories) de décider où l'envoyer.
//
//  Règles respectées :
//  - Permission caméra/micro demandée UNIQUEMENT quand l'utilisateur
//    choisit explicitement "Prendre une photo" ou "Filmer", jamais
//    au montage du composant.
//  - Vidéo : durée maximale affichée AVANT le début de l'enregistrement,
//    arrêt automatique à la limite, compression appliquée dès la
//    capture (résolution + débit limités au niveau de MediaRecorder,
//    pas de ré-encodage a posteriori, trop lourd pour un téléphone
//    d'entrée de gamme).
//  - Fichier vidéo importé depuis la galerie : validé (durée, poids),
//    jamais recompressé, voir le plan Étape 1/2.
//  - Toutes les pistes caméra/micro sont coupées (`track.stop()`) dès
//    qu'on quitte l'aperçu live, la relecture ou le composant.
// ══════════════════════════════════════════════════════════════

const DEFAULT_T = {
  c1:"#05090f", c2:"#08111d", c3:"#0d1828",
  border:"rgba(0,210,120,0.08)", text:"#dff0ff",
  sub:"#4a7090", sub2:"#80a8c8", ink:"#000", red:"#ff2255", gold:"#f0b020",
};

const VIDEO_MIME_CANDIDATES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9,opus",
  "video/webm",
  "video/mp4",
];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of VIDEO_MIME_CANDIDATES) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch(_) {}
  }
  return null;
}

// Compresse une image (fichier ou frame vidéo) en JPEG, même logique
// que l'upload photo de profil (max 800px, qualité 0.72).
function compressImageBlob(sourceCanvas) {
  return new Promise((resolve) => {
    sourceCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.72);
  });
}

function drawToCanvas(source, sw, sh, maxDim = 800) {
  let w = sw, h = sh;
  if (w > maxDim || h > maxDim) {
    const r = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * r); h = Math.round(h * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(source, 0, 0, w, h);
  return canvas;
}

export default function CameraCapture({
  theme, accent = "#00d478",
  allowVideo = true,
  maxVideoSec = 15,
  onDone,
  onCancel,
}) {
  const T = theme || DEFAULT_T;
  const [phase, setPhase] = useState("choose"); // choose | live | recording | review | error
  const [captureMode, setCaptureMode] = useState(null); // "photo" | "video"
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null); // { type, blob, previewUrl, thumbnailBlob, durationSec, width, height }
  const [busy, setBusy] = useState(false);

  const videoRef = useRef(null);       // <video> aperçu live
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  // Miroir de `elapsed` lisible depuis les callbacks (recorder.onstop,
  // l'intervalle du minuteur) sans dépendre d'une closure périmée.
  const elapsedRef = useRef(0);

  const videoSupported = allowVideo && !!pickSupportedMimeType() && typeof navigator.mediaDevices?.getUserMedia === "function";

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });
      streamRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Coupe toujours la caméra/micro en quittant le composant, quelle que
  // soit la façon dont on en sort (confirmer, annuler, fermer l'onglet).
  useEffect(() => () => stopStream(), [stopStream]);

  const openLiveCamera = async (mode) => {
    setError("");
    setCaptureMode(mode);
    try {
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 960 }, height: { ideal: 960 } },
        audio: mode === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPhase("live");
      // Le <video> n'existe qu'après le changement de phase, on attache
      // le flux au prochain tick une fois le DOM rendu.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (e) {
      const denied = e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError";
      setError(denied
        ? "Autorisation caméra refusée. Active la caméra dans les paramètres de ton navigateur pour utiliser cette fonction."
        : "Impossible d'accéder à la caméra sur cet appareil.");
      setPhase("error");
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    try {
      const v = videoRef.current;
      const canvas = drawToCanvas(v, v.videoWidth || 800, v.videoHeight || 800);
      const blob = await compressImageBlob(canvas);
      stopStream();
      setResult({
        type: "photo", blob, previewUrl: URL.createObjectURL(blob),
        thumbnailBlob: null, durationSec: 0, width: canvas.width, height: canvas.height,
      });
      setPhase("review");
    } finally { setBusy(false); }
  };

  const startRecording = () => {
    const mimeType = pickSupportedMimeType();
    if (!mimeType || !streamRef.current) { setError("Vidéo non disponible sur cet appareil, utilise une photo."); setPhase("error"); return; }
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType, videoBitsPerSecond: 900_000 });
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const previewUrl = URL.createObjectURL(blob);
      const thumbnailBlob = await generateVideoThumbnail(previewUrl).catch(() => null);
      const durationSec = elapsedRef.current;
      stopStream();
      setResult({ type: "video", blob, previewUrl, thumbnailBlob, durationSec, width: 0, height: 0 });
      setPhase("review");
    };
    recorderRef.current = recorder;
    recorder.start();
    setElapsed(0);
    elapsedRef.current = 0;
    setPhase("recording");
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= maxVideoSec) stopRecording();
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch(_) {}
    }
  };

  const retake = () => {
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
    setPhase("choose");
    setCaptureMode(null);
  };

  const discard = () => {
    if (result?.previewUrl) URL.revokeObjectURL(result.previewUrl);
    setResult(null);
    stopStream();
    onCancel?.();
  };

  const confirm = () => {
    if (!result) return;
    onDone?.(result);
  };

  // ── Fichier depuis la galerie (photo ou vidéo) ──
  const handleFilePicked = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    setBusy(true);
    try {
      if (f.type.startsWith("image/")) {
        const img = await loadImage(f);
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
        const blob = await compressImageBlob(canvas);
        setResult({ type: "photo", blob, previewUrl: URL.createObjectURL(blob), thumbnailBlob: null, durationSec: 0, width: canvas.width, height: canvas.height });
        setPhase("review");
      } else if (f.type.startsWith("video/")) {
        const MAX_MB = 25; // poids brut avant sélection, la validation de durée est déterminante
        if (f.size > MAX_MB * 1024 * 1024) {
          setError(`Vidéo trop lourde (max ${MAX_MB}Mo). Filme directement dans l'app pour une vidéo déjà optimisée.`);
          setPhase("error"); return;
        }
        const tmpUrl = URL.createObjectURL(f);
        const duration = await getVideoDuration(tmpUrl).catch(() => null);
        if (duration == null) {
          URL.revokeObjectURL(tmpUrl);
          setError("Vidéo illisible, essaie un autre fichier ou filme directement dans l'app.");
          setPhase("error"); return;
        }
        if (duration > maxVideoSec + 1) {
          URL.revokeObjectURL(tmpUrl);
          setError(`Cette vidéo dure ${Math.round(duration)}s, maximum autorisé : ${maxVideoSec}s. Filme directement dans l'app pour rester dans la limite.`);
          setPhase("error"); return;
        }
        const thumbnailBlob = await generateVideoThumbnail(tmpUrl).catch(() => null);
        setResult({ type: "video", blob: f, previewUrl: tmpUrl, thumbnailBlob, durationSec: Math.round(duration), width: 0, height: 0 });
        setPhase("review");
      } else {
        setError("Fichier non pris en charge, choisis une image ou une vidéo.");
        setPhase("error");
      }
    } finally { setBusy(false); }
  };

  const T2 = T;
  const btnStyle = (col) => ({
    display:"flex", flexDirection:"column", alignItems:"center", gap:6,
    padding:"16px 10px", borderRadius:14, border:`1px solid ${col}44`,
    background:`${col}12`, color:col, cursor:"pointer", fontFamily:"inherit",
    fontWeight:800, fontSize:12, flex:1,
  });

  return (
    <div style={{ background:T2.c1, border:`1px solid ${accent}33`, borderRadius:16, padding:"1rem", color:T2.text, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif" }}>
      {phase === "choose" && (
        <>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:12 }}>Ajouter un média</div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <button onClick={() => openLiveCamera("photo")} style={btnStyle(accent)}>
              <span style={{ fontSize:22 }}>📷</span>Prendre une photo
            </button>
            {videoSupported && (
              <button onClick={() => openLiveCamera("video")} style={btnStyle(T2.gold)}>
                <span style={{ fontSize:22 }}>🎥</span>Filmer ({maxVideoSec}s max)
              </button>
            )}
          </div>
          <button onClick={() => fileInputRef.current?.click()} style={{ width:"100%", padding:"11px", borderRadius:12, border:`1px solid ${T2.border}`, background:T2.c2, color:T2.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:12 }}>
            🖼️ Choisir un fichier
          </button>
          <input ref={fileInputRef} type="file" accept={videoSupported ? "image/*,video/*" : "image/*"} onChange={handleFilePicked} style={{ display:"none" }}/>
          {onCancel && (
            <button onClick={onCancel} style={{ width:"100%", marginTop:8, padding:"9px", borderRadius:10, border:"none", background:"transparent", color:T2.sub, cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:11 }}>
              Annuler
            </button>
          )}
        </>
      )}

      {phase === "error" && (
        <div style={{ textAlign:"center", padding:"1rem 0" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>⚠️</div>
          <div style={{ fontSize:12.5, color:T2.sub2, marginBottom:16, lineHeight:1.6 }}>{error}</div>
          <button onClick={() => { setError(""); setPhase("choose"); }} style={{ padding:"9px 20px", borderRadius:10, border:"none", background:accent, color:T2.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:12 }}>
            Réessayer
          </button>
        </div>
      )}

      {(phase === "live" || phase === "recording") && (
        <div>
          {captureMode === "video" && (
            <div style={{ textAlign:"center", marginBottom:8, fontSize:11, fontWeight:700, color: phase==="recording" ? T2.red : T2.sub2 }}>
              {phase === "recording" ? `⏺ Enregistrement… ${elapsed}s / ${maxVideoSec}s` : `Durée maximale : ${maxVideoSec} secondes`}
            </div>
          )}
          <div style={{ position:"relative", borderRadius:14, overflow:"hidden", background:"#000", aspectRatio:"1/1" }}>
            <video ref={videoRef} muted playsInline autoPlay style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            {phase === "recording" && (
              <div style={{ position:"absolute", top:10, right:10, width:12, height:12, borderRadius:"50%", background:T2.red, animation:"pulse 1s ease infinite" }}/>
            )}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={() => { stopStream(); setPhase("choose"); }} style={{ flex:1, padding:"11px", borderRadius:12, border:`1px solid ${T2.border}`, background:T2.c2, color:T2.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:12 }}>
              Annuler
            </button>
            {captureMode === "photo" && phase === "live" && (
              <button onClick={takePhoto} disabled={busy} style={{ flex:2, padding:"11px", borderRadius:12, border:"none", background:accent, color:T2.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:13 }}>
                {busy ? "⏳…" : "📸 Capturer"}
              </button>
            )}
            {captureMode === "video" && phase === "live" && (
              <button onClick={startRecording} style={{ flex:2, padding:"11px", borderRadius:12, border:"none", background:T2.red, color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:13 }}>
                ⏺ Démarrer l'enregistrement
              </button>
            )}
            {phase === "recording" && (
              <button onClick={stopRecording} style={{ flex:2, padding:"11px", borderRadius:12, border:"none", background:T2.red, color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:13 }}>
                ⏹ Arrêter
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "review" && result && (
        <div>
          <div style={{ borderRadius:14, overflow:"hidden", background:"#000" }}>
            {result.type === "photo" ? (
              <img src={result.previewUrl} alt="aperçu" style={{ width:"100%", maxHeight:360, objectFit:"contain", display:"block" }}/>
            ) : (
              <video src={result.previewUrl} controls playsInline style={{ width:"100%", maxHeight:360, display:"block" }}/>
            )}
          </div>
          {result.type === "video" && (
            <div style={{ textAlign:"center", marginTop:6, fontSize:10.5, color:T2.sub }}>{result.durationSec}s</div>
          )}
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={retake} style={{ flex:1, padding:"11px", borderRadius:12, border:`1px solid ${T2.border}`, background:T2.c2, color:T2.sub2, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:12 }}>
              🔄 Recommencer
            </button>
            <button onClick={discard} style={{ flex:1, padding:"11px", borderRadius:12, border:`1px solid ${T2.red}44`, background:`${T2.red}12`, color:T2.red, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:12 }}>
              🗑️ Supprimer
            </button>
            <button onClick={confirm} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background:accent, color:T2.ink, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:12 }}>
              ✅ Confirmer
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ── Helpers ──

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function getVideoDuration(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(v.duration);
    v.onerror = reject;
    v.src = url;
  });
}

// Génère une miniature JPEG depuis la 1ère frame utile d'une vidéo,
// aucun traitement serveur nécessaire.
function generateVideoThumbnail(videoUrl) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.src = videoUrl;
    v.onloadeddata = () => {
      try {
        v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
      } catch(_) { captureFrame(); }
    };
    v.onseeked = captureFrame;
    v.onerror = reject;
    function captureFrame() {
      try {
        const canvas = drawToCanvas(v, v.videoWidth || 400, v.videoHeight || 400);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      } catch(e) { reject(e); }
    }
  });
}
