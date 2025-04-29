
import { NextResponse } from "next/server"
import { withPermission } from "@/lib/rbac/server"
import { getAnalyticsData } from "./service"

export async function GET() {
  return withPermission('admin:access', async () => {
    try {
      const data = await getAnalyticsData()
      return NextResponse.json(data)
    } catch (error) {
      console.error("[ANALYTICS_ERROR]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
} 