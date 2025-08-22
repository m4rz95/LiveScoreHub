import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json()
  const m = await prisma.match.update({ where: { id }, data: { homeScore: body.homeScore ?? 0, awayScore: body.awayScore ?? 0, played: body.played ?? false, status: body.status ?? "scheduled" } })
  return NextResponse.json(m)
}
