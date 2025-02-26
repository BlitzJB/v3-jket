"use client"

import { SideNav } from "@/components/layout/side-nav"
import {
  LayoutDashboard,
  Package2,
  Clock,
} from "lucide-react"

// Navigation items for the sales dashboard
const salesNavItems = [
  {
    title: "Overview",
    href: "/dashboard/sales",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "All Machines",
    href: "/dashboard/sales/machines",
    icon: <Package2 className="h-4 w-4" />,
  },
  {
    title: "Expiring Machines",
    href: "/dashboard/sales/machines/expiring",
    icon: <Clock className="h-4 w-4" />,
  },
]

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={salesNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 