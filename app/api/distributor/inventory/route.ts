
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { auth } from "@/auth"

export async function GET() {
  return withPermission("distributor:inventory:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all machines supplied to this distributor that haven't been sold or returned
    const machines = await prisma.machine.findMany({
      where: {
        supply: {
          distributorId: session.user.id,
        },
        sale: null,
        return: null,
      },
      include: {
        machineModel: {
          include: {
            category: true,
          },
        },
        supply: true,
      },
      orderBy: {
        supply: {
          supplyDate: 'desc',
        },
      },
    })

    // Filter out machines where supply is null
    const validMachines = machines.filter((machine) => machine.supply !== null)

    return Response.json(validMachines)
  })
}
