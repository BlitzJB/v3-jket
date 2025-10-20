import { createMockMachine, createMachineServiceDueIn, createMachineServiceOverdueBy, createMachineWithExpiredWarranty, createMachineWithOptOut, createMachineWithoutEmail } from '@/test/fixtures/machines'
import { subDays, addDays } from 'date-fns'

// Create mock functions
const mockMachineFindMany = jest.fn()
const mockMachineFindUnique = jest.fn()
const mockActionLogFindFirst = jest.fn()
const mockActionLogCreate = jest.fn()
const mockSendMail = jest.fn()
const mockGenerateHTML = jest.fn()

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    machine: {
      get findMany() { return mockMachineFindMany },
      get findUnique() { return mockMachineFindUnique },
    },
    actionLog: {
      get findFirst() { return mockActionLogFindFirst },
      get create() { return mockActionLogCreate },
    },
  }
}))

jest.mock('@/lib/email/config', () => ({
  get transporter() {
    return {
      get sendMail() { return mockSendMail }
    }
  },
  emailConfig: {
    from: 'test@jket.in'
  }
}))

jest.mock('@/lib/email-templates/service-reminder', () => ({
  get generateServiceReminderHTML() { return mockGenerateHTML }
}))

// Import after mocks
import { ReminderService } from '@/lib/services/reminder.service'

describe('ReminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
    mockGenerateHTML.mockReturnValue('<html>Test Email</html>')
  })

  describe('processReminders()', () => {
    it('should process eligible machines and send reminders', async () => {
      const machine = createMachineServiceDueIn(15)

      mockMachineFindMany.mockResolvedValue([machine] as any)
      mockActionLogFindFirst.mockResolvedValue(null)
      mockActionLogCreate.mockResolvedValue({} as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
      expect(mockActionLogCreate).toHaveBeenCalledTimes(1)
    })

    it('should skip machines without email', async () => {
      const machineNoEmail = createMachineWithoutEmail()

      mockMachineFindMany.mockResolvedValue([machineNoEmail] as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(0)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should skip machines that have opted out', async () => {
      const machineOptedOut = createMachineWithOptOut()

      mockMachineFindMany.mockResolvedValue([machineOptedOut] as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(0)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should skip machines with expired warranty', async () => {
      const machineExpired = createMachineWithExpiredWarranty()

      mockMachineFindMany.mockResolvedValue([machineExpired] as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(0)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should not send duplicate reminders on same day', async () => {
      const machine = createMachineServiceDueIn(15)
      const today = new Date()

      mockMachineFindMany.mockResolvedValue([machine] as any)
      mockActionLogFindFirst.mockResolvedValue({
        id: 'log-1',
        machineId: machine.id,
        actionType: 'REMINDER_SENT',
        createdAt: today,
        channel: 'EMAIL',
        metadata: {}
      } as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(0)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should process multiple eligible machines', async () => {
      const machine1 = createMachineServiceDueIn(15)
      const machine2 = createMachineServiceDueIn(7)
      const machine3 = createMachineServiceDueIn(3)

      machine1.id = 'machine-1'
      machine2.id = 'machine-2'
      machine3.id = 'machine-3'

      mockMachineFindMany.mockResolvedValue([machine1, machine2, machine3] as any)
      mockActionLogFindFirst.mockResolvedValue(null)
      mockActionLogCreate.mockResolvedValue({} as any)

      const count = await ReminderService.processReminders()

      expect(count).toBe(3)
      expect(mockSendMail).toHaveBeenCalledTimes(3)
      expect(mockActionLogCreate).toHaveBeenCalledTimes(3)
    })

    it('should handle errors gracefully and continue processing', async () => {
      const machine1 = createMachineServiceDueIn(15)
      const machine2 = createMachineServiceDueIn(7)

      machine1.id = 'machine-1'
      machine2.id = 'machine-2'

      mockMachineFindMany.mockResolvedValue([machine1, machine2] as any)
      mockActionLogFindFirst.mockResolvedValue(null)
      mockActionLogCreate.mockResolvedValue({} as any)

      // First email fails, second succeeds
      mockSendMail
        .mockRejectedValueOnce(new Error('Email failed'))
        .mockResolvedValueOnce({ messageId: 'test-id' })

      const count = await ReminderService.processReminders()

      expect(count).toBe(1) // Only one succeeded
      expect(mockSendMail).toHaveBeenCalledTimes(2)
    })
  })

  describe('sendReminder()', () => {
    it('should send email with correct content', async () => {
      const machine = createMachineServiceDueIn(15)

      mockActionLogCreate.mockResolvedValue({} as any)

      const result = await ReminderService.sendReminder(machine)

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@jket.in',
          to: machine.sale.customerEmail,
          subject: expect.stringContaining('Service Reminder'),
          html: '<html>Test Email</html>'
        })
      )
    })

    it('should use appropriate urgency level in subject', async () => {
      const overdueeMachine = createMachineServiceOverdueBy(5)
      const urgentMachine = createMachineServiceDueIn(2)
      const soonMachine = createMachineServiceDueIn(5)
      const upcomingMachine = createMachineServiceDueIn(10)

      mockActionLogCreate.mockResolvedValue({} as any)

      await ReminderService.sendReminder(overdueeMachine)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('⚠️ Overdue')
        })
      )

      await ReminderService.sendReminder(urgentMachine)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🔴 Urgent')
        })
      )

      await ReminderService.sendReminder(soonMachine)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🟡 Reminder')
        })
      )

      await ReminderService.sendReminder(upcomingMachine)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Service Reminder')
        })
      )
    })

    it('should log reminder action with metadata', async () => {
      const machine = createMachineServiceDueIn(15)

      mockActionLogCreate.mockResolvedValue({} as any)

      await ReminderService.sendReminder(machine)

      expect(mockActionLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          machineId: machine.id,
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: expect.objectContaining({
            daysUntilService: expect.any(Number),
            healthScore: expect.any(Number),
            urgency: expect.any(String),
            sentTo: machine.sale.customerEmail
          })
        })
      })
    })

    it('should return false if no service due date', async () => {
      const machine = createMockMachine({ sale: null })

      const result = await ReminderService.sendReminder(machine)

      expect(result).toBe(false)
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('sendTestReminder()', () => {
    it('should send test email to specified address', async () => {
      const machine = createMachineServiceDueIn(15)
      const testEmail = 'developer@test.com'

      mockMachineFindUnique.mockResolvedValue(machine as any)

      const result = await ReminderService.sendTestReminder(machine.id, testEmail)

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('[TEST]')
        })
      )
    })

    it('should return false if machine not found', async () => {
      mockMachineFindUnique.mockResolvedValue(null)

      const result = await ReminderService.sendTestReminder('non-existent', 'test@test.com')

      expect(result).toBe(false)
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle email send failure gracefully', async () => {
      const machine = createMachineServiceDueIn(15)

      mockSendMail.mockRejectedValue(new Error('SMTP error'))

      const result = await ReminderService.sendReminder(machine)

      expect(result).toBe(false)
    })

    it('should handle database errors in processReminders', async () => {
      mockMachineFindMany.mockRejectedValue(new Error('DB connection failed'))

      const count = await ReminderService.processReminders()

      expect(count).toBe(0) // Returns 0 on error
    })
  })
})
