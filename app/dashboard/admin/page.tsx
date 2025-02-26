import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { Users, UserCheck, UserX } from "lucide-react"

async function getStats() {
  return withPermission("users:read", async () => {
    const [totalUsers, approvedUsers, pendingUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approved: true } }),
      prisma.user.count({ where: { approved: false } }),
    ])

    return {
      totalUsers,
      approvedUsers,
      pendingUsers,
    }
  })
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Approved Users</CardTitle>
            <UserCheck className="h-4 w-4 text-success/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approvedUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending Users</CardTitle>
            <UserX className="h-4 w-4 text-destructive/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.pendingUsers}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 