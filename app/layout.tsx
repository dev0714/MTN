import type { Metadata } from "next"
import type React from "react"
import { Archivo, Inter } from "next/font/google"
import "./globals.css"

const heading = Archivo({ subsets: ["latin"], variable: "--font-heading" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Exquisite Cellular Enterprise Management System",
  description: "Exquisite Cellular enterprise website and CRM with mock dashboard data.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className={`${heading.variable} ${body.variable} mtn-shell font-[var(--font-body)]`}>
        {children}
      </body>
    </html>
  )
}
