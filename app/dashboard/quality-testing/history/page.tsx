import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { QualityTestingHistoryTable } from "./quality-testing-history-table"

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  testResultData: Record<string, any>
  testAdditionalNotes: string | null
  machineModel: {
    id: string
    name: string
    shortCode: string
    coverImageUrl: string | null
    category: {
      id: string
      name: string
      shortCode: string
    }
  }
}

async function getCategories() {
  return withPermission("quality:read", async () => {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        machineModels: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            coverImageUrl: true,
            categoryId: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })
  })
}

async function getMachinesData() {
  return withPermission("quality:read", async () => {
    const machines = await prisma.machine.findMany({
      select: {
        id: true,
        serialNumber: true,
        manufacturingDate: true,
        testResultData: true,
        testAdditionalNotes: true,
        machineModel: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            coverImageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
                shortCode: true,
              },
            },
          },
        },
      },
      orderBy: {
        manufacturingDate: "desc",
      },
    })

    // Map database results to our interface
    return machines.map((machine): Machine => ({
      id: machine.id,
      serialNumber: machine.serialNumber,
      manufacturingDate: machine.manufacturingDate,
      testResultData: machine.testResultData as Record<string, any> || {},
      testAdditionalNotes: machine.testAdditionalNotes,
      machineModel: {
        id: machine.machineModel.id,
        name: machine.machineModel.name,
        shortCode: machine.machineModel.shortCode,
        coverImageUrl: machine.machineModel.coverImageUrl,
        category: {
          id: machine.machineModel.category.id,
          name: machine.machineModel.category.name,
          shortCode: machine.machineModel.category.shortCode,
        },
      },
    }))
  })
}

export default async function QualityTestingHistoryPage() {
  const [machines, categories] = await Promise.all([
    getMachinesData(),
    getCategories(),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Quality Testing History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage machine quality test results
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <QualityTestingHistoryTable 
          initialMachines={machines} 
          categories={categories}
        />
      </div>
    </div>
  )
} 