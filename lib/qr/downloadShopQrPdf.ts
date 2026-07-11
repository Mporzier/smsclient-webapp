/** Génère un PDF A4 prêt à imprimer avec le QR code boutique. */
export async function downloadShopQrPdf(options: {
  qrDataUrl: string;
  publicUrl: string;
  companyName?: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;

  const brand = {
    blue: [47, 111, 237] as const,
    blueDark: [37, 88, 190] as const,
    blueSoft: [239, 246, 255] as const,
    blueBorder: [191, 219, 254] as const,
    slate900: [15, 23, 42] as const,
    slate600: [71, 85, 105] as const,
    slate400: [148, 163, 184] as const,
    slate100: [241, 245, 249] as const,
    white: [255, 255, 255] as const,
  };

  // Fond léger sur toute la page
  doc.setFillColor(...brand.slate100);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Bandeau haut
  const headerH = 36;
  doc.setFillColor(...brand.blue);
  doc.rect(0, 0, pageWidth, headerH, "F");
  doc.setFillColor(...brand.blueDark);
  doc.rect(0, headerH - 6, pageWidth, 6, "F");

  doc.setTextColor(...brand.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("smsclient.fr", pageWidth / 2, 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("QR code boutique", pageWidth / 2, 21, { align: "center" });

  const company = options.companyName?.trim();
  const contentTop = headerH + 18;
  let y = contentTop;

  // Carte principale blanche
  const mainCardW = pageWidth - margin * 2;
  const mainCardX = margin;
  const mainCardY = contentTop - 6;
  const mainCardH = 200;

  doc.setFillColor(...brand.white);
  doc.setDrawColor(...brand.blueBorder);
  doc.setLineWidth(0.35);
  doc.roundedRect(mainCardX, mainCardY, mainCardW, mainCardH, 5, 5, "FD");

  y = mainCardY + 16;

  if (company) {
    doc.setTextColor(...brand.blue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(company, pageWidth / 2, y, { align: "center" });
    y += 11;
  }

  doc.setTextColor(...brand.slate900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Scannez pour nous rejoindre", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...brand.slate600);
  const subtitle = doc.splitTextToSize(
    "Inscrivez-vous en quelques secondes avec votre mobile — sans application à installer.",
    mainCardW - 24,
  );
  doc.text(subtitle, pageWidth / 2, y, { align: "center" });
  y += subtitle.length * 5 + 10;

  // Carte QR
  const qrSize = 82;
  const qrPad = 10;
  const qrCardSize = qrSize + qrPad * 2;
  const qrCardX = (pageWidth - qrCardSize) / 2;

  doc.setFillColor(226, 232, 240);
  doc.roundedRect(qrCardX + 1.2, y + 1.2, qrCardSize, qrCardSize, 6, 6, "F");

  doc.setFillColor(...brand.blueSoft);
  doc.setDrawColor(...brand.blueBorder);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrCardX, y, qrCardSize, qrCardSize, 6, 6, "FD");

  doc.setFillColor(...brand.white);
  doc.roundedRect(
    qrCardX + qrPad - 1,
    y + qrPad - 1,
    qrSize + 2,
    qrSize + 2,
    3,
    3,
    "F",
  );
  doc.addImage(
    options.qrDataUrl,
    "PNG",
    qrCardX + qrPad,
    y + qrPad,
    qrSize,
    qrSize,
  );
  y += qrCardSize + 14;

  // URL sans libellé « Lien direct »
  const urlBoxW = mainCardW - 28;
  const urlBoxX = (pageWidth - urlBoxW) / 2;
  const urlLines = doc.splitTextToSize(options.publicUrl, urlBoxW - 12);
  const urlBoxH = Math.max(14, urlLines.length * 4.2 + 8);

  doc.setFillColor(...brand.slate100);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(urlBoxX, y, urlBoxW, urlBoxH, 3, 3, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(...brand.slate400);
  doc.text(urlLines, pageWidth / 2, y + 5.5, { align: "center" });

  // Pied de page
  const footerY = pageHeight - 18;
  doc.setDrawColor(...brand.blueBorder);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  doc.setFontSize(8);
  doc.setTextColor(...brand.slate400);
  doc.text(
    "Affichez ce document en boutique · Impression A4 recommandée",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  const filename = company
    ? `qr-boutique-${slugifyFilename(company)}.pdf`
    : `qr-boutique-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function slugifyFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
