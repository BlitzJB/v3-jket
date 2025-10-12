import { NextResponse } from "next/server"
import { withPermission } from "@/lib/rbac/server"
import { getServiceEngineerAnalyticsData } from "./service"
import { auth } from "@/lib/auth"

export async function GET() {
  return withPermission('service:read', async () => {
    try {
      const session = await auth()

      if (!session || !session.user || !session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 })
      }

      // Get analytics data scoped to this engineer
      const data = await getServiceEngineerAnalyticsData(session.user.id)
      return NextResponse.json(data)
    } catch (error) {
      console.error("[SERVICE_ANALYTICS_ERROR]", error)
      return new NextResponse("Internal error", { status: 500 })
    }
  })
}
