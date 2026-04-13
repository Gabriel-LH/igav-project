const { PrismaClient } = require('./prisma/generated/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reservation'
    `);
    console.log('Columns in reservation table:', result);
    
    // Test a simple findMany with one field
    const test = await prisma.reservation.findMany({
      take: 1,
      select: { id: true }
    });
    console.log('Small findMany test:', test);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
