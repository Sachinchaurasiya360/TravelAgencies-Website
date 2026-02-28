import ExcelJS from "exceljs";

interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

export async function generateExcel(
  data: Record<string, unknown>[],
  columns: ColumnDef[],
  sheetName: string = "Report"
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sarthak Tour and Travels";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  // Add data
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: "A1",
    to: `${String.fromCharCode(64 + columns.length)}1`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function bookingsExportColumns(): ColumnDef[] {
  return [
    { header: "Booking ID", key: "bookingId", width: 20 },
    { header: "Customer", key: "customerName", width: 25 },
    { header: "Phone", key: "customerPhone", width: 15 },
    { header: "Vehicle", key: "vehicleType", width: 20 },
    { header: "Trip Type", key: "tripType", width: 12 },
    { header: "Pickup", key: "pickupLocation", width: 25 },
    { header: "Drop", key: "dropLocation", width: 25 },
    { header: "Travel Date", key: "travelDate", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Base Fare", key: "baseFare", width: 12 },
    { header: "Tax", key: "taxAmount", width: 12 },
    { header: "Total", key: "totalAmount", width: 12 },
    { header: "Payment Status", key: "paymentStatus", width: 15 },
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
