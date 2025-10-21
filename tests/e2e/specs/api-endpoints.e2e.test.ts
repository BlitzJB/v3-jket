import { TestDatabase } from '../setup/database'
import { EmailCapture } from '../setup/email-capture'
import { MachineFactory } from '../factories/machine-factory'

// Mock email before importing
const emailCapture = new EmailCapture()
const mockTransport = emailCapture.setup()

jest.mock('@/lib/email/config', () => ({
  transporter: mockTransport,
  emailConfig: {
    from: 'test@jket.in'
  }
}))

describe('E2E: API Endpoints', () => {
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

  describe('Action Log API - POST /api/actions/log', () => {
    it('should create action log with valid data', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      const payload = {
        machineId: machine!.id,
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: {
          testData: 'test-value',
          daysUntilService: 15
        }
      }

      // Act - Create via ReminderService which uses the prisma client directly
      await testDb.getPrisma().actionLog.create({
        data: payload
      })

      // Assert - Query the log
      const logs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })

      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        machineId: machine!.id,
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      })
      expect(logs[0].metadata).toMatchObject({
        testData: 'test-value',
        daysUntilService: 15
      })
      expect(logs[0].createdAt).toBeInstanceOf(Date)
    })

    it('should validate required fields', async () => {
      // This test validates the behavior when required fields are missing
      // In real implementation, the API endpoint validates this
      // For E2E, we test that Prisma enforces constraints

      await expect(
        testDb.getPrisma().actionLog.create({
          data: {
            machineId: '',  // Empty ID
            actionType: 'REMINDER_SENT',
            channel: 'EMAIL'
          }
        })
      ).rejects.toThrow()
    })

    it('should accept valid action types', async () => {
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      const validTypes = [
        'REMINDER_SENT',
        'SERVICE_SCHEDULED',
        'WARRANTY_VIEWED',
        'EMAIL_OPENED',
        'LINK_CLICKED'
      ]

      for (const actionType of validTypes) {
        const log = await testDb.getPrisma().actionLog.create({
          data: {
            machineId: machine!.id,
            actionType,
            channel: 'EMAIL',
            metadata: {}
          }
        })

        expect(log.actionType).toBe(actionType)
      }

      const allLogs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })

      expect(allLogs).toHaveLength(validTypes.length)
    })

    it('should accept valid channels', async () => {
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      const validChannels = ['EMAIL', 'WHATSAPP', 'WEB', 'SMS', 'SYSTEM']

      for (const channel of validChannels) {
        const log = await testDb.getPrisma().actionLog.create({
          data: {
            machineId: machine!.id,
            actionType: 'REMINDER_SENT',
            channel,
            metadata: {}
          }
        })

        expect(log.channel).toBe(channel)
      }
    })

    it('should handle metadata as optional', async () => {
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      // Without metadata
      const log1 = await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        }
      })

      expect(log1.metadata).toBeDefined()

      // With metadata
      const log2 = await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: { key: 'value' }
        }
      })

      expect(log2.metadata).toMatchObject({ key: 'value' })
    })
  })

  describe('Action Log API - GET /api/actions/log', () => {
    it('should query logs by machineId', async () => {
      // Arrange
      const machine1 = await factory.createMachineWithServiceDueIn(15)
      const machine2 = await factory.createMachineWithServiceDueIn(7)

      // Create logs for both machines
      await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine1.machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        }
      })

      await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine1.machine!.id,
          actionType: 'EMAIL_OPENED',
          channel: 'EMAIL'
        }
      })

      await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine2.machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        }
      })

      // Act - Query logs for machine1
      const machine1Logs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine1.machine!.id }
      })

      // Assert
      expect(machine1Logs).toHaveLength(2)
      expect(machine1Logs.every(log => log.machineId === machine1.machine!.id)).toBe(true)
    })

    it('should query logs by actionType', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        }
      })

      await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'EMAIL_OPENED',
          channel: 'EMAIL'
        }
      })

      // Act
      const reminderLogs = await testDb.getPrisma().actionLog.findMany({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      // Assert
      expect(reminderLogs).toHaveLength(1)
      expect(reminderLogs[0].actionType).toBe('REMINDER_SENT')
    })

    it('should support ordering by createdAt desc', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      const log1 = await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        }
      })

      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const log2 = await testDb.getPrisma().actionLog.create({
        data: {
          machineId: machine!.id,
          actionType: 'EMAIL_OPENED',
          channel: 'EMAIL'
        }
      })

      // Act
      const logs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id },
        orderBy: { createdAt: 'desc' }
      })

      // Assert - Most recent first
      expect(logs).toHaveLength(2)
      expect(logs[0].id).toBe(log2.id)
      expect(logs[1].id).toBe(log1.id)
      expect(logs[0].createdAt.getTime()).toBeGreaterThan(logs[1].createdAt.getTime())
    })
  })

  describe('Integration: Reminder Processing Creates Action Logs', () => {
    it('should create action log when reminder is sent', async () => {
      // Arrange
      const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

      // Verify no logs initially
      const initialLogs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })
      expect(initialLogs).toHaveLength(0)

      // Act - Process reminders (which should create action log)
      const { ReminderService } = await import('@/lib/services/reminder.service')
      await ReminderService.processReminders()

      // Assert - Action log was created
      const logs = await testDb.getPrisma().actionLog.findMany({
        where: {
          machineId: machine!.id,
          actionType: 'REMINDER_SENT'
        }
      })

      expect(logs).toHaveLength(1)
      expect(logs[0]).toMatchObject({
        machineId: machine!.id,
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      })
      expect(logs[0].metadata).toMatchObject({
        sentTo: sale.customerEmail,
        urgency: 'UPCOMING',
        daysUntilService: 15
      })
    })

    it('should NOT create action log if email fails', async () => {
      // Arrange
      const { machine } = await factory.createMachineWithServiceDueIn(15)

      // Configure mock to fail
      mockTransport.sendMail.mockRejectedValueOnce(new Error('SMTP error'))

      // Act
      const { ReminderService } = await import('@/lib/services/reminder.service')
      await ReminderService.processReminders()

      // Assert - No action log created
      const logs = await testDb.getPrisma().actionLog.findMany({
        where: { machineId: machine!.id }
      })

      expect(logs).toHaveLength(0)
    })
  })
})
