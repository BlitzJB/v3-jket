import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { auth } from "@/auth"

export async function POST(
  req: Request,
  { params }: { params: { machineId: string } }
) {
  return withPermission("distributor:sales:write", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customerName, customerPhoneNumber, customerAddress, saleDate } = await req.json()

    // Verify the machine belongs to this distributor and is available
    const machine = await prisma.machine.findFirst({
      where: {
        id: params.machineId,
        supply: {
          distributorId: session.user.id,
        },
        sale: null,
        return: null,
      },
    })

    if (!machine) {
      return Response.json(
        { error: "Machine not found or not available for sale" },
        { status: 404 }
      )
    }

    // Create the sale record
    const sale = await prisma.sale.create({
      data: {
        machine: {
          connect: {
            id: params.machineId,
          },
        },
        saleDate: new Date(saleDate),
        customerName,
        customerPhoneNumber,
        customerAddress,
      },
    })

    return Response.json(sale)
  })
} 