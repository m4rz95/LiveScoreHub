import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
export const dynamic = "force-dynamic";

export async function GET() { const teams = await prisma.team.findMany({ orderBy: { id: 'asc' } }); return NextResponse.json(teams) }
export async function POST(req: Request) { const data = await req.json(); const t = await prisma.team.create({ data: { name: data.name, city: data.city || null } }); return NextResponse.json(t) }
