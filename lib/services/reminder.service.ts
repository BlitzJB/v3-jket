import { prisma } from '@/lib/prisma'
import { WarrantyHelper } from '../warranty-helper'
import { generateServiceReminderHTML } from '../email-templates/service-reminder'
import { transporter, emailConfig } from '@/lib/email/config'
import { SignJWT } from 'jose'
import { differenceInDays } from 'date-fns'

export class ReminderService {
  /**
   * Process all machines and send reminders where needed
   */
  static async processReminders(): Promise<number> {
    let sentCount = 0
    
    try {
      // Get all machines with sales (we'll filter further below)
      const allMachines = await prisma.machine.findMany({
        where: {
          sale: { isNot: null }
        },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })

      // Filter machines that have valid email and haven't opted out
      const machines = allMachines.filter(machine => 
        machine.sale &&
        machine.sale.customerEmail &&
        machine.sale.customerEmail.trim() !== '' &&
        !machine.sale.reminderOptOut
      )
      
      console.log(`Found ${machines.length} machines to check for reminders`)
      
      for (const machine of machines) {
        // Check if warranty is still active
        if (!WarrantyHelper.isWarrantyActive(machine)) {
          continue
        }
        
        // Check last reminder sent
        const lastReminder = await prisma.actionLog.findFirst({
          where: {
            machineId: machine.id,
            actionType: 'REMINDER_SENT'
          },
          orderBy: { createdAt: 'desc' }
        })
        
        // Check if we should send today
        if (!WarrantyHelper.shouldSendReminder(machine, lastReminder?.createdAt)) {
          continue
        }
        
        // Send reminder
        const sent = await this.sendReminder(machine)
        if (sent) sentCount++
      }
      
      console.log(`✅ Sent ${sentCount} reminders`)
    } catch (error) {
      console.error('Error processing reminders:', error)
    }
    
    return sentCount
  }
  
  /**
   * Send reminder email for a specific machine
   */
  static async sendReminder(machine: any): Promise<boolean> {
    try {
      const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
      if (!nextServiceDue) return false
      
      const daysUntilService = differenceInDays(nextServiceDue, new Date())
      const healthScore = WarrantyHelper.getHealthScore(machine)
      const totalSavings = WarrantyHelper.getTotalSavings(machine)
      
      // Generate JWT token for scheduling link
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'development-jwt-secret-32-characters'
      )
      
      const token = await new SignJWT({
        machineId: machine.id,
        serialNumber: machine.serialNumber,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)
      
      const scheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/machines/${machine.serialNumber}/schedule-warranty?token=${token}`
      
      // Generate email HTML
      const html = generateServiceReminderHTML({
        customerName: machine.sale.customerName,
        machineName: machine.machineModel.name,
        serialNumber: machine.serialNumber,
        daysUntilService,
        healthScore,
        totalSavings,
        scheduleUrl
      })
      
      // Determine subject based on urgency
      const urgency = WarrantyHelper.getUrgencyLevel(daysUntilService)
      const subject = {
        'OVERDUE': `⚠️ Overdue: Service Required - ${machine.machineModel.name}`,
        'URGENT': `🔴 Urgent: Service Due Soon - ${machine.machineModel.name}`,
        'SOON': `🟡 Reminder: Service Due in ${daysUntilService} Days - ${machine.machineModel.name}`,
        'UPCOMING': `Service Reminder - ${machine.machineModel.name}`
      }[urgency]
      
      // Send email
      await transporter.sendMail({
        from: emailConfig.from,
        to: machine.sale.customerEmail,
        subject,
        html
      })
      
      // Log the reminder
      await prisma.actionLog.create({
        data: {
          machineId: machine.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: {
            daysUntilService,
            healthScore,
            urgency,
            sentTo: machine.sale.customerEmail
          }
        }
      })
      
      console.log(`📧 Sent reminder for ${machine.serialNumber} to ${machine.sale.customerEmail}`)
      return true
      
    } catch (error) {
      console.error(`Failed to send reminder for ${machine.serialNumber}:`, error)
      return false
    }
  }

  /**
   * Send a test reminder to a specific email
   */
  static async sendTestReminder(machineId: string, testEmail: string): Promise<boolean> {
    try {
      const machine = await prisma.machine.findUnique({
        where: { id: machineId },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })

      if (!machine) {
        console.error('Machine not found for test reminder')
        return false
      }

      const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
      if (!nextServiceDue) return false

      const daysUntilService = differenceInDays(nextServiceDue, new Date())
      const healthScore = WarrantyHelper.getHealthScore(machine)
      const totalSavings = WarrantyHelper.getTotalSavings(machine)

      // Generate JWT token
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'development-jwt-secret-32-characters'
      )

      const token = await new SignJWT({
        machineId: machine.id,
        serialNumber: machine.serialNumber,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)

      const scheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL}/machines/${machine.serialNumber}/schedule-warranty?token=${token}`

      // Generate email HTML
      const html = generateServiceReminderHTML({
        customerName: machine.sale?.customerName || 'Test Customer',
        machineName: machine.machineModel.name,
        serialNumber: machine.serialNumber,
        daysUntilService,
        healthScore,
        totalSavings,
        scheduleUrl
      })

      // Send test email
      await transporter.sendMail({
        from: emailConfig.from,
        to: testEmail,
        subject: `[TEST] Service Reminder - ${machine.machineModel.name}`,
        html
      })

      console.log(`📧 Sent test reminder for ${machine.serialNumber} to ${testEmail}`)
      return true

    } catch (error) {
      console.error('Failed to send test reminder:', error)
      return false
    }
  }
}