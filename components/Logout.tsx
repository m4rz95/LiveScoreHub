"use client"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Logout() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false }) // tidak otomatis redirect
    router.push("/admin/login") // arahkan ke halaman login
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  )
}
