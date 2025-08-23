"use client"
import { useEffect, useState } from "react"
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

export default function PublicDashboard() {
    const [rows, setRows] = useState<Row[]>([])
    const [matches, setMatches] = useState<Match[]>([])
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])

    async function loadStandings() {
        const res = await fetch("/api/standings", { cache: "no-store" })
        setRows(await res.json())
    }

    async function loadMatches() {
        const res = await fetch("/api/matches", { cache: "no-store" })
        const data: Match[] = await res.json()
        updateMatches(data)
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
                        LIVE
                    </span>
                )
            case "finished":
                return (
                    <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">
                        FINISHED
                    </span>
                )
            default:
                return (
                    <span className="px-2 py-1 bg-gray-300 text-black rounded-full text-xs">
                        SCHEDULED
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

    return (
        <div className="p-4 grid grid-cols-12 gap-4">
            {/* HASIL PERTANDINGAN */}
            <div className="col-span-12 lg:col-span-4">
                <Card className="w-full shadow-xl rounded-2xl">
                    <CardHeader className="text-lg font-bold tracking-wide text-gray-700 py-1">
                        HASIL PERTANDINGAN
                    </CardHeader>
                    <CardContent>
                        <motion.div initial="hidden" animate="show" variants={tableVariants}>
                            <Table className="min-w-full border-separate border-spacing-y-1.5">
                                <TBody>
                                    {matches.map((m, i) => (
                                        <motion.tr
                                            key={m.id ?? i}
                                            className={`cursor-pointer rounded-lg ${getRowColor(m.status)}`}
                                            custom={i}
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="show"
                                            whileHover="hover"
                                        >
                                            <TD>{i + 1}</TD>
                                            <TD className="font-semibold">{m.homeTeam.name}</TD>
                                            <TD className="text-center text-2xl font-bold">
                                                <AnimatePresence mode="popLayout">
                                                    <motion.span
                                                        key={m.homeScore}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="inline-block min-w-[1ch]" // biar stabil lebar
                                                    >
                                                        {m.homeScore ?? 0}
                                                    </motion.span>
                                                </AnimatePresence>
                                                {" - "}
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
                                            </TD>

                                            <TD className="font-semibold">{m.awayTeam.name}</TD>
                                            <TD className="flex justify-center">
                                                {getStatusBadge(m.status)}
                                            </TD>
                                        </motion.tr>
                                    ))}
                                </TBody>
                            </Table>
                        </motion.div>
                    </CardContent>
                </Card>
            </div>

            {/* LIVE SCORE */}
            <div className="col-span-12 lg:col-span-8">
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
                    <CardContent className="h-[475px] flex items-center justify-center relative overflow-hidden rounded-xl">
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
                            className="relative z-10 w-full sm:m-24 sm:px-6 sm:py-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center"
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
                                        className="flex flex-col items-center text-white gap-4"
                                    >
                                        <div className="grid grid-cols-3 items-center w-full max-w-4xl">
                                            <div className="text-right text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.homeTeam.name}
                                            </div>
                                            <div className="text-center text-xl sm:text-2xl font-semibold">
                                                vs
                                            </div>
                                            <div className="text-left text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.awayTeam.name}
                                            </div>
                                        </div>
                                        <div className="text-6xl sm:text-9xl font-extrabold flex gap-6">
                                            <AnimatePresence mode="popLayout">
                                                <motion.span
                                                    key={m.homeScore}
                                                    initial={{ rotateX: -90, opacity: 0 }}
                                                    animate={{ rotateX: 0, opacity: 1 }}
                                                    exit={{ rotateX: 90, opacity: 0 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    style={{
                                                        display: "inline-block",
                                                        transformOrigin: "center bottom", // biar efek flip ke atas
                                                    }}
                                                >
                                                    {m.homeScore}
                                                </motion.span>
                                            </AnimatePresence>

                                            <span>:</span>

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
                </Card>
            </div>

            {/* KLASEMEN */}
            <div className="col-span-12 md:col-span-12 flex flex-col gap-4">
                <Card className="w-full">
                    <CardHeader>KLASEMEN</CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>No</TH>
                                        <TH>TIM</TH>
                                        <TH>P</TH>
                                        <TH>W</TH>
                                        <TH>D</TH>
                                        <TH>L</TH>
                                        <TH>GF</TH>
                                        <TH>GA</TH>
                                        <TH>GD</TH>
                                        <TH>Pts</TH>
                                        <TH>Last 5</TH>
                                    </TR>
                                </THead>
                                <LayoutGroup>
                                    <TBody>
                                        {Array.isArray(rows) &&
                                            rows.map((r, i) => (
                                                <motion.tr
                                                    key={r.teamId}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                                    className={i === 0 ? "bg-green-200 text-black font-bold" : "bg-white"}
                                                >
                                                    <TD>{i + 1}</TD>
                                                    <TD className="font-semibold">{r.teamName}</TD>
                                                    <TD>{r.played}</TD>
                                                    <TD>{r.win}</TD>
                                                    <TD>{r.draw}</TD>
                                                    <TD>{r.loss}</TD>
                                                    <TD>{r.gf}</TD>
                                                    <TD>{r.ga}</TD>
                                                    <TD>{r.gd}</TD>
                                                    <TD>{r.points}</TD>
                                                    <TD>
                                                        <div className="flex gap-1 justify-center">
                                                            {(r.last5 ?? []).map((res, j) => (
                                                                <span
                                                                    key={j}
                                                                    className={`w-5 h-5 flex items-center justify-center text-xs rounded-full
                                ${res === "W"
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
        </div >
    )
}
