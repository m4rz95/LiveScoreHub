import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(){
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchDate: 'asc' }, { id: 'asc' }]
  })
  return NextResponse.json(matches)
}
