'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format, addMonths, isBefore, formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Box, Calendar, FileText, Building2, Phone, MapPin, FileWarning, Printer, Clock, ShieldCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateWarrantyCertificateHTML } from '@/app/components/warranty-certificate'

interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: string
  machineModel: {
    name: string
    shortCode: string
    description: string
    warrantyPeriodMonths: number
    coverImageUrl: string
    category: {
      name: string
      shortCode: string
    }
  }
  sale?: {
    saleDate: string
    customerName: string
    customerPhoneNumber: string
    customerAddress: string
  }
  supply?: {
    distributor: {
      organizationName: string
      region: string
    }
  }
  warrantyCertificate?: {
    id: string
    createdAt: string
    name: string
    address: string
    state: string
    zipCode: string
    country: string
  }
  serviceRequests: Array<{
    id: string
    complaint: string
    createdAt: string
    serviceVisit?: {
      serviceVisitDate: string
      serviceVisitNotes?: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
    }
  }>
}

interface WarrantyCertificateForm {
  name: string
  address: string
  state: string
  zipCode: string
}

export default function MachinePage({ params }: { params: { serialNumber: string } }) {
  const router = useRouter()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingWarranty, setIsSubmittingWarranty] = useState(false)
  const [warrantyForm, setWarrantyForm] = useState<WarrantyCertificateForm>({
    name: '',
    address: '',
    state: '',
    zipCode: ''
  })
  const { generatePdf, isGenerating } = usePdfGenerator()

  useEffect(() => {
    fetchMachineData()
  }, [params.serialNumber])

  const fetchMachineData = async () => {
    try {
      const response = await fetch(`/api/machines/${params.serialNumber}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Machine not found')
          router.push('/customer')
        } else {
          toast.error('Failed to load machine data')
        }
        return
      }
      const data = await response.json()
      setMachine(data)
      
      // Pre-fill warranty form with sale data if available
      if (data.sale && !data.warrantyCertificate) {
        setWarrantyForm({
          name: data.sale.customerName,
          address: data.sale.customerAddress,
          state: '', // Need to be filled by user
          zipCode: '' // Need to be filled by user
        })
      }
    } catch (error) {
      console.error('Error fetching machine data:', error)
      toast.error('Failed to load machine data')
    } finally {
      setIsLoading(false)
    }
  }

  const getWarrantyStatus = () => {
    if (!machine?.warrantyCertificate) {
      return { status: 'inactive', message: 'Not Registered', badge: 'secondary', timeLeft: null }
    }
    
    const startDate = new Date(machine.warrantyCertificate.createdAt)
    const warrantyEnd = addMonths(startDate, machine.machineModel.warrantyPeriodMonths)
    const isExpired = isBefore(warrantyEnd, new Date())

    return isExpired
      ? { 
          status: 'expired', 
          message: 'Expired', 
          badge: 'destructive',
          timeLeft: `Expired ${formatDistanceToNow(warrantyEnd, { addSuffix: true })}`
        }
      : { 
          status: 'active', 
          message: 'Active', 
          badge: 'success',
          timeLeft: `Expires ${formatDistanceToNow(warrantyEnd, { addSuffix: true })}`
        }
  }

  const handleWarrantySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!machine?.sale) return

    setIsSubmittingWarranty(true)
    try {
      const response = await fetch('/api/warranty-certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine.id,
          ...warrantyForm,
          country: 'India' // Default as per schema
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to register warranty')
      }

      toast.success('Warranty registered successfully')
      fetchMachineData()
    } catch (error) {
      console.error('Error registering warranty:', error)
      toast.error('Failed to register warranty')
    } finally {
      setIsSubmittingWarranty(false)
    }
  }

  const handleGenerateWarrantyCertificate = async () => {
    if (!machine?.warrantyCertificate) return

    try {
      const html = generateWarrantyCertificateHTML({ machine })
      const pdfBlob = await generatePdf({ html })
      const url = URL.createObjectURL(pdfBlob)
      window.open(url)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating warranty certificate:', error)
      toast.error('Failed to generate warranty certificate')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded"></div>
            <div className="h-12 w-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!machine) return null

  const warrantyStatus = getWarrantyStatus()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link href="/customer">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Warranty Status Banner */}
        <div className={`w-full p-4 mb-6 rounded-lg border ${
          warrantyStatus.badge === 'success' ? 'bg-success/10 border-success text-success' :
          warrantyStatus.badge === 'destructive' ? 'bg-destructive/10 border-destructive text-destructive' :
          'bg-muted border-muted-foreground text-muted-foreground'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Warranty Status: {warrantyStatus.message}</span>
            </div>
            {warrantyStatus.timeLeft && (
              <span className="mt-2 md:mt-0">{warrantyStatus.timeLeft}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Machine Information */}
          <Card>
            <CardHeader>
              <CardTitle>Machine Information</CardTitle>
              <CardDescription>Details about your machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {machine.machineModel.coverImageUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={machine.machineModel.coverImageUrl}
                    alt={machine.machineModel.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{machine.machineModel.name}</h3>
                  <p className="text-sm text-muted-foreground">{machine.machineModel.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-medium">{machine.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{machine.machineModel.category.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model Code</p>
                    <p className="font-medium">{machine.machineModel.shortCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manufacturing Date</p>
                    <p className="font-medium">{format(new Date(machine.manufacturingDate), 'PPP')}</p>
                  </div>
                </div>
              </div>

              {machine.sale && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Sale Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Sold By</p>
                        <p className="font-medium">{machine.supply?.distributor.organizationName}</p>
                        <p className="text-sm text-muted-foreground">{machine.supply?.distributor.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sale Date</p>
                        <p className="font-medium">{format(new Date(machine.sale.saleDate), 'PPP')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Customer Details</p>
                        <p className="font-medium">{machine.sale.customerName}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          {machine.sale.customerPhoneNumber}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {machine.sale.customerAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Service History & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Service & Support</CardTitle>
              <CardDescription>Service history and support options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!machine.sale ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileWarning className="h-4 w-4" />
                  <span>Machine sale has not been recorded by the distributor</span>
                </div>
              ) : !machine.warrantyCertificate ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Please register your warranty to access service features</span>
                  </div>

                  <form onSubmit={handleWarrantySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={warrantyForm.name}
                        onChange={(e) => setWarrantyForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={warrantyForm.address}
                        onChange={(e) => setWarrantyForm(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={warrantyForm.state}
                          onChange={(e) => setWarrantyForm(prev => ({ ...prev, state: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={warrantyForm.zipCode}
                          onChange={(e) => setWarrantyForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmittingWarranty}
                    >
                      {isSubmittingWarranty ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Registering...
                        </>
                      ) : (
                        'Register Warranty'
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Service Requests</h3>
                    <Button 
                      onClick={() => router.push(`/machines/${params.serialNumber}/service-request`)}
                    >
                      Request Service
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {machine.serviceRequests.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No service requests yet</p>
                    ) : (
                      machine.serviceRequests.map((request) => (
                        <div key={request.id} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{request.complaint}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(request.createdAt), 'PPP')}
                              </p>
                            </div>
                            {request.serviceVisit && (
                              <Badge variant={
                                request.serviceVisit.status === 'COMPLETED' ? 'success' :
                                request.serviceVisit.status === 'IN_PROGRESS' ? 'default' :
                                request.serviceVisit.status === 'CANCELLED' ? 'destructive' :
                                'secondary'
                              }>
                                {request.serviceVisit.status}
                              </Badge>
                            )}
                          </div>
                          {request.serviceVisit && (
                            <div className="mt-2 text-sm">
                              <p className="text-muted-foreground">
                                Visit Date: {format(new Date(request.serviceVisit.serviceVisitDate), 'PPP')}
                              </p>
                              {request.serviceVisit.serviceVisitNotes && (
                                <p className="mt-1">{request.serviceVisit.serviceVisitNotes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Warranty Certificate</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleGenerateWarrantyCertificate}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Certificate
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Registered on {format(new Date(machine.warrantyCertificate.createdAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 