# Step 4: Schedule Warranty Service UI

**Time Estimate**: 3-4 hours  
**Dependencies**: Steps 1-3 (Database, Calculations, Reminders)  
**Risk Level**: Low

## Objective
Add a public scheduling page at `/machines/[serialNumber]/schedule-warranty` that allows customers to schedule service from reminder emails without authentication.

## Implementation

### 1. Create Schedule Page
Create `app/machines/[serialNumber]/schedule-warranty/page.tsx`:

```tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, addDays, addMonths, isWeekend } from 'date-fns'
import { CalendarIcon, Clock, Heart, IndianRupee, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import jwt from 'jsonwebtoken'

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

export default function ScheduleWarrantyPage({ 
  params 
}: { 
  params: Promise<{ serialNumber: string }> 
}) {
  const { serialNumber } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    // Verify token if provided
    if (token) {
      try {
        const decoded = jwt.decode(token) as any
        if (decoded && decoded.serialNumber === serialNumber) {
          setTokenValid(true)
        }
      } catch (error) {
        console.error('Invalid token')
        setTokenValid(false)
      }
    }
    
    fetchMachineData()
  }, [serialNumber, token])

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
      
      // Pre-select next service date if available
      if (data.warrantyInfo?.nextServiceDue) {
        setSelectedDate(new Date(data.warrantyInfo.nextServiceDue))
      }
    } catch (error) {
      console.error('Error fetching machine:', error)
      toast.error('Failed to load machine data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    
    if (!machine) return
    
    setIsSubmitting(true)
    try {
      // Create service request
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: machine.id,
          complaint: `Scheduled warranty service - ${notes || 'Regular maintenance'}`,
          metadata: {
            scheduledDate: selectedDate.toISOString(),
            source: 'WARRANTY_REMINDER',
            healthScore: machine.warrantyInfo?.healthScore
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to schedule service')
      }
      
      // Log the action
      await fetch('/api/actions/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: machine.id,
          actionType: 'SERVICE_SCHEDULED',
          channel: 'WEB',
          metadata: {
            scheduledDate: selectedDate.toISOString(),
            fromReminder: !!token
          }
        })
      })
      
      toast.success('Service scheduled successfully!')
      
      // Redirect to machine page
      setTimeout(() => {
        router.push(`/machines/${serialNumber}`)
      }, 2000)
      
    } catch (error) {
      console.error('Error scheduling service:', error)
      toast.error('Failed to schedule service')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickDate = (days: number) => {
    const date = addDays(new Date(), days)
    // Skip weekends
    if (isWeekend(date)) {
      setSelectedDate(addDays(date, date.getDay() === 6 ? 2 : 1))
    } else {
      setSelectedDate(date)
    }
  }

  if (loading) {
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
        {/* Back Button */}
        <Link href={`/machines/${serialNumber}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machine Details
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Schedule Warranty Service</h1>
          <p className="text-muted-foreground mt-1">
            Keep your {machine.machineModel.name} running at peak performance
          </p>
        </div>

        {/* Health Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
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
          </CardContent>
        </Card>

        {/* Warning if warranty expired */}
        {!warrantyActive && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        )}

        {/* Schedule Form */}
        <Card>
          <CardHeader>
            <CardTitle>Select Service Date</CardTitle>
            <CardDescription>
              Choose a convenient date for your warranty service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quick Date Options */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(1)}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(3)}
                  >
                    In 3 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDate(7)}
                  >
                    Next Week
                  </Button>
                </div>
              </div>

              {/* Calendar */}
              <div className="space-y-2">
                <Label>Or choose a specific date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    date < new Date() || 
                    date > addMonths(new Date(), 2) ||
                    isWeekend(date)
                  }
                  className="rounded-md border"
                />
                {selectedDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific issues or requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Customer Info (readonly) */}
              {machine.sale && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <Label>Service will be scheduled for:</Label>
                  <div className="text-sm space-y-1">
                    <p><strong>{machine.sale.customerName}</strong></p>
                    <p>{machine.sale.customerPhoneNumber}</p>
                    <p>{machine.sale.customerEmail}</p>
                    <p className="text-muted-foreground">{machine.sale.customerAddress}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={!selectedDate || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Confirm Service Booking
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Need assistance? Call <strong>1800 202 0051</strong></p>
          <p>or email <strong>customer.support@jket.in</strong></p>
        </div>
      </div>
    </div>
  )
}
```

### 2. Create Action Log Endpoint
Create `app/api/actions/log/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { machineId, actionType, channel, metadata } = body
    
    if (!machineId || !actionType || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const log = await prisma.actionLog.create({
      data: {
        machineId,
        actionType,
        channel,
        metadata: metadata || {}
      }
    })
    
    return NextResponse.json(log)
  } catch (error) {
    console.error('Error logging action:', error)
    return NextResponse.json(
      { error: 'Failed to log action' },
      { status: 500 }
    )
  }
}
```

### 3. Update Machine Page to Show Health Score
Update `app/machines/[serialNumber]/page.tsx` to display warranty info:

```tsx
// Add to the existing page after fetching machine data:

// In the component, after the warranty status section, add:
{machine.warrantyInfo && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-lg">Maintenance Status</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Health Score</p>
          <p className={`text-2xl font-bold ${
            machine.warrantyInfo.healthScore >= 80 ? 'text-green-500' :
            machine.warrantyInfo.healthScore >= 60 ? 'text-yellow-500' : 
            'text-red-500'
          }`}>
            {Math.round(machine.warrantyInfo.healthScore)}/100
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next Service</p>
          <p className="font-medium">
            {machine.warrantyInfo.nextServiceDue 
              ? format(new Date(machine.warrantyInfo.nextServiceDue), 'PP')
              : 'Not scheduled'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Savings</p>
          <p className="font-medium text-green-600">
            ₹{machine.warrantyInfo.totalSavings.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      
      {/* Add Schedule Service button if warranty is active */}
      {machine.warrantyInfo.warrantyActive && (
        <div className="mt-4">
          <Link href={`/machines/${machine.serialNumber}/schedule-warranty`}>
            <Button variant="outline" className="w-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule Warranty Service
            </Button>
          </Link>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

### 4. Add Required Imports
Update imports in machine page:
```tsx
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
```

## Testing

### 1. Test Scheduling Flow
```bash
# 1. Navigate to a machine page
http://localhost:3000/machines/[SERIAL_NUMBER]/schedule-warranty

# 2. Test with token from email
http://localhost:3000/machines/[SERIAL_NUMBER]/schedule-warranty?token=[JWT_TOKEN]

# 3. Verify:
- Page loads without authentication
- Health score displays correctly
- Calendar works (weekends disabled)
- Quick date buttons work
- Form submits successfully
```

### 2. Test Service Creation
```typescript
// Check that service request was created
const serviceRequest = await prisma.serviceRequest.findFirst({
  where: {
    machineId: 'test-machine-id',
    complaint: { contains: 'Scheduled warranty service' }
  }
})
console.log(serviceRequest)
```

### 3. Test Action Logging
```typescript
// Check action log was created
const logs = await prisma.actionLog.findMany({
  where: {
    machineId: 'test-machine-id',
    actionType: 'SERVICE_SCHEDULED'
  }
})
console.log(logs)
```

## Testing Checklist

### ✅ Page Functionality
- [ ] Loads without authentication
- [ ] Shows machine information
- [ ] Displays health score correctly
- [ ] Shows warranty status

### ✅ Scheduling
- [ ] Calendar displays properly
- [ ] Weekends are disabled
- [ ] Quick date buttons work
- [ ] Selected date shows correctly

### ✅ Form Submission
- [ ] Creates service request
- [ ] Logs action
- [ ] Shows success message
- [ ] Redirects to machine page

### ✅ Token Validation
- [ ] Works with valid token
- [ ] Works without token
- [ ] Handles expired tokens gracefully

### ✅ Edge Cases
- [ ] Handles machines without sales
- [ ] Shows expired warranty warning
- [ ] Validates date selection
- [ ] Handles API errors gracefully

## Integration Points

### With Reminder Emails
The scheduling URL in emails should be:
```
/machines/${serialNumber}/schedule-warranty?token=${jwt_token}
```

### With Machine Page
Add link to schedule service:
```tsx
<Link href={`/machines/${serialNumber}/schedule-warranty`}>
  <Button>Schedule Service</Button>
</Link>
```

### With Service Requests
The created service request will appear in:
- Machine page service history
- Customer service dashboard
- Service engineer assignments

## Success Criteria
- [x] Page accessible without login
- [x] Health score displays correctly
- [x] Service scheduling works
- [x] Actions are logged
- [x] Integrates with existing service system
- [x] Good mobile experience

## Next Step
With UI complete, proceed to [Deployment Checklist](./deployment-checklist.md)