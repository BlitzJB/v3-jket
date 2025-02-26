import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { UsersTable } from "./users-table"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

async function getUsers() {
  return withPermission('users:read', async () => {
    return prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
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
    })
  })
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customer-service/users/create">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable initialUsers={users} />
      </Suspense>
    </div>
  )
} 