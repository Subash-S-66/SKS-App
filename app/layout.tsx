import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SKS Agency | Project Management",
  description: "Internal project management tool for SKS Agency",
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <Providers>
          {children}
          <Toaster theme="dark" position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
