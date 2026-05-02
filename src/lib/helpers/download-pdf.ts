async function htmlToPdf(html: string, filename: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  const renderWidth = 794; // A4 width in px at 96dpi
  const renderHeight = 1123; // A4 height in px at 96dpi

  // Create a hidden iframe to render the HTML
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = `${renderWidth}px`;
  iframe.style.height = `${renderHeight}px`;
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Could not access iframe document");

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content to render
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      // Fallback timeout in case onload doesn't fire
      setTimeout(resolve, 1500);
    });

    // Wait a bit more for styles/images
    await new Promise((r) => setTimeout(r, 500));

    const body = iframeDoc.body;

    // Capture the rendered HTML as a canvas
    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: renderWidth,
      windowWidth: renderWidth,
      windowHeight: renderHeight,
    });

    // Generate PDF from canvas
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasRatio = canvas.height / canvas.width;
    const fullWidthHeight = pdfWidth * canvasRatio;
    const renderPdfWidth = fullWidthHeight > pdfHeight ? pdfHeight / canvasRatio : pdfWidth;
    const renderPdfHeight = fullWidthHeight > pdfHeight ? pdfHeight : fullWidthHeight;
    const x = (pdfWidth - renderPdfWidth) / 2;

    pdf.addImage(imgData, "PNG", x, 0, renderPdfWidth, renderPdfHeight);

    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Downloads an invoice as a PDF by fetching its HTML,
 * rendering it in a hidden iframe, capturing with html2canvas,
 * and generating a PDF with jsPDF — all without leaving the page.
 */
export async function downloadInvoicePdf(
  invoiceId: string,
  invoiceNumber?: string
): Promise<void> {
  const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
  if (!res.ok) throw new Error("Failed to fetch invoice");
  const html = await res.text();
  const filename = invoiceNumber ? `${invoiceNumber}.pdf` : `invoice-${invoiceId}.pdf`;
  await htmlToPdf(html, filename);
}

/**
 * Downloads a duty slip as a PDF using the same render pipeline as invoices.
 */
export async function downloadDutySlipPdf(
  dutySlipId: string,
  bookingId?: string
): Promise<void> {
  const res = await fetch(`/api/duty-slips/${dutySlipId}/pdf`);
  if (!res.ok) throw new Error("Failed to fetch duty slip");
  const html = await res.text();
  const filename = bookingId ? `duty-slip-${bookingId}.pdf` : `duty-slip-${dutySlipId}.pdf`;
  await htmlToPdf(html, filename);
}
