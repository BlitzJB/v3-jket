import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { ReminderAuditTable } from "./reminder-audit-table"
import { Card } from "@/components/ui/card"
import { Mail, CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react"
import { subDays } from "date-fns"

interface AuditStats {
  totalReminders: number
  last24Hours: number
  last7Days: number
  last30Days: number
  uniqueMachines: number
  uniqueCustomers: number
}

async function getAuditData() {
  return withPermission("users:read", async () => {
    const now = new Date()
    const oneDayAgo = subDays(now, 1)
    const sevenDaysAgo = subDays(now, 7)
    const thirtyDaysAgo = subDays(now, 30)

    // Get all reminder logs with machine and sale data
    const reminders = await prisma.actionLog.findMany({
      where: {
        actionType: 'REMINDER_SENT'
      },
      include: {
        machine: {
          include: {
            machineModel: true,
            sale: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to last 100 reminders for performance
    })

    // Calculate stats
    const totalReminders = await prisma.actionLog.count({
      where: { actionType: 'REMINDER_SENT' }
    })

    const last24Hours = await prisma.actionLog.count({
      where: {
        actionType: 'REMINDER_SENT',
        createdAt: { gte: oneDayAgo }
      }
    })

    const last7Days = await prisma.actionLog.count({
      where: {
        actionType: 'REMINDER_SENT',
        createdAt: { gte: sevenDaysAgo }
      }
    })

    const last30Days = await prisma.actionLog.count({
      where: {
        actionType: 'REMINDER_SENT',
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    // Get unique machines and customers
    const uniqueMachinesResult = await prisma.actionLog.groupBy({
      by: ['machineId'],
      where: { actionType: 'REMINDER_SENT' }
    })

    // Get unique customers from metadata
    const allRemindersWithMetadata = await prisma.actionLog.findMany({
      where: { actionType: 'REMINDER_SENT' },
      select: { metadata: true }
    })

    const uniqueEmails = new Set(
      allRemindersWithMetadata
        .map(r => (r.metadata as any)?.sentTo)
        .filter(Boolean)
    )

    const stats: AuditStats = {
      totalReminders,
      last24Hours,
      last7Days,
      last30Days,
      uniqueMachines: uniqueMachinesResult.length,
      uniqueCustomers: uniqueEmails.size
    }

    return { reminders, stats }
  })
}

export default async function RemindersAuditPage() {
  const { reminders, stats } = await getAuditData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Warranty Reminder Audit Trail</h1>
        <p className="text-muted-foreground mt-1">
          Track and monitor all warranty reminder emails sent to customers
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/5 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Reminders</div>
              <div className="text-2xl font-bold">{stats.totalReminders}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/5 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last 24 Hours</div>
              <div className="text-2xl font-bold text-green-600">{stats.last24Hours}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last 7 Days</div>
              <div className="text-2xl font-bold text-blue-600">{stats.last7Days}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/5 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last 30 Days</div>
              <div className="text-2xl font-bold text-purple-600">{stats.last30Days}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-2 md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/5 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unique Machines</div>
              <div className="text-2xl font-bold text-orange-600">{stats.uniqueMachines}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-2 md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/5 rounded-lg">
              <Mail className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unique Customers</div>
              <div className="text-2xl font-bold text-cyan-600">{stats.uniqueCustomers}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-lg shadow">
        <ReminderAuditTable initialReminders={reminders} />
      </div>
    </div>
  )
}
