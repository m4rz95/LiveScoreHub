"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from "@/lib/supabaseClient"

type Team = { id: number; name: string }
type Match = {
  id?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  matchDate?: string;
  status?: 'scheduled' | 'live' | 'finished';
  played?: boolean;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [preview, setPreview] = useState<Match[]>([])
  const [loading, setLoading] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMatch, setDialogMatch] = useState<Match | null>(null)
  const [dialogHS, setDialogHS] = useState(0)
  const [dialogAS, setDialogAS] = useState(0)
  const [dialogStatus, setDialogStatus] = useState<'scheduled' | 'live' | 'finished'>('scheduled');

  // Load matches langsung client-side
  const load = async () => {
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
        .order("id", { ascending: true });

      if (error) throw error;

      const mapped = data?.map(m => ({
        ...m,
        homeTeam: Array.isArray(m.homeTeam) ? m.homeTeam[0] ?? { id: 0, name: 'Unknown' } : m.homeTeam,
        awayTeam: Array.isArray(m.awayTeam) ? m.awayTeam[0] ?? { id: 0, name: 'Unknown' } : m.awayTeam,
      })) ?? []

      setMatches(mapped)
    } catch (err) {
      console.error("Gagal load matches:", err)
      toast.error("Gagal load matches")
    }
  }

  useEffect(() => {
    load()
  }, [])

  function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

  // Generate preview animasi
  async function generate() {
    try {
      setGenerating(true)
      const res = await fetch('/api/matches/generate', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      // slot waktu fix
      const times = [
        "13:00:00", "13:25:00", "13:50:00", "14:15:00", "14:40:00",
        "15:05:00", "15:30:00", "15:55:00", "16:20:00", "16:45:00"
      ]
      const date = "2025-08-29"
      const matchDates = times.map(t => new Date(`${date}T${t}`).toISOString())

      const finalMatches: Match[] = await res.json()
      // suntikkan matchDate ke setiap match
      finalMatches.forEach((m, i) => {
        m.matchDate = matchDates[i] ?? new Date().toISOString()
      })

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
            matchDate: m.matchDate,
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
    } catch (err: any) {
      console.error(err)
      toast.error("Gagal generate match preview")
    } finally {
      setGenerating(false)
    }
  }

  // Save preview ke database
  const save = async () => {
    try {
      const rows = preview.map((m, i) => ({
        homeTeamId: m.homeTeam.id,
        awayTeamId: m.awayTeam.id,
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        played: m.played ?? false,
        status: m.status ?? 'scheduled',
        matchDate: m.matchDate
          ? new Date(m.matchDate).toLocaleString("sv-SE").replace(" ", "T")
          : null,
        updatedAt: new Date().toISOString()
      }))

      const { error } = await supabase.from('Match').insert(rows).select()
      if (error) throw error

      setPreview([])
      await load()
      toast.success("Jadwal berhasil disimpan 🎉")
    } catch (err: any) {
      console.error(err)
      toast.error("Gagal menyimpan jadwal 😢")
    }
  }

  // Update skor & status
  async function updateScore(m: Match, hs: number, as: number, status: 'scheduled' | 'live' | 'finished') {
    try {
      setLoading(m.id!)
      const { error } = await supabase.from('Match').update({
        homeScore: hs,
        awayScore: as,
        status,
        played: true
      }).eq('id', m.id)

      if (error) throw error

      toast.success("Skor & status berhasil diperbarui ✅")
      setDialogOpen(false)
      await load()
    } catch (err: any) {
      console.error(err)
      toast.error("Gagal update ❌")
    } finally {
      setLoading(null)
    }
  }

  const list = preview.length > 0 ? preview : matches
  const getRowColor = (status?: string) => {
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
              <Button
                className="px-4 py-1 text-md rounded"
                onClick={generate}
                disabled={generating}
              >
                {generating ? "Memproses..." : "Acak"}
              </Button>
              {preview.length > 0 && <Button onClick={save} hidden={generating}>Simpan</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>#</TH>
                  <TH>TIM</TH>
                  <TH>SKOR</TH>
                  <TH>TIM</TH>
                  <TH>TANGGAL</TH>
                  <TH>STATUS</TH>
                  <TH>AKSI</TH>
                </TR>
              </THead>
              <TBody>
                {list.map((m, i) => {
                  const isScheduled = !m.status || m.status === "scheduled"
                  const striping = i % 2 === 0 ? "bg-yellow-100" : "bg-white"
                  const rowColor = isScheduled ? striping : getRowColor(m.status)

                  return (
                    <motion.tr
                      key={m.id ?? `${m.homeTeam.id}-${m.awayTeam.id}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`${rowColor} cursor-pointer`}
                      onClick={() => {
                        if (!m.id) return
                        setDialogMatch(m)
                        setDialogHS(m.homeScore ?? 0)
                        setDialogAS(m.awayScore ?? 0)
                        setDialogStatus(m.status ?? 'scheduled')
                        setDialogOpen(true)
                      }}
                    >
                      <TD className='font-bold py-4'>{i + 1}</TD>
                      <TD className='font-bold'>{m.homeTeam.name}</TD>
                      <TD className='font-bold'>{m.homeScore ?? 0} - {m.awayScore ?? 0}</TD>
                      <TD className='font-bold'>{m.awayTeam.name}</TD>
                      <TD className='font-bold'>
                        {m.matchDate
                          ? `${new Date(m.matchDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })} ${new Date(m.matchDate).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                          : "-"}
                      </TD>
                      <TD>{m.status ?? 'scheduled'}</TD>
                      <TD>{m.id ? <span className="text-gray-500">Klik baris untuk update</span> : <span className="text-gray-400">Belum tersimpan</span>}</TD>
                    </motion.tr>
                  )
                })}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {dialogOpen && dialogMatch && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white text-center rounded-lg p-6 w-80 pt-20 relative"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl font-bold mb-4">{dialogMatch.homeTeam.name} - {dialogMatch.awayTeam.name}</h2>
              <div className="flex gap-2 justify-center mb-4">
                <Input type="number" value={dialogHS} onChange={e => setDialogHS(Number(e.target.value))} className="w-16 text-center text-3xl font-bold" />
                <span className="text-3xl font-bold">-</span>
                <Input type="number" value={dialogAS} onChange={e => setDialogAS(Number(e.target.value))} className="w-16 text-center text-3xl font-bold" />
              </div>
              <div className="mb-4">
                <select value={dialogStatus} onChange={e => setDialogStatus(e.target.value as any)} className="w-full border rounded px-3 py-2">
                  <option value="scheduled">Menunggu</option>
                  <option value="live">Berlangsung</option>
                  <option value="finished">Selesai</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={() => updateScore(dialogMatch!, dialogHS, dialogAS, dialogStatus)} disabled={loading === dialogMatch?.id}>
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
