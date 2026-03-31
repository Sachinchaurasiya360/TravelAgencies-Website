import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create super admin user (OTP login — passwordHash is unused placeholder)
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@sarthaktourandtravels.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@sarthaktourandtravels.com",
      name: "Super Admin",
      phone: process.env.ADMIN_PHONE || "7498125466",
      passwordHash: "",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`Admin user created: ${admin.phone} (${admin.email})`);

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: "app_settings" },
    update: {},
    create: {
      id: "app_settings",
      companyName: "Sarthak Tour and Travels",
      companyState: "Maharashtra",
      companyStateCode: "27",
      companyCity: "Pune",
      companyAddress: "Ravet, Pimpri Chinchwad",
      companyPincode: "411001",
      companyPhone: "7498125466",
      companyEmail: "sarthaktourandtravelpune@gmail.com",
      gstRate: 0,
      defaultSacCode: "9964",
      bookingPrefix: "TA",
      invoicePrefix: "INV",
      defaultPaymentDueDays: 7,
      invoiceTerms: "Payment is due within 7 days of invoice date.",
    },
  });

  console.log(`Settings created: ${settings.companyName}`);
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
