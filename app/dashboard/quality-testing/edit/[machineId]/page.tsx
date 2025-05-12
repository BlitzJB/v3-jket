import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { notFound } from "next/navigation"
import { EditTestForm } from "./edit-test-form"

interface Test {
  id: string
  name: string
  type: "both" | "condition"
}

interface TestGroup {
  id: string
  name: string
  tests: Test[]
}

interface Category {
  id: string
  name: string
  shortCode: string
  machineModels: {
    id: string
    name: string
    shortCode: string
    categoryId: string
  }[]
  testConfiguration: { groups: TestGroup[] } | null
}

interface Machine {
  id: string
  serialNumber: string
  machineModelId: string
  manufacturingDate: Date
  testResultData: any
  testAdditionalNotes: string | null
  machineModel: {
    id: string
    name: string
    shortCode: string
    categoryId: string
    category: {
      id: string
      name: string
      shortCode: string
      testConfiguration: { groups: TestGroup[] } | null
    }
  }
}

export const metadata: Metadata = {
  title: "Edit QA Test | Quality Testing Dashboard",
  description: "Edit quality assurance test results for machines",
}

async function getCategories() {
  return withPermission("equipment:read", async () => {
    const categories = await prisma.category.findMany({
      include: {
        machineModels: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Map database results to our interface
    return categories.map((category): Category => ({
      id: category.id,
      name: category.name,
      shortCode: category.shortCode,
      machineModels: category.machineModels.map(model => ({
        id: model.id,
        name: model.name,
        shortCode: model.shortCode,
        categoryId: model.categoryId,
      })),
      testConfiguration: category.testConfiguration as { groups: TestGroup[] } | null,
    }))
  })
}

async function getMachine(machineId: string) {
  return withPermission("quality:read", async () => {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: {
        machineModel: {
          include: {
            category: true
          }
        }
      }
    })

    if (!machine) return null

    return {
      id: machine.id,
      serialNumber: machine.serialNumber,
      machineModelId: machine.machineModelId,
      manufacturingDate: machine.manufacturingDate,
      testResultData: machine.testResultData,
      testAdditionalNotes: machine.testAdditionalNotes,
      machineModel: {
        id: machine.machineModel.id,
        name: machine.machineModel.name,
        shortCode: machine.machineModel.shortCode,
        categoryId: machine.machineModel.categoryId,
        category: {
          id: machine.machineModel.category.id,
          name: machine.machineModel.category.name,
          shortCode: machine.machineModel.category.shortCode,
          testConfiguration: machine.machineModel.category.testConfiguration as { groups: TestGroup[] } | null,
        }
      }
    }
  })
}

export default async function EditQATestPage({
  params
}: {
  params: { machineId: string }
}) {
  const { machineId } = params
  const categories = await getCategories()
  const machine = await getMachine(machineId)

  if (!machine) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Edit QA Test</h1>
        <p className="text-muted-foreground mt-1">
          Edit quality assurance test results for machine {machine.serialNumber}
        </p>
      </div>
      <EditTestForm categories={categories} machine={machine} />
    </div>
  )
} 