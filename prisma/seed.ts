import { PrismaClient, Role, VisaType, CaseStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const staffPassword = await bcrypt.hash("staff1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@lovebridge.local" },
    update: {},
    create: {
      email: "admin@lovebridge.local",
      name: "Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@lovebridge.local" },
    update: {},
    create: {
      email: "staff@lovebridge.local",
      name: "Staff One",
      passwordHash: staffPassword,
      role: Role.STAFF,
    },
  });

  const existing = await prisma.client.findFirst({
    where: { email: "somchai@example.com" },
  });
  if (existing) {
    console.log("Seed data already present, skipping client fixtures.");
    return;
  }

  const client = await prisma.client.create({
    data: {
      firstName: "สมใจ",
      lastName: "ใจดี",
      email: "somchai@example.com",
      phone: "0812345678",
      nationalId: "1234567890123",
      address: "กรุงเทพมหานคร",
      assignedToId: staff.id,
      partner: {
        create: {
          firstName: "John",
          lastName: "Smith",
          passportNo: "US1234567",
          nationality: "US",
          countryOfResidence: "United States",
          occupation: "Engineer",
        },
      },
    },
  });

  await prisma.visaCase.create({
    data: {
      caseNumber: `LB-${new Date().getFullYear()}-0001`,
      clientId: client.id,
      visaType: VisaType.SPOUSE_US,
      destinationCountry: "United States",
      status: CaseStatus.DOCUMENT_COLLECTION,
      assignedToId: staff.id,
      targetSubmitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      activities: {
        create: {
          userId: admin.id,
          type: "NOTE",
          message: "Initial consultation completed. Collecting documents.",
        },
      },
    },
  });

  console.log("Seed completed.");
  console.log("Admin: admin@lovebridge.local / admin1234");
  console.log("Staff: staff@lovebridge.local / staff1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
