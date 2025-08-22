"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Match = {
  id?: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  homeScore?: number | null;
  awayScore?: number | null;
  status?: 'scheduled' | 'live' | 'finished';
  played?: boolean;
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
  const [dialogStatus, setDialogStatus] = useState<'scheduled' | 'live' | 'finished'>('scheduled');

  async function load() {
    const res = await fetch('/api/matches', { cache: 'no-store' })
    setMatches(await res.json())
  }

  useEffect(() => {
    load()

    // Realtime listener Supabase
    const channel = supabase
      .channel("public:matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) => {
            let updated = [...prev]

            if (payload.eventType === "INSERT") {
              updated = [...prev, payload.new as Match]
            }
            if (payload.eventType === "UPDATE") {
              updated = prev.map(m => m.id === payload.new.id ? (payload.new as Match) : m)
            }
            if (payload.eventType === "DELETE") {
              updated = prev.filter(m => m.id !== payload.old.id)
            }

            return updated
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function generate() {
    const res = await fetch('/api/matches/generate', { method: 'POST' })
    if (!res.ok) return console.error(await res.text())

    const finalMatches: Match[] = await res.json()
    const tempMatches = finalMatches.map(m => ({ ...m }))
    const teamNames = Array.from(new Set(finalMatches.flatMap(m => [m.homeTeam.name, m.awayTeam.name])))

    const previewCopy: Match[] = []

    for (let i = 0; i < tempMatches.length; i++) {
      const m = tempMatches[i]
      const animDuration = 1000
      const intervalTime = 100
      let elapsed = 0
      let lastHome = ""
      let lastAway = ""
      while (elapsed < animDuration) {
        let randomHome = teamNames[Math.floor(Math.random() * teamNames.length)]
        let randomAway = teamNames[Math.floor(Math.random() * teamNames.length)]

        while ((randomAway === randomHome || randomHome === lastHome || randomAway === lastAway) && teamNames.length > 1) {
          randomAway = teamNames[Math.floor(Math.random() * teamNames.length)]
          randomHome = teamNames[Math.floor(Math.random() * teamNames.length)]
        }

        previewCopy[i] = {
          ...m,
          homeTeam: { ...m.homeTeam, name: randomHome },
          awayTeam: { ...m.awayTeam, name: randomAway },
        }
        setPreview([...previewCopy])
        lastHome = randomHome
        lastAway = randomAway
        await sleep(intervalTime)
        elapsed += intervalTime
      }

      previewCopy[i] = m
      setPreview([...previewCopy])
      await sleep(50)
    }
  }

  async function save() {
    await fetch('/api/matches/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preview)
    })
    setPreview([])
    toast.success("Jadwal berhasil disimpan 🎉")
  }

  async function updateScore(m: Match, hs: number, as: number, status: 'scheduled' | 'live' | 'finished') {
    try {
      setLoading(m.id!)
      const res = await fetch('/api/matches/' + m.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: hs, awayScore: as, status, played: true })
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Skor & status berhasil diperbarui ✅")
      setDialogOpen(false)
      // ❌ Tidak perlu `await load()`, karena realtime otomatis update
    } catch (err: any) {
      toast.error("Gagal update ❌: " + err.message)
      setDialogOpen(false)
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const list = preview.length > 0 ? preview : matches

  function getRowColor(status?: string) {
    switch (status) {
      case 'live': return 'bg-green-200 hover:bg-green-300'
      case 'finished': return 'bg-gray-300 hover:bg-gray-400'
      default: return 'bg-white hover:bg-orange-100'
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>PERTANDINGAN</div>
            <div className="flex gap-2">
              <Button className="px-4 py-1 text-md rounded" onClick={generate}>Acak</Button>
              {preview.length > 0 && <Button onClick={save}>Simpan</Button>}
            </div>
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
                    key={m.id ?? `${m.homeTeam.id}-${m.awayTeam.id}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${getRowColor(m.status)} cursor-pointer`}
                    onClick={() => {
                      if (!m.id) return
                      setDialogMatch(m)
                      setDialogHS(m.homeScore ?? 0)
                      setDialogAS(m.awayScore ?? 0)
                      setDialogStatus(m.status ?? 'scheduled')
                      setDialogOpen(true)
                    }}
                  >
                    <TD>{i + 1}</TD>
                    <TD>{m.homeTeam.name}</TD>
                    <TD>{m.homeScore ?? 0} - {m.awayScore ?? 0}</TD>
                    <TD>{m.awayTeam.name}</TD>
                    <TD>{m.status}</TD>
                    <TD>
                      {m.id ? <span className="text-gray-500">Klik baris untuk update</span> : <span className="text-gray-400">Belum tersimpan</span>}
                    </TD>
                  </motion.tr>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-bold mb-4">
                {dialogMatch.homeTeam.name} - {dialogMatch.awayTeam.name}
              </h2>

              {/* Input Skor */}
              <div className="flex gap-2 justify-center mb-4">
                <Input
                  type="number"
                  value={dialogHS}
                  onChange={e => setDialogHS(Number(e.target.value))}
                  className="w-16 text-center text-3xl font-bold"
                />
                <span className="text-3xl font-bold">-</span>
                <Input
                  type="number"
                  value={dialogAS}
                  onChange={e => setDialogAS(Number(e.target.value))}
                  className="w-16 text-center text-3xl font-bold"
                />
              </div>

              {/* Dropdown Status */}
              <div className="mb-4">
                <select
                  value={dialogStatus}
                  onChange={e => setDialogStatus(e.target.value as 'scheduled' | 'live' | 'finished')}
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
                  onClick={() => updateScore(dialogMatch!, dialogHS, dialogAS, dialogStatus)}
                  disabled={loading === dialogMatch?.id}
                >
                  {loading === dialogMatch?.id ? 'Loading...' : 'Update'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
