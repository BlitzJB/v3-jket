import { addMonths, differenceInDays, startOfDay, isSameDay } from 'date-fns'

/**
 * Machine type definition for warranty calculations
 */
interface Machine {
  id: string
  serialNumber: string
  manufacturingDate: Date | string
  machineModel: {
    warrantyPeriodMonths: number
    name?: string
  }
  sale?: {
    saleDate: Date | string
    customerEmail?: string
    reminderOptOut?: boolean
  } | null
  serviceRequests?: Array<{
    id: string
    createdAt: Date | string
    serviceVisit?: {
      id: string
      serviceVisitDate: Date | string
      status: string
    } | null
  }>
}

/**
 * Warranty Helper - Core business logic for warranty and service reminder calculations
 */
export class WarrantyHelper {
  // Configuration constants from environment variables
  private static readonly SERVICE_INTERVAL_MONTHS = parseInt(process.env.SERVICE_INTERVAL_MONTHS || '3')
  private static readonly REMINDER_DAYS_BEFORE = parseInt(process.env.REMINDER_DAYS_BEFORE || '15')
  private static readonly AVG_PREVENTIVE_COST = parseFloat(process.env.AVG_PREVENTIVE_COST || '15000')
  private static readonly AVG_BREAKDOWN_COST = parseFloat(process.env.AVG_BREAKDOWN_COST || '200000')

  // Reminder trigger days (before/after service due date)
  private static readonly REMINDER_TRIGGER_DAYS = [15, 7, 3, 0, -3]

  /**
   * Get the warranty expiry date for a machine
   * @param machine - Machine with sale and model information
   * @returns Date when warranty expires, or null if no sale date
   */
  static getWarrantyExpiryDate(machine: Machine): Date | null {
    if (!machine.sale?.saleDate) {
      return null
    }

    const saleDate = typeof machine.sale.saleDate === 'string'
      ? new Date(machine.sale.saleDate)
      : machine.sale.saleDate
    const warrantyPeriodMonths = machine.machineModel.warrantyPeriodMonths

    return addMonths(saleDate, warrantyPeriodMonths)
  }

  /**
   * Check if warranty is still active
   * @param machine - Machine to check
   * @returns true if warranty is active, false otherwise
   */
  static isWarrantyActive(machine: Machine): boolean {
    const expiryDate = this.getWarrantyExpiryDate(machine)

    if (!expiryDate) {
      return false
    }

    const today = startOfDay(new Date())
    const expiry = startOfDay(expiryDate)

    return today <= expiry
  }

  /**
   * Get the next service due date for a machine
   * Calculates based on SERVICE_INTERVAL_MONTHS from sale date
   * Returns overdue services (if any) or the next upcoming service
   * @param machine - Machine to calculate for
   * @returns Date of next service due, or null if warranty expired or no sale
   */
  static getNextServiceDue(machine: Machine): Date | null {
    if (!machine.sale?.saleDate) {
      return null
    }

    // Check if warranty is active
    if (!this.isWarrantyActive(machine)) {
      return null
    }

    const saleDate = typeof machine.sale.saleDate === 'string'
      ? new Date(machine.sale.saleDate)
      : machine.sale.saleDate
    const warrantyExpiry = this.getWarrantyExpiryDate(machine)
    const today = startOfDay(new Date())

    // Generate all service due dates from sale date until warranty expiry
    let currentServiceDate = addMonths(saleDate, this.SERVICE_INTERVAL_MONTHS)
    let lastOverdueService: Date | null = null
    let nextFutureService: Date | null = null

    while (warrantyExpiry && currentServiceDate <= warrantyExpiry) {
      if (currentServiceDate < today) {
        // This is an overdue service - keep track of the most recent one
        lastOverdueService = currentServiceDate
      } else {
        // This is a future service - save the first one and break
        nextFutureService = currentServiceDate
        break
      }
      currentServiceDate = addMonths(currentServiceDate, this.SERVICE_INTERVAL_MONTHS)
    }

    // Priority: return overdue service if exists, otherwise return next future service
    return lastOverdueService || nextFutureService
  }

  /**
   * Calculate health score for a machine (0-100)
   * Based on service history, timeliness, and current status
   * @param machine - Machine to calculate for
   * @returns Health score from 0 (critical) to 100 (excellent)
   */
  static getHealthScore(machine: Machine): number {
    if (!machine.sale?.saleDate) {
      return 0
    }

    let score = 100 // Start with perfect score

    const nextServiceDue = this.getNextServiceDue(machine)
    const completedServices = this.getCompletedServiceCount(machine)
    const expectedServices = this.getExpectedServiceCount(machine)

    // Factor 1: Current service status (40% weight)
    if (nextServiceDue) {
      const daysUntilService = differenceInDays(nextServiceDue, new Date())

      if (daysUntilService < -30) {
        score -= 40 // Severely overdue (30+ days)
      } else if (daysUntilService < -14) {
        score -= 30 // Very overdue (14-30 days)
      } else if (daysUntilService < -7) {
        score -= 20 // Overdue (7-14 days)
      } else if (daysUntilService < 0) {
        score -= 10 // Slightly overdue (1-7 days)
      } else if (daysUntilService <= 7) {
        score -= 5 // Due soon (no major penalty)
      }
    }

    // Factor 2: Service completion rate (40% weight)
    if (expectedServices > 0) {
      const completionRate = completedServices / expectedServices

      if (completionRate < 0.5) {
        score -= 40 // Less than 50% services completed
      } else if (completionRate < 0.75) {
        score -= 25 // 50-75% services completed
      } else if (completionRate < 1.0) {
        score -= 10 // 75-100% services completed
      }
      // No penalty if all services completed on time
    }

    // Factor 3: Machine age bonus (20% weight)
    // Older machines that are well-maintained get bonus points
    const saleDate = typeof machine.sale.saleDate === 'string'
      ? new Date(machine.sale.saleDate)
      : machine.sale.saleDate
    const ageInMonths = Math.abs(differenceInDays(new Date(), saleDate)) / 30

    if (ageInMonths > 6 && completedServices >= expectedServices) {
      score += Math.min(10, ageInMonths) // Bonus for well-maintained older machines
    }

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Get risk level based on health score
   * @param healthScore - Health score (0-100)
   * @returns Risk level: 'LOW', 'MEDIUM', or 'HIGH'
   */
  static getRiskLevel(healthScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (healthScore >= 80) {
      return 'LOW'
    } else if (healthScore >= 60) {
      return 'MEDIUM'
    } else {
      return 'HIGH'
    }
  }

  /**
   * Calculate total savings from preventive maintenance
   * @param machine - Machine to calculate for
   * @returns Total savings in rupees
   */
  static getTotalSavings(machine: Machine): number {
    const completedServices = this.getCompletedServiceCount(machine)
    const savingsPerService = this.AVG_BREAKDOWN_COST - this.AVG_PREVENTIVE_COST

    return completedServices * savingsPerService
  }

  /**
   * Get urgency level based on days until service
   * @param daysUntilService - Number of days until service (negative = overdue)
   * @returns Urgency level: 'OVERDUE', 'URGENT', 'SOON', or 'UPCOMING'
   */
  static getUrgencyLevel(daysUntilService: number): 'OVERDUE' | 'URGENT' | 'SOON' | 'UPCOMING' {
    if (daysUntilService <= 0) {
      return 'OVERDUE'
    } else if (daysUntilService <= 3) {
      return 'URGENT'
    } else if (daysUntilService <= 7) {
      return 'SOON'
    } else {
      return 'UPCOMING'
    }
  }

  /**
   * Determine if a reminder should be sent today
   * Checks against trigger days and prevents duplicate sends
   * @param machine - Machine to check
   * @param lastReminderDate - Date of last reminder sent (optional)
   * @returns true if reminder should be sent today, false otherwise
   */
  static shouldSendReminder(machine: Machine, lastReminderDate?: Date | null): boolean {
    const nextServiceDue = this.getNextServiceDue(machine)

    if (!nextServiceDue) {
      return false
    }

    const today = startOfDay(new Date())
    const daysUntilService = differenceInDays(nextServiceDue, today)

    // Check if today is one of the trigger days
    const isTriggerDay = this.REMINDER_TRIGGER_DAYS.indexOf(daysUntilService) !== -1

    if (!isTriggerDay) {
      return false
    }

    // Check if we already sent a reminder today
    if (lastReminderDate) {
      const lastReminderDay = startOfDay(lastReminderDate)
      if (isSameDay(today, lastReminderDay)) {
        return false // Already sent today
      }
    }

    return true
  }

  /**
   * Helper: Get count of completed service visits
   * @param machine - Machine to count for
   * @returns Number of completed services
   */
  private static getCompletedServiceCount(machine: Machine): number {
    if (!machine.serviceRequests || machine.serviceRequests.length === 0) {
      return 0
    }

    return machine.serviceRequests.filter(request =>
      request.serviceVisit &&
      request.serviceVisit.status === 'COMPLETED'
    ).length
  }

  /**
   * Helper: Calculate expected number of services by now
   * @param machine - Machine to calculate for
   * @returns Number of services that should have been completed
   */
  private static getExpectedServiceCount(machine: Machine): number {
    if (!machine.sale?.saleDate) {
      return 0
    }

    const saleDate = typeof machine.sale.saleDate === 'string'
      ? new Date(machine.sale.saleDate)
      : machine.sale.saleDate
    const today = new Date()
    const warrantyExpiry = this.getWarrantyExpiryDate(machine)

    if (!warrantyExpiry || today > warrantyExpiry) {
      // If warranty expired, calculate based on warranty period
      const warrantyPeriodMonths = machine.machineModel.warrantyPeriodMonths
      return Math.floor(warrantyPeriodMonths / this.SERVICE_INTERVAL_MONTHS)
    }

    // Calculate how many service intervals have passed since sale
    const monthsSinceSale = Math.abs(differenceInDays(today, saleDate)) / 30
    const expectedServices = Math.floor(monthsSinceSale / this.SERVICE_INTERVAL_MONTHS)

    return expectedServices
  }

  /**
   * Get all scheduled service dates for a machine within warranty period
   * @param machine - Machine to calculate for
   * @returns Array of service due dates
   */
  static getAllServiceDates(machine: Machine): Date[] {
    if (!machine.sale?.saleDate) {
      return []
    }

    const saleDate = typeof machine.sale.saleDate === 'string'
      ? new Date(machine.sale.saleDate)
      : machine.sale.saleDate
    const warrantyExpiry = this.getWarrantyExpiryDate(machine)

    if (!warrantyExpiry) {
      return []
    }

    const serviceDates: Date[] = []
    let currentServiceDate = addMonths(saleDate, this.SERVICE_INTERVAL_MONTHS)

    while (currentServiceDate <= warrantyExpiry) {
      serviceDates.push(currentServiceDate)
      currentServiceDate = addMonths(currentServiceDate, this.SERVICE_INTERVAL_MONTHS)
    }

    return serviceDates
  }

  /**
   * Get detailed warranty status for a machine
   * @param machine - Machine to analyze
   * @returns Comprehensive warranty status object
   */
  static getWarrantyStatus(machine: Machine) {
    const warrantyExpiry = this.getWarrantyExpiryDate(machine)
    const isActive = this.isWarrantyActive(machine)
    const nextServiceDue = this.getNextServiceDue(machine)
    const healthScore = this.getHealthScore(machine)
    const riskLevel = this.getRiskLevel(healthScore)
    const totalSavings = this.getTotalSavings(machine)

    let daysUntilService: number | null = null
    let urgencyLevel: ReturnType<typeof this.getUrgencyLevel> | null = null

    if (nextServiceDue) {
      daysUntilService = differenceInDays(nextServiceDue, new Date())
      urgencyLevel = this.getUrgencyLevel(daysUntilService)
    }

    return {
      warrantyActive: isActive,
      warrantyExpiry,
      nextServiceDue,
      daysUntilService,
      healthScore,
      riskLevel,
      urgencyLevel,
      totalSavings,
      completedServices: this.getCompletedServiceCount(machine),
      expectedServices: this.getExpectedServiceCount(machine),
      allServiceDates: this.getAllServiceDates(machine)
    }
  }
}
