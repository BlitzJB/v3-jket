"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  engineerId: z.string({
    required_error: "Please select an engineer",
  }),
  serviceVisitDate: z.date({
    required_error: "Please select a date",
  }),
  typeOfIssue: z.string({
    required_error: "Please select the type of issue",
  }),
  customerSupportNotes: z.string().optional(),
})

interface Engineer {
  id: string
  name: string | null
  region: string | null
}

interface ServiceRequest {
  id: string
  complaint: string | null
  machine: {
    serialNumber: string
    machineModel: {
      name: string
    }
  }
}

interface CreateVisitDialogProps {
  request: ServiceRequest
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ISSUE_TYPES = [
  "Installation",
  "Repair",
  "Maintenance",
  "Inspection",
  "Warranty Claim",
  "Other",
]

export function CreateVisitDialog({
  request,
  open,
  onOpenChange,
}: CreateVisitDialogProps) {
  const router = useRouter()
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  // Fetch engineers when dialog opens
  useEffect(() => {
    if (open) {
      fetch('/api/engineers')
        .then((res) => res.json())
        .then((data) => {
          setEngineers(data)
          setIsLoadingEngineers(false)
        })
        .catch((error) => {
          console.error('Failed to fetch engineers:', error)
          setIsLoadingEngineers(false)
        })
    }
  }, [open])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/service-requests/${request.id}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to create service visit')
      }

      toast.success('Visit scheduled', {
        description: 'The service visit has been scheduled successfully.',
      })
      
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Error', {
        description: 'Failed to schedule the service visit. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Service Visit</DialogTitle>
          <DialogDescription>
            Schedule a service visit for {request.machine.machineModel.name} ({request.machine.serialNumber})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="engineerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Engineer</FormLabel>
                  <Select
                    disabled={isLoadingEngineers}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an engineer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {engineers.map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          {engineer.name} {engineer.region ? `(${engineer.region})` : ''}
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
              name="serviceVisitDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visit Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="typeOfIssue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Issue</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name="customerSupportNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Support Notes</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter any notes or observations about the service request..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Visit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 