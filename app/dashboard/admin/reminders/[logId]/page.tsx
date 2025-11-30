import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mail,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  User,
  MapPin,
  Phone,
  Heart,
  TrendingUp,
  Shield,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { notFound } from "next/navigation"

async function getReminderDetails(logId: string) {
  return withPermission("users:read", async () => {
    const log = await prisma.actionLog.findUnique({
      where: { id: logId },
      include: {
        machine: {
          include: {
            machineModel: true,
            sale: true,
            serviceRequests: {
              include: {
                serviceVisit: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            }
          }
        }
      }
    })

    if (!log || log.actionType !== 'REMINDER_SENT') {
      return null
    }

    return log
  })
}

export default async function ReminderDetailPage({
  params
}: {
  params: Promise<{ logId: string }>
}) {
  const { logId } = await params
  const log = await getReminderDetails(logId)

  if (!log) {
    notFound()
  }

  const metadata = log.metadata as any
  const machine = log.machine
  const sale = machine.sale

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'OVERDUE':
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-500/10',
          label: 'Overdue'
        }
      case 'URGENT':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-500/10',
          label: 'Urgent'
        }
      case 'SOON':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500/10',
          label: 'Soon'
        }
      case 'UPCOMING':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-500/10',
          label: 'Upcoming'
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-500/10',
          label: urgency
        }
    }
  }

  const urgencyConfig = metadata?.urgency ? getUrgencyConfig(metadata.urgency) : null
  const UrgencyIcon = urgencyConfig?.icon

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/admin/reminders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reminders
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reminder Details</h1>
            <p className="text-muted-foreground mt-1">
              Sent on {format(new Date(log.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          {urgencyConfig && UrgencyIcon && (
            <Badge className={`${urgencyConfig.bgColor} ${urgencyConfig.color} flex items-center gap-2 px-4 py-2`}>
              <UrgencyIcon className="h-4 w-4" />
              {urgencyConfig.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Email Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Email Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Recipient</div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary/60" />
                  <span className="font-medium">{metadata?.sentTo || sale?.customerEmail || '—'}</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Channel</div>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <Mail className="h-3 w-3" />
                  {log.channel}
                </Badge>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Sent At</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  <span className="font-medium">
                    {format(new Date(log.createdAt), "EEEE, MMMM d, yyyy")}
                  </span>
                  <span className="text-muted-foreground">at</span>
                  <span className="font-medium">{format(new Date(log.createdAt), "h:mm a")}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Service Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Service Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Days Until Service</div>
                <div className={`text-2xl font-bold ${
                  metadata?.daysUntilService < 0 ? 'text-red-600' :
                  metadata?.daysUntilService <= 3 ? 'text-orange-600' :
                  metadata?.daysUntilService <= 7 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {metadata?.daysUntilService !== undefined
                    ? metadata.daysUntilService < 0
                      ? `${Math.abs(metadata.daysUntilService)} days overdue`
                      : `${metadata.daysUntilService} days`
                    : '—'}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Health Score</div>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${
                    metadata?.healthScore >= 80 ? 'text-green-600' :
                    metadata?.healthScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {metadata?.healthScore || '—'}/100
                  </div>
                  <Heart className={`h-5 w-5 ${
                    metadata?.healthScore >= 80 ? 'text-green-600' :
                    metadata?.healthScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Warranty Status</div>
                <Badge variant={metadata?.warrantyActive ? "default" : "secondary"}>
                  {metadata?.warrantyActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {metadata?.warrantyExpiryDate && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Warranty Expiry</div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary/60" />
                    <span className="font-medium">
                      {format(new Date(metadata.warrantyExpiryDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Service History */}
          {machine.serviceRequests && machine.serviceRequests.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Recent Service History</h2>
              </div>

              <div className="space-y-4">
                {machine.serviceRequests.map((request) => (
                  <div key={request.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-medium">{request.complaint || 'Service Request'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Requested: {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    {request.serviceVisit && (
                      <Badge variant={
                        request.serviceVisit.status === 'COMPLETED' ? 'default' :
                        request.serviceVisit.status === 'IN_PROGRESS' ? 'secondary' :
                        'outline'
                      }>
                        {request.serviceVisit.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Machine Info */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Machine</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Model</div>
                <div className="font-medium">{machine.machineModel.name}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm text-muted-foreground mb-1">Serial Number</div>
                <div className="font-mono text-sm font-medium">{machine.serialNumber}</div>
              </div>
            </div>
          </Card>

          {/* Customer Info */}
          {sale && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Customer</h2>
              </div>

              <div className="space-y-4">
                {sale.customerName && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Name</div>
                    <div className="font-medium">{sale.customerName}</div>
                  </div>
                )}

                {sale.customerEmail && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Email</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-primary/60" />
                        <span className="font-medium break-all">{sale.customerEmail}</span>
                      </div>
                    </div>
                  </>
                )}

                {sale.customerPhoneNumber && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Phone</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-primary/60" />
                        <span className="font-medium">{sale.customerPhoneNumber}</span>
                      </div>
                    </div>
                  </>
                )}

                {sale.saleDate && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Sale Date</div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-primary/60" />
                        <span className="font-medium">{format(new Date(sale.saleDate), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Raw Metadata (for debugging) */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Metadata</h2>
            </div>

            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}
