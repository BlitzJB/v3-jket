// @ts-nocheck

"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreateVisitDialog } from "../create-visit-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import {
  Building2,
  Calendar,
  MapPin,
  Phone,
  Package2,
  Tag,
  Clock,
  WrenchIcon,
  MessageSquare,
  PlusCircle,
  Loader2,
  CheckCircle2,
  History,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  VideoIcon,
} from "lucide-react"
import Image from "next/image"
import { Machine } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ISSUE_TYPES = [
  "Transit Damage",
  "Electrical Failure",
  "Mechanical Failure",
  "PLC error",
  "Card Failure",
  "Aging failure",
  "Leakage (oil/water/air)",
  "Pump failure",
  "Motor failure",
  "Not working as per standard",
] as const

const completeVisitSchema = z.object({
  typeOfIssue: z.enum(ISSUE_TYPES),
  totalCost: z.coerce.number().min(0),
})

interface Comment {
  id: string
  comment: string
  createdAt: Date
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
}

interface ServiceVisit {
  id: string
  status: string
  serviceVisitDate: Date
  serviceVisitNotes: string | null
  comments: Comment[]
  // ... other fields
}

interface ServiceRequest {
  id: string
  complaint: string
  serviceVisit: ServiceVisit | null
  machine: {
    // ... machine fields
  }
  // ... other fields
}

interface ServiceHistory {
  id: string
  complaint: string
  createdAt: Date
  serviceVisit: {
    id: string
    status: string
    serviceVisitDate: Date
    serviceVisitNotes: string | null
    typeOfIssue: string | null
    totalCost: number | null
    engineer: {
      name: string | null
      email: string | null
    } | null
    comments: Array<{
      id: string
      comment: string
      createdAt: Date
      attachments: Array<{
        id: string
        name: string
        url: string
        type: string
      }>
    }>
  }
}

interface ServiceRequestDetailsProps {
  request: ServiceRequest
}

function getFileIcon(type: string) {
  switch (type) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon className="h-4 w-4" />
    case 'pdf':
      return <FileTextIcon className="h-4 w-4" />
    case 'mp4':
    case 'mov':
    case 'avi':
      return <VideoIcon className="h-4 w-4" />
    default:
      return <FileIcon className="h-4 w-4" />
  }
}

function isImageType(type: string) {
  return ['jpg', 'jpeg', 'png', 'gif'].includes(type.toLowerCase())
}

// Client component for the create visit dialog
function CreateVisitButton({ request }: { request: any }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Schedule Visit
      </Button>
      <CreateVisitDialog
        request={request}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

function CompleteVisitDialog({ 
  visit, 
  open, 
  onOpenChange 
}: { 
  visit: any
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof completeVisitSchema>>({
    resolver: zodResolver(completeVisitSchema),
    defaultValues: {
      typeOfIssue: undefined,
      totalCost: 0,
    },
  })

  const onSubmit = async (values: z.infer<typeof completeVisitSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/service-visits/${visit.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to complete service visit')
      }

      toast.success('Service visit completed successfully')
      onOpenChange(false)
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Error completing service visit:', error)
      toast.error('Failed to complete service visit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Service Visit</DialogTitle>
          <DialogDescription>
            Enter the visit details to complete the service request
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="typeOfIssue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Issue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ISSUE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        placeholder="Enter total cost"
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Visit
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface AttachmentViewerProps {
  attachment: { url: string; type: 'photo' | 'video' }
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AttachmentViewer({ attachment, open, onOpenChange }: AttachmentViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-lg h-[80vh] flex items-center justify-center p-0">
        {attachment.type === 'photo' ? (
          <img
            src={attachment.url}
            alt="Attachment"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            src={attachment.url}
            controls
            className="max-h-full max-w-full"
            autoPlay
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ServiceVisitHistoryCard({ visit }: { visit: ServiceHistory }) {
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
                {visit.serviceVisit.comments.map(comment => (
                  <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">
                      {format(new Date(comment.createdAt), "PPP p")}
                    </div>
                    <div className="whitespace-pre-wrap">{comment.comment}</div>
                    {comment.attachments.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        {comment.attachments.map(attachment => (
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

export function ServiceRequestDetails({ request }: ServiceRequestDetailsProps) {
  const { machine } = request as { machine: Machine }
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<{ url: string; type: 'photo' | 'video' } | null>(null)
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    async function fetchServiceHistory() {
      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/machines/${machine.serialNumber}/service-history`)
        if (!response.ok) throw new Error('Failed to fetch service history')
        const data = await response.json()
        setServiceHistory(data)
      } catch (error) {
        console.error('Error fetching service history:', error)
        toast.error('Failed to load service history')
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchServiceHistory()
  }, [machine.id])

  console.log(request)

  return (
    <div className="container py-8 space-y-8 md:px-12 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Request Details</h1>
          <p className="text-muted-foreground">
            View and manage service request information
          </p>
        </div>
        {!request.serviceVisit ? (
          <CreateVisitButton request={request} />
        ) : request.serviceVisit.status !== 'CLOSED' && request.serviceVisit.status !== 'CANCELLED' && (
          <Button onClick={() => setCompleteDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Close Visit
          </Button>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Visit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Machine Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-primary/60" />
                  Machine Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground">Serial Number</div>
                  <div className="font-medium">{machine.serialNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Model</div>
                  <div className="font-medium">{machine.machineModel.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary/60" />
                    <span className="font-medium">{machine.machineModel.category.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary/60" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {machine.warrantyCertificate ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{machine.warrantyCertificate.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{machine.warrantyCertificate.address}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/60" />
                      <span className="font-medium">{machine.warrantyCertificate.state}</span>
                    </div>
                  </>
                ) : machine.sale ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{machine.sale.customerName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Contact</div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary/60" />
                        <span className="font-medium">{machine.sale.customerPhoneNumber}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Address</div>
                      <div className="font-medium">{machine.sale.customerAddress}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">No customer information available</div>
                )}
              </CardContent>
            </Card>

            {/* Request Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary/60" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground">Complaint</div>
                  <div className="font-medium">{request.complaint}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created At</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary/60" />
                    <span className="font-medium">
                      {format(new Date(request.createdAt), "PPP")}
                    </span>
                  </div>
                </div>
                {request.attachments && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Attachments</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(request.attachments as any[]).map((attachment, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer" 
                          onClick={() => setSelectedAttachment(attachment)}
                        >
                          {attachment.type === 'photo' ? (
                            <img
                              src={attachment.url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <video
                              src={attachment.url}
                              className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Visit Information */}
            {request.serviceVisit && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <WrenchIcon className="h-5 w-5 text-primary/60" />
                      Service Visit Details
                    </CardTitle>
                    <Badge variant={
                      request.serviceVisit.status === 'CLOSED' ? 'success' :
                      request.serviceVisit.status === 'IN_PROGRESS' ? 'default' :
                      request.serviceVisit.status === 'CANCELLED' ? 'destructive' :
                      'secondary'
                    }>
                      {request.serviceVisit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Assigned Engineer</div>
                    <div className="font-medium">
                      {request.serviceVisit.engineer?.name || 'Not assigned'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Visit Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/60" />
                      <span className="font-medium">
                        {format(new Date(request.serviceVisit.serviceVisitDate), "PPP")}
                      </span>
                    </div>
                  </div>
                  {request.serviceVisit.typeOfIssue && (
                    <div>
                      <div className="text-sm text-muted-foreground">Type of Issue</div>
                      <div className="font-medium">{request.serviceVisit.typeOfIssue}</div>
                    </div>
                  )}
                  {request.serviceVisit.totalCost && (
                    <div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="font-medium">₹{request.serviceVisit.totalCost}</div>
                    </div>
                  )}
                  {request.serviceVisit.comments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-4">Visit Comments</div>
                        <div className="space-y-4">
                          {request.serviceVisit.comments.map((comment: any) => (
                            <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                              <div className="text-sm text-muted-foreground mb-1">
                                {format(new Date(comment.createdAt), "PPP")}
                              </div>
                              <div>{comment.comment}</div>
                              {comment.attachments.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {comment.attachments.map((attachment: any) => (
                                    <div
                                      key={attachment.id}
                                      className="text-sm text-primary hover:underline cursor-pointer"
                                    >
                                      {attachment.name}
                                    </div>
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : serviceHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No service visit history found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {serviceHistory.map(visit => (
                <ServiceVisitHistoryCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {request.serviceVisit && (
        <CompleteVisitDialog
          visit={request.serviceVisit}
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
        />
      )}

      {selectedAttachment && (
        <AttachmentViewer
          attachment={selectedAttachment}
          open={!!selectedAttachment}
          onOpenChange={(open) => !open && setSelectedAttachment(null)}
        />
      )}
    </div>
  )
} 