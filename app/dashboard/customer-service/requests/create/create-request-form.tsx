"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Package2, Building2, Phone } from "lucide-react"

const formSchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required"),
  complaint: z.string().min(1, "Complaint description is required"),
})

type FormValues = z.infer<typeof formSchema>

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    category: {
      name: string
    }
  }
  warrantyCertificate?: {
    name: string
    address: string
    state: string
  } | null
  sale?: {
    customerName: string
    customerPhoneNumber: string
    customerAddress: string
  } | null
}

export function CreateRequestForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [machine, setMachine] = useState<Machine | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      complaint: "",
    },
  })

  const searchMachine = async (serialNumber: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/machines/${serialNumber}`)
      if (!response.ok) {
        throw new Error('Machine not found')
      }
      const data = await response.json()
      if (!data.sale) {
        throw new Error('Machine sale information not found')
      }
      setMachine(data)
    } catch (error) {
      console.error('Error searching machine:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to find machine')
      setMachine(null)
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!machine) {
      toast.error('Please search for a valid machine first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine.id,
          complaint: values.complaint,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create service request')
      }

      const serviceRequest = await response.json()
      toast.success('Service request created successfully')
      router.push(`/dashboard/customer-service/requests/${serviceRequest.id}`)
    } catch (error) {
      console.error('Error creating service request:', error)
      toast.error('Failed to create service request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Machine Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Package2 className="h-5 w-5 text-primary/60" />
                  Machine Details
                </div>

                <div className="flex gap-3">
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter machine serial number" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e)
                              setMachine(null)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    className="self-end"
                    onClick={() => searchMachine(form.getValues('serialNumber'))}
                    disabled={isSearching || !form.getValues('serialNumber')}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>

                {machine && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Model</div>
                      <div className="font-medium">{machine.machineModel.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Category</div>
                      <div className="font-medium">{machine.machineModel.category.name}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Customer Information */}
              {machine && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Building2 className="h-5 w-5 text-primary/60" />
                    Customer Details
                  </div>

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
                      <div>
                        <div className="text-sm text-muted-foreground">State</div>
                        <div className="font-medium">{machine.warrantyCertificate.state}</div>
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
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {machine && (
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue with the machine..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/customer-service/requests')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !machine} 
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Request'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 