import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { InventoryTable } from "./inventory-table"

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  machineModel: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  supply: {
    id: string
    supplyDate: Date
    sellBy: Date
  }
}

async function getInventoryData() {
  return withPermission("distributor:inventory:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get all machines supplied to this distributor that haven't been sold or returned
    const machines = await prisma.machine.findMany({
      where: {
        supply: {
          distributorId: session.user.id,
        },
        sale: null,
        return: null,
      },
      include: {
        machineModel: {
          include: {
            category: true,
          },
        },
        supply: true,
      },
      orderBy: {
        supply: {
          supplyDate: 'desc',
        },
      },
    })

    // Filter out machines where supply is null and map to our interface
    return machines
      .filter((machine) => machine.supply !== null)
      .map((machine): Machine => ({
        id: machine.id,
        serialNumber: machine.serialNumber,
        manufacturingDate: machine.manufacturingDate,
        machineModel: {
          id: machine.machineModel.id,
          name: machine.machineModel.name,
          category: {
            id: machine.machineModel.category.id,
            name: machine.machineModel.category.name,
          },
        },
        supply: {
          id: machine.supply!.id,
          supplyDate: machine.supply!.supplyDate,
          sellBy: machine.supply!.sellBy,
        },
      }))
  })
}

export default async function InventoryPage() {
  const machines = await getInventoryData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your machine inventory
            </p>
          </div>
          <Link href="/dashboard/distributor/inventory/log-sale">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Sale
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <InventoryTable initialMachines={machines} />
        </div>
      </div>
    </div>
  )
} 