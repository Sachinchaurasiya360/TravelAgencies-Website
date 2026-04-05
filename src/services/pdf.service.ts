// PDF invoice generation using HTML template
// This generates an HTML string that can be converted to PDF

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
  vehicleNumber?: string | null;
  vehicleName?: string | null;
  travelDate?: Date | string | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const invoiceDate = new Date(data.invoiceDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "numeric", year: "numeric",
  });

  const travelDateStr = data.travelDate
    ? new Date(data.travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  const hasToll = Number(data.tollCharges) > 0;
  const hasParking = Number(data.parkingCharges) > 0;
  const hasDriverAllowance = Number(data.driverAllowance) > 0;
  const hasExtraCharges = Number(data.extraCharges) > 0;
  const hasDiscount = Number(data.discount) > 0;

  // Build line items for the table
  const routeDesc = data.pickupLocation && data.dropLocation
    ? `${data.pickupLocation} To ${data.dropLocation}`
    : data.serviceDescription;

  // Format amounts without currency symbol for the table
  const fmtNum = (val: number | string) => {
    const n = Math.round(Number(val));
    return n.toLocaleString("en-IN");
  };

  // Build item rows
  const itemRows: string[] = [];

  // Main trip row
  itemRows.push(`
    <tr>
      <td>${travelDateStr}</td>
      <td>${routeDesc}</td>
      <td></td>
      <td class="amt">${fmtNum(data.subtotal)}</td>
    </tr>
  `);

  // Additional charge rows
  if (hasToll) {
    itemRows.push(`<tr><td></td><td>Toll / FastTag</td><td></td><td class="amt">${fmtNum(data.tollCharges)}</td></tr>`);
  }
  if (hasParking) {
    itemRows.push(`<tr><td></td><td>Parking</td><td></td><td class="amt">${fmtNum(data.parkingCharges)}</td></tr>`);
  }
  if (hasDriverAllowance) {
    itemRows.push(`<tr><td></td><td>Driver Allowance</td><td></td><td class="amt">${fmtNum(data.driverAllowance)}</td></tr>`);
  }
  if (hasExtraCharges) {
    itemRows.push(`<tr><td></td><td>${data.extraChargesNote || "Other Charges"}</td><td></td><td class="amt">${fmtNum(data.extraCharges)}</td></tr>`);
  }
  if (hasDiscount) {
    itemRows.push(`<tr><td></td><td>Discount</td><td></td><td class="amt">-${fmtNum(data.discount)}</td></tr>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000; }

  .page {
    max-width: 794px;
    margin: 0 auto;
    padding: 0;
    border: 1.5px solid #000;
  }

  /* ── HEADER ── */
  .header {
    text-align: center;
    padding: 16px 20px 10px;
    border-bottom: 1.5px solid #000;
  }
  .co-name {
    font-size: 28px;
    font-weight: 900;
    color: #b00;
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 1.2;
    margin-bottom: 4px;
    font-family: 'Times New Roman', Times, serif;
  }
  .co-phone {
    font-size: 13px;
    font-weight: 700;
    color: #c00;
    margin-bottom: 2px;
  }
  .co-tagline {
    font-size: 13px;
    font-weight: 700;
    color: #00c;
    text-transform: uppercase;
  }

  /* ── INFO ROW ── */
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 20px;
    border-bottom: 1.5px solid #000;
  }
  .info-left { font-size: 13px; }
  .info-right { text-align: right; font-size: 13px; }
  .info-right table { margin-left: auto; border-collapse: collapse; }
  .info-right td { padding: 1px 0; }
  .info-right td:first-child { font-weight: 700; padding-right: 12px; }
  .info-right td:last-child { font-weight: 700; color: #c00; text-decoration: underline; }
  .cust-name { font-weight: 400; }
  .cust-company { font-weight: 400; padding-left: 20px; }

  /* ── ITEMS TABLE ── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
  }
  .items-table thead th {
    font-size: 13px;
    font-weight: 700;
    font-style: italic;
    padding: 8px 10px;
    text-align: center;
    border-bottom: 1.5px solid #000;
    border-right: 1.5px solid #000;
  }
  .items-table thead th:last-child { border-right: none; }
  .items-table thead th:first-child { width: 120px; }
  .items-table thead th:nth-child(2) { text-align: center; }
  .items-table thead th:nth-child(3) { width: 120px; }
  .items-table thead th:last-child { width: 120px; }

  .items-table tbody td {
    padding: 6px 10px;
    vertical-align: top;
    border-right: 1.5px solid #000;
    font-size: 13px;
    text-align: center;
  }
  .items-table tbody td:last-child { border-right: none; }
  .items-table tbody td.amt { text-align: right; }

  /* Car info row */
  .car-info {
    font-weight: 700;
    text-align: center;
  }

  /* ── TOTAL ROW ── */
  .total-row td {
    padding: 8px 10px;
    border-top: 1.5px solid #000;
    font-weight: 700;
    font-size: 14px;
  }

  /* ── BOTTOM SECTION ── */
  .bottom-section {
    border-top: 1.5px solid #000;
    min-height: 40px;
    position: relative;
  }

  /* E. & O. E. */
  .eoe {
    text-align: right;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
  }

  /* Amount + company sign row */
  .amount-row {
    display: flex;
    justify-content: space-between;
    border-top: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
  }
  .amount-words {
    padding: 8px 14px;
    font-size: 13px;
    flex: 1;
  }
  .amount-words span { font-weight: 700; }
  .company-sign {
    padding: 8px 14px;
    font-size: 13px;
    text-align: right;
    white-space: nowrap;
  }

  /* ── FOOTER ── */
  .footer-area {
    padding: 12px 20px;
    text-align: center;
  }
  .footer-heading {
    font-size: 14px;
    font-weight: 700;
    color: #c00;
    margin-bottom: 6px;
  }
  .footer-address {
    font-size: 11px;
    color: #000;
    line-height: 1.5;
  }
  .footer-address strong { font-weight: 700; }

  @media screen and (max-width: 600px) {
    .page { border: none; }
    .co-name { font-size: 20px; }
    .info-row { flex-direction: column; gap: 8px; }
    .info-right { text-align: left; }
    .info-right table { margin-left: 0; }
    .amount-row { flex-direction: column; }
  }

  @media print {
    .page { border: 1.5px solid #000; }
  }
</style>
</head>
<body>
<div class="page">

<!-- ── HEADER ── -->
<div class="header">
  <div class="co-name">${data.companyName}</div>
  <div class="co-phone">Mob No ${data.companyPhone}</div>
  <div class="co-tagline">ALL TYPES VAHICAL / LOCAL/ OUTSTATION / RENTAL</div>
</div>

<!-- ── CUSTOMER & INVOICE INFO ── -->
<div class="info-row">
  <div class="info-left">
    <div class="cust-name">Customer Name - ${data.customerName}</div>
    ${data.customerAddress ? `<div class="cust-company">${data.customerAddress}</div>` : ""}
  </div>
  <div class="info-right">
    <table>
      <tr><td>Invoice No</td><td>${data.invoiceNumber.replace(/^INV-/, "")}</td></tr>
      <tr><td>Invoice Date</td><td>${invoiceDate}</td></tr>
    </table>
  </div>
</div>

<!-- ── ITEMS TABLE ── -->
<table class="items-table">
  <thead>
    <tr>
      <th>Travelling Date</th>
      <th>Particular</th>
      <th>Remarks</th>
      <th>Total Amount</th>
    </tr>
  </thead>
  <tbody>
    ${data.vehicleNumber || data.vehicleName ? `
    <tr>
      <td></td>
      <td class="car-info">
        Car Number<br>
        ${data.vehicleNumber || ""}<br>
        ${data.vehicleName || ""}
      </td>
      <td></td>
      <td></td>
    </tr>
    ` : ""}
    ${itemRows.join("")}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td></td>
      <td></td>
      <td style="text-align:center;border-right:1.5px solid #000;">TOTAL</td>
      <td class="amt">${fmtNum(data.grandTotal)}</td>
    </tr>
  </tfoot>
</table>

<!-- ── E. & O. E. ── -->
<div class="bottom-section">
  <div class="eoe">E . &amp; O . E .</div>
</div>

<!-- ── AMOUNT IN WORDS + COMPANY ── -->
<div class="amount-row">
  <div class="amount-words">
    <span>Amount -</span> ${data.amountInWords || ""}
  </div>
  <div class="company-sign">${data.companyName}</div>
</div>

<!-- ── FOOTER ── -->
<div class="footer-area">
  ${data.companyState ? `<div class="footer-heading">Head of ${data.companyState}</div>` : ""}
  <div class="footer-address">
    <strong>Address</strong> : ${data.companyAddress}
  </div>
</div>

</div>
</body>
</html>`;
}
