"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'

type Team = { id: number; name: string; city?: string | null }

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')

  async function load() {
    const res = await fetch('/api/teams', { cache: 'no-store' })
    const json = await res.json(); setTeams(json)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setName(''); setCity(''); setOpen(true) }
  function openEdit(t: Team) { setEditing(t); setName(t.name); setCity(t.city || ''); setOpen(true) }

  async function save() {
    const payload = { name, city }
    if (editing) {
      await fetch('/api/teams/' + editing.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setOpen(false); await load()
  }

  async function remove(id: number) { if (!confirm('Hapus tim ini?')) return; await fetch('/api/teams/' + id, { method: 'DELETE' }); await load() }

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
                  <TD>
                    <Button onClick={() => openEdit(t)}>Ubah</Button>
                    <Button className="border-red-500 text-red-600" onClick={() => remove(t.id)}>Hapus</Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>{editing ? 'Ubah Team' : 'Tambah Team'}</DialogHeader>
        <div className="grid gap-2">
          <Label>Nama</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama tim" />
          <Label>Kota</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Kota" />
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={save}>Simpan</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
