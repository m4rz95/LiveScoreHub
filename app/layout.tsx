import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Liga Manager', description: 'Liga Management System' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-fixed bg-cover bg-center" style={{ backgroundImage: "url('/image/background_core.jpg')" }}>
        <div
          className="py-2 px-2 sm:py-4 sm:px-6 lg:py-4 lg:px-8"
        >
          {children}
        </div>
      </body>
    </html>
  )
}

