import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } })
  const matches = await prisma.match.findMany({
    where: { played: true },
    orderBy: { id: 'asc' } // biar urut kronologis
  })

  // inisialisasi tabel
  const table = new Map()
  for (const t of teams) {
    table.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      played: 0, win: 0, draw: 0, loss: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      last5: [] as string[]   // <<< tambahin di sini
    })
  }

  // proses semua match
  for (const m of matches) {
    const hs = m.homeScore ?? 0
    const as = m.awayScore ?? 0
    const home = table.get(m.homeTeamId)
    const away = table.get(m.awayTeamId)

    home.played++
    away.played++

    home.gf += hs
    home.ga += as
    home.gd = home.gf - home.ga

    away.gf += as
    away.ga += hs
    away.gd = away.gf - away.ga

    if (hs > as) {
      home.win++; home.points += 3; away.loss++
      home.last5.push("W")
      away.last5.push("L")
    } else if (hs < as) {
      away.win++; away.points += 3; home.loss++
      away.last5.push("W")
      home.last5.push("L")
    } else {
      home.draw++; away.draw++
      home.points++; away.points++
      home.last5.push("D")
      away.last5.push("D")
    }

    // simpan hanya 5 terakhir
    home.last5 = home.last5.slice(-5)
    away.last5 = away.last5.slice(-5)
  }

  // urutkan klasemen
  const rows = Array.from(table.values()).sort((a, b) => (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.teamName.localeCompare(b.teamName)
  ))

  return NextResponse.json(rows)
}
