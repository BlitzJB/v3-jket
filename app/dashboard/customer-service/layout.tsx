import { SideNav } from "@/components/layout/side-nav"
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Users,
  Clock,
  Package2,
} from "lucide-react"

const supportNavItems = [
  {
    title: "Overview",
    href: "/dashboard/customer-service",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "Service Requests",
    href: "/dashboard/customer-service/requests",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    title: "History",
    href: "/dashboard/customer-service/history",
    icon: <History className="h-4 w-4" />,
  },
  {
    title: "Users",
    href: "/dashboard/customer-service/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Expiring Overview",
    href: "/dashboard/customer-service/machine-expiry",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "All Machines",
    href: "/dashboard/customer-service/machine-expiry/machines",
    icon: <Package2 className="h-4 w-4" />,
  },
  {
    title: "Expiring Machines",
    href: "/dashboard/customer-service/machine-expiry/machines/expiring",
    icon: <Clock className="h-4 w-4" />,
  },
]

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={supportNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 