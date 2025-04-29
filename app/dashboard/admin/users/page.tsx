
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { UserManagementTable } from "./user-management-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getUsersData() {
  return withPermission("users:read", async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        emailVerified: true,
        phoneNumber: true,
        region: true,
        organizationName: true,
      },
      orderBy: {
        emailVerified: "desc",
      },
    })
  })
}

export default async function UsersPage() {
  const users = await getUsersData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve user accounts
          </p>
        </div>
        <Link href="/dashboard/admin/users/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <UserManagementTable initialUsers={users} />
      </div>
    </div>
  )
} 