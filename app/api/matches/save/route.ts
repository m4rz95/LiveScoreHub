import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const matches = await req.json();

        // simpan semua match ke DB
        const saved = await prisma.$transaction(
            matches.map((m: any) =>
                prisma.match.create({
                    data: {
                        homeTeamId: m.homeTeam.id,
                        awayTeamId: m.awayTeam.id,
                        homeScore: m.homeScore ?? 0,
                        awayScore: m.awayScore ?? 0,
                        played: m.played ?? false,
                    },
                })
            )
        );

        return NextResponse.json(saved, { status: 201 });
    } catch (err) {
        console.error("Save error:", err);
        return NextResponse.json({ error: "Gagal simpan ke DB" }, { status: 500 });
    }
}
