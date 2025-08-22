import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(_: Request, { params }: { params: { id: string } }){
  const id = Number(params.id)
  const data = await _.json()
  const t = await prisma.team.update({ where: { id }, data: { name: data.name, city: data.city || null } })
  return NextResponse.json(t)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }){
  const id = Number(params.id)
  await prisma.match.deleteMany({ where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] } })
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
