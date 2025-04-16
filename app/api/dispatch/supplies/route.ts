import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

// Special constant for D2C distributor
const D2C_DISTRIBUTOR_EMAIL = "d2c_distributor@jket.com"
const D2C_DISTRIBUTOR_NAME = "JKET D2C"

export async function POST(request: Request) {
  return withPermission('dispatch:write', async () => {
    try {
      const body = await request.json()
      const { 
        machineId, 
        distributorId, 
        supplyDate, 
        sellBy, 
        supplyType, 
        customerName, 
        customerContactPersonName,
        customerEmail,
        customerPhoneNumber, 
        customerAddress, 
        distributorInvoiceNumber,
        saleDate, 
        notes 
      } = body

      // Check if machine is already supplied
      const existingSupply = await prisma.supply.findFirst({
        where: {
          machineId,
          machine: {
            return: {
              is: null,
            },
          },
        },
      })

      if (existingSupply) {
        return new NextResponse(
          "Machine is already supplied and not returned",
          { status: 400 }
        )
      }

      let finalDistributorId = distributorId

      // For direct-to-customer supply, we need to find or create the D2C distributor
      if (supplyType === "direct") {
        // Check if the special D2C distributor exists
        let d2cDistributor = await prisma.user.findUnique({
          where: {
            email: D2C_DISTRIBUTOR_EMAIL,
          },
        })

        // If not, create it
        if (!d2cDistributor) {
          d2cDistributor = await prisma.user.create({
            data: {
              email: D2C_DISTRIBUTOR_EMAIL,
              name: D2C_DISTRIBUTOR_NAME,
              organizationName: D2C_DISTRIBUTOR_NAME,
              role: "DISTRIBUTOR",
              approved: true,
            },
          })
        }

        finalDistributorId = d2cDistributor.id
      }

      // Create supply
      const supply = await prisma.supply.create({
        data: {
          machineId,
          distributorId: finalDistributorId,
          supplyDate: new Date(supplyDate),
          sellBy: new Date(sellBy),
          notes,
        },
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              return: true,
              sale: true,
            },
          },
          distributor: true,
        },
      })

      // For direct-to-customer, also create a sale record
      if (supplyType === "direct" && customerName && customerPhoneNumber && customerAddress) {
        await prisma.sale.create({
          data: {
            machineId,
            saleDate: new Date(saleDate || supplyDate),
            customerName,
            customerContactPersonName,
            customerEmail,
            customerPhoneNumber,
            customerAddress,
            distributorInvoiceNumber,
          },
        })
      }

      // Transform the response to include return information
      return NextResponse.json({
        ...supply,
        return: supply.machine?.return || null,
      })
    } catch (error) {
      console.error("[SUPPLIES_POST]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET() {
  return withPermission('dispatch:read', async () => {
    try {
      const supplies = await prisma.supply.findMany({
        include: {
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true,
                },
              },
              return: true,
              sale: true,
            },
          },
          distributor: true,
        },
        orderBy: {
          supplyDate: 'desc',
        },
      })

      // Transform the response to include return information
      return NextResponse.json(
        supplies.map(supply => ({
          ...supply,
          return: supply.machine?.return || null,
        }))
      )
    } catch (error) {
      console.error("[SUPPLIES_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 