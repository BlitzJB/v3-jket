import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"
import { Prisma } from "@prisma/client"

interface TestResult {
  range?: string
  condition: string
  passed: boolean
}

interface UpdateMachineBody {
  testResults: Record<string, TestResult>
  additionalNotes?: string
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ machineId: string }> }
) {
  return withPermission('quality:write', async () => {
    try {
      const { machineId } = await params
      const body = await req.json() as UpdateMachineBody
      const { testResults, additionalNotes } = body

      // Check if machine exists
      const existingMachine = await prisma.machine.findUnique({
        where: { id: machineId },
      })

      if (!existingMachine) {
        return new NextResponse("Machine not found", { status: 404 })
      }

      // Convert testResults to a plain object that matches Prisma's JSON type
      const testResultData: Prisma.JsonObject = {}
      for (const [key, value] of Object.entries(testResults)) {
        testResultData[key] = {
          range: value.range,
          condition: value.condition,
          passed: value.passed
        }
      }

      const updatedMachine = await prisma.machine.update({
        where: { id: machineId },
        data: {
          testResultData,
          testAdditionalNotes: additionalNotes,
        },
      })

      return NextResponse.json(updatedMachine)
    } catch (error) {
      console.error("[MACHINE_UPDATE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ machineId: string }> }
) {
  return withPermission('quality:read', async () => {
    try {
      const { machineId } = await params
      
      const machine = await prisma.machine.findUnique({
        where: { id: machineId },
        include: {
          machineModel: {
            include: {
              category: true
            }
          },
          supply: true,
          sale: true,
          return: true,
          warrantyCertificate: true,
          serviceRequests: true,
        }
      })

      if (!machine) {
        return new NextResponse("Machine not found", { status: 404 })
      }

      // Check for dependencies that would prevent deletion
      const dependencies = []
      
      if (machine.supply) {
        dependencies.push("supply record")
      }
      
      if (machine.sale) {
        dependencies.push("sale record")
      }
      
      if (machine.return) {
        dependencies.push("return record")
      }
      
      if (machine.warrantyCertificate) {
        dependencies.push("warranty certificate")
      }
      
      if (machine.serviceRequests && machine.serviceRequests.length > 0) {
        dependencies.push("service requests")
      }

      return NextResponse.json({
        ...machine,
        canDelete: dependencies.length === 0,
        dependencies
      })
    } catch (error) {
      console.error("[MACHINE_GET]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ machineId: string }> }
) {
  const { machineId } = await params

  return withPermission('*', async () => {
    try {
      // Check if machine exists with all relations
      const machine = await prisma.machine.findUnique({
        where: {
          id: machineId,
        },
        include: {
          supply: true,
          sale: true,
          return: true,
          warrantyCertificate: true,
          serviceRequests: true,
        },
      })

      if (!machine) {
        return new NextResponse("Machine not found", { status: 404 })
      }

      // Check for dependencies that prevent deletion
      const dependencies = []
      
      if (machine.supply) {
        dependencies.push("supply record")
      }
      
      if (machine.sale) {
        dependencies.push("sale record")
      }
      
      if (machine.return) {
        dependencies.push("return record")
      }
      
      if (machine.warrantyCertificate) {
        dependencies.push("warranty certificate")
      }
      
      if (machine.serviceRequests && machine.serviceRequests.length > 0) {
        dependencies.push("service requests")
      }

      if (dependencies.length > 0) {
        return NextResponse.json(
          { 
            canDelete: false, 
            dependencies,
            message: `Cannot delete machine. It has associated ${dependencies.join(", ")}.`
          },
          { status: 400 }
        )
      }

      // If no dependencies, proceed with deletion
      await prisma.machine.delete({
        where: {
          id: machineId,
        },
      })

      return NextResponse.json({ 
        canDelete: true,
        message: "Machine deleted successfully" 
      })

    } catch (error) {
      console.error("[MACHINE_DELETE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 