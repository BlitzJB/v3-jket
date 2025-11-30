'use client'

import { useState, use, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { MediaCapture } from '@/components/ui/media-capture'
import { MediaFile } from '@/types/media-capture'
import { Camera, X, Loader2, ArrowLeft, Heart, AlertCircle, IndianRupee, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { format, addDays, isWeekend } from 'date-fns'
import { usePresignedUpload } from '@/hooks/use-presigned-upload'

type Attachment = {
  url: string
  objectName: string
  type: 'photo' | 'video'
}

interface Machine {
  id: string
  serialNumber: string
  machineModel: {
    name: string
    shortCode: string
  }
  sale?: {
    customerName: string
    customerPhoneNumber: string
    customerEmail: string
    customerAddress: string
  }
  warrantyInfo?: {
    healthScore: number
    riskLevel: string
    nextServiceDue: string
    totalSavings: number
    warrantyActive: boolean
  }
}

export default function ServiceRequestPage({ 
  params 
}: { 
  params: Promise<{ serialNumber: string }> 
}) {
  const { serialNumber } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source')
  const isFromWarrantyReminder = source === 'warranty-reminder'
  
  const [machine, setMachine] = useState<Machine | null>(null)
  const [complaint, setComplaint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [machineLoading, setMachineLoading] = useState(true)
  const { uploadFile } = usePresignedUpload()

  useEffect(() => {
    fetchMachineData()
  }, [serialNumber])

  const fetchMachineData = async () => {
    try {
      const res = await fetch(`/api/machines/${serialNumber}`)
      if (!res.ok) {
        toast.error('Machine not found')
        router.push('/customer')
        return
      }
      const data = await res.json()
      setMachine(data)
      
      // Pre-populate complaint for warranty reminders
      if (isFromWarrantyReminder && data.warrantyInfo) {
        const healthScore = Math.round(data.warrantyInfo.healthScore)
        setComplaint(`Scheduled warranty service - Regular maintenance needed (Health Score: ${healthScore}/100)`)
      }
    } catch (error) {
      console.error('Error fetching machine:', error)
      toast.error('Failed to load machine data')
    } finally {
      setMachineLoading(false)
    }
  }

  const handleCapture = async (mediaFile: MediaFile) => {
    setIsUploading(true)
    try {
      const result = await uploadFile(mediaFile.file, {
        onSuccess: (uploadResult) => {
          setAttachments(prev => [...prev, {
            url: uploadResult.publicUrl,
            objectName: uploadResult.objectName,
            type: mediaFile.type
          }])
        }
      })
    } catch (error) {
      console.error('Error uploading media:', error)
    } finally {
      setIsUploading(false)
      setIsCaptureOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaint.trim()) {
      toast.error('Please describe the issue')
      return
    }

    if (!machine) {
      toast.error('Machine data not loaded')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machine.id,
          complaint,
          metadata: {
            source: isFromWarrantyReminder ? 'WARRANTY_REMINDER' : 'WEB',
            healthScore: machine.warrantyInfo?.healthScore,
            warrantyActive: warrantyActive,
            riskLevel: riskLevel,
            totalSavings: totalSavings
          },
          attachments: attachments.map(a => ({
            url: a.url,
            objectName: a.objectName,
            type: a.type
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit service request')
      }

      // Log the action if from warranty reminder
      if (isFromWarrantyReminder) {
        await fetch('/api/actions/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineId: machine.id,
            actionType: 'SERVICE_SCHEDULED',
            channel: 'WEB',
            metadata: {
              fromReminder: true,
              healthScore: machine.warrantyInfo?.healthScore,
              warrantyActive: warrantyActive,
              riskLevel: riskLevel,
              totalSavings: totalSavings
            }
          })
        })
      }

      toast.success('Service request submitted successfully')
      router.push(`/machines/${serialNumber}`)
    } catch (error) {
      console.error('Error submitting service request:', error)
      toast.error('Failed to submit service request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  if (machineLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!machine) return null

  const healthScore = machine.warrantyInfo?.healthScore || 100
  const riskLevel = machine.warrantyInfo?.riskLevel || 'LOW'
  const totalSavings = machine.warrantyInfo?.totalSavings || 0
  const warrantyActive = machine.warrantyInfo?.warrantyActive ?? true

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href={`/machines/${serialNumber}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machine Details
          </Button>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              {isFromWarrantyReminder ? 'Schedule Warranty Service' : 'Request Service'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isFromWarrantyReminder 
                ? `Keep your ${machine.machineModel.name} running at peak performance`
                : 'Describe the issue you\'re experiencing with your machine'
              }
            </p>
          </div>

          {/* Warranty Info Card - Show if from reminder or has warranty info */}
          {(isFromWarrantyReminder || machine.warrantyInfo) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">Health Score</div>
                    <div className={`text-2xl font-bold ${
                      healthScore >= 80 ? 'text-green-500' :
                      healthScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {Math.round(healthScore)}/100
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                    <div className={`text-2xl font-bold ${
                      riskLevel === 'LOW' ? 'text-green-500' :
                      riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {riskLevel}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground">Total Saved</div>
                    <div className="text-2xl font-bold text-green-500">
                      ₹{totalSavings.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Warning if warranty expired */}
                {!warrantyActive && (
                  <div className="mt-4 p-4 border border-yellow-500 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900">Warranty Expired</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your warranty has expired. Consider purchasing an Annual Maintenance Contract (AMC) 
                          to continue receiving discounted services.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next service info */}
                {machine.warrantyInfo?.nextServiceDue && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Next Service Due: {format(new Date(machine.warrantyInfo.nextServiceDue), 'PPP')}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="complaint" className="text-sm font-medium">
                Issue Description
              </label>
              <Textarea
                id="complaint"
                placeholder="Please provide details about the issue..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">
                Media Attachments
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group aspect-video">
                    {attachment.type === 'photo' ? (
                      <img
                        src={attachment.url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={attachment.url}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="aspect-video w-full"
                  onClick={() => setIsCaptureOpen(true)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 mr-2" />
                      Add Photo/Video
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Customer Info - Show for warranty reminders */}
            {isFromWarrantyReminder && machine.sale && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <label className="text-sm font-medium">Service will be scheduled for:</label>
                <div className="text-sm space-y-1">
                  <p><strong>{machine.sale.customerName}</strong></p>
                  <p>{machine.sale.customerPhoneNumber}</p>
                  <p>{machine.sale.customerEmail}</p>
                  <p className="text-muted-foreground">{machine.sale.customerAddress}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/machines/${serialNumber}`)}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isFromWarrantyReminder ? 'Scheduling...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    {isFromWarrantyReminder ? 'Schedule Service' : 'Submit Request'}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info Footer */}
          {isFromWarrantyReminder && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need assistance? Call <strong>1800 202 0051</strong></p>
              <p>or email <strong>customer.support@jket.in</strong></p>
            </div>
          )}
        </div>
      </div>

      {isCaptureOpen && (
        <MediaCapture
          onCapture={handleCapture}
          onClose={() => setIsCaptureOpen(false)}
        />
      )}
    </div>
  )
}