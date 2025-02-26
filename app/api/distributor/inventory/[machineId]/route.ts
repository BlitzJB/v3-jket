import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { auth } from "@/auth"

export async function GET(
  req: Request,
  { params }: { params: { machineId: string } }
) {
  return withPermission("distributor:inventory:read", async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const machine = await prisma.machine.findFirst({
      where: {
        id: params.machineId,
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
    })

    if (!machine) {
      return Response.json({ error: "Machine not found" }, { status: 404 })
    }

    return Response.json(machine)
  })
} 