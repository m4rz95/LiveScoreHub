// app/api/standings/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

)

export async function GET() {
  try {
    // Ambil semua tim
    const { data: teams, error: teamErr } = await supabase
      .from("Team")
      .select("*")
      .order("name", { ascending: true })

    if (teamErr) throw teamErr
    if (!teams || teams.length === 0) {
      return NextResponse.json([])
    }

    // Ambil semua match yg udah dimainkan
    const { data: match, error: matchErr } = await supabase
      .from("Match")
      .select("*")
      .eq("played", true)
      .order("id", { ascending: true }) // kronologis

    if (matchErr) throw matchErr

    // inisialisasi tabel
    const table = new Map()
    for (const t of teams) {
      table.set(t.id, {
        teamId: t.id,
        teamName: t.name,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        last5: [] as string[],
      })
    }

    // proses semua match
    for (const m of match ?? []) {
      const hs = m.homeScore ?? 0
      const as = m.awayScore ?? 0
      const home = table.get(m.homeTeamId)
      const away = table.get(m.awayTeamId)

      if (!home || !away) continue

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

      home.last5 = home.last5.slice(-5)
      away.last5 = away.last5.slice(-5)
    }

    // urutkan klasemen
    const rows = Array.from(table.values()).sort((a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.teamName.localeCompare(b.teamName)
    )

    return NextResponse.json(rows)
  } catch (err) {
    console.error("Error fetching standings:", err)
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  }
}
