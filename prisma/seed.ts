import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create all default users
  const users = [
    {
      email: process.env.ADMIN_EMAIL || "admin@sarthaktourandtravels.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123456",
      name: "Super Admin",
      role: "SUPER_ADMIN" as const,
    },
    {
      email: "manager@sarthaktourandtravels.com",
      password: "Manager@123456",
      name: "Manager",
      role: "ADMIN" as const,
    },
    {
      email: "driver@sarthaktourandtravels.com",
      password: "Driver@123456",
      name: "Sample Driver",
      role: "DRIVER" as const,
      phone: "9876543210",
    },
  ];

  for (const u of users) {
    const passwordHash = await hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        phone: "phone" in u ? (u as { phone: string }).phone : undefined,
        passwordHash,
        role: u.role,
        isActive: true,
      },
    });
    console.log(`${u.role} user created: ${user.email}`);
  }

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
