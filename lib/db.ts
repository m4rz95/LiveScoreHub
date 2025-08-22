// app/lib/db.ts
import { PrismaClient } from "@prisma/client"

declare global {
  // untuk mencegah multiple PrismaClient saat hot-reload di dev
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") global.prisma = prisma
