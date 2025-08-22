"use client"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table"
import { easeOut, motion, Variants } from "framer-motion"

type Match = {
    id?: number
    homeTeam: { id: number, name: string }
    awayTeam: { id: number, name: string }
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
        setMatches(data)

        // filter live matches
        const live = data
            .filter(m => m.status === "live")
            .map(m => ({
                id: m.id,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                homeScore: m.homeScore ?? 0,
                awayScore: m.awayScore ?? 0,
                minute: m.minute ?? 0
            }))
        setLiveMatches(live)
    }

    useEffect(() => {
        loadStandings()
        loadMatches()
    }, [])

    // Fungsi untuk menentukan warna background baris berdasarkan status
    const getRowClass = (status?: string) => {
        switch (status) {
            case "live": return "bg-red-100"
            case "finished": return "bg-green-100"
            case "scheduled": return "bg-white"
            default: return "bg-white"
        }
    }

    // Fungsi untuk background di tabel pertandingan
    const getMatchRowClass = (status?: string) => {
        switch (status) {
            case "live": return "bg-red-100"
            case "finished": return "bg-green-100"
            default: return "bg-white"
        }
    }

    // Fungsi untuk background di tabel klasemen
    const getStandingRowClass = (index: number) => {
        if (index === 0) return "bg-green-100" // baris pertama hijau
        return "bg-white"
    }

    // Fungsi untuk membuat badge status
    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "live": return <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">LIVE</span>
            case "finished": return <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs">FINISHED</span>
            default: return <span className="px-2 py-1 bg-gray-300 text-black rounded-full text-xs">MENUNGGU</span>
        }
    }
    const tableVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: easeOut }
        }
    };


    const rowVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        show: (i: any) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: easeOut
            }
        }),
        hover: {
            scale: 1.02,
            backgroundColor: "rgba(59,130,246,0.08)", // biru soft elegan
            transition: { duration: 0.2 }
        }
    };


    return (
        <div className="p-4 grid grid-cols-12 gap-4">
            {/* Pertandingan */}
            <div className="col-span-12 md:col-span-4">
                <Card className="w-full shadow-xl rounded-2xl">
                    <CardHeader className="text-lg font-bold tracking-wide text-gray-700 py-1">
                        HASIL PERTANDINGAN
                    </CardHeader>
                    <CardContent>
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={tableVariants}
                        >
                            <Table className="min-w-full border-separate border-spacing-y-1.5">
                                {/* <THead>
                                    <TR className="bg-gray-100">
                                        <TH>#</TH>
                                        <TH>Home</TH>
                                        <TH>Score</TH>
                                        <TH>Away</TH>
                                        <TH>Status</TH>
                                    </TR>
                                </THead> */}
                                <TBody>
                                    {matches.map((m, i) => (
                                        <motion.tr
                                            key={m.id ?? i}
                                            className={`${getMatchRowClass(m.status)} cursor-pointer rounded-lg`}
                                            custom={i}
                                            variants={rowVariants}
                                            initial="hidden"
                                            animate="show"
                                            whileHover="hover"
                                        >
                                            <TD>{i + 1}</TD>
                                            <TD className="font-semibold">{m.homeTeam.name}</TD>
                                            <TD className="text-center">{m.homeScore ?? 0} - {m.awayScore ?? 0}</TD>
                                            <TD className="font-semibold">{m.awayTeam.name}</TD>
                                            <TD className="flex justify-center">{getStatusBadge(m.status)}</TD>
                                        </motion.tr>
                                    ))}
                                </TBody>
                            </Table>
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
            <div className="col-span-12 md:col-span-8">
                {/* Live Score */}
                <Card className="w-full">
                    <CardHeader className="font-bold text-lg flex items-center space-x-2 rounded-lg">
                        <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs">
                            LIVE SCORE
                        </span>
                        {/* Bulatan animasi modern */}
                        <motion.span
                            className="w-3 h-3 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </CardHeader>

                    <CardContent
                        className="h-[475px] flex items-center justify-center relative overflow-hidden rounded-xl"
                        style={{
                            backgroundImage: "url('/image/background.jpg')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        {/* Overlay animasi gradient lebih halus */}
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background:
                                    "linear-gradient(-45deg, rgba(139,92,246,0.6), rgba(236,72,153,0.6), rgba(34,211,238,0.6), rgba(139,92,246,0.6))",
                                backgroundSize: "400% 400%",
                                filter: "blur(20px)",
                            }}
                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Logo di pojok kiri atas */}
                        <div
                            className="absolute top-4 left-4 z-20"
                            style={{
                                perspective: "1000px", // supaya efek 3D keliatan
                            }}
                        >
                            <motion.img
                                src="/icon/logo.png"
                                alt="Logo"
                                className="w-12 h-12 sm:w-16 sm:h-16"
                                animate={{ rotateY: [0, 180, 360] }}
                                transition={{
                                    repeat: Infinity,
                                    ease: "linear",
                                    duration: 6, // makin besar makin smooth
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                            />
                        </div>

                        {/* Copyright di bawah tengah */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xs sm:text-sm opacity-80">
                            © Umardev
                        </div>

                        {/* Konten dengan efek glass */}
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
                                    <div key={m.id ?? i} className="flex flex-col items-center text-white gap-4">
                                        {/* Baris Nama Tim */}
                                        <div className="grid grid-cols-3 items-center w-full max-w-4xl">
                                            <div className="text-right text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.homeTeam.name}
                                            </div>
                                            <div className="text-center text-xl sm:text-2xl font-semibold">vs</div>
                                            <div className="text-left text-2xl sm:text-4xl font-bold truncate px-2">
                                                {m.awayTeam.name}
                                            </div>
                                        </div>

                                        {/* Baris Skor */}
                                        <div className="text-4xl sm:text-9xl font-extrabold">
                                            {m.homeScore} : {m.awayScore}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </CardContent>
                </Card>
            </div>

            {/* Klasemen*/}
            <div className="col-span-12 md:col-span-12 flex flex-col gap-4">
                {/* Klasemen */}
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
                                <TBody>
                                    {rows.map((r, i) => (
                                        <motion.tr
                                            key={r.teamId}
                                            className={getStandingRowClass(i)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: i * 0.05 }}
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
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
