import { prisma } from "@/lib/prisma"

async function main() {
  // Delete in the correct order if there are foreign key constraints
  await prisma.partner.deleteMany({})
  await prisma.partnerUser.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.song.deleteMany({})
  await prisma.sku.deleteMany({})
  await prisma.auditLog.deleteMany({})
  // Add more tables here if needed

  console.log("✅ Database cleared.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
