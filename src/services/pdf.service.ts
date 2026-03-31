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
  const invoiceDate = new Date(data.invoiceDate).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const hasToll = Number(data.tollCharges) > 0;
  const hasParking = Number(data.parkingCharges) > 0;
  const hasDriverAllowance = Number(data.driverAllowance) > 0;
  const hasExtraCharges = Number(data.extraCharges) > 0;
  const hasDiscount = Number(data.discount) > 0;
  const hasBank = !!data.bankName;
  const hasExtra = hasToll || hasParking || hasDriverAllowance || hasExtraCharges || hasDiscount;

  // Trip detail line
  const tripParts: string[] = [];
  if (data.startKm != null && data.endKm != null) {
    const dist = Number(data.endKm) - Number(data.startKm);
    tripParts.push(`${Number(data.startKm).toLocaleString("en-IN")} &rarr; ${Number(data.endKm).toLocaleString("en-IN")} km (${dist.toLocaleString("en-IN")} km)`);
  } else if (Number(data.actualDistance || data.estimatedDistance || 0) > 0) {
    tripParts.push(`${Number(data.actualDistance || data.estimatedDistance).toLocaleString("en-IN")} km`);
  }
  if (data.startDateTime) tripParts.push(new Date(data.startDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
  if (data.endDateTime) tripParts.push(new Date(data.endDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
  const tripLine = tripParts.join("  &middot;  ");

  // Signature
  const sig = data.dutySlipSignatureData || data.signatureData;
  const sigDate = data.dutySlipSignedAt || data.signedAt;
  const sigImg = sig && sig.startsWith("data:image/")
    ? `<img src="${sig.replace(/"/g, "&quot;")}" style="max-width:120px;max-height:40px;display:block;margin-bottom:4px;" />`
    : "";
  const sigDateStr = sigDate
    ? `<div style="font-size:9px;color:#999;margin-top:3px;">Signed ${new Date(sigDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; }

  .wrap {
    max-width: 700px;
    margin: 0 auto;
    padding: 48px 24px 56px;
    color: #1a1a1a;
    font-size: 12px;
    line-height: 1.5;
  }

  /* ── HEADER ── */
  .hdr-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .hdr-table td { vertical-align: top; padding: 0; }
  .hdr-table td:last-child { text-align: right; }

  .co-name {
    font-size: 20px;
    font-weight: 700;
    color: #111;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .co-meta { font-size: 11px; color: #555; line-height: 1.6; }

  .inv-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 6px;
  }
  .inv-num {
    font-size: 18px;
    font-weight: 700;
    color: #111;
    white-space: nowrap;
    margin-bottom: 4px;
  }
  .inv-date { font-size: 11px; color: #666; }

  .hdr-rule {
    border: none;
    border-top: 2px solid #111;
    margin: 16px 0 20px;
  }

  /* ── BILL TO ── */
  .bill-to-wrap {
    border-left: 3px solid #111;
    padding: 10px 14px;
    background: #fafafa;
    margin-bottom: 24px;
  }
  .bill-to-tag {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 5px;
  }
  .bill-to-name { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 3px; }
  .bill-to-detail { font-size: 11px; color: #555; line-height: 1.6; }

  /* ── ITEMS TABLE ── */
  .items { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items thead tr { border-bottom: 2px solid #111; }
  .items thead th {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #888;
    padding: 0 0 8px 0;
    text-align: left;
  }
  .items thead th.amt { text-align: right; width: 120px; }
  .items tbody tr { border-bottom: 1px solid #ebebeb; }
  .items tbody tr:last-child { border-bottom: 1px solid #ebebeb; }
  .items tbody td { padding: 14px 0; vertical-align: top; }
  .items tbody td.amt {
    text-align: right;
    font-size: 14px;
    font-weight: 700;
    color: #111;
    white-space: nowrap;
    width: 120px;
  }
  .item-title { font-size: 12px; font-weight: 600; color: #111; margin-bottom: 4px; }
  .item-sub { font-size: 10px; color: #aaa; }

  /* ── TOTALS ── */
  .totals-table {
    width: 260px;
    max-width: 100%;
    margin-left: auto;
    margin-top: 0;
    border-collapse: collapse;
  }
  .totals-table td {
    padding: 5px 0;
    font-size: 11px;
    color: #555;
    border-bottom: 1px solid #f2f2f2;
  }
  .totals-table td:last-child { text-align: right; font-weight: 500; color: #222; }
  .totals-table tr:last-child td { border-bottom: none; }
  .totals-rule { border: none; border-top: 1px solid #bbb; margin: 6px 0; }
  .total-row td { font-size: 13px !important; font-weight: 700 !important; color: #111 !important; padding-top: 8px !important; }
  .total-row td:first-child { font-size: 10px !important; letter-spacing: 1.5px; text-transform: uppercase; color: #666 !important; }
  .paid-row td { font-size: 11px; color: #555; border-top: 1px solid #e0e0e0; padding-top: 5px; }
  .due-row td {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #111 !important;
    border-top: 2px solid #111 !important;
    border-bottom: none !important;
    padding-top: 6px !important;
  }

  /* ── DIVIDER ── */
  .section-rule {
    border: none;
    border-top: 1px solid #ddd;
    margin: 16px 0 14px;
  }

  /* ── AMOUNT IN WORDS ── */
  .words-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 4px; }
  .words-val { font-size: 11px; color: #444; font-style: italic; line-height: 1.5; margin-bottom: 12px; }

  /* ── BANK DETAILS ── */
  .bank-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
  .bank-table { border-collapse: collapse; }
  .bank-table td { padding: 0 28px 0 0; vertical-align: top; }
  .bank-table td:last-child { padding-right: 0; }
  .bf-l { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .bf-v { font-size: 11px; font-weight: 600; color: #222; }

  /* ── SIGNATURES ── */
  .sig-table { width: 100%; border-collapse: collapse; margin-top: 32px; padding-top: 20px; }
  .sig-table td { vertical-align: bottom; width: 50%; padding: 0; }
  .sig-table td:last-child { text-align: right; }
  .sig-box { display: inline-block; width: 100%; }
  .sig-line {
    height: 46px;
    border-bottom: 1px solid #ccc;
    display: block;
    margin-bottom: 6px;
  }
  .sig-lbl { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #bbb; }
  .sig-co-name { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #333; margin-bottom: 2px; }

  /* ── TERMS ── */
  .terms-wrap { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8e8e8; }
  .terms-lbl { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #aaa; margin-bottom: 6px; }
  .terms-text { font-size: 9.5px; color: #aaa; line-height: 1.75; white-space: pre-line; }

  /* ── FOOTER ── */
  .footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #ccc;
  }

  @media screen and (max-width: 600px) {
    .wrap { padding: 24px 16px 32px; font-size: 11px; }
    .co-name { font-size: 15px; }
    .inv-num { font-size: 14px; }
    .hdr-table td { display: block; text-align: left !important; }
    .hdr-table td:last-child { margin-top: 10px; }
    .bill-to-name { font-size: 13px; }
    .items thead th.amt, .items tbody td.amt { width: auto; }
    .items tbody td.amt { font-size: 12px; }
    .totals-table { width: 100%; }
    .total-row td:last-child { font-size: 16px !important; }
    .bank-table td { display: block; padding: 0 0 8px 0; }
    .sig-table td { display: block; width: 100%; text-align: left !important; margin-bottom: 20px; }
  }

  @media print {
    .wrap { padding: 24px 0 32px; }
  }
</style>
</head>
<body>
<div class="wrap">

<!-- ── HEADER ── -->
<table class="hdr-table">
  <tr>
    <td>
      <div class="co-name">${data.companyName}</div>
      <div class="co-meta">
        ${[data.companyPhone, data.companyEmail, data.companyAddress].filter(Boolean).join(" &nbsp;|&nbsp; ")}
        ${data.companyGstin ? `<br>GSTIN: ${data.companyGstin}` : ""}
      </div>
    </td>
    <td>
      <div class="inv-badge">Invoice</div>
      <div class="inv-num">${data.invoiceNumber}</div>
      <div class="inv-date">${invoiceDate}</div>
    </td>
  </tr>
</table>
<hr class="hdr-rule">

<!-- ── BILL TO ── -->
<div class="bill-to-wrap">
  <div class="bill-to-tag">Bill To</div>
  <div class="bill-to-name">${data.customerName}</div>
  <div class="bill-to-detail">
    ${[data.customerPhone, data.customerEmail, data.customerAddress].filter(Boolean).join(" &nbsp;|&nbsp; ")}
    ${data.customerGstin ? `<br>GSTIN: ${data.customerGstin}` : ""}
  </div>
</div>

<!-- ── LINE ITEMS ── -->
<table class="items">
  <thead>
    <tr>
      <th>Description</th>
      <th class="amt">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div class="item-title">${data.serviceDescription}</div>
        ${tripLine ? `<div class="item-sub">${tripLine}</div>` : ""}
      </td>
      <td class="amt">${formatCurrency(data.subtotal)}</td>
    </tr>
  </tbody>
</table>

<!-- ── TOTALS ── -->
<table class="totals-table">
  ${hasExtra ? `
    ${hasToll ? `<tr><td>Toll / FastTag</td><td>${formatCurrency(data.tollCharges)}</td></tr>` : ""}
    ${hasParking ? `<tr><td>Parking</td><td>${formatCurrency(data.parkingCharges)}</td></tr>` : ""}
    ${hasDriverAllowance ? `<tr><td>Driver Allowance</td><td>${formatCurrency(data.driverAllowance)}</td></tr>` : ""}
    ${hasExtraCharges ? `<tr><td>${data.extraChargesNote || "Other Charges"}</td><td>${formatCurrency(data.extraCharges)}</td></tr>` : ""}
    ${hasDiscount ? `<tr><td>Discount</td><td>&minus; ${formatCurrency(data.discount)}</td></tr>` : ""}
    <tr><td colspan="2"><hr class="totals-rule"></td></tr>
  ` : ""}
  <tr class="total-row"><td>Total</td><td>${formatCurrency(data.grandTotal)}</td></tr>
  ${Number(data.amountPaid) > 0 ? `<tr class="paid-row"><td>Amount Paid</td><td>${formatCurrency(data.amountPaid)}</td></tr>` : ""}
  ${Number(data.balanceDue) > 0 ? `<tr class="due-row"><td>Balance Due</td><td>${formatCurrency(data.balanceDue)}</td></tr>` : ""}
</table>

<hr class="section-rule">

<!-- ── AMOUNT IN WORDS + BANK ── -->
${data.amountInWords ? `<div class="words-label">Amount in Words</div><div class="words-val">${data.amountInWords}</div>` : ""}

${hasBank ? `
<div class="bank-label">Bank Details</div>
<table class="bank-table">
  <tr>
    ${data.bankName ? `<td><div class="bf-l">Bank</div><div class="bf-v">${data.bankName}</div></td>` : ""}
    ${data.bankAccountName ? `<td><div class="bf-l">Account Name</div><div class="bf-v">${data.bankAccountName}</div></td>` : ""}
    ${data.bankAccountNumber ? `<td><div class="bf-l">Account No.</div><div class="bf-v">${data.bankAccountNumber}</div></td>` : ""}
    ${data.bankIfscCode ? `<td><div class="bf-l">IFSC</div><div class="bf-v">${data.bankIfscCode}</div></td>` : ""}
    ${data.upiId ? `<td><div class="bf-l">UPI</div><div class="bf-v">${data.upiId}</div></td>` : ""}
  </tr>
</table>
` : ""}

<!-- ── SIGNATURES ── -->
<hr class="section-rule">
<table class="sig-table">
  <tr>
    <td>
      <div class="sig-line">${sigImg}</div>
      <div class="sig-lbl">Customer Signature</div>
      ${sigDateStr}
    </td>
    <td>
      <div class="sig-co-name">${data.companyName}</div>
      <div class="sig-line"></div>
      <div class="sig-lbl">Authorised Signatory</div>
    </td>
  </tr>
</table>

${data.termsAndConditions ? `
<div class="terms-wrap">
  <div class="terms-lbl">Terms &amp; Conditions</div>
  <div class="terms-text">${data.termsAndConditions}</div>
</div>` : ""}

<div class="footer">Thank you &nbsp;&middot;&nbsp; ${data.companyName}</div>

</div>
</body>
</html>`;
}
