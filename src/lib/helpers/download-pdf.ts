/**
 * Downloads an invoice as a PDF by fetching its HTML,
 * rendering it in a hidden iframe, capturing with html2canvas,
 * and generating a PDF with jsPDF — all without leaving the page.
 */
export async function downloadInvoicePdf(
  invoiceId: string,
  invoiceNumber?: string
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas-pro");
  const { jsPDF } = await import("jspdf");

  // Fetch the invoice HTML from the server
  const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
  if (!res.ok) throw new Error("Failed to fetch invoice");
  const html = await res.text();

  // Create a hidden iframe to render the HTML
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px"; // A4 width in px at 96dpi
  iframe.style.height = "1123px"; // A4 height
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
      width: 794,
      windowWidth: 794,
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
    const imgHeight = pdfWidth * canvasRatio;

    // Handle multi-page if content exceeds one page
    let yOffset = 0;
    let remainingHeight = imgHeight;

    while (remainingHeight > 0) {
      if (yOffset > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        0,
        -yOffset,
        pdfWidth,
        imgHeight
      );

      yOffset += pdfHeight;
      remainingHeight -= pdfHeight;
    }

    // Download the PDF
    const filename = invoiceNumber
      ? `${invoiceNumber}.pdf`
      : `invoice-${invoiceId}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
