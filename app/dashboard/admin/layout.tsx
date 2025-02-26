import { SideNav } from "@/components/layout/side-nav"
import {
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  Building2,
  Boxes,
  Tags,
  ClipboardCheck,
} from "lucide-react"

// Navigation items for the admin dashboard
const adminNavItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Equipment",
    href: "/dashboard/admin/equipment",
    icon: <Boxes className="h-4 w-4" />,
    items: [
      {
        title: "Categories",
        href: "/dashboard/admin/equipment/categories",
        icon: <Tags className="h-4 w-4" />,
      },
      {
        title: "Machine Models",
        href: "/dashboard/admin/equipment/models",
        icon: <Boxes className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Test Configuration",
    href: "/dashboard/admin/equipment/test-config",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNav items={adminNavItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 