"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TableIcon as TableTennis } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Start", href: "/" },
    { name: "Spelare", href: "/players" },
    { name: "Grupper", href: "/groups" },
    { name: "Schema", href: "/schedule" },
    { name: "Matcher", href: "/matches" },
    { name: "Poängställning", href: "/standings" },
    { name: "Slutspel", href: "/playoffs" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <TableTennis className="h-6 w-6" />
          <span className="font-bold hidden sm:inline-block">Sogeti Pingis Turnering</span>
        </Link>
        <nav className="flex items-center space-x-1 md:space-x-2 overflow-auto">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "default" : "ghost"}
              size="sm"
              className={cn(
                "text-sm",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
              asChild
            >
              <Link href={item.href}>{item.name}</Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
