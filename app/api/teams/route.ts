import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // pastikan ini sudah ada dan terhubung

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { data: teams, error } = await supabase
            .from("Team")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("GET teams error:", error);
            return NextResponse.json(
                { error: "Gagal fetch teams" },
                { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        return NextResponse.json(teams, {
            headers: { "Cache-Control": "no-store, max-age=0" },
        });
    } catch (err) {
        console.error("Unexpected GET error:", err);
        return NextResponse.json(
            { error: "Gagal fetch teams" },
            { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
        );
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        const { data: t, error } = await supabase
            .from("Team")
            .insert([{ name: data.name, city: data.city || null }])
            .select();

        if (error) {
            console.error("POST team error:", error);
            return NextResponse.json(
                { error: "Gagal create team" },
                { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        return NextResponse.json(t, {
            headers: { "Cache-Control": "no-store, max-age=0" },
        });
    } catch (err) {
        console.error("Unexpected POST error:", err);
        return NextResponse.json(
            { error: "Gagal create team" },
            { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
        );
    }
}
