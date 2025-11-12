import { Machine, Sale, ServiceRequest, ServiceVisit, MachineModel } from '@prisma/client'
import { differenceInDays, addMonths, format } from 'date-fns'

type MachineWithRelations = Machine & {
  sale: Sale | null
  machineModel: MachineModel & {
    category?: any
  }
  serviceRequests: (ServiceRequest & {
    serviceVisit: ServiceVisit | null
  })[]
  supply?: any
  warrantyCertificate?: any
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