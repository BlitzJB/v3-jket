import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { TestConfigManager } from "./test-config-manager"

export const metadata: Metadata = {
  title: "Test Configuration | Admin Dashboard",
  description: "Configure test groups and tests for equipment categories",
}

export default async function TestConfigPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      testConfiguration: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Test Configuration</h2>
      </div>
      <div className="h-[calc(100vh-10rem)]">
        <TestConfigManager initialCategories={categories} />
      </div>
    </div>
  )
} 