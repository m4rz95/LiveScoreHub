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
    const res = await fetch('/api/standings', { cache: 'no-store' })
    setRows(await res.json())
  }

  useEffect(() => {
    load()

    // listen realtime ke tabel matches
    const channel = supabase
      .channel('matches-standings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: "Match" },
        () => {
          // setiap ada perubahan di tabel matches, reload standings
          load()
        }
      )
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
              {Array.isArray(rows) && rows.map((r, i) => (
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
                      {(r.last5 ?? []).map((res, j) => (
                        <span
                          key={j}
                          className={`
                            w-5 h-5 flex items-center justify-center text-xs rounded-full
                            ${res === "W" ? "bg-green-500 text-white" :
                              res === "D" ? "bg-yellow-500 text-black" :
                                res === "L" ? "bg-red-500 text-white" : "bg-gray-300"}
                          `}
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
