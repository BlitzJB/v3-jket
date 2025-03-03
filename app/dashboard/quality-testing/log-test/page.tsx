import { Metadata } from "next"
import { QATestForm } from "./test-form"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

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

export const metadata: Metadata = {
  title: "Log QA Test | Quality Testing Dashboard",
  description: "Log quality assurance test results for machines",
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

export default async function LogQATestPage() {
  const categories = await getCategories()

  return (
    <div className="flex-1 space-y-4 p-8 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Log QA Test</h1>
        <p className="text-muted-foreground mt-1">
          Record quality assurance test results for newly manufactured machines
        </p>
      </div>
      <QATestForm categories={categories} />
    </div>
  )
} 