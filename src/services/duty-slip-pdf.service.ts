// Duty slip PDF generation using HTML template
import fs from "fs";
import path from "path";

interface DutySlipPdfData {
  bookingId: string;
  guestName: string;
  travelDate: Date | string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  pickupTime: string | null;

  driverName: string | null;
  driverPhone: string | null;
  vendorName: string | null;
  vendorPhone: string | null;
  vehicleName: string | null;
  vehicleNumber: string | null;

  officeStartKm: number | null;
  officeStartDateTime: Date | string | null;
  customerPickupKm: number | null;
  customerPickupDateTime: string | null;
  customerDropKm: number | null;
  customerDropDateTime: string | null;
  customerEndKm: number | null;
  customerEndDateTime: Date | string | null;

  tollAmount: number | string | null;
  parkingAmount: number | string | null;
  otherChargeName: string | null;
  otherChargeAmount: number | string | null;

  signatureData: string | null;
  submittedAt: Date | string | null;

  companyName: string;
  status: string;
}

export function generateDutySlipHtml(data: DutySlipPdfData): string {
  // Load company signature image as base64 — try src/assets first, fallback to public/
  let companySignatureBase64 = "";
  try {
    const sigPath = path.join(process.cwd(), "src", "assets", "signature.png");
    const sigBuffer = fs.readFileSync(sigPath);
    companySignatureBase64 = `data:image/png;base64,${sigBuffer.toString("base64")}`;
  } catch {
    try {
      const sigPath = path.join(process.cwd(), "public", "signature.png");
      const sigBuffer = fs.readFileSync(sigPath);
      companySignatureBase64 = `data:image/png;base64,${sigBuffer.toString("base64")}`;
    } catch { /* signature not found, skip */ }
  }

  const travelDateStr = data.travelDate
    ? new Date(data.travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  const officeStartTimeStr = data.officeStartDateTime
    ? new Date(data.officeStartDateTime).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "-";

  const customerEndTimeStr = data.customerEndDateTime
    ? new Date(data.customerEndDateTime).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    : "-";

  const fmtKm = (val: number | null) => val != null ? `${Number(val).toLocaleString("en-IN")} km` : "-";
  const fmtAmt = (val: number | string | null) => {
    const n = Number(val || 0);
    if (n <= 0) return "-";
    return Math.round(n).toLocaleString("en-IN");
  };

  const totalKm = data.officeStartKm != null && data.customerEndKm != null
    ? `${(data.customerEndKm - data.officeStartKm).toLocaleString("en-IN")} km`
    : "-";

  const totalExpenses =
    Number(data.tollAmount || 0) +
    Number(data.parkingAmount || 0) +
    Number(data.otherChargeAmount || 0);

  const partyName = data.driverName || data.vendorName || "-";
  const partyPhone = data.driverPhone || data.vendorPhone || "-";
  const partyLabel = data.driverName ? "Driver" : data.vendorName ? "Vendor" : "Driver";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000; padding: 30px; }

  .page {
    max-width: 794px;
    margin: 30px auto;
    padding: 0;
    border: 2px solid #000;
  }

  /* ── HEADER ── */
  .header-name {
    text-align: center;
    padding: 20px 20px 14px;
    border-bottom: 1.5px solid #000;
  }
  .co-name {
    font-size: 28px;
    font-weight: 900;
    color: #b00;
    text-transform: uppercase;
    letter-spacing: 2px;
    line-height: 1.2;
    font-family: 'Algerian', 'Times New Roman', Times, serif;
  }
  .header-phone {
    text-align: center;
    padding: 8px 20px;
    border-bottom: 1.5px solid #000;
  }
  .co-phone { font-size: 13px; font-weight: 700; color: #000; }
  .header-tagline {
    text-align: center;
    padding: 8px 20px;
    border-bottom: 1.5px solid #000;
  }
  .co-tagline {
    font-size: 13px;
    font-weight: 700;
    color: #000;
    text-transform: uppercase;
  }
  .doc-title {
    text-align: center;
    padding: 10px 20px;
    border-bottom: 1.5px solid #000;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* ── INFO ROW ── */
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 0 0 20px;
    border-bottom: 1.5px solid #000;
  }
  .info-left { display: flex; flex-direction: column; justify-content: center; font-size: 13px; line-height: 1.8; padding: 10px 0; }
  .info-right { text-align: right; font-size: 13px; }
  .info-right table { margin-left: auto; border-collapse: collapse; height: 100%; }
  .info-right td { padding: 6px 12px; border-left: 1.5px solid #000; }
  .info-right td:first-child { font-weight: 700; }
  .info-right td:last-child { font-weight: 700; color: #c00; }
  .info-right tr:first-child td { border-bottom: 1.5px solid #000; }

  /* ── DETAIL TABLES ── */
  .section-title {
    background: #f3f3f3;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 800;
    border-bottom: 1.5px solid #000;
    border-top: 1.5px solid #000;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .details-table {
    width: 100%;
    border-collapse: collapse;
  }
  .details-table td {
    padding: 8px 14px;
    font-size: 13px;
    border-bottom: 1px solid #ccc;
    vertical-align: top;
  }
  .details-table td.label {
    font-weight: 700;
    width: 30%;
    background: #fafafa;
    border-right: 1px solid #ccc;
  }
  .details-table tr:last-child td { border-bottom: none; }

  /* ── KM READINGS TABLE ── */
  .km-table {
    width: 100%;
    border-collapse: collapse;
  }
  .km-table thead th {
    font-size: 13px;
    font-weight: 700;
    padding: 10px 8px;
    text-align: center;
    border-bottom: 1.5px solid #000;
    border-right: 1.5px solid #000;
    background: #f3f3f3;
  }
  .km-table thead th:last-child { border-right: none; }
  .km-table tbody td {
    padding: 10px 8px;
    text-align: center;
    border-right: 1.5px solid #000;
    border-bottom: 1.5px solid #000;
    font-size: 13px;
  }
  .km-table tbody td:last-child { border-right: none; }
  .km-table tfoot td {
    padding: 10px 8px;
    text-align: center;
    font-weight: 800;
    font-size: 13px;
    background: #fafafa;
    border-right: 1.5px solid #000;
  }
  .km-table tfoot td:last-child { border-right: none; color: #c00; }

  /* ── EXPENSES ── */
  .exp-table {
    width: 100%;
    border-collapse: collapse;
    border-top: 1.5px solid #000;
  }
  .exp-table td {
    padding: 8px 14px;
    font-size: 13px;
    border-bottom: 1px solid #ccc;
  }
  .exp-table td:last-child { text-align: right; font-weight: 700; }
  .exp-table tr.total-row td {
    border-top: 1.5px solid #000;
    border-bottom: none;
    font-weight: 800;
    font-size: 14px;
    background: #fafafa;
  }
  .exp-table tr.total-row td:last-child { color: #c00; }

  /* ── SIGNATURE AREA ── */
  .sig-row {
    display: flex;
    justify-content: space-between;
    border-top: 1.5px solid #000;
  }
  .sig-box {
    flex: 1;
    padding: 14px;
    text-align: center;
    border-right: 1.5px solid #000;
    min-height: 110px;
  }
  .sig-box:last-child { border-right: none; }
  .sig-label {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .sig-img { max-height: 60px; max-width: 200px; margin: 0 auto; display: block; }
  .sig-name { font-size: 13px; font-weight: 700; margin-top: 6px; }

  /* ── FOOTER ── */
  .footer-area {
    padding: 12px 20px;
    text-align: center;
    border-top: 1.5px solid #000;
  }
  .footer-heading {
    font-size: 13px;
    font-weight: 700;
    color: #c00;
    margin-bottom: 4px;
  }
  .footer-address {
    font-size: 11px;
    color: #000;
    line-height: 1.5;
  }

  @media screen and (max-width: 600px) {
    .page { border: 1.5px solid #000; }
    .co-name { font-size: 20px; letter-spacing: 1px; }
    .info-row { flex-direction: column; gap: 8px; }
    .info-right { text-align: left; }
    .info-right table { margin-left: 0; }
    .sig-row { flex-direction: column; }
    .sig-box { border-right: none; border-bottom: 1.5px solid #000; }
    .sig-box:last-child { border-bottom: none; }
  }

  @media print {
    .page { border: 1.5px solid #000; }
  }
</style>
</head>
<body>
<div class="page">

<!-- ── HEADER ── -->
<div class="header-name">
  <div class="co-name">${data.companyName.replace(/Tour And Travels/i, "Tours And Travels")}</div>
</div>
<div class="header-phone">
  <div class="co-phone">Mob No 7498125466, 9527806257</div>
</div>
<div class="header-tagline">
  <div class="co-tagline">ALL TYPES VEHICLE / LOCAL / OUTSTATION / RENTAL</div>
</div>
<div class="doc-title">Duty Slip</div>

<!-- ── BOOKING & GUEST INFO ── -->
<div class="info-row">
  <div class="info-left">
    <div><strong>Guest Name -</strong> ${data.guestName}</div>
    ${data.pickupLocation && data.dropLocation ? `<div><strong>Route -</strong> ${data.pickupLocation} To ${data.dropLocation}</div>` : ""}
    ${data.pickupTime ? `<div><strong>Pickup Time -</strong> ${data.pickupTime}</div>` : ""}
  </div>
  <div class="info-right">
    <table>
      <tr><td>Booking No</td><td>${data.bookingId}</td></tr>
      <tr><td>Travel Date</td><td>${travelDateStr}</td></tr>
    </table>
  </div>
</div>

<!-- ── DRIVER & VEHICLE ── -->
<div class="section-title">Driver &amp; Vehicle</div>
<table class="details-table">
  <tr>
    <td class="label">${partyLabel} Name</td>
    <td>${partyName}</td>
  </tr>
  <tr>
    <td class="label">${partyLabel} Phone</td>
    <td>${partyPhone}</td>
  </tr>
  <tr>
    <td class="label">Vehicle Name</td>
    <td>${data.vehicleName || "-"}</td>
  </tr>
  <tr>
    <td class="label">Vehicle Number</td>
    <td>${data.vehicleNumber || "-"}</td>
  </tr>
</table>

<!-- ── KM READINGS ── -->
<div class="section-title">KM Readings</div>
<table class="km-table">
  <thead>
    <tr>
      <th>Stage</th>
      <th>KM Reading</th>
      <th>Date / Time</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Office Start</td>
      <td>${fmtKm(data.officeStartKm)}</td>
      <td>${officeStartTimeStr}</td>
    </tr>
    <tr>
      <td>Customer Pickup</td>
      <td>${fmtKm(data.customerPickupKm)}</td>
      <td>${data.customerPickupDateTime || "-"}</td>
    </tr>
    <tr>
      <td>Customer Drop</td>
      <td>${fmtKm(data.customerDropKm)}</td>
      <td>${data.customerDropDateTime || "-"}</td>
    </tr>
    <tr>
      <td>Office End</td>
      <td>${fmtKm(data.customerEndKm)}</td>
      <td>${customerEndTimeStr}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2" style="text-align:right;">TOTAL KM</td>
      <td>${totalKm}</td>
    </tr>
  </tfoot>
</table>

<!-- ── EXPENSES ── -->
${totalExpenses > 0 ? `
<div class="section-title">Duty Expenses</div>
<table class="exp-table">
  ${Number(data.tollAmount || 0) > 0 ? `<tr><td>FastTag / Toll</td><td>${fmtAmt(data.tollAmount)}</td></tr>` : ""}
  ${Number(data.parkingAmount || 0) > 0 ? `<tr><td>Parking</td><td>${fmtAmt(data.parkingAmount)}</td></tr>` : ""}
  ${data.otherChargeName && Number(data.otherChargeAmount || 0) > 0 ? `<tr><td>${data.otherChargeName}</td><td>${fmtAmt(data.otherChargeAmount)}</td></tr>` : ""}
  <tr class="total-row">
    <td>TOTAL EXPENSES</td>
    <td>${Math.round(totalExpenses).toLocaleString("en-IN")}</td>
  </tr>
</table>
` : ""}

<!-- ── SIGNATURES ── -->
<div class="sig-row">
  <div class="sig-box">
    <div class="sig-label">For ${data.companyName}</div>
    ${companySignatureBase64 ? `<img src="${companySignatureBase64}" alt="Company signature" class="sig-img" />` : ""}
    <div class="sig-name">Authorised Signatory</div>
  </div>
</div>

<!-- ── FOOTER ── -->
<div class="footer-area">
  <div class="footer-heading">Head Office - Pune</div>
  <div class="footer-address">
    <strong>Address</strong> : Shop No 1, Sw. Yashwantrao Chavan Smruti Smarak Bhavan, Sector No.27A, Near Sant Tukaram Garden Rd Pradhikaran Nigdi Pune - 411044
  </div>
</div>

</div>
</body>
</html>`;
}
