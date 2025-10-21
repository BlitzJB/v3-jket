import { TestDatabase } from '../setup/database'
import { EmailCapture } from '../setup/email-capture'
import { MachineFactory } from '../factories/machine-factory'
import { ReminderService } from '@/lib/services/reminder.service'

// Mock email before importing
const emailCapture = new EmailCapture()
let mockTransport: any

jest.mock('@/lib/email/config', () => ({
  get transporter() {
    return mockTransport
  },
  emailConfig: {
    from: 'test@jket.in'
  }
}))

describe('E2E: Multiple Machine Processing', () => {
  let testDb: TestDatabase
  let factory: MachineFactory

  beforeAll(async () => {
    mockTransport = emailCapture.setup()
    testDb = new TestDatabase()
    await testDb.start()
    factory = new MachineFactory(testDb.getPrisma())
  })

  afterAll(async () => {
    await testDb.stop()
  })

  afterEach(async () => {
    await testDb.cleanup()
    emailCapture.clear()
  })

  describe('Batch Processing', () => {
    it('should process multiple eligible machines in one batch', async () => {
      // Arrange - Create machines due on different trigger days
      const machines = await Promise.all([
        factory.createMachineWithServiceDueIn(15),
        factory.createMachineWithServiceDueIn(7),
        factory.createMachineWithServiceDueIn(3),
        factory.createMachineWithServiceOverdueBy(3),
      ])

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(4)
      expect(emailCapture.getEmailCount()).toBe(4)

      // Verify each email went to the right customer
      for (const { sale } of machines) {
        emailCapture.assertEmailSent(sale.customerEmail!)
      }

      // Verify action logs for all
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: {
          actionType: 'REMINDER_SENT'
        }
      })
      expect(actionLogs).toHaveLength(4)
    })

    it('should send correct urgency level for each machine', async () => {
      // Arrange
      const { sale: overdueCustomer } = await factory.createMachineWithServiceOverdueBy(3)
      const { sale: urgentCustomer } = await factory.createMachineWithServiceDueIn(3)
      const { sale: soonCustomer } = await factory.createMachineWithServiceDueIn(7)
      const { sale: upcomingCustomer } = await factory.createMachineWithServiceDueIn(15)

      // Act
      await ReminderService.processReminders()

      // Assert - Check each email has correct urgency
      const overdueEmail = emailCapture.getEmailsTo(overdueCustomer.customerEmail!)[0]
      expect(overdueEmail.subject).toContain('⚠️ Overdue')

      const urgentEmail = emailCapture.getEmailsTo(urgentCustomer.customerEmail!)[0]
      expect(urgentEmail.subject).toContain('🔴 Urgent')

      const soonEmail = emailCapture.getEmailsTo(soonCustomer.customerEmail!)[0]
      expect(soonEmail.subject).toContain('Service Reminder')

      const upcomingEmail = emailCapture.getEmailsTo(upcomingCustomer.customerEmail!)[0]
      expect(upcomingEmail.subject).toContain('Service Reminder')
    })
  })

  describe('Large Batch Performance', () => {
    it('should handle 10+ machines efficiently', async () => {
      // Arrange - Create 10 machines
      const machines = []
      for (let i = 0; i < 10; i++) {
        machines.push(await factory.createMachineWithServiceDueIn(15))
      }

      // Act
      const startTime = Date.now()
      const sentCount = await ReminderService.processReminders()
      const endTime = Date.now()

      // Assert
      expect(sentCount).toBe(10)
      expect(emailCapture.getEmailCount()).toBe(10)

      // Performance check - should complete within reasonable time
      const duration = endTime - startTime
      expect(duration).toBeLessThan(10000) // Less than 10 seconds

      // Verify all emails unique
      const emails = emailCapture.getEmails()
      const uniqueEmails = new Set(emails.map(e => e.to))
      expect(uniqueEmails.size).toBe(10)
    })
  })
})
