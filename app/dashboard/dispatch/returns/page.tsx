import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { ReturnTable } from "./return-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getReturnsData() {
  return withPermission("dispatch:read", async () => {
    return prisma.return.findMany({
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true,
              },
            },
            supply: {
              include: {
                distributor: true,
              },
            },
          },
        },
      },
      orderBy: {
        returnDate: 'desc',
      },
    })
  })
}

export default async function ReturnsPage() {
  const returns = await getReturnsData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Machine Returns</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track machine returns from distributors
          </p>
        </div>
        <Link href="/dashboard/dispatch/returns/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Return
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <ReturnTable initialReturns={returns} />
      </div>
    </div>
  )
} 