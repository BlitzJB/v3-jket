import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/actions/log/route'

// Mock Prisma
const mockActionLogCreate = jest.fn()
const mockActionLogFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    actionLog: {
      get create() { return mockActionLogCreate },
      get findMany() { return mockActionLogFindMany },
    },
  }
}))

describe('/api/actions/log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    const validPayload = {
      machineId: 'machine-123',
      actionType: 'REMINDER_SENT',
      channel: 'EMAIL',
      metadata: { sentTo: 'test@example.com' }
    }

    it('should create action log with valid data', async () => {
      const mockCreatedLog = {
        id: 'log-123',
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: { sentTo: 'test@example.com' },
        createdAt: new Date()
      }

      mockActionLogCreate.mockResolvedValue(mockCreatedLog)

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.actionLog.id).toBe('log-123')
      expect(data.actionLog.machineId).toBe('machine-123')
      expect(mockActionLogCreate).toHaveBeenCalledWith({
        data: validPayload
      })
    })

    it('should return 400 when machineId is missing', async () => {
      const payload = {
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      }

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
      expect(mockActionLogCreate).not.toHaveBeenCalled()
    })

    it('should return 400 when actionType is missing', async () => {
      const payload = {
        machineId: 'machine-123',
        channel: 'EMAIL'
      }

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when channel is missing', async () => {
      const payload = {
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT'
      }

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    it('should return 400 when actionType is invalid', async () => {
      const payload = {
        machineId: 'machine-123',
        actionType: 'INVALID_TYPE',
        channel: 'EMAIL'
      }

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid actionType')
    })

    it('should return 400 when channel is invalid', async () => {
      const payload = {
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'INVALID_CHANNEL'
      }

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid channel')
    })

    it('should accept all valid action types', async () => {
      const validTypes = ['REMINDER_SENT', 'SERVICE_SCHEDULED', 'WARRANTY_VIEWED', 'EMAIL_OPENED', 'LINK_CLICKED']

      for (const actionType of validTypes) {
        jest.clearAllMocks()

        mockActionLogCreate.mockResolvedValue({
          id: 'log-123',
          machineId: 'machine-123',
          actionType,
          channel: 'EMAIL',
          metadata: {},
          createdAt: new Date()
        })

        const payload = {
          machineId: 'machine-123',
          actionType,
          channel: 'EMAIL'
        }

        const request = new NextRequest('http://localhost:3000/api/actions/log', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('should accept all valid channels', async () => {
      const validChannels = ['EMAIL', 'WHATSAPP', 'WEB', 'SMS', 'SYSTEM']

      for (const channel of validChannels) {
        jest.clearAllMocks()

        mockActionLogCreate.mockResolvedValue({
          id: 'log-123',
          machineId: 'machine-123',
          actionType: 'REMINDER_SENT',
          channel,
          metadata: {},
          createdAt: new Date()
        })

        const payload = {
          machineId: 'machine-123',
          actionType: 'REMINDER_SENT',
          channel
        }

        const request = new NextRequest('http://localhost:3000/api/actions/log', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('should handle metadata as optional', async () => {
      const payloadWithoutMetadata = {
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      }

      mockActionLogCreate.mockResolvedValue({
        id: 'log-123',
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: {},
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(payloadWithoutMetadata)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockActionLogCreate).toHaveBeenCalledWith({
        data: {
          ...payloadWithoutMetadata,
          metadata: {}
        }
      })
    })

    it('should return 500 when database operation fails', async () => {
      mockActionLogCreate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/actions/log', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create action log')
    })
  })

  describe('GET', () => {
    const mockLogs = [
      {
        id: 'log-1',
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: {},
        createdAt: new Date()
      },
      {
        id: 'log-2',
        machineId: 'machine-123',
        actionType: 'EMAIL_OPENED',
        channel: 'EMAIL',
        metadata: {},
        createdAt: new Date()
      }
    ]

    it('should fetch all action logs without filters', async () => {
      mockActionLogFindMany.mockResolvedValue(mockLogs)

      const request = new NextRequest('http://localhost:3000/api/actions/log')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.actionLogs).toHaveLength(2)
      expect(data.actionLogs[0].id).toBe('log-1')
      expect(data.actionLogs[1].id).toBe('log-2')
      expect(data.count).toBe(2)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })

    it('should filter by machineId', async () => {
      mockActionLogFindMany.mockResolvedValue([mockLogs[0]])

      const request = new NextRequest('http://localhost:3000/api/actions/log?machineId=machine-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: { machineId: 'machine-123' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })

    it('should filter by actionType', async () => {
      mockActionLogFindMany.mockResolvedValue([mockLogs[0]])

      const request = new NextRequest('http://localhost:3000/api/actions/log?actionType=REMINDER_SENT')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: { actionType: 'REMINDER_SENT' },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })

    it('should filter by both machineId and actionType', async () => {
      mockActionLogFindMany.mockResolvedValue([mockLogs[0]])

      const request = new NextRequest('http://localhost:3000/api/actions/log?machineId=machine-123&actionType=REMINDER_SENT')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: {
          machineId: 'machine-123',
          actionType: 'REMINDER_SENT'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    })

    it('should respect limit parameter', async () => {
      mockActionLogFindMany.mockResolvedValue(mockLogs)

      const request = new NextRequest('http://localhost:3000/api/actions/log?limit=10')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    })

    it('should cap limit at 100', async () => {
      mockActionLogFindMany.mockResolvedValue(mockLogs)

      const request = new NextRequest('http://localhost:3000/api/actions/log?limit=200')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockActionLogFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    })

    it('should return empty array when no logs found', async () => {
      mockActionLogFindMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/actions/log')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actionLogs).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should return 500 when database operation fails', async () => {
      mockActionLogFindMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/actions/log')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch action logs')
    })
  })
})
