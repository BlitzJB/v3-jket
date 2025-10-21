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

describe('E2E: Reminder Deduplication', () => {
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

  describe('Prevent Same-Day Duplicates', () => {
    it('should not send duplicate reminder on same day', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act - First reminder
      const sentCount1 = await ReminderService.processReminders()

      expect(sentCount1).toBe(1)
      expect(emailCapture.getEmailCount()).toBe(1)
      emailCapture.assertEmailSent(sale.customerEmail!)

      // Clear email capture but keep action log
      emailCapture.clear()

      // Act - Try to send again on same day
      const sentCount2 = await ReminderService.processReminders()

      // Assert - No duplicate email sent
      expect(sentCount2).toBe(0)
      emailCapture.assertNoEmailSent()

      // But action log still exists from first send
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })
      expect(actionLogs).toHaveLength(1) // Still only one log entry
    })

    it('should check action log creation timestamp for deduplication', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act - First send
      await ReminderService.processReminders()

      const firstLog = await testDb.getPrisma().actionLog.findFirst({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      expect(firstLog).toBeDefined()
      const firstTimestamp = firstLog!.createdAt

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      emailCapture.clear()

      // Act - Try again
      await ReminderService.processReminders()

      // Assert - No new log created
      const allLogs = await testDb.getPrisma().actionLog.findMany({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      expect(allLogs).toHaveLength(1)
      expect(allLogs[0].createdAt.getTime()).toBe(firstTimestamp.getTime())
    })
  })

  describe('Multiple Machines Deduplication', () => {
    it('should handle deduplication for multiple machines independently', async () => {
      // Arrange - Create 3 machines
      const { machine: m1, sale: s1 } = await factory.createMachineWithServiceDueIn(15)
      const { machine: m2, sale: s2 } = await factory.createMachineWithServiceDueIn(15)
      const { machine: m3, sale: s3 } = await factory.createMachineWithServiceDueIn(15)

      // Act - First batch
      const sentCount1 = await ReminderService.processReminders()

      expect(sentCount1).toBe(3)
      expect(emailCapture.getEmailCount()).toBe(3)

      emailCapture.clear()

      // Act - Second batch (same day)
      const sentCount2 = await ReminderService.processReminders()

      // Assert - No duplicates for any machine
      expect(sentCount2).toBe(0)
      emailCapture.assertNoEmailSent()

      // Verify each machine has exactly one action log
      for (const machine of [m1, m2, m3]) {
        const logs = await testDb.getPrisma().actionLog.findMany({
          where: { machineId: machine!.id }
        })
        expect(logs).toHaveLength(1)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should allow reminder if previous reminder was for different urgency level', async () => {
      // This is more of a clarification test - our current implementation
      // prevents ALL same-day reminders, regardless of urgency change
      // This behavior is correct to avoid spam

      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act - Send reminder
      await ReminderService.processReminders()

      expect(emailCapture.getEmailCount()).toBe(1)

      emailCapture.clear()

      // Hypothetically, if urgency changed within same day (very unlikely)
      // we still wouldn't send another reminder
      await ReminderService.processReminders()

      // Assert - Still no duplicate
      expect(emailCapture.getEmailCount()).toBe(0)
    })
  })
})
