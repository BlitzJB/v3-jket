import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { EquipmentManager } from "./equipment-manager"

export const metadata: Metadata = {
  title: "Equipment Management | Admin Dashboard",
  description: "Manage equipment categories and machine models",
}

export default async function EquipmentPage() {
  const categories = await prisma.category.findMany({
    include: {
      machineModels: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Equipment Management</h2>
      </div>
      <div className="h-[calc(100vh-10rem)]">
        <EquipmentManager initialCategories={categories} />
      </div>
    </div>
  )
} 