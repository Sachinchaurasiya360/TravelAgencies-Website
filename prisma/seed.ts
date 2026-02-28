import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sarthaktourandtravels.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: "app_settings" },
    update: {},
    create: {
      id: "app_settings",
      companyName: "Sarthak Tour and Travels",
      companyState: "Maharashtra",
      companyStateCode: "27",
      companyCity: "Mumbai",
      gstRate: 5.0,
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
