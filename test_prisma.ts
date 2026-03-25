import { PrismaClient } from './prisma/generated/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Testing rentalItem.findMany()...");
    // We attempt to find many but select all fields to see which one fails
    const items = await prisma.rentalItem.findMany({
      take: 1
    });
    console.log("Success:", JSON.stringify(items, null, 2));
  } catch (error: any) {
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Meta:", error.meta);
    console.error("Full Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
