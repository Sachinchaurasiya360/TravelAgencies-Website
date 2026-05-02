import ExcelJS from "exceljs";

interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

interface ExcelHeaderOptions {
  title?: string;
  period?: string;
  generatedAt?: Date;
  companyName?: string;
  companyPhone?: string;
  tagline?: string;
}

export async function generateExcel(
  data: Record<string, unknown>[],
  columns: ColumnDef[],
  sheetName: string = "Report",
  header?: ExcelHeaderOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = header?.companyName || "Sarthak Tour and Travels";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);
  const totalColumns = Math.max(columns.length, 1);
  const lastColumn = worksheet.getColumn(totalColumns).letter;

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  const tableStartRow = header ? 7 : 1;

  if (header) {
    worksheet.spliceRows(1, 0, [], [], [], [], [], []);

    worksheet.mergeCells(`A1:${lastColumn}1`);
    worksheet.getCell("A1").value = header.companyName || "Sarthak Tours And Travels";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFB00000" } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells(`A2:${lastColumn}2`);
    worksheet.getCell("A2").value = header.companyPhone || "Mob No 7498125466, 9527806257";
    worksheet.getCell("A2").font = { bold: true, size: 11 };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.mergeCells(`A3:${lastColumn}3`);
    worksheet.getCell("A3").value = header.tagline || "ALL TYPES VEHICLE / LOCAL / OUTSTATION / RENTAL";
    worksheet.getCell("A3").font = { bold: true, size: 11 };
    worksheet.getCell("A3").alignment = { horizontal: "center" };

    worksheet.mergeCells(`A4:${lastColumn}4`);
    worksheet.getCell("A4").value = header.title || sheetName;
    worksheet.getCell("A4").font = { bold: true, size: 14 };
    worksheet.getCell("A4").alignment = { horizontal: "center" };

    worksheet.mergeCells(`A5:${lastColumn}5`);
    worksheet.getCell("A5").value = `Period: ${header.period || "All Dates"} | Generated: ${(header.generatedAt || new Date()).toLocaleString("en-IN")}`;
    worksheet.getCell("A5").font = { italic: true, size: 10 };
    worksheet.getCell("A5").alignment = { horizontal: "center" };
  }

  // Style header row
  const headerRow = worksheet.getRow(tableStartRow);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Add data
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: `A${tableStartRow}`,
    to: `${lastColumn}${tableStartRow}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function bookingsExportColumns(): ColumnDef[] {
  return [
    { header: "Booking ID", key: "bookingId", width: 20 },
    { header: "Customer", key: "customerName", width: 25 },
    { header: "Phone", key: "customerPhone", width: 15 },
    { header: "Email", key: "customerEmail", width: 25 },
    { header: "Pickup", key: "pickupLocation", width: 25 },
    { header: "Pickup Address", key: "pickupAddress", width: 30 },
    { header: "Drop", key: "dropLocation", width: 25 },
    { header: "Drop Address", key: "dropAddress", width: 30 },
    { header: "Travel Date", key: "travelDate", width: 15 },
    { header: "Return Date", key: "returnDate", width: 15 },
    { header: "Pickup Time", key: "pickupTime", width: 14 },
    { header: "Vehicle Preference", key: "vehiclePreference", width: 20 },
    { header: "Car Source", key: "carSource", width: 14 },
    { header: "Driver", key: "driverName", width: 22 },
    { header: "Vendor", key: "vendorName", width: 22 },
    { header: "Status", key: "status", width: 15 },
    { header: "Base Fare", key: "baseFare", width: 12 },
    { header: "Toll", key: "tollCharges", width: 12 },
    { header: "Parking", key: "parkingCharges", width: 12 },
    { header: "Driver Allowance", key: "driverAllowance", width: 18 },
    { header: "Extra Charges", key: "extraCharges", width: 15 },
    { header: "Discount", key: "discount", width: 12 },
    { header: "Total", key: "totalAmount", width: 12 },
    { header: "Advance", key: "advanceAmount", width: 12 },
    { header: "Payment Status", key: "paymentStatus", width: 15 },
    { header: "Special Requests", key: "specialRequests", width: 30 },
    { header: "Admin Remarks", key: "adminRemarks", width: 30 },
    { header: "Created At", key: "createdAt", width: 18 },
  ];
}

export function paymentsExportColumns(): ColumnDef[] {
  return [
    { header: "Receipt #", key: "receiptNumber", width: 20 },
    { header: "Booking ID", key: "bookingId", width: 20 },
    { header: "Customer", key: "customerName", width: 25 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Method", key: "method", width: 15 },
    { header: "Type", key: "type", width: 12 },
    { header: "Date", key: "paymentDate", width: 15 },
    { header: "Reference", key: "transactionRef", width: 20 },
  ];
}
