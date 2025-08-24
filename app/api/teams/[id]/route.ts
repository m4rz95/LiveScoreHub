import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const data = await req.json();

    const { data: t, error } = await supabase
      .from("Team")
      .update({ name: data.name, city: data.city || null })
      .eq("id", id)
      .select();

    if (error) {
      console.error("PUT team error:", error);
      return NextResponse.json(
        { error: "Gagal update team" },
        { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(t, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("Unexpected PUT error:", err);
    return NextResponse.json(
      { error: "Gagal update team" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);

    // Hapus match yang berhubungan dengan tim
    const { error: matchError } = await supabase
      .from("Match")
      .delete()
      .or(`homeTeamId.eq.${id},awayTeamId.eq.${id}`);

    if (matchError) {
      console.error("DELETE match error:", matchError);
      return NextResponse.json(
        { error: "Gagal hapus match terkait" },
        { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    // Hapus tim
    const { error: teamError } = await supabase
      .from("Team")
      .delete()
      .eq("id", id);

    if (teamError) {
      console.error("DELETE team error:", teamError);
      return NextResponse.json(
        { error: "Gagal hapus team" },
        { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("Unexpected DELETE error:", err);
    return NextResponse.json(
      { error: "Gagal hapus team" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
