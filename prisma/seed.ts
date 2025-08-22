// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding admin user...")

  // Upsert admin user
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {}, // tidak ada update
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 10),
    },
  })

  console.log("Seeding teams...")

  const teams = [
    { name: 'TIMA', city: 'TANGERANG' },
    { name: 'TIMB', city: 'TANGERANG' },
    { name: 'TIMC', city: 'TANGERANG' },
    { name: 'TIMD', city: 'TANGERANG' },
    { name: 'TIME', city: 'TANGERANG' },
  ]

  for (const t of teams) {
    await prisma.team.upsert({
      where: { name: t.name },
      update: {}, // tidak ada update
      create: t,
    })
  }

  console.log("Seeding selesai ✅")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
