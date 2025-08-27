"use client"
import React, { useEffect, useRef, useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import { easeOut, motion, Variants } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { LayoutGroup, AnimatePresence } from "framer-motion"

type Match = {
    id?: number
    homeTeam: { id: number; name: string }
    awayTeam: { id: number; name: string }
    homeScore?: number | null
    awayScore?: number | null
    played?: boolean
    status?: "scheduled" | "live" | "finished"
    minute?: number
    matchDate?: string
}

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

type LiveMatch = {
    id?: number
    homeTeam: { id: number; name: string }
    awayTeam: { id: number; name: string }
    homeScore: number
    awayScore: number
    minute: number
}

type Message = {
    id?: number
    username: string
    message: string
    created_at: string
}

export default function PublicDashboard() {
    const [rows, setRows] = useState<Row[]>([])
    const [matches, setMatches] = useState<Match[]>([])
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [userColors, setUserColors] = useState<Record<string, string>>({})


    async function loadStandings() {
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

    async function loadMatches() {
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
                .order("id", { ascending: true });

            if (error) throw error;

            const mapped = data?.map(m => ({
                ...m,
                homeTeam: Array.isArray(m.homeTeam) ? m.homeTeam[0] ?? { id: 0, name: 'Unknown' } : m.homeTeam,
                awayTeam: Array.isArray(m.awayTeam) ? m.awayTeam[0] ?? { id: 0, name: 'Unknown' } : m.awayTeam,
            })) ?? []
            updateMatches(mapped)
        } catch (err) {
            console.error("Gagal load matches:", err)
        }
    }

    // helper buat filter live matches
    function updateMatches(data: Match[]) {
        setMatches(data)
        const live = data
            .filter((m) => m.status === "live")
            .map((m) => ({
                id: m.id,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                homeScore: m.homeScore ?? 0,
                awayScore: m.awayScore ?? 0,
                minute: m.minute ?? 0,
            }))
        setLiveMatches(live)
    }

    useEffect(() => {
        loadStandings()
        loadMatches()

        // pasang realtime listener untuk matches
        const channel = supabase
            .channel("matches-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Match" },
                payload => {
                    console.log("Realtime change received!", payload)

                    setMatches(prev => {
                        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
                            loadMatches()
                            loadStandings()
                        }
                        return prev
                    })
                }
            )

            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Fungsi untuk membuat badge status
    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "live":
                return (
                    <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">
                        live
                    </span>
                )
            case "finished":
                return (
                    <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                        finished
                    </span>
                )
            default:
                return (
                    <span className="px-2 bg-gray-300 text-black rounded-full text-xs">
                        scheduled
                    </span>
                )
        }
    }

    // helper row color
    function getRowColor(status?: string) {
        switch (status) {
            case "live":
                return "bg-red-100 hover:bg-red-200"
            case "finished":
                return "bg-green-100 hover:bg-green-200"
            case "scheduled":
            default:
                return "bg-gray-100 hover:bg-gray-200"
        }
    }


    const tableVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: easeOut },
        },
    }

    const rowVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        show: (i: any) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: easeOut,
            },
        }),
        hover: {
            scale: 1.02,
            backgroundColor: "rgba(59,130,246,0.08)", // biru soft elegan
            transition: { duration: 0.2 },
        },
    }

    // 🔹 Warna random untuk setiap user
    const COLORS = [
        "bg-red-500", "bg-green-500", "bg-blue-500",
        "bg-yellow-500", "bg-purple-500", "bg-pink-500",
        "bg-indigo-500", "bg-teal-500", "bg-orange-500"
    ]

    const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("Chat")
                .select("*")
                .order("created_at", { ascending: true })

            if (error) console.error(error)
            else if (data) {
                setMessages(data)

                // assign warna ke setiap user
                const colorMap: Record<string, string> = {}
                data.forEach(msg => {
                    if (!colorMap[msg.username]) {
                        colorMap[msg.username] = getRandomColor()
                    }
                })
                setUserColors(colorMap)
            }
        }

        fetchMessages()

        // 🔹 Supabase realtime
        const channel = supabase
            .channel("chat-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "Chat" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newMsg = payload.new as Message
                        setMessages(prev => [...prev, newMsg])
                        setUserColors(prev => ({
                            ...prev,
                            [newMsg.username]: prev[newMsg.username] || getRandomColor()
                        }))
                    }

                    if (payload.eventType === "UPDATE") {
                        const updatedMsg = payload.new as Message
                        setMessages(prev =>
                            prev.map(m => (m.id === updatedMsg.id ? updatedMsg : m))
                        )
                    }

                    if (payload.eventType === "DELETE") {
                        const deletedId = payload.old.id
                        setMessages(prev =>
                            prev.filter(m => m.id !== deletedId)
                        )
                    }
                }
            )
            .subscribe()


        return () => {
            supabase.removeChannel(channel)
        }
    }, [])
    return (
        <div className="p-4 grid grid-cols-12 gap-4">
            {/* HASIL PERTANDINGAN */}
            <div className="col-span-12 lg:col-span-4 order-2 lg:order-1">
                <Card className="w-full shadow-xl rounded-2xl">
                    <CardHeader className="text-lg font-bold tracking-wide text-gray-700 py-1">
                        HASIL PERTANDINGAN
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <motion.div initial="hidden" animate="show" variants={tableVariants}>
                                <Table className="min-w-full border-separate border-spacing-y-3">
                                    <TBody>
                                        {matches.map((m, i) => (
                                            <React.Fragment key={m.id ?? i}>
                                                <motion.tr
                                                    key={m.id ?? i}
                                                    className={`cursor-pointer rounded-lg ${getRowColor(m.status)}`}
                                                    custom={i}
                                                    variants={rowVariants}
                                                    initial="hidden"
                                                    animate="show"
                                                    whileHover="hover"
                                                >
                                                    {/* <TD className="text-xs font-bold">{i + 1}</TD> */}

                                                    {/* Home team */}
                                                    <TD className="text-md font-bold whitespace-nowrap px-5">{m.homeTeam.name}</TD>

                                                    {/* Score + matchDate di bawah */}
                                                    <TD className="text-center text-md md:text-lg font-bold">
                                                        <div className="flex flex-col justify-center items-center py-2 whitespace-nowrap">
                                                            {/* skor */}
                                                            <div className="flex items-center gap-5">
                                                                <AnimatePresence mode="popLayout">
                                                                    <motion.span
                                                                        key={m.homeScore}
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: 10 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        className="inline-block min-w-[1ch]"
                                                                    >
                                                                        {m.homeScore ?? 0}
                                                                    </motion.span>
                                                                </AnimatePresence>
                                                                <span>-</span>
                                                                <AnimatePresence mode="popLayout">
                                                                    <motion.span
                                                                        key={m.awayScore}
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: 10 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        className="inline-block min-w-[1ch]"
                                                                    >
                                                                        {m.awayScore ?? 0}
                                                                    </motion.span>
                                                                </AnimatePresence>
                                                            </div>

                                                            {/* tanggal */}
                                                            <div className="text-sm italic text-gray-700 whitespace-nowrap pt-1">
                                                                {m.matchDate
                                                                    ? new Date(m.matchDate).toLocaleDateString("id-ID", {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "numeric",
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        second: "2-digit",
                                                                        hour12: false,
                                                                    }).replace(/\./g, ":")
                                                                    : "-"} {getStatusBadge(m.status)}
                                                            </div>
                                                        </div>
                                                    </TD>

                                                    {/* Away team */}
                                                    <TD className="text-md font-bold whitespace-nowrap px-5">{m.awayTeam.name}</TD>

                                                    {/* Status */}
                                                    {/* <TD className="text-center align-middle">
                                                        {getStatusBadge(m.status)}
                                                    </TD> */}

                                                </motion.tr>

                                            </React.Fragment>
                                        ))}
                                    </TBody>
                                </Table>

                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LIVE SCORE */}
            <div className="col-span-12 lg:col-span-8 order-1 lg:order-2">
                <Card className="w-full">
                    <CardHeader className="font-bold text-lg flex items-center space-x-2 rounded-lg">
                        <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">
                            LIVE SCORE
                        </span>
                        <motion.span
                            className="w-3 h-3 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[510px] flex items-center justify-center relative overflow-hidden rounded-xl">
                        <div className="absolute top-4 left-4 z-20">
                            <motion.img
                                src="/icon/logo.png"
                                alt="Logo"
                                className="w-12 h-12 sm:w-16 sm:h-16"
                                animate={{ rotateY: [0, 180, 360] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 4,
                                    ease: "linear"
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                            />
                        </div>
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(-45deg, rgba(139,92,246,0.6), rgba(236,72,153,0.6), rgba(34,211,238,0.6), rgba(139,92,246,0.6))",
                                backgroundSize: "400% 400%",
                                filter: "blur(20px)",
                            }}
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="relative z-10 w-full sm:m-24 sm:px-6 sm:py-10 rounded-2xl lg:bg-white/10 lg:backdrop-blur-md lg:border lg:border-white/20 text-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {liveMatches.length === 0 ? (
                                <p className="text-gray-100 text-2xl font-bold">
                                    Tidak ada pertandingan live
                                </p>
                            ) : (
                                liveMatches.map((m, i) => (
                                    <div
                                        key={m.id ?? i}
                                        className="flex flex-col items-center justify-center text-black gap-4"
                                    >
                                        <div className="grid grid-cols-3 items-center w-full max-w-4xl">
                                            <div className="text-right text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.homeTeam.name}
                                            </div>
                                            <div className="text-center text-2xl sm:text-6xl font-bold">
                                                vs
                                            </div>
                                            <div className="text-left text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.awayTeam.name}
                                            </div>
                                        </div>
                                        <div className="text-6xl md:text-[18rem] font-extrabold flex justify-center items-center gap-8">
                                            <AnimatePresence mode="popLayout">
                                                <motion.span
                                                    key={m.homeScore}
                                                    initial={{ rotateX: -90, opacity: 0 }}
                                                    animate={{ rotateX: 0, opacity: 1 }}
                                                    exit={{ rotateX: 90, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    style={{
                                                        display: "inline-block",
                                                        transformOrigin: "center bottom",
                                                    }}
                                                >
                                                    {m.homeScore}
                                                </motion.span>
                                            </AnimatePresence>

                                            <span>-</span>

                                            <AnimatePresence mode="popLayout">
                                                <motion.span
                                                    key={m.awayScore}
                                                    initial={{ rotateX: -90, opacity: 0 }}
                                                    animate={{ rotateX: 0, opacity: 1 }}
                                                    exit={{ rotateX: 90, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    style={{
                                                        display: "inline-block",
                                                        transformOrigin: "center bottom",
                                                    }}
                                                >
                                                    {m.awayScore}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>

                                    </div>
                                ))
                            )}
                        </motion.div>
                    </CardContent>
                    <motion.div
                        className="w-full text-center pt-2 text-gray-800 text-xs sm:text-sm flex justify-center gap-1 flex-wrap font-semibold"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.3,
                                },
                            },
                        }}
                    >
                        {"Powered by © 2025 MarDev.".split(" ").map((word, i) => (
                            <motion.span
                                key={i}
                                className="inline-block"
                                variants={{
                                    hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
                                    visible: { opacity: 1, x: 0, filter: "blur(0px)" },
                                }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </motion.div>
                </Card>

                <Card className="w-full mt-5">
                    <CardHeader>KLASEMEN</CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="min-w-full table-auto border border-gray-300">
                                <THead className="bg-gray-100">
                                    <TR className="border-b border-gray-300">
                                        <TH className="border border-gray-300 px-2 py-1">No</TH>
                                        <TH className="border border-gray-300 px-2 py-1">TIM</TH>
                                        <TH className="border border-gray-300 px-2 py-1">P</TH>
                                        <TH className="border border-gray-300 px-2 py-1">W</TH>
                                        <TH className="border border-gray-300 px-2 py-1">D</TH>
                                        <TH className="border border-gray-300 px-2 py-1">L</TH>
                                        <TH className="border border-gray-300 px-2 py-1">GF</TH>
                                        <TH className="border border-gray-300 px-2 py-1">GA</TH>
                                        <TH className="border border-gray-300 px-2 py-1">GD</TH>
                                        <TH className="border border-gray-300 px-2 py-1">Pts</TH>
                                        <TH className="border border-gray-300 px-2 py-1">Last 5</TH>
                                    </TR>
                                </THead>
                                <LayoutGroup>
                                    <TBody className="divide-y divide-gray-300">
                                        {Array.isArray(rows) &&
                                            rows.map((r, i) => (
                                                <motion.tr
                                                    key={r.teamId}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                                    className={`${i === 0
                                                        ? "bg-green-200 text-black font-semibold md:font-bold"
                                                        : "bg-white"
                                                        }`}
                                                >
                                                    <TD className="border border-gray-300 px-2 py-1">{i + 1}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1 font-semibold whitespace-nowrap">{r.teamName}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.played}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.win}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.draw}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.loss}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.gf}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.ga}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.gd}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">{r.points}</TD>
                                                    <TD className="border border-gray-300 px-2 py-1">
                                                        <div className="flex gap-1 justify-center">
                                                            {(r.last5 ?? []).map((res, j) => (
                                                                <span
                                                                    key={j}
                                                                    className={`w-5 h-5 flex items-center justify-center text-xs rounded-full ${res === "W"
                                                                        ? "bg-green-500 text-white"
                                                                        : res === "D"
                                                                            ? "bg-yellow-500 text-black"
                                                                            : res === "L"
                                                                                ? "bg-red-500 text-white"
                                                                                : "bg-gray-300"
                                                                        }`}
                                                                >
                                                                    {res}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </TD>
                                                </motion.tr>
                                            ))}
                                    </TBody>
                                </LayoutGroup>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MARQUEE CHAT STYLE */}
            <div className="col-span-12 md:col-span-12 flex flex-col gap-4 order-3">
                <div className="w-full overflow-hidden relative bg-gray-900/30 backdrop-blur-sm rounded-lg py-2">
                    <div className="marquee-container">
                        <div className="marquee">
                            {messages.map((msg, idx) => (
                                <div key={idx} className="marquee-item">
                                    <div className={`avatar ${userColors[msg.username] || "bg-gray-400"}`}>
                                        {msg.username[0].toUpperCase()}
                                    </div>
                                    <span className="username">{msg.username} :</span>
                                    <span className="message">{msg.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
