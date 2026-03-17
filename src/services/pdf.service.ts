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
  cgstRate: number | string;
  sgstRate: number | string;
  igstRate: number | string;
  cgstAmount: number | string;
  sgstAmount: number | string;
  igstAmount: number | string;
  totalTax: number | string;
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
  isInterState: boolean;
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
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const invoiceDate = new Date(data.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const dueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const hasToll = Number(data.tollCharges) > 0;
  const hasParking = Number(data.parkingCharges) > 0;
  const hasDriverAllowance = Number(data.driverAllowance) > 0;
  const hasExtraCharges = Number(data.extraCharges) > 0;
  const hasDiscount = Number(data.discount) > 0;
  const hasTax = Number(data.totalTax) > 0;
  const hasBank = !!data.bankName;
  const hasKmData = data.startKm != null && data.endKm != null;
  const hasDistanceData = !hasKmData && Number(data.actualDistance || data.estimatedDistance || 0) > 0;
  const hasTimeData = !!data.startDateTime || !!data.endDateTime;
  const hasTripDetails = hasKmData || hasDistanceData || hasTimeData;

  // Build additional charges rows
  const additionalRows: string[] = [];
  if (hasToll) additionalRows.push(row("FastTag / Toll Charges", formatCurrency(data.tollCharges)));
  if (hasParking) additionalRows.push(row("Parking Charges", formatCurrency(data.parkingCharges)));
  if (hasDriverAllowance) additionalRows.push(row("Driver Allowance", formatCurrency(data.driverAllowance)));
  if (hasExtraCharges) additionalRows.push(row(data.extraChargesNote || "Other Charges", formatCurrency(data.extraCharges)));
  if (hasDiscount) additionalRows.push(row("Discount", `- ${formatCurrency(data.discount)}`, "#059669"));

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
      padding: 32px;
      line-height: 1.5;
    }

    /* ---- Header ---- */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      margin-bottom: 24px;
      border-bottom: 3px solid #ea580c;
    }
    .company-block {}
    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: #ea580c;
      letter-spacing: -0.3px;
    }
    .company-detail {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.6;
    }
    .gstin-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      font-weight: 600;
      color: #ea580c;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .invoice-block { text-align: right; }
    .invoice-title {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .invoice-meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-meta strong {
      color: #334155;
    }
    .invoice-number {
      font-size: 13px;
      font-weight: 700;
      color: #ea580c;
      margin-top: 6px;
    }

    /* ---- Parties ---- */
    .parties {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
    }
    .party-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .party-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .party-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.6;
    }

    /* ---- Trip Details Strip ---- */
    .trip-strip {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .trip-item {
      flex: 1;
      padding: 10px 14px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
    }
    .trip-item:last-child { border-right: none; }
    .trip-item-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
    }
    .trip-item-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 2px;
    }

    /* ---- Table ---- */
    .table-wrapper {
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead th {
      background: #0f172a;
      color: #fff;
      padding: 10px 14px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      text-align: left;
    }
    thead th.ar { text-align: right; }
    tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    tbody tr:last-child td { border-bottom: none; }
    .ar { text-align: right; }

    /* ---- Summary ---- */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-table {
      width: 340px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row .label { color: #64748b; }
    .summary-row .value { font-weight: 600; color: #1e293b; }
    .summary-grand {
      background: #ea580c;
      color: #fff;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 700;
    }
    .summary-balance {
      background: #fef2f2;
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 12px;
      color: #dc2626;
    }
    .summary-paid {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      color: #059669;
      font-weight: 600;
      border-bottom: 1px solid #f1f5f9;
    }

    /* ---- Amount in Words ---- */
    .amount-words {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 11px;
      font-style: italic;
      color: #92400e;
      margin-bottom: 20px;
    }
    .amount-words strong { font-style: normal; color: #78350f; }

    /* ---- Bank Details ---- */
    .bank-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 20px;
      background: #f8fafc;
    }
    .bank-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 24px;
    }
    .bank-item-label {
      font-size: 10px;
      color: #94a3b8;
    }
    .bank-item-value {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }

    /* ---- Signatures ---- */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 20px;
    }
    .sig-box {
      text-align: center;
      width: 44%;
    }
    .sig-area {
      height: 72px;
      border-bottom: 2px solid #cbd5e1;
      margin-bottom: 8px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .sig-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sig-date {
      font-size: 9px;
      color: #059669;
      margin-top: 3px;
      font-weight: 500;
    }
    .sig-company {
      font-size: 14px;
      font-weight: 700;
      color: #ea580c;
      font-style: italic;
      padding-bottom: 4px;
    }

    /* ---- Terms ---- */
    .terms {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
    }
    .terms-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .terms-text {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.6;
      white-space: pre-line;
    }

    /* ---- Thank You ---- */
    .thank-you {
      text-align: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #ea580c;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .thank-you strong { color: #ea580c; }

    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="company-block">
      <div class="company-name">${data.companyName}</div>
      <div class="company-detail">
        ${data.companyAddress}
        ${data.companyPhone ? `<br>Phone: ${data.companyPhone}` : ""}
        ${data.companyEmail ? `&nbsp;&nbsp;|&nbsp;&nbsp;Email: ${data.companyEmail}` : ""}
        ${data.companyState ? `<br>State: ${data.companyState}${data.companyStateCode ? ` (${data.companyStateCode})` : ""}` : ""}
      </div>
      ${data.companyGstin ? `<div class="gstin-badge">GSTIN: ${data.companyGstin}</div>` : ""}
    </div>
    <div class="invoice-block">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number">${data.invoiceNumber}</div>
      <div class="invoice-meta">
        <strong>Date:</strong> ${invoiceDate}
        ${dueDate ? `<br><strong>Due:</strong> ${dueDate}` : ""}
      </div>
    </div>
  </div>

  <!-- Bill To / Company -->
  <div class="parties">
    <div class="party-card">
      <div class="party-label">Bill To</div>
      <div class="party-name">${data.customerName}</div>
      <div class="party-info">
        ${data.customerAddress ? `${data.customerAddress}<br>` : ""}
        Phone: ${data.customerPhone}
        ${data.customerEmail ? `<br>Email: ${data.customerEmail}` : ""}
        ${data.customerGstin ? `<br>GSTIN: ${data.customerGstin}` : ""}
      </div>
    </div>
    <div class="party-card">
      <div class="party-label">From</div>
      <div class="party-name">${data.companyName}</div>
      <div class="party-info">
        ${data.companyAddress}
        ${data.companyGstin ? `<br>GSTIN: ${data.companyGstin}` : ""}
      </div>
    </div>
  </div>

  <!-- Trip Details -->
  ${hasTripDetails ? `
  <div class="trip-strip">
    ${hasKmData ? `
    <div class="trip-item">
      <div class="trip-item-label">Start KM</div>
      <div class="trip-item-value">${Number(data.startKm).toLocaleString("en-IN")}</div>
    </div>
    <div class="trip-item">
      <div class="trip-item-label">End KM</div>
      <div class="trip-item-value">${Number(data.endKm).toLocaleString("en-IN")}</div>
    </div>
    <div class="trip-item">
      <div class="trip-item-label">Total Distance</div>
      <div class="trip-item-value">${(Number(data.endKm) - Number(data.startKm)).toLocaleString("en-IN")} km</div>
    </div>` : ""}
    ${hasDistanceData ? `
    <div class="trip-item">
      <div class="trip-item-label">Total Distance</div>
      <div class="trip-item-value">${Number(data.actualDistance || data.estimatedDistance).toLocaleString("en-IN")} km</div>
    </div>` : ""}
    ${data.startDateTime ? `
    <div class="trip-item">
      <div class="trip-item-label">Start Time</div>
      <div class="trip-item-value">${new Date(data.startDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
    </div>` : ""}
    ${data.endDateTime ? `
    <div class="trip-item">
      <div class="trip-item-label">End Time</div>
      <div class="trip-item-value">${new Date(data.endDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
    </div>` : ""}
  </div>` : ""}

  <!-- Service Table -->
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th style="width: 36px;">#</th>
          <th>Service Description</th>
          <th style="width: 80px;">SAC</th>
          <th class="ar" style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${data.serviceDescription}</td>
          <td>${data.sacCode}</td>
          <td class="ar" style="font-weight: 600;">${formatCurrency(data.subtotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Summary -->
  <div class="summary-section">
    <div class="summary-table">
      <div class="summary-row">
        <span class="label">Subtotal</span>
        <span class="value">${formatCurrency(data.subtotal)}</span>
      </div>
      ${hasTax ? (
        !data.isInterState
          ? `<div class="summary-row">
              <span class="label">CGST @ ${data.cgstRate}%</span>
              <span class="value">${formatCurrency(data.cgstAmount)}</span>
            </div>
            <div class="summary-row">
              <span class="label">SGST @ ${data.sgstRate}%</span>
              <span class="value">${formatCurrency(data.sgstAmount)}</span>
            </div>`
          : `<div class="summary-row">
              <span class="label">IGST @ ${data.igstRate}%</span>
              <span class="value">${formatCurrency(data.igstAmount)}</span>
            </div>`
      ) : ""}
      ${additionalRows.join("")}
      <div class="summary-grand">
        <span>Grand Total</span>
        <span>${formatCurrency(data.grandTotal)}</span>
      </div>
      ${Number(data.amountPaid) > 0 ? `
      <div class="summary-paid">
        <span>Amount Paid</span>
        <span>${formatCurrency(data.amountPaid)}</span>
      </div>` : ""}
      ${Number(data.balanceDue) > 0 ? `
      <div class="summary-balance">
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
      <div>
        <div class="bank-item-label">Bank Name</div>
        <div class="bank-item-value">${data.bankName}</div>
      </div>
      <div>
        <div class="bank-item-label">Account Name</div>
        <div class="bank-item-value">${data.bankAccountName || "-"}</div>
      </div>
      <div>
        <div class="bank-item-label">Account Number</div>
        <div class="bank-item-value">${data.bankAccountNumber || "-"}</div>
      </div>
      <div>
        <div class="bank-item-label">IFSC Code</div>
        <div class="bank-item-value">${data.bankIfscCode || "-"}</div>
      </div>
      ${data.upiId ? `
      <div>
        <div class="bank-item-label">UPI ID</div>
        <div class="bank-item-value">${data.upiId}</div>
      </div>` : ""}
    </div>
  </div>` : ""}

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-area">
        ${data.signatureData && data.signatureData.startsWith("data:image/")
          ? `<img src="${data.signatureData.replace(/"/g, "&quot;")}" alt="Customer Signature" style="max-width: 180px; max-height: 64px;" />`
          : ""}
      </div>
      <div class="sig-label">Customer Signature</div>
      ${data.signedAt ? `<div class="sig-date">Signed on ${new Date(data.signedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>` : ""}
    </div>
    <div class="sig-box">
      <div class="sig-area">
        <div class="sig-company">${data.companyName}</div>
      </div>
      <div class="sig-label">Authorized Signatory</div>
    </div>
  </div>

  <!-- Terms -->
  ${data.termsAndConditions ? `
  <div class="terms">
    <div class="terms-title">Terms & Conditions</div>
    <div class="terms-text">${data.termsAndConditions}</div>
  </div>` : ""}

  <!-- Thank You -->
  <div class="thank-you">
    Thank you for choosing <strong>${data.companyName}</strong>
  </div>

</body>
</html>`;
}

function row(label: string, value: string, color?: string): string {
  return `<div class="summary-row">
    <span class="label">${label}</span>
    <span class="value"${color ? ` style="color:${color}"` : ""}>${value}</span>
  </div>`;
}
