
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { MachinesTable } from "../../components/machines-table"
import { addDays, isAfter, isBefore } from "date-fns"

async function getExpiringMachinesData() {
  return withPermission("distributor:sales:read", async () => {
    const today = new Date()
    const thirtyDaysFromNow = addDays(today, 30)

    const supplies = await prisma.supply.findMany({
      where: {
        sellBy: {
          gt: today,
          lte: thirtyDaysFromNow
        },
        distributor: {
          name: {
            not: null
          }
        }
      },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true
              }
            }
          }
        },
        distributor: true
      },
      orderBy: {
        sellBy: 'asc'
      }
    })

    // Transform the data to match the MachinesTable interface
    return supplies.map(supply => ({
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
          name: supply.distributor.name!,
          organizationName: supply.distributor.name!
        }
      }
    }))
  })
}

export default async function ExpiringMachinesPage() {
  const machines = await getExpiringMachinesData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Expiring Machines</h1>
          <p className="text-muted-foreground mt-1">
            Machines expiring within the next 30 days
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