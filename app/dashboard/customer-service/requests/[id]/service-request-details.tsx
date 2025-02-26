"use client"

import { useState } from "react"
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
} from "lucide-react"

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
  totalCost: z.string().transform((val) => parseFloat(val)),
})

interface ServiceRequestDetailsProps {
  request: any // TODO: Add proper type
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
      totalCost: "",
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

export function ServiceRequestDetails({ request }: ServiceRequestDetailsProps) {
  const { machine } = request
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

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

      {request.serviceVisit && (
        <CompleteVisitDialog
          visit={request.serviceVisit}
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
        />
      )}
    </div>
  )
} 