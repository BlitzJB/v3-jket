import { notFound } from "next/navigation"
import { format } from "date-fns"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Calendar, MapPin, MessageSquare, Wrench } from "lucide-react"
import { CommentsList } from "./comments-list"
import { AddCommentForm } from "./add-comment-form"
import { UpdateStatusForm } from "./update-status-form"

async function getVisitDetails(id: string) {
  const visit = await prisma.serviceVisit.findUnique({
    where: { id },
    include: {
      comments: {
        
        orderBy: {
          createdAt: 'desc'
        }
      },
      serviceRequest: {
        include: {
          
          machine: {
            include: {
              machineModel: {
                include: {
                  category: true
                }
              },
              warrantyCertificate: true
            }
          }
        }
      }
    }
  })

  if (!visit) {
    notFound()
  }

  return visit
}

interface PageProps {
  params: {
    id: string
  }
}

export default async function ServiceVisitDetailsPage({ params }: PageProps) {
  const visit = await getVisitDetails(params.id)
  const { machine } = visit.serviceRequest

  return (
    <div className="container py-8 space-y-8 md:px-12 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Visit Details</h1>
          <p className="text-muted-foreground">
            View and manage service visit information
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={
            visit.status === 'COMPLETED' ? 'success' :
            visit.status === 'IN_PROGRESS' ? 'default' :
            visit.status === 'CANCELLED' ? 'destructive' :
            'secondary'
          }>
            {visit.status}
          </Badge>
          {visit.status !== 'COMPLETED' && visit.status !== 'CANCELLED' && (
            <UpdateStatusForm visitId={visit.id} currentStatus={visit.status} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Machine Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium">{machine.machineModel.name}</div>
              <div className="text-sm text-muted-foreground">
                Serial Number: {machine.serialNumber}
              </div>
              <div className="text-sm text-muted-foreground">
                Category: {machine.machineModel.category.name}
              </div>
            </div>
            <Separator />
            {machine.warrantyCertificate ? (
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4" />
                  {machine.warrantyCertificate.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  {machine.warrantyCertificate.address}, {machine.warrantyCertificate.state} {machine.warrantyCertificate.zipCode}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No warranty information available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Service Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium">Complaint</div>
              <div className="text-sm text-muted-foreground">
                {visit.serviceRequest.complaint}
              </div>
            </div>
            {visit.serviceVisitNotes && (
              <>
                <Separator />
                <div>
                  <div className="font-medium">Visit Notes</div>
                  <div className="text-sm text-muted-foreground">
                    {visit.serviceVisitNotes}
                  </div>
                </div>
              </>
            )}
            <Separator />
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                Scheduled for {format(new Date(visit.serviceVisitDate), 'PPP')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comments & Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <AddCommentForm visitId={visit.id} />
            <Separator />
            <CommentsList comments={visit.comments} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}