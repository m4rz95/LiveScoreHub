"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import cn from "classnames"
import Logout from "./Logout"

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-xl block",
        {
          "bg-gray-900 text-white": pathname.startsWith(href),
          "hover:bg-gray-100": !pathname.startsWith(href),
        }
      )}
      onClick={() => setOpen(false)}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-white shadow-md p-3 mb-5">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl font-bold">LIGA FUTSAL AKR</div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {link("/teams", "TIM")}
          {link("/matches", "PERTANDINGAN")}
          {link("/standings", "KLASEMEN")}
          <Logout />
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded bg-gray-200"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-2 flex flex-col gap-2">
          {link("/teams", "TIM")}
          {link("/matches", "PERTANDINGAN")}
          {link("/standings", "KLASEMEN")}
          <Logout />
        </div>
      )}
    </nav>
  )
}
