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
  driverAllowance: number | string;
  extraCharges: number | string;
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
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const invoiceDate = new Date(data.invoiceDate).toLocaleDateString("en-IN");
  const dueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("en-IN")
    : "N/A";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
    .invoice-title { font-size: 20px; font-weight: bold; text-align: right; color: #333; }
    .details-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .details-box { width: 48%; }
    .details-box h3 { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8f9fa; padding: 8px 12px; text-align: left; border: 1px solid #dee2e6; font-weight: 600; }
    td { padding: 8px 12px; border: 1px solid #dee2e6; }
    .amount-right { text-align: right; }
    .total-row { font-weight: bold; background: #f0f7ff; }
    .grand-total { font-size: 14px; color: #2563eb; }
    .amount-words { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-style: italic; }
    .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
    .bank-details { background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
    .bank-details h3 { margin-top: 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${data.companyName}</div>
      <div>${data.companyAddress}</div>
      <div>GSTIN: ${data.companyGstin}</div>
      <div>Phone: ${data.companyPhone} | Email: ${data.companyEmail}</div>
      <div>State: ${data.companyState} (${data.companyStateCode})</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">TAX INVOICE</div>
      <div><strong>Invoice #:</strong> ${data.invoiceNumber}</div>
      <div><strong>Date:</strong> ${invoiceDate}</div>
      <div><strong>Due Date:</strong> ${dueDate}</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="details-box">
      <h3>Bill To</h3>
      <div><strong>${data.customerName}</strong></div>
      ${data.customerAddress ? `<div>${data.customerAddress}</div>` : ""}
      <div>Phone: ${data.customerPhone}</div>
      ${data.customerEmail ? `<div>Email: ${data.customerEmail}</div>` : ""}
      ${data.customerGstin ? `<div>GSTIN: ${data.customerGstin}</div>` : ""}
    </div>
    <div class="details-box">
      <h3>Supply Details</h3>
      <div>Place of Supply: ${data.companyState}</div>
      <div>Supply Type: ${data.isInterState ? "Inter-State" : "Intra-State"}</div>
      <div>Reverse Charge: No</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>SAC Code</th>
        <th class="amount-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${data.serviceDescription}</td>
        <td>${data.sacCode}</td>
        <td class="amount-right">${formatCurrency(data.subtotal)}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <tbody>
      <tr>
        <td style="width: 70%;"><strong>Subtotal</strong></td>
        <td class="amount-right">${formatCurrency(data.subtotal)}</td>
      </tr>
      ${
        !data.isInterState
          ? `
      <tr>
        <td>CGST @ ${data.cgstRate}%</td>
        <td class="amount-right">${formatCurrency(data.cgstAmount)}</td>
      </tr>
      <tr>
        <td>SGST @ ${data.sgstRate}%</td>
        <td class="amount-right">${formatCurrency(data.sgstAmount)}</td>
      </tr>`
          : `
      <tr>
        <td>IGST @ ${data.igstRate}%</td>
        <td class="amount-right">${formatCurrency(data.igstAmount)}</td>
      </tr>`
      }
      ${Number(data.tollCharges) > 0 ? `<tr><td>Toll Charges</td><td class="amount-right">${formatCurrency(data.tollCharges)}</td></tr>` : ""}
      ${Number(data.driverAllowance) > 0 ? `<tr><td>Driver Allowance</td><td class="amount-right">${formatCurrency(data.driverAllowance)}</td></tr>` : ""}
      ${Number(data.extraCharges) > 0 ? `<tr><td>Extra Charges</td><td class="amount-right">${formatCurrency(data.extraCharges)}</td></tr>` : ""}
      ${Number(data.discount) > 0 ? `<tr><td>Discount</td><td class="amount-right">-${formatCurrency(data.discount)}</td></tr>` : ""}
      <tr class="total-row grand-total">
        <td><strong>Grand Total</strong></td>
        <td class="amount-right"><strong>${formatCurrency(data.grandTotal)}</strong></td>
      </tr>
      <tr>
        <td>Amount Paid</td>
        <td class="amount-right">${formatCurrency(data.amountPaid)}</td>
      </tr>
      <tr class="total-row">
        <td><strong>Balance Due</strong></td>
        <td class="amount-right"><strong>${formatCurrency(data.balanceDue)}</strong></td>
      </tr>
    </tbody>
  </table>

  ${data.amountInWords ? `<div class="amount-words"><strong>Amount in words:</strong> ${data.amountInWords}</div>` : ""}

  ${
    data.bankName
      ? `
  <div class="bank-details">
    <h3>Bank Details</h3>
    <div>Bank: ${data.bankName}</div>
    <div>Account Name: ${data.bankAccountName || ""}</div>
    <div>Account Number: ${data.bankAccountNumber || ""}</div>
    <div>IFSC: ${data.bankIfscCode || ""}</div>
    ${data.upiId ? `<div>UPI: ${data.upiId}</div>` : ""}
  </div>`
      : ""
  }

  ${data.termsAndConditions ? `<div class="footer"><strong>Terms & Conditions:</strong><br>${data.termsAndConditions}</div>` : ""}

  <div class="footer">
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>`;
}
