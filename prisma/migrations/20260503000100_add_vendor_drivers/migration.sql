ALTER TABLE "users" ADD COLUMN "vendorId" TEXT;

CREATE INDEX "users_vendorId_idx" ON "users"("vendorId");

ALTER TABLE "users" ADD CONSTRAINT "users_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
