import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cron/daily-reminders/route'
import { ReminderService } from '@/lib/services/reminder.service'

// Mock ReminderService
jest.mock('@/lib/services/reminder.service', () => ({
  ReminderService: {
    processReminders: jest.fn(),
  }
}))

const mockProcessReminders = ReminderService.processReminders as jest.MockedFunction<typeof ReminderService.processReminders>

describe('/api/cron/daily-reminders', () => {
  let originalCronSecret: string | undefined

  beforeAll(() => {
    originalCronSecret = process.env.CRON_SECRET
  })

  afterAll(() => {
    if (originalCronSecret) {
      process.env.CRON_SECRET = originalCronSecret
    } else {
      delete process.env.CRON_SECRET
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret-123'
  })

  describe('GET', () => {
    it('should return 401 when authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockProcessReminders).not.toHaveBeenCalled()
    })

    it('should return 401 when authorization token is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        headers: {
          authorization: 'Bearer wrong-secret'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockProcessReminders).not.toHaveBeenCalled()
    })

    it('should process reminders when authorization is valid', async () => {
      mockProcessReminders.mockResolvedValue(5)

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        headers: {
          authorization: 'Bearer test-secret-123'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.remindersSent).toBe(5)
      expect(data.timestamp).toBeDefined()
      expect(mockProcessReminders).toHaveBeenCalledTimes(1)
    })

    it('should return success with zero reminders sent', async () => {
      mockProcessReminders.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        headers: {
          authorization: 'Bearer test-secret-123'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.remindersSent).toBe(0)
    })

    it('should return 500 when reminder processing fails', async () => {
      mockProcessReminders.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        headers: {
          authorization: 'Bearer test-secret-123'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process reminders')
    })

    it('should allow access when CRON_SECRET is not set', async () => {
      delete process.env.CRON_SECRET
      mockProcessReminders.mockResolvedValue(3)

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.remindersSent).toBe(3)
    })
  })

  describe('POST', () => {
    it('should behave identically to GET', async () => {
      mockProcessReminders.mockResolvedValue(7)

      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-secret-123'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.remindersSent).toBe(7)
      expect(mockProcessReminders).toHaveBeenCalledTimes(1)
    })

    it('should return 401 when authorization is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/daily-reminders', {
        method: 'POST',
        headers: {
          authorization: 'Bearer wrong-secret'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
