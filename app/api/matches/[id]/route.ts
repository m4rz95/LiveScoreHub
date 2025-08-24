// app/api/matches/[id]/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json()

  const { data, error } = await supabase
    .from("Match")
    .update({
      homeScore: body.homeScore ?? 0,
      awayScore: body.awayScore ?? 0,
      played: body.played ?? false,
      status: body.status ?? "scheduled",
    })
    .eq("id", id)
    .select()   // biar hasilnya dikembalikan, mirip Prisma update

  if (error) {
    console.error("Error updating match:", error)
    return NextResponse.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } })
  }

  return NextResponse.json(data?.[0] ?? {})
}
