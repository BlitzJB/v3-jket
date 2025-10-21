import { TestDatabase } from '../setup/database'
import { EmailCapture } from '../setup/email-capture'
import { MachineFactory } from '../factories/machine-factory'
import { ReminderService } from '@/lib/services/reminder.service'

// Mock email before importing
const emailCapture = new EmailCapture()
const mockTransport = emailCapture.setup()

jest.mock('@/lib/email/config', () => ({
  transporter: mockTransport,
  emailConfig: {
    from: 'test@jket.in'
  }
}))

describe('E2E: Reminder Filtering and Skip Logic', () => {
  let testDb: TestDatabase
  let factory: MachineFactory

  beforeAll(async () => {
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

  describe('Skip Machines Without Email', () => {
    it('should not send reminder if customer email is empty', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithoutEmail()

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(0)
      emailCapture.assertNoEmailSent()

      // Verify no action log was created
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })
      expect(actionLogs).toHaveLength(0)
    })

    it('should not send reminder if customer email is null', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Update to null email
      await testDb.getPrisma().sale.update({
        where: { id: sale.id },
        data: { customerEmail: null as any }
      })

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(0)
      emailCapture.assertNoEmailSent()
    })
  })

  describe('Respect Reminder Opt-Out', () => {
    it('should not send reminder if reminderOptOut is true', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithOptOut()

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(0)
      emailCapture.assertNoEmailSent()

      // Verify no action log
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })
      expect(actionLogs).toHaveLength(0)
    })

    it('should send reminder if reminderOptOut is false', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Explicitly set to false
      await testDb.getPrisma().sale.update({
        where: { id: sale.id },
        data: { reminderOptOut: false }
      })

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(1)
      emailCapture.assertEmailSent(sale.customerEmail!)
    })
  })

  describe('Skip Machines with Expired Warranty', () => {
    it('should not send reminder if warranty has expired', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithExpiredWarranty()

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(0)
      emailCapture.assertNoEmailSent()

      // Verify no action log
      const actionLogs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })
      expect(actionLogs).toHaveLength(0)
    })

    it('should send reminder if warranty is still active', async () => {
      // Arrange - 6 months old sale, 12 month warranty = still active
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(1)
      emailCapture.assertEmailSent(sale.customerEmail!)
    })
  })

  describe('Combined Filtering Scenarios', () => {
    it('should handle mixed eligible and ineligible machines', async () => {
      // Arrange - Create various machines
      const { sale: sale1 } = await factory.createMachineWithServiceDueIn(15) // Eligible
      await factory.createMachineWithoutEmail() // Skip - no email
      const { sale: sale3 } = await factory.createMachineWithServiceDueIn(7)  // Eligible
      await factory.createMachineWithOptOut()  // Skip - opted out
      await factory.createMachineWithExpiredWarranty() // Skip - expired

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert - Only 2 eligible machines
      expect(sentCount).toBe(2)
      expect(emailCapture.getEmailCount()).toBe(2)

      // Verify correct emails were sent
      emailCapture.assertEmailSent(sale1.customerEmail!)
      emailCapture.assertEmailSent(sale3.customerEmail!)
    })
  })

  describe('No Sale Record', () => {
    it('should skip machines without sale record', async () => {
      // Arrange - Create machine without sale
      const category = await factory.createCategory()
      const model = await factory.createModel(category.id)
      const machine = await factory.createMachine(model.id)

      // Act
      const sentCount = await ReminderService.processReminders()

      // Assert
      expect(sentCount).toBe(0)
      emailCapture.assertNoEmailSent()
    })
  })
})
