import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CustomersTable } from "./customers-table"

interface Customer {
  id: string // Using the first sale ID as a reference
  name: string
  phoneNumber: string
  address: string
  firstPurchaseDate: Date
  totalPurchases: number
  recentPurchases: {
    id: string
    saleDate: Date
    machine: {
      serialNumber: string
      machineModel: {
        name: string
        category: {
          name: string
        }
      }
    }
  }[]
}

function cleanPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Remove country code if present (assuming +XX or 0XX format)
  if (cleaned.length > 10) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    } else {
      cleaned = cleaned.substring(cleaned.length - 10)
    }
  }
  
  return cleaned
}

async function getCustomersData() {
  return withPermission("distributor:customers:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get all sales for this distributor
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

    // Create a map to group sales by cleaned phone number
    const customerMap = new Map<string, Customer>()

    sales.forEach((sale) => {
      const cleanedPhone = cleanPhoneNumber(sale.customerPhoneNumber)
      
      if (customerMap.has(cleanedPhone)) {
        // Update existing customer
        const customer = customerMap.get(cleanedPhone)!
        customer.totalPurchases++
        customer.recentPurchases.push({
          id: sale.id,
          saleDate: sale.saleDate,
          machine: {
            serialNumber: sale.machine.serialNumber,
            machineModel: sale.machine.machineModel,
          },
        })
        // Keep only the 3 most recent purchases
        if (customer.recentPurchases.length > 3) {
          customer.recentPurchases = customer.recentPurchases.slice(0, 3)
        }
      } else {
        // Create new customer
        customerMap.set(cleanedPhone, {
          id: sale.id, // Using first sale ID as customer ID
          name: sale.customerName,
          phoneNumber: sale.customerPhoneNumber,
          address: sale.customerAddress,
          firstPurchaseDate: sale.saleDate,
          totalPurchases: 1,
          recentPurchases: [{
            id: sale.id,
            saleDate: sale.saleDate,
            machine: {
              serialNumber: sale.machine.serialNumber,
              machineModel: sale.machine.machineModel,
            },
          }],
        })
      }
    })

    // Convert map to array and sort by total purchases
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalPurchases - a.totalPurchases)

    return customers
  })
}

export default async function CustomersPage() {
  const customers = await getCustomersData()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Customer Database</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your customer relationships
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <CustomersTable initialCustomers={customers} />
        </div>
      </div>
    </div>
  )
} 