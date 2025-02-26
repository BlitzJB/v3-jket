import { Metadata } from "next"
import { QATestForm } from "./test-form"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

export const metadata: Metadata = {
  title: "Log QA Test | Quality Testing Dashboard",
  description: "Log quality assurance test results for machines",
}

async function getCategories() {
  return withPermission("equipment:read", async () => {
    return prisma.category.findMany({
      include: {
        machineModels: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
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