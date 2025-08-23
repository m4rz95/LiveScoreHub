// src/app/api/matches/save/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
    try {
        const matches = await req.json()

        // mapping biar sesuai struktur tabel Supabase
        const rows = matches.map((m: any) => ({
            homeTeamId: m.homeTeam.id,
            awayTeamId: m.awayTeam.id,
            homeScore: m.homeScore ?? 0,
            awayScore: m.awayScore ?? 0,
            played: m.played ?? false,
            status: m.status ?? "scheduled",
            matchDate: m.matchDate ?? new Date().toISOString(),
        }))

        const { data, error } = await supabase.from("Match").insert(rows).select()

        if (error) {
            console.error("Save error:", error)
            return NextResponse.json({ error: "Gagal simpan ke DB" }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error("Save error:", err)
        return NextResponse.json({ error: "Gagal simpan ke DB" }, { status: 500 })
    }
}
