
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { MachinesTable } from "../components/machines-table"

async function getMachinesData() {
  return withPermission("distributor:sales:read", async () => {
    const supplies = await prisma.supply.findMany({
      where: {
        machine: {
          isNot: undefined,
          sale: null // Exclude machines that have been sold
        }
      },
      select: {
        id: true,
        sellBy: true,
        machine: {
          select: {
            id: true,
            serialNumber: true,
            machineModel: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        distributor: {
          select: {
            name: true,
            organizationName: true,
            region: true
          }
        }
      },
      orderBy: {
        sellBy: 'asc'
      }
    })

    // Transform the data to match the MachinesTable interface
    return supplies
      .filter(supply => supply.machine && supply.machine.machineModel)
      .map(supply => ({
        id: supply.machine!.id,
        serialNumber: supply.machine!.serialNumber,
        machineModel: {
          name: supply.machine!.machineModel.name,
          category: {
            name: supply.machine!.machineModel.category.name
          }
        },
        supply: {
          id: supply.id,
          sellBy: supply.sellBy,
          distributor: {
            name: supply.distributor.name || 'Unknown',
            organizationName: supply.distributor.organizationName || supply.distributor.name || 'Unknown'
          }
        }
      }))
  })
}

export default async function MachinesPage() {
  const machines = await getMachinesData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Machine Inventory</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all machines in distribution
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <MachinesTable 
            initialMachines={machines}
            showBulkActions={true}
          />
        </div>
      </div>
    </div>
  )
} 