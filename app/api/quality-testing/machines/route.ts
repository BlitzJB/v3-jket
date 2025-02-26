import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withPermission } from "@/lib/rbac/server"

interface TestResult {
  range?: string
  condition: string
  passed: boolean
}

interface CreateMachineBody {
  serialNumber: string
  machineModelId: string
  manufacturingDate: Date
  testResults: Record<string, TestResult>
  additionalNotes?: string
}

export async function POST(req: Request) {
  return withPermission('quality:write', async () => {
    try {
      const body = await req.json() as CreateMachineBody
      const { serialNumber, machineModelId, manufacturingDate, testResults, additionalNotes } = body

      // Validate if serial number is unique
      const existing = await prisma.machine.findFirst({
        where: {
          serialNumber,
        },
      })

      if (existing) {
        return new NextResponse("Serial number already exists", { status: 400 })
      }

      const machine = await prisma.machine.create({
        data: {
          serialNumber,
          machineModelId,
          manufacturingDate: new Date(manufacturingDate),
          testResultData: testResults,
          testAdditionalNotes: additionalNotes,
        },
      })

      return NextResponse.json(machine)
    } catch (error) {
      console.error("[MACHINE_CREATE]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}

export async function GET(req: Request) {
  return withPermission('quality:read', async () => {
    try {
      const { searchParams } = new URL(req.url)
      const modelId = searchParams.get('modelId')

      const count = await prisma.machine.count({
        where: {
          machineModelId: modelId || undefined,
        },
      })

      return NextResponse.json({ count })
    } catch (error) {
      console.error("[MACHINE_COUNT]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 