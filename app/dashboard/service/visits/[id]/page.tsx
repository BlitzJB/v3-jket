import { notFound } from "next/navigation"
import { format } from "date-fns"
import { withPermission } from "@/lib/rbac/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Calendar, MapPin, MessageSquare, Wrench, History } from "lucide-react"
import { CommentsList } from "./comments-list"
import { AddCommentForm } from "./add-comment-form"
import { UpdateStatusForm } from "./update-status-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { getFileIcon, isImageType } from "./utils"

async function getServiceHistory(machineId: string) {
  const serviceHistory = await prisma.serviceRequest.findMany({
    where: {
      machineId: machineId,
      serviceVisit: {
        isNot: null
      }
    },
    include: {
      serviceVisit: {
        include: {
          engineer: {
            select: {
              name: true,
              email: true
            }
          },
          comments: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform the data to include parsed attachments
  return serviceHistory.map(request => ({
    ...request,
    serviceVisit: request.serviceVisit ? {
      ...request.serviceVisit,
      comments: request.serviceVisit.comments.map(comment => {
        let attachmentArray = [];
        try {
          if (typeof comment.attachments === 'string') {
            const parsed = JSON.parse(comment.attachments);
            attachmentArray = Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(comment.attachments)) {
            attachmentArray = comment.attachments;
          }
        } catch (e) {
          console.error('Error parsing attachments:', e);
        }

        return {
          ...comment,
          attachments: attachmentArray.map(attachment => ({
            id: attachment.id,
            name: attachment.name,
            url: `/api/media/${attachment.objectName}.jpg`,
            type: attachment.name.split('.').pop()?.toLowerCase() || 'unknown'
          }))
        };
      })
    } : null
  }))
}

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

  // Get service history for this machine
  const serviceHistory = await getServiceHistory(visit.serviceRequest.machine.id)

  // Transform comments data to match the expected type
  return {
    ...visit,
    comments: visit.comments.map(comment => {
      let attachmentArray: Array<{ id: string; name: string; objectName: string }> = [];
      
      try {
        if (typeof comment.attachments === 'string') {
          const parsed = JSON.parse(comment.attachments);
          attachmentArray = Array.isArray(parsed) ? parsed : [];
        } else if (Array.isArray(comment.attachments)) {
          // @ts-ignore
          attachmentArray = comment.attachments;
        }
      } catch (e) {
        console.error('Error parsing attachments:', e);
      }

      return {
        id: comment.id,
        comment: comment.comment,
        createdAt: comment.createdAt,
        attachments: attachmentArray.map(attachment => ({
          id: attachment.id,
          name: attachment.name,
          url: `/api/media/${attachment.objectName}.jpg`,
          type: attachment.name.split('.').pop()?.toLowerCase() || 'unknown'
        }))
      };
    }),
    serviceHistory
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

function ServiceVisitHistoryCard({ visit }: { visit: any }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(visit.serviceVisit.serviceVisitDate), "PPP")}
          </CardTitle>
          <Badge variant={
            visit.serviceVisit.status === 'CLOSED' ? 'success' :
            visit.serviceVisit.status === 'IN_PROGRESS' ? 'default' :
            visit.serviceVisit.status === 'CANCELLED' ? 'destructive' :
            'secondary'
          }>
            {visit.serviceVisit.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Complaint</div>
          <div className="font-medium">{visit.complaint}</div>
        </div>
        
        {visit.serviceVisit.engineer && (
          <div>
            <div className="text-sm text-muted-foreground">Engineer</div>
            <div className="font-medium">{visit.serviceVisit.engineer.name}</div>
          </div>
        )}

        {visit.serviceVisit.typeOfIssue && (
          <div>
            <div className="text-sm text-muted-foreground">Type of Issue</div>
            <div className="font-medium">{visit.serviceVisit.typeOfIssue}</div>
          </div>
        )}

        {visit.serviceVisit.totalCost && (
          <div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
            <div className="font-medium">₹{visit.serviceVisit.totalCost}</div>
          </div>
        )}

        {visit.serviceVisit.comments.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-4">Comments</div>
              <div className="space-y-4">
                {visit.serviceVisit.comments.map((comment: any) => (
                  <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      {format(new Date(comment.createdAt), "PPP p")}
                    </div>
                    <div className="whitespace-pre-wrap">{comment.comment}</div>
                    {comment.attachments.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {comment.attachments.map((attachment: any) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block"
                          >
                            {isImageType(attachment.type) ? (
                              <div className="relative aspect-square overflow-hidden rounded-lg border">
                                <Image
                                  src={attachment.url}
                                  alt={attachment.name}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors">
                                {getFileIcon(attachment.type)}
                                <span className="text-sm truncate">{attachment.name}</span>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default async function ServiceVisitDetailsPage({ params }: PageProps) {
  const { id } = await params
  const visit = await getVisitDetails(id)
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

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Machine History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="history">
          {visit.serviceHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No service visit history found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visit.serviceHistory.map(historyVisit => (
                <ServiceVisitHistoryCard key={historyVisit.id} visit={historyVisit} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}