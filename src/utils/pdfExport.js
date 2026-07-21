import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ══════════════════════════════════════════════════════════════
//  Génère un vrai fichier PDF téléchargeable à partir d'un fragment
//  HTML (facture, reçu…), remplace window.print()/CSS @media print,
//  dont le comportement est trop inconsistant sur les navigateurs
//  mobiles (page blanche, ouverture d'un onglet séparé). Le rendu se
//  fait hors-écran avec html2canvas, puis l'image est intégrée dans
//  un PDF téléchargé directement, sans dialogue d'impression natif.
// ══════════════════════════════════════════════════════════════
export async function downloadPdfFromHtml(html, filename) {
  const container = document.createElement("div");
  container.id = "print-area";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "740px";
  container.style.background = "#fff";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Laisser le temps aux images (QR code, etc.) de charger avant capture
    const imgs = Array.from(container.querySelectorAll("img"));
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
      img.onload = res; img.onerror = res;
      setTimeout(res, 2000);
    })));

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
