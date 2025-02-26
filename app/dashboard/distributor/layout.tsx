import { SideNav } from "@/components/layout/side-nav"
import {
  BarChart3,
  Box,
  History,
  Users,
} from "lucide-react"

// Navigation items for the distributor dashboard
const distributorNavItems = [
  {
    title: "Overview",
    href: "/dashboard/distributor",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Inventory",
    href: "/dashboard/distributor/inventory",
    icon: <Box className="h-4 w-4" />,
  },
  {
    title: "Sales History",
    href: "/dashboard/distributor/sales",
    icon: <History className="h-4 w-4" />,
  },
  {
    title: "Customers",
    href: "/dashboard/distributor/customers",
    icon: <Users className="h-4 w-4" />,
  },
]

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={distributorNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 