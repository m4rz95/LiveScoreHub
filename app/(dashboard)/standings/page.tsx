"use client"
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Row = {
  teamId: number
  teamName: string
  played: number
  win: number
  draw: number
  loss: number
  gf: number
  ga: number
  gd: number
  points: number
  last5: string[]
}

export default function StandingsPage() {
  const [rows, setRows] = useState<Row[]>([])

  async function load() {
    try {
      // Ambil semua tim
      const { data: teams, error: teamErr } = await supabase
        .from("Team")
        .select("*")
        .order("name", { ascending: true })
      if (teamErr) throw teamErr
      if (!teams || teams.length === 0) {
        setRows([])
        return
      }

      // Ambil semua match yg udah dimainkan
      const { data: match, error: matchErr } = await supabase
        .from("Match")
        .select("*")
        .eq("played", true)
        .order("id", { ascending: true })
      if (matchErr) throw matchErr

      // inisialisasi tabel
      const table = new Map<number, Row>()
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
          last5: []
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
          home.last5.push("W"); away.last5.push("L")
        } else if (hs < as) {
          away.win++; away.points += 3; home.loss++
          away.last5.push("W"); home.last5.push("L")
        } else {
          home.draw++; away.draw++
          home.points++; away.points++
          home.last5.push("D"); away.last5.push("D")
        }

        home.last5 = home.last5.slice(-5)
        away.last5 = away.last5.slice(-5)
      }

      // urutkan klasemen
      const sortedRows = Array.from(table.values()).sort((a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.teamName.localeCompare(b.teamName)
      )

      setRows(sortedRows)
    } catch (err) {
      console.error("Error fetching standings:", err)
      setRows([])
    }
  }

  useEffect(() => {
    load()

    // Realtime listener
    const channel = supabase
      .channel('matches-standings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Match' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Card>
      <CardHeader>KLASEMEN</CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>#</TH><TH>Tim</TH><TH>P</TH><TH>W</TH><TH>D</TH><TH>L</TH>
                <TH>GF</TH><TH>GA</TH><TH>GD</TH><TH>Pts</TH><TH>Last 5</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r, i) => (
                <TR key={r.teamId}>
                  <TD>{i + 1}</TD>
                  <TD>{r.teamName}</TD>
                  <TD>{r.played}</TD>
                  <TD>{r.win}</TD>
                  <TD>{r.draw}</TD>
                  <TD>{r.loss}</TD>
                  <TD>{r.gf}</TD>
                  <TD>{r.ga}</TD>
                  <TD>{r.gd}</TD>
                  <TD>{r.points}</TD>
                  <TD>
                    <div className="flex gap-1">
                      {r.last5.map((res, j) => (
                        <span
                          key={j}
                          className={`w-5 h-5 flex items-center justify-center text-xs rounded-full
                            ${res === "W" ? "bg-green-500 text-white" :
                              res === "D" ? "bg-yellow-500 text-black" :
                                res === "L" ? "bg-red-500 text-white" : "bg-gray-300"}`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
