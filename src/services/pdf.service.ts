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
    tripParts.push(`${Number(data.startKm).toLocaleString("en-IN")} km &rarr; ${Number(data.endKm).toLocaleString("en-IN")} km &nbsp;&bull;&nbsp; ${(Number(data.endKm) - Number(data.startKm)).toLocaleString("en-IN")} km covered`);
  } else if (Number(data.actualDistance || data.estimatedDistance || 0) > 0) {
    tripParts.push(`Distance: ${Number(data.actualDistance || data.estimatedDistance).toLocaleString("en-IN")} km`);
  }
  if (data.startDateTime) tripParts.push(`Departed: ${new Date(data.startDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);
  if (data.endDateTime) tripParts.push(`Arrived: ${new Date(data.endDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`);

  const tripDetail = tripParts.length > 0
    ? `<div class="trip-detail">${tripParts.join(" &nbsp;|&nbsp; ")}</div>`
    : "";

  // Build charge rows for summary
  const chargeRows: string[] = [];
  chargeRows.push(summaryRow("Base Fare", formatCurrency(data.subtotal)));
  if (hasToll) chargeRows.push(summaryRow("FastTag / Toll", formatCurrency(data.tollCharges)));
  if (hasParking) chargeRows.push(summaryRow("Parking", formatCurrency(data.parkingCharges)));
  if (hasDriverAllowance) chargeRows.push(summaryRow("Driver Allowance", formatCurrency(data.driverAllowance)));
  if (hasExtraCharges) chargeRows.push(summaryRow(data.extraChargesNote || "Other Charges", formatCurrency(data.extraCharges)));
  if (hasDiscount) chargeRows.push(summaryRow("Discount", `&minus; ${formatCurrency(data.discount)}`, "#4ade80"));

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
      color: #e2e8f0;
      background: #0d0d0d;
      padding: 48px 40px 40px;
      line-height: 1.5;
      max-width: 794px;
    }

    /* ─── Gold accent ─── */
    :root {
      --gold: #c9a84c;
      --gold-light: #e2c472;
      --surface: #161616;
      --surface-2: #1e1e1e;
      --border: #2a2a2a;
      --border-gold: #3a3020;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #4b5563;
    }

    /* ─── Watermark ─── */
    body::before {
      content: "INVOICE";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 110px;
      font-weight: 900;
      letter-spacing: 20px;
      color: rgba(201, 168, 76, 0.04);
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
    }

    /* ─── Header ─── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 1px solid #2a2a2a;
      position: relative;
    }
    .header::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, #c9a84c, transparent);
    }

    .company-name {
      font-size: 22px;
      font-weight: 800;
      color: #c9a84c;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .company-tagline {
      font-size: 9px;
      color: #4b5563;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .company-detail {
      font-size: 10px;
      color: #64748b;
      margin-top: 10px;
      line-height: 1.7;
    }
    .company-detail span { color: #94a3b8; }

    .invoice-block { text-align: right; }
    .invoice-title {
      font-size: 32px;
      font-weight: 900;
      color: #f1f5f9;
      text-transform: uppercase;
      letter-spacing: 6px;
      line-height: 1;
    }
    .invoice-number {
      font-size: 11px;
      font-weight: 700;
      color: #c9a84c;
      margin-top: 6px;
      letter-spacing: 1.5px;
    }
    .invoice-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.7;
    }
    .invoice-meta strong { color: #94a3b8; }

    /* ─── Info Grid (Bill To + Invoice Details) ─── */
    .info-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
    }
    .info-card {
      flex: 1;
      background: #161616;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 16px 18px;
      position: relative;
      overflow: hidden;
    }
    .info-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0;
      width: 3px; height: 100%;
      background: linear-gradient(180deg, #c9a84c 0%, transparent 100%);
    }
    .info-card-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #c9a84c;
      margin-bottom: 10px;
    }
    .info-name {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 4px;
    }
    .info-detail {
      font-size: 10px;
      color: #64748b;
      line-height: 1.7;
    }
    .info-detail span { color: #94a3b8; }

    /* ─── Service Table ─── */
    .table-wrapper {
      margin-bottom: 8px;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr {
      background: linear-gradient(135deg, #1a1510 0%, #1e1e1e 100%);
      border-bottom: 1px solid #3a3020;
    }
    thead th {
      padding: 10px 14px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #c9a84c;
      text-align: left;
    }
    thead th.ar { text-align: right; }
    tbody tr { border-bottom: 1px solid #1e1e1e; }
    tbody tr:last-child { border-bottom: none; }
    tbody td {
      padding: 14px;
      font-size: 12px;
      color: #e2e8f0;
      background: #161616;
    }
    .ar { text-align: right; }
    .sac-badge {
      display: inline-block;
      background: #1e1e1e;
      border: 1px solid #2a2a2a;
      color: #64748b;
      font-size: 8px;
      padding: 1px 6px;
      border-radius: 3px;
      margin-left: 6px;
      letter-spacing: 0.5px;
    }
    .trip-detail {
      font-size: 10px;
      color: #64748b;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid #1e1e1e;
      letter-spacing: 0.3px;
    }

    /* ─── Summary ─── */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 22px;
      margin-top: 20px;
    }
    .summary-table {
      width: 310px;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
    }
    .s-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 14px;
      font-size: 11px;
      border-bottom: 1px solid #1e1e1e;
      background: #161616;
    }
    .s-row:last-child { border-bottom: none; }
    .s-row .lbl { color: #64748b; }
    .s-row .val { font-weight: 600; color: #e2e8f0; }
    .s-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #3a3020, transparent);
      margin: 0;
    }
    .s-grand {
      background: linear-gradient(135deg, #1a1510 0%, #2a2010 100%);
      border-top: 1px solid #3a3020;
      padding: 13px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .s-grand .g-label {
      font-size: 11px;
      font-weight: 700;
      color: #c9a84c;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .s-grand .g-value {
      font-size: 16px;
      font-weight: 900;
      color: #e2c472;
      letter-spacing: 0.5px;
    }
    .s-paid {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 11px;
      color: #4ade80;
      font-weight: 600;
      background: #0f1a12;
      border-top: 1px solid #1a2e1a;
    }
    .s-due {
      background: #1a0f0f;
      border-top: 1px solid #2e1a1a;
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-weight: 700;
      font-size: 12px;
      color: #f87171;
    }

    /* ─── Amount in Words ─── */
    .amount-words {
      background: #161616;
      border: 1px solid #2a2a2a;
      border-left: 3px solid #c9a84c;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 22px;
      font-style: italic;
    }
    .amount-words strong {
      font-style: normal;
      color: #c9a84c;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ─── Bank Details ─── */
    .bank-card {
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 22px;
    }
    .bank-header {
      background: linear-gradient(135deg, #1a1510 0%, #1e1e1e 100%);
      border-bottom: 1px solid #3a3020;
      padding: 8px 14px;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #c9a84c;
    }
    .bank-body {
      background: #161616;
      padding: 14px;
    }
    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .bank-item {}
    .bank-lbl { font-size: 8px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
    .bank-val { font-size: 11px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.3px; }

    /* ─── Signatures ─── */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      gap: 20px;
    }
    .sig-box {
      flex: 1;
      background: #161616;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 16px 18px;
      text-align: center;
    }
    .sig-area {
      height: 60px;
      border-bottom: 1px dashed #2a2a2a;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sig-placeholder {
      font-size: 9px;
      color: #2a2a2a;
      letter-spacing: 1px;
    }
    .sig-label {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .sig-date {
      font-size: 9px;
      color: #4ade80;
      margin-top: 4px;
      font-weight: 500;
    }
    .sig-company {
      font-size: 11px;
      font-weight: 800;
      color: #c9a84c;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* ─── Terms ─── */
    .terms {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid #1e1e1e;
    }
    .terms-title {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #c9a84c;
      margin-bottom: 6px;
    }
    .terms-text {
      font-size: 9px;
      color: #4b5563;
      line-height: 1.7;
      white-space: pre-line;
    }

    /* ─── Footer ─── */
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #1e1e1e;
      position: relative;
    }
    .footer::before {
      content: "";
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 1px;
      background: #c9a84c;
    }
    .footer-text {
      font-size: 10px;
      color: #4b5563;
      letter-spacing: 0.5px;
    }
    .footer-brand {
      font-size: 12px;
      font-weight: 800;
      color: #c9a84c;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    @media print {
      body { padding: 20px; background: #0d0d0d !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${companyNameUpper}</div>
      <div class="company-tagline">Premium Travel &amp; Transport Services</div>
      <div class="company-detail">
        <span>${data.companyAddress}</span>
        ${data.companyPhone ? `<br><span>${data.companyPhone}</span>` : ""}
        ${data.companyEmail ? ` &nbsp;&bull;&nbsp; <span>${data.companyEmail}</span>` : ""}
        ${data.companyState ? `<br><span>${data.companyState}${data.companyStateCode ? ` &mdash; ${data.companyStateCode}` : ""}</span>` : ""}
        ${data.companyGstin ? `<br>GSTIN: <span>${data.companyGstin}</span>` : ""}
      </div>
    </div>
    <div class="invoice-block">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number"># ${data.invoiceNumber}</div>
      <div class="invoice-meta"><strong>Date</strong> &nbsp; ${invoiceDate}</div>
      ${data.dueDate ? `<div class="invoice-meta"><strong>Due</strong> &nbsp;&nbsp;&nbsp; ${new Date(data.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>` : ""}
    </div>
  </div>

  <!-- Info Grid -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-label">Bill To</div>
      <div class="info-name">${data.customerName}</div>
      <div class="info-detail">
        ${data.customerAddress ? `${data.customerAddress}<br>` : ""}
        <span>${data.customerPhone}</span>
        ${data.customerEmail ? `<br><span>${data.customerEmail}</span>` : ""}
        ${data.customerGstin ? `<br>GSTIN: <span>${data.customerGstin}</span>` : ""}
      </div>
    </div>
    <div class="info-card">
      <div class="info-card-label">Invoice Details</div>
      <div class="info-detail" style="line-height:2;">
        <strong style="color:#64748b;">Number</strong> &nbsp; <span style="color:#e2c472; font-weight:700;">${data.invoiceNumber}</span><br>
        <strong style="color:#64748b;">Date</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span>${invoiceDate}</span><br>
        ${data.sacCode ? `<strong style="color:#64748b;">SAC</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span>${data.sacCode}</span><br>` : ""}
        ${data.customerGstin ? `<strong style="color:#64748b;">GSTIN</strong> &nbsp;&nbsp;&nbsp; <span>${data.customerGstin}</span>` : ""}
      </div>
    </div>
  </div>

  <!-- Service Table -->
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th style="width: 36px;">#</th>
          <th>Description of Service</th>
          <th class="ar" style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="color:#c9a84c; font-weight:700;">01</td>
          <td>
            <div style="font-weight:600; color:#f1f5f9;">${data.serviceDescription}<span class="sac-badge">SAC ${data.sacCode}</span></div>
            ${tripDetail}
          </td>
          <td class="ar" style="font-weight:700; color:#e2c472; font-size:13px;">${formatCurrency(data.subtotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Summary -->
  <div class="summary-section">
    <div class="summary-table">
      ${chargeRows.join("")}
      <div class="s-divider"></div>
      <div class="s-grand">
        <span class="g-label">Grand Total</span>
        <span class="g-value">${formatCurrency(data.grandTotal)}</span>
      </div>
      ${Number(data.amountPaid) > 0 ? `
      <div class="s-paid">
        <span>&#10003; Amount Paid</span>
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
    <strong>Amount in Words</strong> &nbsp;&mdash;&nbsp; ${data.amountInWords}
  </div>` : ""}

  <!-- Bank Details -->
  ${hasBank ? `
  <div class="bank-card">
    <div class="bank-header">Payment Details</div>
    <div class="bank-body">
      <div class="bank-grid">
        <div class="bank-item"><div class="bank-lbl">Bank Name</div><div class="bank-val">${data.bankName}</div></div>
        <div class="bank-item"><div class="bank-lbl">Account Name</div><div class="bank-val">${data.bankAccountName || "—"}</div></div>
        <div class="bank-item"><div class="bank-lbl">Account Number</div><div class="bank-val">${data.bankAccountNumber || "—"}</div></div>
        <div class="bank-item"><div class="bank-lbl">IFSC Code</div><div class="bank-val">${data.bankIfscCode || "—"}</div></div>
        ${data.upiId ? `<div class="bank-item"><div class="bank-lbl">UPI ID</div><div class="bank-val">${data.upiId}</div></div>` : ""}
      </div>
    </div>
  </div>` : ""}

  <!-- Signatures -->
  ${renderSignatures(data, companyNameUpper)}

  <!-- Terms -->
  ${data.termsAndConditions ? `
  <div class="terms">
    <div class="terms-title">Terms &amp; Conditions</div>
    <div class="terms-text">${data.termsAndConditions}</div>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">Thank you for choosing</div>
    <div class="footer-brand">${companyNameUpper}</div>
  </div>

</body>
</html>`;
}

function renderSignatures(data: InvoiceData, companyNameUpper: string): string {
  const sig = data.dutySlipSignatureData || data.signatureData;
  const sigDate = data.dutySlipSignedAt || data.signedAt;

  const sigImg = sig && sig.startsWith("data:image/")
    ? `<img src="${sig.replace(/"/g, "&quot;")}" alt="Customer Signature" style="max-width: 160px; max-height: 54px;" />`
    : `<span class="sig-placeholder">SIGN HERE</span>`;
  const sigDateStr = sigDate
    ? `<div class="sig-date">&#10003; Signed ${new Date(sigDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>`
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
