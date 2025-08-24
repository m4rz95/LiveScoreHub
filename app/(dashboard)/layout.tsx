// app/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import Nav from '@/components/Nav'
import { Toaster } from 'sonner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <Nav />
      <main className="flex-1 p-2 md:p-4 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
