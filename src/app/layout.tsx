import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
/* import { Toast } from "@/components/ui/toast" */

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Table Tennis Tournament",
  description: "Manage your office table tennis tournament with ease",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          {/* <Toast /> */}
        </ThemeProvider>
      </body>
    </html>
  )
}
