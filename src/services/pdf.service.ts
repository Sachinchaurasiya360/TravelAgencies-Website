// PDF invoice generation using HTML template
// This generates an HTML string that can be converted to PDF

import { formatCurrency } from "@/lib/helpers/currency";

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyPhone: string;
  companyEmail: string;
  companyState: string;
  companyStateCode: string;
  customerName: string;
  customerAddress: string | null;
  customerPhone: string;
  customerEmail: string | null;
  customerGstin: string | null;
  serviceDescription: string;
  sacCode: string;
  subtotal: number | string;
  tollCharges: number | string;
  parkingCharges: number | string;
  driverAllowance: number | string;
  extraCharges: number | string;
  extraChargesNote?: string | null;
  discount: number | string;
  grandTotal: number | string;
  amountInWords: string | null;
  amountPaid: number | string;
  balanceDue: number | string;
  termsAndConditions: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankAccountName?: string | null;
  upiId?: string | null;
  estimatedDistance?: number | string | null;
  actualDistance?: number | string | null;
  startKm?: number | string | null;
  endKm?: number | string | null;
  startDateTime?: Date | string | null;
  endDateTime?: Date | string | null;
  signatureData?: string | null;
  signedAt?: Date | string | null;
  dutySlipSignatureData?: string | null;
  dutySlipSignedAt?: Date | string | null;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const invoiceDate = new Date(data.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const companyNameUpper = data.companyName.toUpperCase();

  const hasToll = Number(data.tollCharges) > 0;
  const hasParking = Number(data.parkingCharges) > 0;
  const hasDriverAllowance = Number(data.driverAllowance) > 0;
  const hasExtraCharges = Number(data.extraCharges) > 0;
  const hasDiscount = Number(data.discount) > 0;
  const hasBank = !!data.bankName;

  // Build trip detail parts
  const tripParts: string[] = [];
  if (data.startKm != null && data.endKm != null) {
    tripParts.push(`${Number(data.startKm).toLocaleString("en-IN")} km → ${Number(data.endKm).toLocaleString("en-IN")} km (${(Number(data.endKm) - Number(data.startKm)).toLocaleString("en-IN")} km)`);
  } else if (Number(data.actualDistance || data.estimatedDistance || 0) > 0) {
    tripParts.push(`Distance: ${Number(data.actualDistance || data.estimatedDistance).toLocaleString("en-IN")} km`);
  }
  if (data.startDateTime) tripParts.push(`Start: ${new Date(data.startDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);
  if (data.endDateTime) tripParts.push(`End: ${new Date(data.endDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);

  const tripDetail = tripParts.length > 0
    ? `<div class="trip-detail">${tripParts.join(" &bull; ")}</div>`
    : "";

  // Build charge rows for summary
  const chargeRows: string[] = [];
  chargeRows.push(summaryRow("Base Fare", formatCurrency(data.subtotal)));
  if (hasToll) chargeRows.push(summaryRow("FastTag / Toll", formatCurrency(data.tollCharges)));
  if (hasParking) chargeRows.push(summaryRow("Parking", formatCurrency(data.parkingCharges)));
  if (hasDriverAllowance) chargeRows.push(summaryRow("Driver Allowance", formatCurrency(data.driverAllowance)));
  if (hasExtraCharges) chargeRows.push(summaryRow(data.extraChargesNote || "Other Charges", formatCurrency(data.extraCharges)));
  if (hasDiscount) chargeRows.push(summaryRow("Discount", `- ${formatCurrency(data.discount)}`, "#059669"));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      padding: 48px 32px 32px;
      line-height: 1.4;
      max-width: 794px;
    }

    /* ---- Header ---- */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 18px;
      margin-bottom: 24px;
      border-bottom: 3px solid #ea580c;
    }
    .company-name {
      font-size: 20px;
      font-weight: 800;
      color: #ea580c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-detail {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.5;
    }
    .invoice-block { text-align: right; }
    .invoice-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-number {
      font-size: 12px;
      font-weight: 700;
      color: #ea580c;
      margin-top: 2px;
    }
    .invoice-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-meta strong { color: #334155; }

    /* ---- Bill To ---- */
    .bill-to {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 22px;
    }
    .bill-to-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .bill-to-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .bill-to-info {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.5;
    }

    /* ---- Service Table ---- */
    .table-wrapper {
      margin-bottom: 22px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #0f172a;
      color: #fff;
      padding: 8px 12px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: left;
    }
    thead th.ar { text-align: right; }
    tbody td {
      padding: 8px 12px;
      font-size: 11px;
    }
    .ar { text-align: right; }
    .trip-detail {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }

    /* ---- Summary ---- */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-table {
      width: 300px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .s-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f1f5f9;
    }
    .s-row:last-child { border-bottom: none; }
    .s-row .lbl { color: #64748b; }
    .s-row .val { font-weight: 600; color: #1e293b; }
    .s-grand {
      background: #ea580c;
      color: #fff;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
    }
    .s-paid {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11px;
      color: #059669;
      font-weight: 600;
      border-bottom: 1px solid #f1f5f9;
    }
    .s-due {
      background: #fef2f2;
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-weight: 600;
      font-size: 11px;
      color: #dc2626;
    }

    /* ---- Amount in Words ---- */
    .amount-words {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 10px;
      font-style: italic;
      color: #92400e;
      margin-bottom: 20px;
    }
    .amount-words strong { font-style: normal; color: #78350f; }

    /* ---- Bank Details ---- */
    .bank-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 20px;
      background: #f8fafc;
    }
    .bank-title {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
    }
    .bank-lbl { font-size: 9px; color: #94a3b8; }
    .bank-val { font-size: 11px; font-weight: 600; color: #1e293b; }

    /* ---- Signatures ---- */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 28px;
      padding-top: 16px;
    }
    .sig-box { text-align: center; width: 44%; }
    .sig-area {
      height: 56px;
      border-bottom: 2px solid #cbd5e1;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .sig-label {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sig-date {
      font-size: 8px;
      color: #059669;
      margin-top: 2px;
      font-weight: 500;
    }
    .sig-company {
      font-size: 12px;
      font-weight: 700;
      color: #ea580c;
      font-style: italic;
      padding-bottom: 4px;
      text-transform: uppercase;
    }

    /* ---- Terms ---- */
    .terms {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .terms-title {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .terms-text {
      font-size: 9px;
      color: #94a3b8;
      line-height: 1.5;
      white-space: pre-line;
    }

    /* ---- Footer ---- */
    .footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 2px solid #ea580c;
      font-size: 11px;
      color: #64748b;
    }
    .footer strong { color: #ea580c; }

    @media print {
      body { padding: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${companyNameUpper}</div>
      <div class="company-detail">
        ${data.companyAddress}
        ${data.companyPhone ? `<br>Phone: ${data.companyPhone}` : ""}
        ${data.companyEmail ? ` | Email: ${data.companyEmail}` : ""}
        ${data.companyState ? `<br>State: ${data.companyState}${data.companyStateCode ? ` (${data.companyStateCode})` : ""}` : ""}
      </div>
    </div>
    <div class="invoice-block">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number">${data.invoiceNumber}</div>
      <div class="invoice-meta"><strong>Date:</strong> ${invoiceDate}</div>
    </div>
  </div>

  <!-- Bill To -->
  <div class="bill-to">
    <div class="bill-to-label">Bill To</div>
    <div class="bill-to-name">${data.customerName}</div>
    <div class="bill-to-info">
      ${data.customerAddress ? `${data.customerAddress}<br>` : ""}Phone: ${data.customerPhone}${data.customerEmail ? ` | Email: ${data.customerEmail}` : ""}
    </div>
  </div>

  <!-- Service Table -->
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th style="width: 32px;">#</th>
          <th>Description</th>
          <th class="ar" style="width: 110px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            ${data.serviceDescription}
            ${tripDetail}
          </td>
          <td class="ar" style="font-weight: 600;">${formatCurrency(data.subtotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Summary -->
  <div class="summary-section">
    <div class="summary-table">
      ${chargeRows.join("")}
      <div class="s-grand">
        <span>Grand Total</span>
        <span>${formatCurrency(data.grandTotal)}</span>
      </div>
      ${Number(data.amountPaid) > 0 ? `
      <div class="s-paid">
        <span>Amount Paid</span>
        <span>${formatCurrency(data.amountPaid)}</span>
      </div>` : ""}
      ${Number(data.balanceDue) > 0 ? `
      <div class="s-due">
        <span>Balance Due</span>
        <span>${formatCurrency(data.balanceDue)}</span>
      </div>` : ""}
    </div>
  </div>

  <!-- Amount in Words -->
  ${data.amountInWords ? `
  <div class="amount-words">
    <strong>Amount in words:</strong> ${data.amountInWords}
  </div>` : ""}

  <!-- Bank Details -->
  ${hasBank ? `
  <div class="bank-card">
    <div class="bank-title">Bank Details</div>
    <div class="bank-grid">
      <div><div class="bank-lbl">Bank Name</div><div class="bank-val">${data.bankName}</div></div>
      <div><div class="bank-lbl">Account Name</div><div class="bank-val">${data.bankAccountName || "-"}</div></div>
      <div><div class="bank-lbl">Account Number</div><div class="bank-val">${data.bankAccountNumber || "-"}</div></div>
      <div><div class="bank-lbl">IFSC Code</div><div class="bank-val">${data.bankIfscCode || "-"}</div></div>
      ${data.upiId ? `<div><div class="bank-lbl">UPI ID</div><div class="bank-val">${data.upiId}</div></div>` : ""}
    </div>
  </div>` : ""}

  <!-- Signatures -->
  ${renderSignatures(data, companyNameUpper)}

  <!-- Terms -->
  ${data.termsAndConditions ? `
  <div class="terms">
    <div class="terms-title">Terms & Conditions</div>
    <div class="terms-text">${data.termsAndConditions}</div>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    Thank you for choosing <strong>${companyNameUpper}</strong>
  </div>

</body>
</html>`;
}

function renderSignatures(data: InvoiceData, companyNameUpper: string): string {
  const sig = data.dutySlipSignatureData || data.signatureData;
  const sigDate = data.dutySlipSignedAt || data.signedAt;

  const sigImg = sig && sig.startsWith("data:image/")
    ? `<img src="${sig.replace(/"/g, "&quot;")}" alt="Customer Signature" style="max-width: 160px; max-height: 50px;" />`
    : "";
  const sigDateStr = sigDate
    ? `<div class="sig-date">Signed on ${new Date(sigDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>`
    : "";

  return `<div class="signatures">
    <div class="sig-box">
      <div class="sig-area">${sigImg}</div>
      <div class="sig-label">Customer Signature</div>
      ${sigDateStr}
    </div>
    <div class="sig-box">
      <div class="sig-area">
        <div class="sig-company">${companyNameUpper}</div>
      </div>
      <div class="sig-label">Authorized Signatory</div>
    </div>
  </div>`;
}

function summaryRow(label: string, value: string, color?: string): string {
  return `<div class="s-row">
    <span class="lbl">${label}</span>
    <span class="val"${color ? ` style="color:${color}"` : ""}>${value}</span>
  </div>`;
}
