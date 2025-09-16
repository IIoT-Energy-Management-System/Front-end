import { Toaster } from 'sonner';
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IIoT Energy Management Platform",
  description: "Enterprise-grade industrial energy monitoring and management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className="mdl-js">
      <body className={inter.className}>
        {children}
        <Toaster richColors/>
      </body>
    </html>
  )
}
