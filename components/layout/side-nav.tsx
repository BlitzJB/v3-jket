"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface SideNavProps {
  items: {
    title: string
    href: string
    icon: React.ReactNode
  }[]
}

export function SideNav({ items }: SideNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-w-[240px] border-r h-screen bg-card">
      <div className="p-6 border-b">
        <Image
          src="/logo-horizontal.svg"
          alt="JKET Prime Care"
          width={160}
          height={32}
          priority
        />
      </div>
      
      <nav className="flex-1 flex flex-col gap-2 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
} 