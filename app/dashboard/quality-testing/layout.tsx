import { SideNav } from "@/components/layout/side-nav"
import {
  ClipboardCheck,
  QrCode,
  History,
  BarChart3,
} from "lucide-react"

// Navigation items for the quality testing dashboard
const qaNavItems = [
  {
    title: "Overview",
    href: "/dashboard/quality-testing",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Log QA Test",
    href: "/dashboard/quality-testing/log-test",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    title: "Test History",
    href: "/dashboard/quality-testing/history",
    icon: <History className="h-4 w-4" />,
  },
]

export default function QualityTestingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={qaNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 