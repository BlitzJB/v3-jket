import { describe, test, expect, beforeAll } from '@jest/globals'
import { WarrantyHelper } from '../warranty-helper'
import { addMonths, subMonths, addDays, subDays } from 'date-fns'

// Set up environment variables for testing
beforeAll(() => {
  process.env.SERVICE_INTERVAL_MONTHS = '3'
  process.env.REMINDER_DAYS_BEFORE = '15'
  process.env.AVG_PREVENTIVE_COST = '15000'
  process.env.AVG_BREAKDOWN_COST = '200000'
})

interface TestMachine {
  id: string
  serialNumber: string
  manufacturingDate: Date
  machineModel: {
    name: string
    warrantyPeriodMonths: number
  }
  sale: {
    saleDate: Date
    customerEmail: string
    reminderOptOut: boolean
  } | null
  serviceRequests?: any[]
}

function createTestMachine(options: {
  saleDate: Date
  warrantyPeriodMonths: number
  serviceRequests?: any[]
}): TestMachine {
  return {
    id: 'test-machine-id',
    serialNumber: 'TEST-001',
    manufacturingDate: subMonths(options.saleDate, 1),
    machineModel: {
      name: 'Test Machine Model',
      warrantyPeriodMonths: options.warrantyPeriodMonths
    },
    sale: {
      saleDate: options.saleDate,
      customerEmail: 'test@example.com',
      reminderOptOut: false
    },
    serviceRequests: options.serviceRequests || []
  }
}

describe('WarrantyHelper', () => {
  describe('getWarrantyExpiryDate', () => {
    test('should calculate warranty expiry date correctly', () => {
      const saleDate = new Date('2024-01-01')
      const machine = createTestMachine({ saleDate, warrantyPeriodMonths: 12 })
      const expiryDate = WarrantyHelper.getWarrantyExpiryDate(machine)

      expect(expiryDate).not.toBeNull()
      expect(expiryDate?.getFullYear()).toBe(2025)
      expect(expiryDate?.getMonth()).toBe(0) // January = 0
    })

    test('should return null for machine without sale', () => {
      const machine = createTestMachine({ saleDate: new Date(), warrantyPeriodMonths: 12 })
      machine.sale = null
      const expiryDate = WarrantyHelper.getWarrantyExpiryDate(machine)

      expect(expiryDate).toBeNull()
    })

    test('should handle different warranty periods', () => {
      const saleDate = new Date('2024-01-01')
      const machine6Months = createTestMachine({ saleDate, warrantyPeriodMonths: 6 })
      const machine24Months = createTestMachine({ saleDate, warrantyPeriodMonths: 24 })

      const expiry6 = WarrantyHelper.getWarrantyExpiryDate(machine6Months)
      const expiry24 = WarrantyHelper.getWarrantyExpiryDate(machine24Months)

      expect(expiry6?.getFullYear()).toBe(2024)
      expect(expiry6?.getMonth()).toBe(6) // July
      expect(expiry24?.getFullYear()).toBe(2026)
      expect(expiry24?.getMonth()).toBe(0) // January
    })
  })

  describe('isWarrantyActive', () => {
    test('should identify active warranty', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 6),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.isWarrantyActive(machine)).toBe(true)
    })

    test('should identify expired warranty', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 13),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.isWarrantyActive(machine)).toBe(false)
    })

    test('should return false for machine without sale', () => {
      const machine = createTestMachine({
        saleDate: new Date(),
        warrantyPeriodMonths: 12
      })
      machine.sale = null

      expect(WarrantyHelper.isWarrantyActive(machine)).toBe(false)
    })

    test('should handle warranty expiring today', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 12),
        warrantyPeriodMonths: 12
      })

      // Warranty expires today, should still be active
      expect(WarrantyHelper.isWarrantyActive(machine)).toBe(true)
    })
  })

  describe('getNextServiceDue', () => {
    test('should calculate next service date', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 1),
        warrantyPeriodMonths: 12
      })

      const nextService = WarrantyHelper.getNextServiceDue(machine)

      expect(nextService).not.toBeNull()
      // Service should be in ~2 months (3 months from sale - 1 month elapsed)
      if (nextService) {
        const monthsAway = (nextService.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
        expect(monthsAway).toBeGreaterThan(1)
        expect(monthsAway).toBeLessThan(3)
      }
    })

    test('should return null for expired warranty', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 15),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.getNextServiceDue(machine)).toBeNull()
    })

    test('should return null for machine without sale', () => {
      const machine = createTestMachine({
        saleDate: new Date(),
        warrantyPeriodMonths: 12
      })
      machine.sale = null

      expect(WarrantyHelper.getNextServiceDue(machine)).toBeNull()
    })

    test('should return overdue service if applicable', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 5), // Sold 5 months ago
        warrantyPeriodMonths: 12
      })

      const nextService = WarrantyHelper.getNextServiceDue(machine)

      // First service was due at 3 months, which has passed
      expect(nextService).not.toBeNull()
    })
  })

  describe('getHealthScore', () => {
    test('should return score between 0 and 100', () => {
      const machine = createTestMachine({
        saleDate: subDays(new Date(), 30),
        warrantyPeriodMonths: 12
      })

      const score = WarrantyHelper.getHealthScore(machine)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    test('should return 0 for machine without sale', () => {
      const machine = createTestMachine({
        saleDate: new Date(),
        warrantyPeriodMonths: 12
      })
      machine.sale = null

      expect(WarrantyHelper.getHealthScore(machine)).toBe(0)
    })

    test('should give higher score to well-maintained machines', () => {
      const wellMaintained = createTestMachine({
        saleDate: subMonths(new Date(), 9),
        warrantyPeriodMonths: 12,
        serviceRequests: [
          {
            id: '1',
            createdAt: subMonths(new Date(), 6),
            serviceVisit: {
              id: 'v1',
              serviceVisitDate: subMonths(new Date(), 6),
              status: 'COMPLETED'
            }
          },
          {
            id: '2',
            createdAt: subMonths(new Date(), 3),
            serviceVisit: {
              id: 'v2',
              serviceVisitDate: subMonths(new Date(), 3),
              status: 'COMPLETED'
            }
          }
        ]
      })

      const poorlyMaintained = createTestMachine({
        saleDate: subMonths(new Date(), 9),
        warrantyPeriodMonths: 12,
        serviceRequests: []
      })

      const scoreGood = WarrantyHelper.getHealthScore(wellMaintained)
      const scorePoor = WarrantyHelper.getHealthScore(poorlyMaintained)

      expect(scoreGood).toBeGreaterThan(scorePoor)
    })

    test('should return perfect score for new machine', () => {
      const newMachine = createTestMachine({
        saleDate: subDays(new Date(), 15), // Sold 15 days ago
        warrantyPeriodMonths: 12
      })

      const score = WarrantyHelper.getHealthScore(newMachine)

      // New machine with no services due yet should have high score
      expect(score).toBeGreaterThanOrEqual(90)
    })
  })

  describe('getRiskLevel', () => {
    test('should categorize LOW risk correctly', () => {
      expect(WarrantyHelper.getRiskLevel(85)).toBe('LOW')
      expect(WarrantyHelper.getRiskLevel(90)).toBe('LOW')
      expect(WarrantyHelper.getRiskLevel(100)).toBe('LOW')
    })

    test('should categorize MEDIUM risk correctly', () => {
      expect(WarrantyHelper.getRiskLevel(70)).toBe('MEDIUM')
      expect(WarrantyHelper.getRiskLevel(75)).toBe('MEDIUM')
      expect(WarrantyHelper.getRiskLevel(79)).toBe('MEDIUM')
    })

    test('should categorize HIGH risk correctly', () => {
      expect(WarrantyHelper.getRiskLevel(50)).toBe('HIGH')
      expect(WarrantyHelper.getRiskLevel(30)).toBe('HIGH')
      expect(WarrantyHelper.getRiskLevel(0)).toBe('HIGH')
    })

    test('should handle edge cases', () => {
      expect(WarrantyHelper.getRiskLevel(80)).toBe('LOW')
      expect(WarrantyHelper.getRiskLevel(60)).toBe('MEDIUM')
      expect(WarrantyHelper.getRiskLevel(59)).toBe('HIGH')
    })
  })

  describe('getTotalSavings', () => {
    test('should calculate total savings correctly', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 9),
        warrantyPeriodMonths: 12,
        serviceRequests: [
          { id: '1', createdAt: new Date(), serviceVisit: { id: 'v1', serviceVisitDate: new Date(), status: 'COMPLETED' } },
          { id: '2', createdAt: new Date(), serviceVisit: { id: 'v2', serviceVisitDate: new Date(), status: 'COMPLETED' } },
          { id: '3', createdAt: new Date(), serviceVisit: { id: 'v3', serviceVisitDate: new Date(), status: 'COMPLETED' } }
        ]
      })

      const savings = WarrantyHelper.getTotalSavings(machine)
      const expectedSavings = 3 * (200000 - 15000) // 3 services * 185000

      expect(savings).toBe(expectedSavings)
      expect(savings).toBe(555000)
    })

    test('should return 0 for machine with no services', () => {
      const machine = createTestMachine({
        saleDate: new Date(),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.getTotalSavings(machine)).toBe(0)
    })

    test('should only count COMPLETED services', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 6),
        warrantyPeriodMonths: 12,
        serviceRequests: [
          { id: '1', createdAt: new Date(), serviceVisit: { id: 'v1', serviceVisitDate: new Date(), status: 'COMPLETED' } },
          { id: '2', createdAt: new Date(), serviceVisit: { id: 'v2', serviceVisitDate: new Date(), status: 'PENDING' } },
          { id: '3', createdAt: new Date(), serviceVisit: { id: 'v3', serviceVisitDate: new Date(), status: 'COMPLETED' } }
        ]
      })

      const savings = WarrantyHelper.getTotalSavings(machine)

      // Only 2 completed services
      expect(savings).toBe(2 * 185000)
      expect(savings).toBe(370000)
    })
  })

  describe('getUrgencyLevel', () => {
    test('should return OVERDUE for negative or zero days', () => {
      expect(WarrantyHelper.getUrgencyLevel(-5)).toBe('OVERDUE')
      expect(WarrantyHelper.getUrgencyLevel(-1)).toBe('OVERDUE')
      expect(WarrantyHelper.getUrgencyLevel(0)).toBe('OVERDUE')
    })

    test('should return URGENT for 1-3 days', () => {
      expect(WarrantyHelper.getUrgencyLevel(1)).toBe('URGENT')
      expect(WarrantyHelper.getUrgencyLevel(2)).toBe('URGENT')
      expect(WarrantyHelper.getUrgencyLevel(3)).toBe('URGENT')
    })

    test('should return SOON for 4-7 days', () => {
      expect(WarrantyHelper.getUrgencyLevel(4)).toBe('SOON')
      expect(WarrantyHelper.getUrgencyLevel(5)).toBe('SOON')
      expect(WarrantyHelper.getUrgencyLevel(7)).toBe('SOON')
    })

    test('should return UPCOMING for 8+ days', () => {
      expect(WarrantyHelper.getUrgencyLevel(8)).toBe('UPCOMING')
      expect(WarrantyHelper.getUrgencyLevel(15)).toBe('UPCOMING')
      expect(WarrantyHelper.getUrgencyLevel(30)).toBe('UPCOMING')
    })
  })

  describe('shouldSendReminder', () => {
    test('should return true on trigger day (15 days before)', () => {
      const machine = createTestMachine({
        saleDate: subMonths(addDays(new Date(), 15), 3),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.shouldSendReminder(machine)).toBe(true)
    })

    test('should return false when reminder was sent today', () => {
      const machine = createTestMachine({
        saleDate: subMonths(addDays(new Date(), 15), 3),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.shouldSendReminder(machine, new Date())).toBe(false)
    })

    test('should return true when reminder was sent yesterday', () => {
      const machine = createTestMachine({
        saleDate: subMonths(addDays(new Date(), 15), 3),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.shouldSendReminder(machine, subDays(new Date(), 1))).toBe(true)
    })

    test('should return false on non-trigger days', () => {
      const machine = createTestMachine({
        saleDate: subMonths(addDays(new Date(), 10), 3), // 10 days before service
        warrantyPeriodMonths: 12
      })

      // 10 is not a trigger day (15, 7, 3, 0, -3 are trigger days)
      expect(WarrantyHelper.shouldSendReminder(machine)).toBe(false)
    })

    test('should return false for expired warranty', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 15),
        warrantyPeriodMonths: 12
      })

      expect(WarrantyHelper.shouldSendReminder(machine)).toBe(false)
    })
  })

  describe('getAllServiceDates', () => {
    test('should return correct number of service dates', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 6),
        warrantyPeriodMonths: 12
      })

      const dates = WarrantyHelper.getAllServiceDates(machine)

      // 12 month warranty with 3-month intervals = 4 service dates
      expect(dates).toHaveLength(4)
    })

    test('should return dates 3 months apart', () => {
      const machine = createTestMachine({
        saleDate: new Date('2024-01-01'),
        warrantyPeriodMonths: 12
      })

      const dates = WarrantyHelper.getAllServiceDates(machine)

      expect(dates[0].getMonth()).toBe(3) // April (0-indexed, so 3 = April)
      expect(dates[1].getMonth()).toBe(6) // July
      expect(dates[2].getMonth()).toBe(9) // October
      expect(dates[3].getFullYear()).toBe(2025) // Next year
    })

    test('should return empty array for machine without sale', () => {
      const machine = createTestMachine({
        saleDate: new Date(),
        warrantyPeriodMonths: 12
      })
      machine.sale = null

      expect(WarrantyHelper.getAllServiceDates(machine)).toEqual([])
    })
  })

  describe('getWarrantyStatus', () => {
    test('should return comprehensive status object', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 3),
        warrantyPeriodMonths: 12,
        serviceRequests: [
          {
            id: '1',
            createdAt: new Date(),
            serviceVisit: {
              id: 'v1',
              serviceVisitDate: new Date(),
              status: 'COMPLETED'
            }
          }
        ]
      })

      const status = WarrantyHelper.getWarrantyStatus(machine)

      expect(status).toHaveProperty('warrantyActive')
      expect(status).toHaveProperty('warrantyExpiry')
      expect(status).toHaveProperty('nextServiceDue')
      expect(status).toHaveProperty('daysUntilService')
      expect(status).toHaveProperty('healthScore')
      expect(status).toHaveProperty('riskLevel')
      expect(status).toHaveProperty('urgencyLevel')
      expect(status).toHaveProperty('totalSavings')
      expect(status).toHaveProperty('completedServices')
      expect(status).toHaveProperty('expectedServices')
      expect(status).toHaveProperty('allServiceDates')
    })

    test('should have correct values', () => {
      const machine = createTestMachine({
        saleDate: subMonths(new Date(), 3),
        warrantyPeriodMonths: 12,
        serviceRequests: [
          {
            id: '1',
            createdAt: new Date(),
            serviceVisit: {
              id: 'v1',
              serviceVisitDate: new Date(),
              status: 'COMPLETED'
            }
          }
        ]
      })

      const status = WarrantyHelper.getWarrantyStatus(machine)

      expect(status.warrantyActive).toBe(true)
      expect(status.healthScore).toBeGreaterThanOrEqual(0)
      expect(status.healthScore).toBeLessThanOrEqual(100)
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(status.riskLevel)
      expect(status.completedServices).toBe(1)
      expect(status.totalSavings).toBe(185000)
    })
  })
})
