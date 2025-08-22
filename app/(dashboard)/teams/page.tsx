"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Team = { id: number; name: string; city?: string | null }

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')

  async function load() {
    const res = await fetch('/api/teams', { cache: 'no-store' })
    setTeams(await res.json())
  }

  useEffect(() => {
    load()

    // listen realtime ke tabel teams
    const channel = supabase
      .channel("teams-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTeams((prev) => [...prev, payload.new as Team])
          }
          if (payload.eventType === "UPDATE") {
            setTeams((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Team).id ? (payload.new as Team) : t
              )
            )
          }
          if (payload.eventType === "DELETE") {
            setTeams((prev) =>
              prev.filter((t) => t.id !== (payload.old as Team).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setCity('')
    setOpen(true)
  }

  function openEdit(t: Team) {
    setEditing(t)
    setName(t.name)
    setCity(t.city || '')
    setOpen(true)
  }

  async function save() {
    const payload = { name, city }
    if (editing) {
      await fetch('/api/teams/' + editing.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setOpen(false)
  }

  async function remove(id: number) {
    if (!confirm('Hapus tim ini?')) return
    await fetch('/api/teams/' + id, { method: 'DELETE' })
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>TIM</div>
            <Button onClick={openCreate}>+ Tambah Team</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>#</TH><TH>Nama</TH><TH>Kota</TH><TH>Aksi</TH></TR>
            </THead>
            <TBody>
              {teams.map((t, i) => (
                <TR key={t.id}>
                  <TD>{i + 1}</TD>
                  <TD>{t.name}</TD>
                  <TD>{t.city}</TD>
                  <TD className="flex gap-2">
                    <Button onClick={() => openEdit(t)}>Ubah</Button>
                    <Button
                      className="border-red-500 text-red-600"
                      onClick={() => remove(t.id)}
                    >
                      Hapus
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>{editing ? 'Ubah Team' : 'Tambah Team'}</DialogHeader>
        <div className="grid gap-2 p-4">
          <Label>Nama</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama tim"
          />
          <Label>Kota</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Kota"
          />
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={save}>Simpan</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
