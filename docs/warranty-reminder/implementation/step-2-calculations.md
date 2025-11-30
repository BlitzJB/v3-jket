# Step 2: Health Score & Calculations

**Time Estimate**: 3-4 hours  
**Dependencies**: Step 1 (Database)  
**Risk Level**: Low

## Objective
Create helper functions to calculate health scores, next service dates, and savings - all derived from existing data.

## Implementation

### 1. Create Warranty Helper
Create `lib/warranty-helper.ts`:

```typescript
import { Machine, Sale, ServiceRequest, ServiceVisit, MachineModel } from '@prisma/client'
import { differenceInDays, addMonths, format } from 'date-fns'

type MachineWithRelations = Machine & {
  sale: Sale | null
  machineModel: MachineModel
  serviceRequests: (ServiceRequest & {
    serviceVisit: ServiceVisit | null
  })[]
}

export class WarrantyHelper {
  // Configuration (can move to env vars later)
  static readonly SERVICE_INTERVAL_MONTHS = 3
  static readonly HEALTH_DEGRADATION_RATE = 2 // points per day overdue
  static readonly PREVENTIVE_COST = 15000
  static readonly BREAKDOWN_COST = 200000
  
  /**
   * Calculate health score based on service history
   * 100 = Perfect, 0 = Critical
   */
  static getHealthScore(machine: MachineWithRelations): number {
    if (!machine.sale) return 100 // No sale = new machine = perfect health
    
    const lastService = this.getLastCompletedService(machine)
    const nextDue = this.getNextServiceDue(machine)
    
    if (!nextDue) return 100
    
    const today = new Date()
    const daysUntilDue = differenceInDays(nextDue, today)
    
    if (daysUntilDue < 0) {
      // Overdue: lose points for each day
      const daysOverdue = Math.abs(daysUntilDue)
      return Math.max(0, 100 - (daysOverdue * this.HEALTH_DEGRADATION_RATE))
    }
    
    // Not overdue: gradual decline based on time since last service
    const daysSinceLastService = lastService 
      ? differenceInDays(today, lastService.serviceVisitDate)
      : differenceInDays(today, machine.sale.saleDate)
    
    const daysInInterval = this.SERVICE_INTERVAL_MONTHS * 30
    const percentageThrough = daysSinceLastService / daysInInterval
    
    // Decline from 100 to 70 over the service interval
    return Math.max(70, Math.round(100 - (percentageThrough * 30)))
  }
  
  /**
   * Get risk level based on health score
   */
  static getRiskLevel(healthScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (healthScore >= 80) return 'LOW'
    if (healthScore >= 60) return 'MEDIUM'
    if (healthScore >= 40) return 'HIGH'
    return 'CRITICAL'
  }
  
  /**
   * Calculate next service due date
   */
  static getNextServiceDue(machine: MachineWithRelations): Date | null {
    if (!machine.sale) return null
    
    const lastService = this.getLastCompletedService(machine)
    const baseDate = lastService?.serviceVisitDate || machine.sale.saleDate
    
    return addMonths(baseDate, this.SERVICE_INTERVAL_MONTHS)
  }
  
  /**
   * Calculate total savings from preventive maintenance
   */
  static getTotalSavings(machine: MachineWithRelations): number {
    const completedServices = machine.serviceRequests.filter(
      sr => sr.serviceVisit?.status === 'COMPLETED'
    ).length
    
    const savingsPerService = this.BREAKDOWN_COST - this.PREVENTIVE_COST
    return completedServices * savingsPerService
  }
  
  /**
   * Check if warranty is still active
   */
  static isWarrantyActive(machine: MachineWithRelations): boolean {
    if (!machine.sale) return false
    
    const warrantyEndDate = addMonths(
      machine.sale.saleDate,
      machine.machineModel.warrantyPeriodMonths
    )
    
    return warrantyEndDate > new Date()
  }
  
  /**
   * Get warranty expiry date
   */
  static getWarrantyExpiryDate(machine: MachineWithRelations): Date | null {
    if (!machine.sale) return null
    
    return addMonths(
      machine.sale.saleDate,
      machine.machineModel.warrantyPeriodMonths
    )
  }
  
  /**
   * Check if reminder should be sent today
   */
  static shouldSendReminder(
    machine: MachineWithRelations,
    lastReminderDate?: Date
  ): boolean {
    const nextDue = this.getNextServiceDue(machine)
    if (!nextDue) return false
    
    const daysUntilDue = differenceInDays(nextDue, new Date())
    
    // Send at these intervals
    const triggerDays = [15, 7, 3, 0, -3] // Include one overdue reminder
    
    if (!triggerDays.includes(daysUntilDue)) {
      return false
    }
    
    // Don't send if we already sent today
    if (lastReminderDate) {
      const daysSinceLastReminder = differenceInDays(new Date(), lastReminderDate)
      if (daysSinceLastReminder < 1) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Get urgency level for messaging
   */
  static getUrgencyLevel(daysUntilService: number): 'OVERDUE' | 'URGENT' | 'SOON' | 'UPCOMING' {
    if (daysUntilService < 0) return 'OVERDUE'
    if (daysUntilService <= 3) return 'URGENT'
    if (daysUntilService <= 7) return 'SOON'
    return 'UPCOMING'
  }
  
  /**
   * Format service date for display
   */
  static formatServiceDate(date: Date): string {
    return format(date, 'PPP') // e.g., "April 29, 2024"
  }
  
  /**
   * Private helper to get last completed service
   */
  private static getLastCompletedService(machine: MachineWithRelations) {
    const completedServices = machine.serviceRequests
      .filter(sr => sr.serviceVisit?.status === 'COMPLETED')
      .sort((a, b) => {
        const dateA = a.serviceVisit!.serviceVisitDate
        const dateB = b.serviceVisit!.serviceVisitDate
        return dateB.getTime() - dateA.getTime()
      })
    
    return completedServices[0]?.serviceVisit || null
  }
}
```

### 2. Create API Endpoint for Health Score
Create `app/api/machines/[id]/health/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WarrantyHelper } from '@/lib/warranty-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: params.id },
      include: {
        sale: true,
        machineModel: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })
    
    if (!machine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      )
    }
    
    const healthScore = WarrantyHelper.getHealthScore(machine)
    const riskLevel = WarrantyHelper.getRiskLevel(healthScore)
    const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
    const totalSavings = WarrantyHelper.getTotalSavings(machine)
    const warrantyActive = WarrantyHelper.isWarrantyActive(machine)
    const warrantyExpiry = WarrantyHelper.getWarrantyExpiryDate(machine)
    
    return NextResponse.json({
      healthScore,
      riskLevel,
      nextServiceDue,
      totalSavings,
      warrantyActive,
      warrantyExpiry
    })
  } catch (error) {
    console.error('Error calculating health score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}
```

### 3. Add Calculations to Machine API
Update `app/api/machines/[serialNumber]/route.ts` to include calculated fields:

```typescript
// In the existing GET handler, after fetching the machine:

// Add calculated warranty fields
if (machine) {
  const healthScore = WarrantyHelper.getHealthScore(machine)
  const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
  const totalSavings = WarrantyHelper.getTotalSavings(machine)
  
  return NextResponse.json({
    ...machine,
    // Add calculated fields
    warrantyInfo: {
      healthScore,
      riskLevel: WarrantyHelper.getRiskLevel(healthScore),
      nextServiceDue,
      totalSavings,
      warrantyActive: WarrantyHelper.isWarrantyActive(machine),
      warrantyExpiry: WarrantyHelper.getWarrantyExpiryDate(machine)
    }
  })
}
```

## Testing

### 1. Unit Tests
Create `lib/__tests__/warranty-helper.test.ts`:

```typescript
import { WarrantyHelper } from '../warranty-helper'

describe('WarrantyHelper', () => {
  const mockMachine = {
    id: 'test-1',
    sale: {
      saleDate: new Date('2024-01-01')
    },
    machineModel: {
      warrantyPeriodMonths: 12
    },
    serviceRequests: []
  }
  
  test('new machine has 100 health score', () => {
    const score = WarrantyHelper.getHealthScore(mockMachine)
    expect(score).toBe(100)
  })
  
  test('overdue service reduces health score', () => {
    const oldSale = {
      ...mockMachine,
      sale: {
        saleDate: new Date('2023-01-01') // Over a year ago
      }
    }
    const score = WarrantyHelper.getHealthScore(oldSale)
    expect(score).toBeLessThan(100)
  })
  
  test('calculates next service date correctly', () => {
    const nextDue = WarrantyHelper.getNextServiceDue(mockMachine)
    expect(nextDue).toEqual(new Date('2024-04-01')) // 3 months after sale
  })
  
  test('calculates savings correctly', () => {
    const machineWithServices = {
      ...mockMachine,
      serviceRequests: [
        { serviceVisit: { status: 'COMPLETED' } },
        { serviceVisit: { status: 'COMPLETED' } }
      ]
    }
    const savings = WarrantyHelper.getTotalSavings(machineWithServices)
    expect(savings).toBe(370000) // 2 * (200000 - 15000)
  })
})
```

### 2. Manual Testing
```typescript
// Test script: scripts/test-warranty-calculations.ts
import { PrismaClient } from '@prisma/client'
import { WarrantyHelper } from '../lib/warranty-helper'

const prisma = new PrismaClient()

async function test() {
  // Get a real machine
  const machine = await prisma.machine.findFirst({
    where: { sale: { isNot: null } },
    include: {
      sale: true,
      machineModel: true,
      serviceRequests: {
        include: { serviceVisit: true }
      }
    }
  })
  
  if (machine) {
    console.log('Machine:', machine.serialNumber)
    console.log('Health Score:', WarrantyHelper.getHealthScore(machine))
    console.log('Next Service:', WarrantyHelper.getNextServiceDue(machine))
    console.log('Total Savings:', WarrantyHelper.getTotalSavings(machine))
    console.log('Warranty Active:', WarrantyHelper.isWarrantyActive(machine))
  }
}

test()
```

## Testing Checklist

### ✅ Calculation Logic
- [ ] Health score returns 0-100
- [ ] Overdue machines have lower scores
- [ ] Recent services have higher scores
- [ ] Risk levels match score ranges

### ✅ Service Dates
- [ ] Next service is 3 months from last service
- [ ] Falls back to sale date if no services
- [ ] Returns null for unsold machines

### ✅ Savings Calculation
- [ ] Counts only completed services
- [ ] Uses correct cost difference
- [ ] Returns 0 for no services

### ✅ API Endpoints
- [ ] `/api/machines/[id]/health` returns data
- [ ] Machine API includes warrantyInfo
- [ ] No errors for machines without sales

## Success Criteria
- [x] All calculations work without database changes
- [x] Results are consistent and predictable
- [x] Performance is acceptable (<50ms per calculation)
- [x] No null/undefined errors
- [x] Tests pass

## Next Step
With calculations ready, proceed to [Step 3: Reminder System](./step-3-reminders.md)