"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"
import { createClient } from "@supabase/supabase-js"
import clsx from "clsx"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Match = {
  id: number
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  homeScore: number | null
  awayScore: number | null
  status: "scheduled" | "live" | "finished"
  played: boolean
  created_at: string
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [preview, setPreview] = useState<Match[]>([])
  const [loading, setLoading] = useState<number | null>(null)

  // modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMatch, setDialogMatch] = useState<Match | null>(null)
  const [dialogHS, setDialogHS] = useState(0)
  const [dialogAS, setDialogAS] = useState(0)
  const [dialogStatus, setDialogStatus] =
    useState<"scheduled" | "live" | "finished">("scheduled")

  // load awal
  async function load() {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" })
      if (!res.ok) throw new Error("Gagal fetch data")
      setMatches(await res.json())
    } catch (err) {
      console.error(err)
      toast.error("Gagal memuat data pertandingan ❌")
    }
  }

  // setup realtime listener
  useEffect(() => {
    load()

    const channel = supabase
      .channel("realtime:matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          // tiap ada perubahan → reload data dari API (supaya dapat join homeTeam/awayTeam)
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function updateScore(
    m: Match,
    hs: number,
    as: number,
    status: "scheduled" | "live" | "finished"
  ) {
    try {
      setLoading(m.id)
      const res = await fetch("/api/matches/" + m.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: hs,
          awayScore: as,
          status,
          played: true,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Skor & status berhasil diperbarui ✅")
      setDialogOpen(false)
    } catch (err: any) {
      toast.error("Gagal update ❌: " + err.message)
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const list = preview.length > 0 ? preview : matches

  function getRowColor(status?: string) {
    return clsx(
      "cursor-pointer",
      status === "live" && "bg-green-200 hover:bg-green-300",
      status === "finished" && "bg-gray-200 hover:bg-gray-300",
      (!status || status === "scheduled") &&
      "bg-white hover:bg-orange-100"
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">PERTANDINGAN</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>#</TH>
                <TH>Home</TH>
                <TH>Score</TH>
                <TH>Away</TH>
                <TH>Status</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {list.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={getRowColor(m.status)}
                  onClick={() => {
                    setDialogMatch(m)
                    setDialogHS(m.homeScore ?? 0)
                    setDialogAS(m.awayScore ?? 0)
                    setDialogStatus(m.status ?? "scheduled")
                    setDialogOpen(true)
                  }}
                >
                  <TD>{i + 1}</TD>
                  <TD>{m.homeTeam.name}</TD>
                  <TD>{m.homeScore ?? 0} - {m.awayScore ?? 0}</TD>
                  <TD>{m.awayTeam.name}</TD>
                  <TD className="capitalize">{m.status}</TD>
                  <TD>
                    <span className="text-gray-500">
                      Klik baris untuk update
                    </span>
                  </TD>
                </motion.tr>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>

      {/* Modal Update */}
      <AnimatePresence>
        {dialogOpen && dialogMatch && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white text-center rounded-lg p-6 w-80 pt-20 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-bold mb-4">
                {dialogMatch.homeTeam.name} - {dialogMatch.awayTeam.name}
              </h2>

              {/* Input Skor */}
              <div className="flex gap-2 justify-center mb-4">
                <Input
                  type="number"
                  value={dialogHS}
                  onChange={(e) => setDialogHS(Number(e.target.value))}
                  className="w-16 text-center text-3xl font-bold"
                />
                <span className="text-3xl font-bold">-</span>
                <Input
                  type="number"
                  value={dialogAS}
                  onChange={(e) => setDialogAS(Number(e.target.value))}
                  className="w-16 text-center text-3xl font-bold"
                />
              </div>

              {/* Dropdown Status */}
              <div className="mb-4">
                <select
                  value={dialogStatus}
                  onChange={(e) =>
                    setDialogStatus(e.target.value as "scheduled" | "live" | "finished")
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="scheduled">Menunggu</option>
                  <option value="live">Berlangsung</option>
                  <option value="finished">Selesai</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button
                  onClick={() =>
                    updateScore(dialogMatch, dialogHS, dialogAS, dialogStatus)
                  }
                  disabled={loading === dialogMatch.id}
                >
                  {loading === dialogMatch.id ? "Loading..." : "Update"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
