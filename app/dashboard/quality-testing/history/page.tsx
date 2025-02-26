import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { QualityTestingHistoryTable } from "./quality-testing-history-table"

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
    return prisma.machine.findMany({
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