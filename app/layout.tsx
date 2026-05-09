import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'User CRUD Application',
  description: 'A full-featured user management system built with Next.js 16',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}