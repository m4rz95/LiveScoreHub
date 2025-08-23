// src/app/api/matches/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("Match")
      .select(`
        id,
        matchDate,
        homeScore,
        awayScore,
        played,
        status,
        homeTeam:homeTeamId ( id, name ),
        awayTeam:awayTeamId ( id, name )
      `)
      .order("matchDate", { ascending: true })
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching matches:", error)
      return NextResponse.json([], { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error("Unexpected error fetching matches:", err)
    return NextResponse.json([], { status: 500 })
  }
}
