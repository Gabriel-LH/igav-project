const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const methods = await prisma.paymentMethod.findMany()
  console.log('Total methods:', methods.length)
  console.log('Methods:', JSON.stringify(methods, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
