
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { ReturnTable } from "./return-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Return {
  id: string
  returnDate: Date
  returnReason: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      id: string
      name: string
      shortCode: string
      category: {
        id: string
        name: string
        shortCode: string
      }
    }
    supply: {
      id: string
      supplyDate: Date
      distributor: {
        id: string
        name: string
        organizationName: string
        region: string
      }
    }
  }
}

async function getReturnsData() {
  return withPermission("dispatch:read", async () => {
    const returns = await prisma.return.findMany({
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

    // Map database results to our interface
    return returns
      .filter(ret => ret.machine.supply !== null)
      .map(ret => ({
        id: ret.id,
        returnDate: ret.returnDate,
        returnReason: ret.returnReason,
        machine: {
          id: ret.machine.id,
          serialNumber: ret.machine.serialNumber,
          machineModel: {
            id: ret.machine.machineModel.id,
            name: ret.machine.machineModel.name,
            shortCode: ret.machine.machineModel.shortCode,
            category: {
              id: ret.machine.machineModel.category.id,
              name: ret.machine.machineModel.category.name,
              shortCode: ret.machine.machineModel.category.shortCode,
            },
          },
          supply: {
            id: ret.machine.supply!.id,
            supplyDate: ret.machine.supply!.supplyDate,
            distributor: {
              id: ret.machine.supply!.distributor.id,
              name: ret.machine.supply!.distributor.name || '',
              organizationName: ret.machine.supply!.distributor.organizationName || '',
              region: ret.machine.supply!.distributor.region || '',
            },
          },
        },
      }))
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