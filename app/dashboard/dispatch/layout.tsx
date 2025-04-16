import { SideNav } from "@/components/layout/side-nav"
import {
  TruckIcon,
  RotateCcw,
  BarChart3,
} from "lucide-react"

// Navigation items for the dispatch dashboard
const dispatchNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/dispatch",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Dispatch Department",
    href: "/dashboard/dispatch/supplies",
    icon: <TruckIcon className="h-4 w-4" />,
  },
  {
    title: "Machine Returns",
    href: "/dashboard/dispatch/returns",
    icon: <RotateCcw className="h-4 w-4" />,
  },
]

export default function DispatchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={dispatchNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 