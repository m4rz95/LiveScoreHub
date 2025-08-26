"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// 🔑 Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
    id: string
    username: string
    message: string
    created_at: string
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [open, setOpen] = useState(false)
    const [username, setUsername] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    // State untuk edit
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)
    const [editUsername, setEditUsername] = useState("")
    const [editMessage, setEditMessage] = useState("")

    // State untuk hapus
    const [deletingMessage, setDeletingMessage] = useState<Message | null>(null)

    // Ambil data awal
    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        let { data, error } = await supabase
            .from("Chat")
            .select("*")
            .order("created_at", { ascending: false })
        if (!error) setMessages(data || [])
    }

    // Tambah pesan
    const addMessage = async () => {
        setLoading(true)
        const { error } = await supabase.from("Chat").insert([{ username, message }])
        setLoading(false)
        if (!error) {
            setOpen(false)
            setUsername("")
            setMessage("")
            fetchMessages()
        }
    }

    // Edit pesan
    const updateMessage = async () => {
        if (!editingMessage) return
        await supabase
            .from("Chat")
            .update({ username: editUsername, message: editMessage })
            .eq("id", editingMessage.id)
        setEditingMessage(null)
        fetchMessages()
    }

    // Hapus pesan
    const deleteMessage = async () => {
        if (!deletingMessage) return
        await supabase.from("Chat").delete().eq("id", deletingMessage.id)
        setDeletingMessage(null)
        fetchMessages()
    }

    return (
        <div className="p-6">
            {/* Dialog form tambah pesan */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogHeader>Tambah Pesan</DialogHeader>
                <div className="space-y-2 p-4">
                    <Input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={() => setOpen(false)}>Batal</Button>
                    <Button onClick={addMessage} disabled={loading}>
                        {loading ? "Menyimpan..." : "Kirim"}
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Dialog edit pesan */}
            <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
                <DialogHeader>Edit Pesan</DialogHeader>
                <div className="space-y-2 p-4">
                    <Input
                        placeholder="Username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                    />
                    <Input
                        placeholder="Message"
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={() => setEditingMessage(null)}>Batal</Button>
                    <Button onClick={updateMessage}>Simpan</Button>
                </DialogFooter>
            </Dialog>

            {/* Dialog hapus pesan */}
            <Dialog open={!!deletingMessage} onOpenChange={() => setDeletingMessage(null)}>
                <DialogHeader>Konfirmasi Hapus</DialogHeader>
                <div className="p-4 text-sm">
                    {deletingMessage && (
                        <p>
                            Apakah anda yakin akan menghapus{" "}
                            <strong>{deletingMessage.username}</strong>:{" "}
                            <em>{deletingMessage.message}</em> ?
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={() => setDeletingMessage(null)}>Batal</Button>
                    <Button onClick={deleteMessage}>Hapus</Button>
                </DialogFooter>
            </Dialog>

            {/* Tabel pesan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>Live Chat</div>
                        <Button onClick={() => setOpen(true)}>Tambah Pesan</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Username</TH>
                                    <TH>Message</TH>
                                    <TH>Aksi</TH>
                                </TR>
                            </THead>
                            <TBody className="bg-white">
                                {messages.map((msg) => (
                                    <TR key={msg.id}>
                                        <TD>{msg.username}</TD>
                                        <TD>{msg.message}</TD>
                                        <TD className="space-x-2">
                                            <Button
                                                onClick={() => {
                                                    setEditingMessage(msg)
                                                    setEditUsername(msg.username)
                                                    setEditMessage(msg.message)
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button onClick={() => setDeletingMessage(msg)}>Hapus</Button>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
