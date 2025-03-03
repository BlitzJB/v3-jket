import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { SupplyTable } from "./supply-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getSuppliesData() {
  return withPermission("dispatch:read", async () => {
    const supplies = await prisma.supply.findMany({
      where: {
        machine: {
          isNot: null
        }
      },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true,
              },
            },
            return: true,
          },
        },
        distributor: true,
      },
      orderBy: {
        supplyDate: 'desc',
      },
    })

    // Filter out supplies where machine is null and map to our interface
    return supplies
      .filter((supply) => supply.machine !== null)
      .map((supply) => ({
        id: supply.id,
        supplyDate: supply.supplyDate,
        sellBy: supply.sellBy,
        machine: {
          id: supply.machine!.id,
          serialNumber: supply.machine!.serialNumber,
          machineModel: {
            id: supply.machine!.machineModel.id,
            name: supply.machine!.machineModel.name,
            shortCode: supply.machine!.machineModel.shortCode,
            category: {
              id: supply.machine!.machineModel.category.id,
              name: supply.machine!.machineModel.category.name,
              shortCode: supply.machine!.machineModel.category.shortCode,
            },
          },
          return: supply.machine!.return ? {
            id: supply.machine!.return.id,
            returnDate: supply.machine!.return.returnDate,
            returnReason: supply.machine!.return.returnReason,
          } : null,
        },
        distributor: {
          id: supply.distributor.id,
          name: supply.distributor.name || '',
          organizationName: supply.distributor.organizationName || '',
          region: supply.distributor.region || '',
        },
      }))
  })
}

export default async function SuppliesPage() {
  const supplies = await getSuppliesData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Machine Supplies</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track machine supplies to distributors
          </p>
        </div>
        <Link href="/dashboard/dispatch/supplies/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Supply
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <SupplyTable initialSupplies={supplies} />
      </div>
    </div>
  )
} 