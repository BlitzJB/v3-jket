import { TestDatabase } from '../setup/database'
import { EmailCapture } from '../setup/email-capture'
import { MachineFactory } from '../factories/machine-factory'
import { ReminderService } from '@/lib/services/reminder.service'

// Mock email before importing anything that uses it
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

describe('E2E: Core Reminder Flow', () => {
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

  describe('Service Due in 15 Days (UPCOMING)', () => {
    it('should send reminder email with UPCOMING urgency', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert API response
      expect(sentCount).toBe(1)

      // Assert email was sent
      const email = emailCapture.assertEmailSent(
        sale.customerEmail!,
        'Service Reminder'
      )

      expect(email.subject).toContain('Service Reminder')
      expect(email.subject).toContain(machine!.machineModel.name)
      expect(email.html).toContain(machine!.serialNumber)
      expect(email.html).toContain('15')
      expect(email.html).toContain('#10b981') // Green color for UPCOMING

      // Assert action log was created
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      expect(actionLogs).toHaveLength(1)
      expect(actionLogs[0].channel).toBe('EMAIL')
      expect(actionLogs[0].metadata).toMatchObject({
        daysUntilService: 15,
        urgency: 'UPCOMING',
        sentTo: sale.customerEmail
      })
    })
  })

  describe('Service Due in 7 Days (SOON)', () => {
    it('should send SOON reminder with blue styling', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(7)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(sale.customerEmail!)

      expect(email.subject).toContain('Service Reminder')
      expect(email.html).toContain('7')
      expect(email.html).toContain('#3b82f6') // Blue color for SOON

      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: { machineId: machine!.id }
      })

      expect(actionLog?.metadata).toMatchObject({
        urgency: 'SOON',
        daysUntilService: 7
      })
    })
  })

  describe('Service Due in 3 Days (URGENT)', () => {
    it('should send URGENT reminder with orange styling and urgent emoji', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(3)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(
        sale.customerEmail!,
        '🔴 Urgent'
      )

      expect(email.subject).toContain('🔴 Urgent: Service Due Soon')
      expect(email.html).toContain('3')
      expect(email.html).toContain('#f59e0b') // Orange color for URGENT

      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: { machineId: machine!.id }
      })

      expect(actionLog?.metadata).toMatchObject({
        urgency: 'URGENT',
        daysUntilService: 3
      })
    })
  })

  describe('Service Due Today (URGENT)', () => {
    it('should send reminder for service due today', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(0)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(sale.customerEmail!)

      expect(email.html).toContain('today') // Should show "Service due today"

      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: { machineId: machine!.id }
      })

      expect(actionLog?.metadata).toMatchObject({
        urgency: 'URGENT',
        daysUntilService: 0
      })
    })
  })

  describe('Service Overdue by 3 Days (OVERDUE)', () => {
    it('should send OVERDUE reminder with warning box', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceOverdueBy(3)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(
        sale.customerEmail!,
        '⚠️ Overdue'
      )

      expect(email.subject).toContain('⚠️ Overdue: Service Required')
      expect(email.html).toContain('#dc2626') // Red color for OVERDUE
      expect(email.html).toContain('overdue')
      expect(email.html).toContain('⚠️ Important') // Warning box
      expect(email.html).toContain('warranty coverage') // Warning message

      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: { machineId: machine!.id }
      })

      expect(actionLog?.metadata).toMatchObject({
        urgency: 'OVERDUE',
        daysUntilService: -3
      })
    })
  })

  describe('Email Content Validation', () => {
    it('should include all required information in email', async () => {
      // Arrange
      const { machine, sale, model } = await factory.createMachineWithServiceDueIn(15)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(sale.customerEmail!)

      // Customer name
      expect(email.html).toContain(sale.customerName)

      // Machine details
      expect(email.html).toContain(model.name)
      expect(email.html).toContain(machine!.serialNumber)

      // Health score (should be present in some form)
      expect(email.html).toMatch(/\d+\/100/)

      // Schedule service link
      expect(email.html).toContain('Schedule Service')
      expect(email.html).toContain(machine!.serialNumber) // Link should include serial number

      // Contact information
      expect(email.html).toContain('customer.support@jket.in')
      expect(email.html).toContain('1800 202 0051')
    })

    it('should calculate and display health score correctly', async () => {
      // Arrange - Create machine with completed services
      const { machine, sale } = await factory.createMachineWithCompletedServices(2)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(sale.customerEmail!)

      // Health score should be displayed
      expect(email.html).toMatch(/\d+\/100/)

      // Verify metadata has health score
      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: { machineId: machine!.id }
      })

      expect(actionLog?.metadata.healthScore).toBeGreaterThan(0)
      expect(actionLog?.metadata.healthScore).toBeLessThanOrEqual(100)
    })

    it('should calculate and display total savings', async () => {
      // Arrange - Create machine with 2 completed services
      const { machine, sale } = await factory.createMachineWithCompletedServices(2)

      // Act
      await ReminderService.processReminders()

      // Assert
      const email = emailCapture.assertEmailSent(sale.customerEmail!)

      // Total savings = 2 * (200000 - 15000) = ₹3,70,000
      expect(email.html).toContain('₹3,70,000')
    })
  })

  describe('Non-Trigger Days', () => {
    it('should NOT send reminders on non-trigger days', async () => {
      // Arrange - Create machines due in various non-trigger days
      await factory.createMachineWithServiceDueIn(10) // Not a trigger day
      await factory.createMachineWithServiceDueIn(5)  // Not a trigger day
      await factory.createMachineWithServiceDueIn(1)  // Not a trigger day

      // Act
      await ReminderService.processReminders()

      // Assert - No emails sent
      emailCapture.assertNoEmailSent()
    })

    it('should ONLY send reminders on trigger days (15, 7, 3, 0, -3)', async () => {
      // Arrange - Mix of trigger and non-trigger days
      await factory.createMachineWithServiceDueIn(10) // Not trigger
      await factory.createMachineWithServiceDueIn(15) // Trigger
      await factory.createMachineWithServiceDueIn(5)  // Not trigger
      await factory.createMachineWithServiceDueIn(7)  // Trigger

      // Act
      await ReminderService.processReminders()

      // Assert - Only 2 emails sent (for day 15 and 7)
      expect(emailCapture.getEmailCount()).toBe(2)
    })
  })

  describe('Action Logging', () => {
    it('should log all reminder metadata correctly', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act
      await ReminderService.processReminders()

      // Assert
      const actionLog = await testDb.getPrisma().actionLog.findFirst({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      expect(actionLog).toBeDefined()
      expect(actionLog!.channel).toBe('EMAIL')
      expect(actionLog!.metadata).toMatchObject({
        daysUntilService: expect.any(Number),
        healthScore: expect.any(Number),
        urgency: expect.any(String),
        sentTo: sale.customerEmail
      })

      // Verify timestamp
      expect(actionLog!.createdAt).toBeInstanceOf(Date)
      const timeDiff = Date.now() - actionLog!.createdAt.getTime()
      expect(timeDiff).toBeLessThan(5000) // Created within last 5 seconds
    })
  })
})
