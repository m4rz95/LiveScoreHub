// src/app/api/matches/generate/route.ts
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr
}

function scheduleNoRepeat(pairs: { homeTeamId: number, awayTeamId: number }[]) {
  const schedule: typeof pairs = []
  let lastTeams = new Set<number>()

  while (pairs.length > 0) {
    const idx = pairs.findIndex(
      p => !lastTeams.has(p.homeTeamId) && !lastTeams.has(p.awayTeamId)
    )
    if (idx === -1) {
      // fallback: reset lastTeams biar tetap jalan
      lastTeams.clear()
      continue
    }
    const [match] = pairs.splice(idx, 1)
    schedule.push(match)
    lastTeams = new Set([match.homeTeamId, match.awayTeamId])
  }
  return schedule
}

export async function POST() {
  const teams = await prisma.team.findMany({ orderBy: { id: 'asc' } })
  if (teams.length < 2) {
    return NextResponse.json({ error: 'Minimal 2 tim' }, { status: 400 })
  }

  const pairs = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push({ homeTeamId: teams[i].id, awayTeamId: teams[j].id })
    }
  }

  shuffle(pairs)
  const ordered = scheduleNoRepeat(pairs)

  const now = new Date()
  const results = ordered.map((p, idx) => ({
    ...p,
    matchDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + idx),
    homeTeam: teams.find(t => t.id === p.homeTeamId),
    awayTeam: teams.find(t => t.id === p.awayTeamId),
  }))

  return NextResponse.json(results)
}
