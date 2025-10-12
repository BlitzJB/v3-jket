import { SideNav } from "@/components/layout/side-nav"
import {
  LayoutDashboard,
  ClipboardList,
  History,
  LineChart,
} from "lucide-react"

// Navigation items for the service dashboard
const serviceNavItems = [
  {
    title: "Overview",
    href: "/dashboard/service",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "Assigned Visits",
    href: "/dashboard/service/visits",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    title: "Service History",
    href: "/dashboard/service/history",
    icon: <History className="h-4 w-4" />,
  },
  {
    title: "Analytics",
    href: "/dashboard/service/analytics",
    icon: <LineChart className="h-4 w-4" />,
  },
]

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={serviceNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 