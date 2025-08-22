import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ matchDate: 'asc' }, { id: 'asc' }]
    })
    // Prisma findMany() sudah aman kalau tabel kosong → kembalikan []
    return NextResponse.json(matches ?? [])
  } catch (err) {
    console.error("Error fetching matches:", err)
    // Jangan biarkan Next.js kirim HTML error → balikin JSON kosong
    return NextResponse.json([], { status: 500 })
  }
}
