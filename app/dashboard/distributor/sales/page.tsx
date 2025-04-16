import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { SalesTable } from "./sales-table"

interface Sale {
  id: string
  saleDate: Date
  customerName: string
  customerContactPersonName: string
  customerEmail: string
  customerPhoneNumber: string
  customerAddress: string
  distributorInvoiceNumber?: string
  machine: {
    id: string
    serialNumber: string
    machineModel: {
      name: string
      category: {
        name: string
      }
    }
  }
}

async function getSalesData() {
  return withPermission("distributor:sales:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get all sales for machines supplied to this distributor
    const sales = await prisma.sale.findMany({
      where: {
        machine: {
          supply: {
            distributorId: session.user.id,
          },
        },
      },
      include: {
        machine: {
          include: {
            machineModel: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
    })

    return sales
  })
}

export default async function SalesPage() {
  const sales = await getSalesData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your machine sales records
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <SalesTable initialSales={sales} />
        </div>
      </div>
    </div>
  )
} 