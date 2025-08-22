import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
    const cookieStore = cookies()

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    // optional: ambil cookie untuk auth session
                    cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
                }
            }
        }
    )
}
