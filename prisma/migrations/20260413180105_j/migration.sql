-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DRIVER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE');

-- CreateEnum
CREATE TYPE "CarSource" AS ENUM ('OWN_CAR', 'VENDOR_CAR');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'VOID');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'STATUS_UPDATE', 'PAYMENT_REMINDER', 'PAYMENT_RECEIVED', 'INVOICE_SENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('DRIVER_SALARY', 'FUEL', 'CAR_MAINTENANCE', 'INSURANCE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "DutySlipStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_STATUS_CHANGED', 'BOOKING_PRICING_SET', 'BOOKING_NOTE_ADDED', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_CANCELLED', 'PAYMENT_RECORDED', 'PAYMENT_UPDATED', 'REFUND_REQUESTED', 'REFUND_PROCESSED', 'REMINDER_SENT', 'SETTINGS_UPDATED', 'USER_LOGIN', 'USER_LOGOUT', 'EXPORT_GENERATED', 'DRIVER_ASSIGNED', 'EXPENSE_CREATED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'VENDOR_CREATED', 'VENDOR_UPDATED', 'VENDOR_DELETED', 'DRIVER_LINK_GENERATED', 'DUTY_SLIP_CREATED', 'DUTY_SLIP_SUBMITTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleName" TEXT,
    "vehicleNumber" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "alternatePhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "gstin" TEXT,
    "companyName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "customerId" TEXT NOT NULL,
    "driverId" TEXT,
    "driverAccessToken" TEXT,
    "carSource" "CarSource" NOT NULL DEFAULT 'OWN_CAR',
    "vendorId" TEXT,
    "vendorCost" DECIMAL(12,0),
    "vehiclePreference" TEXT,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "pickupLocation" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "dropLocation" TEXT NOT NULL,
    "dropAddress" TEXT,
    "pickupTime" TEXT,
    "estimatedDistance" DOUBLE PRECISION,
    "actualDistance" DOUBLE PRECISION,
    "startKm" DOUBLE PRECISION,
    "endKm" DOUBLE PRECISION,
    "startDateTime" TIMESTAMP(3),
    "endDateTime" TIMESTAMP(3),
    "specialRequests" TEXT,
    "baseFare" DECIMAL(12,0),
    "taxAmount" DECIMAL(12,0),
    "tollCharges" DECIMAL(12,0),
    "parkingCharges" DECIMAL(12,0),
    "driverAllowance" DECIMAL(12,0),
    "extraCharges" DECIMAL(12,0),
    "extraChargesNote" TEXT,
    "discount" DECIMAL(12,0),
    "totalAmount" DECIMAL(12,0),
    "includeGst" BOOLEAN NOT NULL DEFAULT true,
    "advanceAmount" DECIMAL(12,0),
    "advancePaidAt" TIMESTAMP(3),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDueDate" TIMESTAMP(3),
    "adminRemarks" TEXT,
    "rejectionReason" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_notes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_slips" (
    "id" TEXT NOT NULL,
    "status" "DutySlipStatus" NOT NULL DEFAULT 'PENDING',
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleName" TEXT,
    "vehicleNumber" TEXT,
    "guestName" TEXT NOT NULL,
    "officeStartKm" DOUBLE PRECISION,
    "officeStartDateTime" TIMESTAMP(3),
    "customerPickupKm" DOUBLE PRECISION,
    "customerPickupDateTime" TEXT,
    "customerDropKm" DOUBLE PRECISION,
    "customerDropDateTime" TEXT,
    "customerEndKm" DOUBLE PRECISION,
    "customerEndDateTime" TIMESTAMP(3),
    "tollAmount" DECIMAL(12,0),
    "parkingAmount" DECIMAL(12,0),
    "otherChargeName" TEXT,
    "otherChargeAmount" DECIMAL(12,0),
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duty_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyGstin" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyState" TEXT NOT NULL,
    "companyStateCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerGstin" TEXT,
    "customerState" TEXT,
    "customerStateCode" TEXT,
    "serviceDescription" TEXT NOT NULL,
    "sacCode" TEXT NOT NULL DEFAULT '9964',
    "hsnSacDescription" TEXT,
    "subtotal" DECIMAL(12,0) NOT NULL,
    "cgstRate" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "sgstRate" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "igstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(12,0) NOT NULL,
    "tollCharges" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "parkingCharges" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "driverAllowance" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "extraCharges" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "extraChargesNote" TEXT,
    "discount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,0) NOT NULL,
    "amountInWords" TEXT,
    "amountPaid" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(12,0) NOT NULL,
    "placeOfSupply" TEXT,
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "termsAndConditions" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "shareToken" TEXT,
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(12,0) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "isAdvance" BOOLEAN NOT NULL DEFAULT false,
    "transactionRef" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAmount" DECIMAL(12,0) NOT NULL,
    "approvedAmount" DECIMAL(12,0),
    "cancellationFee" DECIMAL(12,0) DEFAULT 0,
    "refundedAmount" DECIMAL(12,0),
    "reason" TEXT NOT NULL,
    "adminRemarks" TEXT,
    "refundMethod" "PaymentMethod",
    "transactionRef" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "bookingId" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "ipAddress" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'app_settings',
    "companyName" TEXT NOT NULL DEFAULT 'Sarthak Tour and Travels',
    "companyLegalName" TEXT,
    "companyAddress" TEXT,
    "companyCity" TEXT,
    "companyState" TEXT,
    "companyStateCode" TEXT,
    "companyPincode" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyWebsite" TEXT,
    "companyGstin" TEXT,
    "companyPan" TEXT,
    "companyCin" TEXT,
    "companyLogoUrl" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "defaultSacCode" TEXT NOT NULL DEFAULT '9964',
    "isInterState" BOOLEAN NOT NULL DEFAULT false,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfscCode" TEXT,
    "bankAccountName" TEXT,
    "upiId" TEXT,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsGateUser" TEXT,
    "smsGatePassword" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceTerms" TEXT DEFAULT 'Payment is due within 7 days of invoice date.',
    "invoiceNotes" TEXT,
    "bookingPrefix" TEXT NOT NULL DEFAULT 'TA',
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "defaultPaymentDueDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,0) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "vehicles" TEXT,
    "rateInfo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "login_otps_email_idx" ON "login_otps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingId_key" ON "bookings"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_driverAccessToken_key" ON "bookings"("driverAccessToken");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_driverId_idx" ON "bookings"("driverId");

-- CreateIndex
CREATE INDEX "bookings_vendorId_idx" ON "bookings"("vendorId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_travelDate_idx" ON "bookings"("travelDate");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_idx" ON "bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "booking_notes_bookingId_idx" ON "booking_notes"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "duty_slips_bookingId_key" ON "duty_slips"("bookingId");

-- CreateIndex
CREATE INDEX "duty_slips_bookingId_idx" ON "duty_slips"("bookingId");

-- CreateIndex
CREATE INDEX "duty_slips_driverId_idx" ON "duty_slips"("driverId");

-- CreateIndex
CREATE INDEX "duty_slips_status_idx" ON "duty_slips"("status");

-- CreateIndex
CREATE INDEX "duty_slips_createdAt_idx" ON "duty_slips"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_shareToken_key" ON "invoices"("shareToken");

-- CreateIndex
CREATE INDEX "invoices_bookingId_idx" ON "invoices"("bookingId");

-- CreateIndex
CREATE INDEX "invoices_customerId_idx" ON "invoices"("customerId");

-- CreateIndex
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptNumber_key" ON "payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refundNumber_key" ON "refunds"("refundNumber");

-- CreateIndex
CREATE INDEX "refunds_bookingId_idx" ON "refunds"("bookingId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "notification_logs_bookingId_idx" ON "notification_logs"("bookingId");

-- CreateIndex
CREATE INDEX "notification_logs_channel_idx" ON "notification_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");

-- CreateIndex
CREATE INDEX "vendors_name_idx" ON "vendors"("name");

-- CreateIndex
CREATE INDEX "vendors_phone_idx" ON "vendors"("phone");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_slips" ADD CONSTRAINT "duty_slips_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_slips" ADD CONSTRAINT "duty_slips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
