import { PrismaClient } from "./generated/client";
import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
dotenv.config();

async function main() {
  console.log("Creando SuperAdmin...");

  const email = "2dejunio2003@gmail.com";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log("SuperAdmin ya existe");
    return;
  }

  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: "Super Admin",
      status: "active",
      globalRole: "SUPER_ADMIN",
      createdBy: "system",
      updatedBy: "system",
    },
  });

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: email,
      providerId: "credential",
      userId,
      password: await hashPassword("Ax23fcw4%0erflk42"),
    },
  });

  console.log("✅ SuperAdmin creado");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
