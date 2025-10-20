# Comprehensive Testing Plan
## Warranty Reminder Notification System

**Version**: 1.0
**Date**: October 20, 2025
**Status**: Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Philosophy & Strategy](#testing-philosophy--strategy)
3. [Test Pyramid Architecture](#test-pyramid-architecture)
4. [Component Testing Specifications](#component-testing-specifications)
5. [Integration Testing Strategy](#integration-testing-strategy)
6. [End-to-End Testing Plan](#end-to-end-testing-plan)
7. [Mock Strategies & Test Doubles](#mock-strategies--test-doubles)
8. [Test Data Management](#test-data-management)
9. [CI/CD Pipeline Integration](#cicd-pipeline-integration)
10. [Coverage Requirements & Metrics](#coverage-requirements--metrics)
11. [Testing Best Practices](#testing-best-practices)
12. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This document outlines a comprehensive testing strategy for the Warranty Reminder Notification System, covering all three implementation steps:

- **Step 1**: Database Schema & Migrations
- **Step 2**: Business Logic (WarrantyHelper)
- **Step 3**: Email Reminder System

**Current Testing Status**:
- ✅ **Step 2 (WarrantyHelper)**: 100% unit tested (36/36 tests passing)
- ⚠️ **Step 1 (Database)**: Manual scripts only
- ⚠️ **Step 3 (Email System)**: Manual scripts only

**Goal**: Achieve 80%+ code coverage with automated tests across all layers while maintaining fast test execution (<5 seconds for unit tests).

---

## Testing Philosophy & Strategy

### Core Principles

1. **Test Pyramid First**
   - Many fast unit tests (80%)
   - Fewer integration tests (15%)
   - Minimal E2E tests (5%)

2. **Test Behavior, Not Implementation**
   - Focus on public APIs and contracts
   - Avoid testing internal implementation details
   - Test outcomes, not steps

3. **Fast Feedback Loop**
   - Unit tests run in <5 seconds
   - Integration tests in <30 seconds
   - E2E tests in <2 minutes

4. **Maintainable Tests**
   - DRY (Don't Repeat Yourself) test code
   - Clear test names that describe behavior
   - Arrange-Act-Assert pattern
   - Shared test utilities and fixtures

5. **Continuous Improvement**
   - Monitor flaky tests
   - Refactor slow tests
   - Update tests when requirements change

### Testing Framework Stack

```typescript
// Framework choices
{
  "unitTests": "Jest + @testing-library",
  "integrationTests": "Jest + Supertest + MSW",
  "e2eTests": "Playwright or Cypress",
  "mocking": "Jest mocks + MSW (Mock Service Worker)",
  "database": "Separate test database + test containers",
  "coverage": "Jest coverage + Codecov",
  "ci": "GitHub Actions"
}
```

---

## Test Pyramid Architecture

```
        /\
       /  \       E2E Tests (5%)
      /    \      - Critical user journeys
     /------\     - Full system integration
    /        \
   /  Integration\ (15%)
  /    Tests      \
 /-----------------\
/                   \
/   Unit Tests (80%)  \
------------------------
```

### Layer Breakdown

#### 1. Unit Tests (80% - ~150 tests)
**Characteristics**:
- Isolated component testing
- Fast execution (<100ms per test)
- No external dependencies
- Mock all I/O operations

**Components to Test**:
- WarrantyHelper (✅ 36 tests done)
- Email template generation (15 tests)
- Date calculations (12 tests)
- Urgency logic (8 tests)
- Health score algorithm (10 tests)

#### 2. Integration Tests (15% - ~30 tests)
**Characteristics**:
- Test component interactions
- Real database (test instance)
- Mocked external services (email)
- Moderate execution time (<1s per test)

**Integration Points**:
- ReminderService + Prisma
- API routes + Database
- Email service + Templates
- Cron jobs + Business logic

#### 3. E2E Tests (5% - ~10 tests)
**Characteristics**:
- Full user journey
- Real database
- Real app server
- Slow execution (5-10s per test)

**Critical Paths**:
- Complete reminder workflow
- API endpoint flows
- Error handling paths

---

## Component Testing Specifications

### 1. Database Layer Tests

#### 1.1 Schema Tests

**File**: `lib/__tests__/database/schema.test.ts`

```typescript
describe('Database Schema - Sale Model', () => {
  test('should have reminderOptOut field with default false', async () => {
    const sale = await prisma.sale.create({
      data: { /* minimal data */ }
    })
    expect(sale.reminderOptOut).toBe(false)
  })

  test('should have whatsappNumber field with default empty string', async () => {
    const sale = await prisma.sale.create({
      data: { /* minimal data */ }
    })
    expect(sale.whatsappNumber).toBe('')
  })
})

describe('Database Schema - ActionLog Model', () => {
  test('should create ActionLog with required fields', async () => {
    const log = await prisma.actionLog.create({
      data: {
        machineId: 'test-id',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: { test: true }
      }
    })
    expect(log.id).toBeDefined()
    expect(log.createdAt).toBeInstanceOf(Date)
  })

  test('should support JSON metadata', async () => {
    const metadata = { daysUntil: 7, urgency: 'SOON' }
    const log = await prisma.actionLog.create({
      data: {
        machineId: 'test-id',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata
      }
    })
    expect(log.metadata).toEqual(metadata)
  })

  test('should query with composite index efficiently', async () => {
    const start = Date.now()
    const logs = await prisma.actionLog.findMany({
      where: {
        machineId: 'test-id',
        actionType: 'REMINDER_SENT'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    const duration = Date.now() - start
    expect(duration).toBeLessThan(100) // Should be fast with index
  })
})
```

**Tests Needed**: 12 tests
- Sale model field defaults (2)
- ActionLog CRUD operations (4)
- Index performance (2)
- Foreign key relationships (2)
- Migration rollback safety (2)

---

#### 1.2 Migration Tests

**File**: `lib/__tests__/database/migrations.test.ts`

```typescript
describe('Database Migrations', () => {
  test('should apply warranty reminder migration successfully', async () => {
    // Run migration
    await runMigration('20250911044224_add_warranty_reminder_fields')

    // Verify schema changes
    const tableInfo = await getTableInfo('Sale')
    expect(tableInfo.columns).toContainEqual(
      expect.objectContaining({ name: 'reminderOptOut', type: 'BOOLEAN' })
    )
  })

  test('should rollback migration cleanly', async () => {
    await runMigration('20250911044224_add_warranty_reminder_fields')
    await rollbackMigration('20250911044224_add_warranty_reminder_fields')

    const tableInfo = await getTableInfo('Sale')
    expect(tableInfo.columns).not.toContainEqual(
      expect.objectContaining({ name: 'reminderOptOut' })
    )
  })

  test('should preserve existing data during migration', async () => {
    // Create test data before migration
    const salesBefore = await prisma.sale.count()

    // Run migration
    await runMigration('20250911044224_add_warranty_reminder_fields')

    // Verify data preserved
    const salesAfter = await prisma.sale.count()
    expect(salesAfter).toBe(salesBefore)
  })
})
```

**Tests Needed**: 6 tests
- Migration apply (1)
- Migration rollback (1)
- Data preservation (1)
- Default value application (1)
- Idempotency (1)
- Performance on large datasets (1)

---

### 2. Business Logic Tests (WarrantyHelper)

**Status**: ✅ **COMPLETE** (36/36 tests passing)

**File**: `lib/__tests__/warranty-helper.test.ts`

**Coverage**: 100% of all methods

No additional tests needed - this layer is fully covered.

---

### 3. Service Layer Tests

#### 3.1 ReminderService Tests

**File**: `lib/__tests__/services/reminder.service.test.ts`

```typescript
import { ReminderService } from '@/lib/services/reminder.service'
import { prismaMock } from '../mocks/prisma'
import { emailMock } from '../mocks/email'

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
jest.mock('@/lib/email/config', () => ({ transporter: emailMock }))

describe('ReminderService - processReminders()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should process eligible machines and send reminders', async () => {
    // Arrange
    const mockMachines = [
      createMockMachine({
        id: '1',
        sale: { saleDate: subMonths(addDays(new Date(), 15), 3) }
      })
    ]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)
    prismaMock.actionLog.findFirst.mockResolvedValue(null)
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    // Act
    const sentCount = await ReminderService.processReminders()

    // Assert
    expect(sentCount).toBe(1)
    expect(emailMock.sendMail).toHaveBeenCalledTimes(1)
    expect(prismaMock.actionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionType: 'REMINDER_SENT'
        })
      })
    )
  })

  test('should skip machines without valid email', async () => {
    const mockMachines = [
      createMockMachine({ sale: { customerEmail: '' } })
    ]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(0)
    expect(emailMock.sendMail).not.toHaveBeenCalled()
  })

  test('should skip machines with reminderOptOut', async () => {
    const mockMachines = [
      createMockMachine({ sale: { reminderOptOut: true } })
    ]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(0)
  })

  test('should skip expired warranties', async () => {
    const mockMachines = [
      createMockMachine({
        sale: { saleDate: subMonths(new Date(), 15) },
        machineModel: { warrantyPeriodMonths: 12 }
      })
    ]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(0)
  })

  test('should not send duplicate reminders on same day', async () => {
    const mockMachines = [createMockMachine()]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)
    prismaMock.actionLog.findFirst.mockResolvedValue({
      id: '1',
      createdAt: new Date(), // Already sent today
      machineId: '1',
      actionType: 'REMINDER_SENT',
      channel: 'EMAIL',
      metadata: null
    })

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(0)
    expect(emailMock.sendMail).not.toHaveBeenCalled()
  })

  test('should handle email sending errors gracefully', async () => {
    const mockMachines = [createMockMachine()]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)
    prismaMock.actionLog.findFirst.mockResolvedValue(null)
    emailMock.sendMail.mockRejectedValue(new Error('SMTP Error'))

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(0)
    expect(prismaMock.actionLog.create).not.toHaveBeenCalled()
  })

  test('should process multiple machines in one run', async () => {
    const mockMachines = [
      createMockMachine({ id: '1' }),
      createMockMachine({ id: '2' }),
      createMockMachine({ id: '3' })
    ]
    prismaMock.machine.findMany.mockResolvedValue(mockMachines)
    prismaMock.actionLog.findFirst.mockResolvedValue(null)
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    const sentCount = await ReminderService.processReminders()

    expect(sentCount).toBe(3)
    expect(emailMock.sendMail).toHaveBeenCalledTimes(3)
  })
})

describe('ReminderService - sendReminder()', () => {
  test('should generate correct email content', async () => {
    const machine = createMockMachine()
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    await ReminderService.sendReminder(machine)

    expect(emailMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: machine.sale.customerEmail,
        subject: expect.stringContaining(machine.machineModel.name),
        html: expect.stringContaining(machine.serialNumber)
      })
    )
  })

  test('should use correct urgency in subject line', async () => {
    const machine = createMockMachine({
      sale: { saleDate: subMonths(new Date(), 3) } // Service due today
    })
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    await ReminderService.sendReminder(machine)

    expect(emailMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/⚠️|🔴/)
      })
    )
  })

  test('should log reminder after successful send', async () => {
    const machine = createMockMachine()
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    await ReminderService.sendReminder(machine)

    expect(prismaMock.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        machineId: machine.id,
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      })
    })
  })

  test('should include health score in metadata', async () => {
    const machine = createMockMachine()
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    await ReminderService.sendReminder(machine)

    expect(prismaMock.actionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metadata: expect.objectContaining({
          healthScore: expect.any(Number),
          urgency: expect.any(String)
        })
      })
    })
  })
})

describe('ReminderService - sendTestReminder()', () => {
  test('should send test email to specified address', async () => {
    const machine = createMockMachine()
    const testEmail = 'test@example.com'
    prismaMock.machine.findUnique.mockResolvedValue(machine)
    emailMock.sendMail.mockResolvedValue({ messageId: 'test' })

    await ReminderService.sendTestReminder(machine.id, testEmail)

    expect(emailMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: testEmail,
        subject: expect.stringContaining('[TEST]')
      })
    )
  })

  test('should return false if machine not found', async () => {
    prismaMock.machine.findUnique.mockResolvedValue(null)

    const result = await ReminderService.sendTestReminder('invalid-id', 'test@example.com')

    expect(result).toBe(false)
    expect(emailMock.sendMail).not.toHaveBeenCalled()
  })
})
```

**Tests Needed**: 15 tests
- processReminders() - 7 tests
- sendReminder() - 4 tests
- sendTestReminder() - 2 tests
- Error handling - 2 tests

---

#### 3.2 Email Template Tests

**File**: `lib/__tests__/email-templates/service-reminder.test.ts`

```typescript
import { generateServiceReminderHTML } from '@/lib/email-templates/service-reminder'

describe('Email Template - generateServiceReminderHTML()', () => {
  test('should generate valid HTML', () => {
    const html = generateServiceReminderHTML({
      customerName: 'John Doe',
      machineName: 'Test Machine',
      serialNumber: 'TEST-001',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 370000,
      scheduleUrl: 'http://example.com/schedule'
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('John Doe')
  })

  test('should use OVERDUE color for negative days', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: -5,
      healthScore: 50,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('#dc2626') // Red color
  })

  test('should use URGENT color for 1-3 days', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 2,
      healthScore: 70,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('#f59e0b') // Orange color
  })

  test('should include health score display', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('85/100')
  })

  test('should format savings with Indian locale', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 555000,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('5,55,000')
  })

  test('should include schedule button with correct URL', () => {
    const scheduleUrl = 'http://example.com/schedule/123'
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl
    })

    expect(html).toContain(`href="${scheduleUrl}"`)
    expect(html).toContain('Schedule Service Now')
  })

  test('should show warning message for OVERDUE', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: -10,
      healthScore: 30,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('⚠️ Important')
    expect(html).toContain('Delaying service')
  })

  test('should display "Service due in X days" correctly', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('Service due in 7 days')
  })

  test('should display "Service due today" for 0 days', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 0,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('Service due today')
  })

  test('should display "Service X days overdue" for negative days', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: -5,
      healthScore: 50,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('Service 5 days overdue')
  })

  test('should be mobile responsive', () => {
    const html = generateServiceReminderHTML({
      customerName: 'Test',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).toContain('max-width: 600px')
    expect(html).toContain('viewport')
  })

  test('should escape HTML in customer name', () => {
    const html = generateServiceReminderHTML({
      customerName: '<script>alert("xss")</script>',
      machineName: 'Test',
      serialNumber: 'TEST',
      daysUntilService: 7,
      healthScore: 85,
      totalSavings: 0,
      scheduleUrl: 'http://test.com'
    })

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
```

**Tests Needed**: 12 tests
- HTML generation (1)
- Urgency color coding (3)
- Health score display (1)
- Savings formatting (1)
- Schedule button (1)
- Warning messages (1)
- Service date display (3)
- Mobile responsive (1)
- XSS protection (1)

---

### 4. API Endpoint Tests

#### 4.1 Cron Endpoint Tests

**File**: `app/api/__tests__/cron/daily-reminders.test.ts`

```typescript
import { GET, POST } from '@/app/api/cron/daily-reminders/route'
import { ReminderService } from '@/lib/services/reminder.service'

jest.mock('@/lib/services/reminder.service')

describe('API - /api/cron/daily-reminders', () => {
  const mockRequest = (headers: Record<string, string> = {}) => ({
    headers: new Map(Object.entries(headers))
  }) as any

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = 'test-secret'
  })

  describe('GET /api/cron/daily-reminders', () => {
    test('should require authentication', async () => {
      const request = mockRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should accept valid Bearer token', async () => {
      const request = mockRequest({
        'authorization': 'Bearer test-secret'
      })
      jest.spyOn(ReminderService, 'processReminders').mockResolvedValue(5)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('should process reminders and return count', async () => {
      const request = mockRequest({
        'authorization': 'Bearer test-secret'
      })
      jest.spyOn(ReminderService, 'processReminders').mockResolvedValue(5)

      const response = await GET(request)
      const data = await response.json()

      expect(data.remindersSent).toBe(5)
      expect(data.timestamp).toBeDefined()
    })

    test('should handle processing errors', async () => {
      const request = mockRequest({
        'authorization': 'Bearer test-secret'
      })
      jest.spyOn(ReminderService, 'processReminders').mockRejectedValue(
        new Error('Database error')
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process reminders')
    })

    test('should reject invalid token', async () => {
      const request = mockRequest({
        'authorization': 'Bearer wrong-secret'
      })

      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/cron/daily-reminders', () => {
    test('should support POST method', async () => {
      const request = mockRequest({
        'authorization': 'Bearer test-secret'
      })
      jest.spyOn(ReminderService, 'processReminders').mockResolvedValue(3)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.remindersSent).toBe(3)
    })
  })
})
```

**Tests Needed**: 7 tests
- Authentication (3)
- Successful processing (1)
- Error handling (1)
- POST method support (1)
- Response format (1)

---

#### 4.2 Action Log API Tests

**File**: `app/api/__tests__/actions/log.test.ts`

```typescript
import { GET, POST } from '@/app/api/actions/log/route'
import { prismaMock } from '../../mocks/prisma'

jest.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

describe('API - /api/actions/log', () => {
  describe('POST /api/actions/log', () => {
    test('should create action log with valid data', async () => {
      const requestData = {
        machineId: 'machine-123',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: { test: true }
      }
      const request = {
        json: async () => requestData
      } as any

      prismaMock.actionLog.create.mockResolvedValue({
        id: 'log-123',
        ...requestData,
        createdAt: new Date()
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.actionLog.id).toBe('log-123')
    })

    test('should validate required fields', async () => {
      const request = {
        json: async () => ({ machineId: 'test' }) // Missing fields
      } as any

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })

    test('should validate actionType', async () => {
      const request = {
        json: async () => ({
          machineId: 'test',
          actionType: 'INVALID_TYPE',
          channel: 'EMAIL'
        })
      } as any

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    test('should validate channel', async () => {
      const request = {
        json: async () => ({
          machineId: 'test',
          actionType: 'REMINDER_SENT',
          channel: 'INVALID'
        })
      } as any

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    test('should handle database errors', async () => {
      const request = {
        json: async () => ({
          machineId: 'test',
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL'
        })
      } as any

      prismaMock.actionLog.create.mockRejectedValue(
        new Error('Database error')
      )

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/actions/log', () => {
    test('should fetch action logs', async () => {
      const mockLogs = [
        { id: '1', machineId: 'test', actionType: 'REMINDER_SENT',
          channel: 'EMAIL', createdAt: new Date(), metadata: null }
      ]
      const request = {
        url: 'http://localhost/api/actions/log'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue(mockLogs)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.actionLogs).toHaveLength(1)
    })

    test('should filter by machineId', async () => {
      const request = {
        url: 'http://localhost/api/actions/log?machineId=test-123'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue([])

      await GET(request)

      expect(prismaMock.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            machineId: 'test-123'
          })
        })
      )
    })

    test('should filter by actionType', async () => {
      const request = {
        url: 'http://localhost/api/actions/log?actionType=REMINDER_SENT'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue([])

      await GET(request)

      expect(prismaMock.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actionType: 'REMINDER_SENT'
          })
        })
      )
    })

    test('should respect limit parameter', async () => {
      const request = {
        url: 'http://localhost/api/actions/log?limit=10'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue([])

      await GET(request)

      expect(prismaMock.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10
        })
      )
    })

    test('should cap limit at 100', async () => {
      const request = {
        url: 'http://localhost/api/actions/log?limit=500'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue([])

      await GET(request)

      expect(prismaMock.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100
        })
      )
    })

    test('should order by createdAt desc', async () => {
      const request = {
        url: 'http://localhost/api/actions/log'
      } as any

      prismaMock.actionLog.findMany.mockResolvedValue([])

      await GET(request)

      expect(prismaMock.actionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )
    })
  })
})
```

**Tests Needed**: 12 tests
- POST validation (5)
- POST success case (1)
- GET filtering (4)
- GET pagination (2)

---

## Integration Testing Strategy

### Setup Requirements

```typescript
// test/setup/integration.ts

import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})

// For tests that need real DB
export const setupTestDatabase = async () => {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.TEST_DATABASE_URL }
    }
  })

  await prisma.$executeRaw`TRUNCATE TABLE "ActionLog" CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "Sale" CASCADE`

  return prisma
}
```

### Integration Test Suites

#### 1. Database Integration Tests

**File**: `test/integration/database.test.ts`

```typescript
describe('Integration - Database Operations', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('should create sale with reminder fields', async () => {
    const sale = await prisma.sale.create({
      data: {
        machineId: 'test-machine',
        saleDate: new Date(),
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhoneNumber: '1234567890',
        customerAddress: 'Test Address',
        reminderOptOut: false,
        whatsappNumber: '1234567890'
      }
    })

    expect(sale.reminderOptOut).toBe(false)
    expect(sale.whatsappNumber).toBe('1234567890')
  })

  test('should create and query action logs', async () => {
    await prisma.actionLog.create({
      data: {
        machineId: 'test-machine',
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL',
        metadata: { test: true }
      }
    })

    const logs = await prisma.actionLog.findMany({
      where: { machineId: 'test-machine' }
    })

    expect(logs).toHaveLength(1)
    expect(logs[0].metadata).toEqual({ test: true })
  })
})
```

**Tests Needed**: 8 tests

---

#### 2. Service Integration Tests

**File**: `test/integration/reminder-service.test.ts`

```typescript
describe('Integration - ReminderService with Database', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  })

  test('should process reminders end-to-end', async () => {
    // Create test machine with sale
    const machine = await createTestMachine(prisma)

    // Process reminders
    const count = await ReminderService.processReminders()

    // Verify action log created
    const logs = await prisma.actionLog.findMany({
      where: { machineId: machine.id }
    })

    expect(logs).toHaveLength(1)
    expect(logs[0].actionType).toBe('REMINDER_SENT')
  })
})
```

**Tests Needed**: 6 tests

---

## End-to-End Testing Plan

### E2E Test Scenarios

#### Critical Path Tests

**File**: `e2e/reminder-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Warranty Reminder Workflow', () => {
  test('should send reminder for machine due for service', async ({ page, request }) => {
    // 1. Setup: Create machine with service due in 15 days
    const machine = await request.post('/api/test/setup', {
      data: { scenario: 'service-due-15-days' }
    })

    // 2. Trigger cron job
    const cronResponse = await request.get('/api/cron/daily-reminders', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    })
    expect(cronResponse.status()).toBe(200)

    // 3. Verify action log created
    const logs = await request.get(`/api/actions/log?machineId=${machine.id}`)
    const data = await logs.json()
    expect(data.actionLogs).toHaveLength(1)

    // 4. Verify email sent (check mock email service)
    // This would integrate with actual email testing service
  })

  test('should not send duplicate reminder on same day', async ({ request }) => {
    // Setup machine
    const machine = await setupMachine()

    // Send reminder first time
    await request.get('/api/cron/daily-reminders', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    })

    // Try to send again
    await request.get('/api/cron/daily-reminders', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    })

    // Verify only one log
    const logs = await request.get(`/api/actions/log?machineId=${machine.id}`)
    const data = await logs.json()
    expect(data.actionLogs).toHaveLength(1)
  })
})
```

**Tests Needed**: 10 tests
- Happy path workflow (1)
- Duplicate prevention (1)
- Different urgency levels (4)
- Error scenarios (2)
- Opt-out handling (1)
- Expired warranty (1)

---

## Mock Strategies & Test Doubles

### Prisma Mock

```typescript
// test/mocks/prisma.ts
import { PrismaClient } from '@prisma/client'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'

export type Context = {
  prisma: PrismaClient
}

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>
}

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>()
  }
}
```

### Email Mock

```typescript
// test/mocks/email.ts
export const emailMock = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  verify: jest.fn().mockResolvedValue(true)
}
```

### Test Fixtures

```typescript
// test/fixtures/machines.ts
export const createMockMachine = (overrides = {}) => ({
  id: 'test-machine-1',
  serialNumber: 'TEST-001',
  manufacturingDate: new Date('2024-01-01'),
  machineModel: {
    name: 'Test Machine Model',
    warrantyPeriodMonths: 12
  },
  sale: {
    saleDate: subMonths(new Date(), 6),
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhoneNumber: '1234567890',
    reminderOptOut: false,
    whatsappNumber: '1234567890'
  },
  serviceRequests: [],
  ...overrides
})
```

---

## Test Data Management

### Test Data Strategy

```typescript
// test/data/seeds.ts

export const seedTestData = async (prisma: PrismaClient) => {
  // Clean slate
  await prisma.actionLog.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.machine.deleteMany()

  // Create test machines in various states
  const scenarios = [
    { name: 'service-due-15-days', saleDate: subMonths(addDays(new Date(), 15), 3) },
    { name: 'service-due-7-days', saleDate: subMonths(addDays(new Date(), 7), 3) },
    { name: 'service-overdue', saleDate: subMonths(subDays(new Date(), 5), 3) },
    { name: 'expired-warranty', saleDate: subMonths(new Date(), 15) },
    { name: 'opted-out', saleDate: new Date(), reminderOptOut: true }
  ]

  for (const scenario of scenarios) {
    await createMachineForScenario(prisma, scenario)
  }
}
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:unit
npm run lint
```

---

## Coverage Requirements & Metrics

### Coverage Targets

| Layer | Target | Current | Status |
|-------|--------|---------|--------|
| **Business Logic** | 90% | 100% | ✅ |
| **Services** | 80% | 0% | 🔴 |
| **API Routes** | 75% | 0% | 🔴 |
| **Email Templates** | 80% | 0% | 🔴 |
| **Database** | 70% | 0% | 🔴 |
| **Overall** | 80% | 36% | 🟡 |

### Jest Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './lib/warranty-helper.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

---

## Testing Best Practices

### 1. Test Naming Convention

```typescript
// ✅ Good
describe('WarrantyHelper - getHealthScore()', () => {
  test('should return 100 for new machine with no services due', () => {})
  test('should penalize overdue services by 40 points', () => {})
})

// ❌ Bad
describe('WarrantyHelper', () => {
  test('test1', () => {})
  test('getHealthScore', () => {})
})
```

### 2. AAA Pattern (Arrange-Act-Assert)

```typescript
test('should send reminder for eligible machine', async () => {
  // Arrange
  const machine = createMockMachine({
    sale: { saleDate: subMonths(addDays(new Date(), 15), 3) }
  })
  prismaMock.machine.findMany.mockResolvedValue([machine])

  // Act
  const count = await ReminderService.processReminders()

  // Assert
  expect(count).toBe(1)
  expect(emailMock.sendMail).toHaveBeenCalledTimes(1)
})
```

### 3. Isolate Tests

```typescript
// ✅ Good - Each test is independent
beforeEach(() => {
  jest.clearAllMocks()
})

// ❌ Bad - Tests depend on each other
let sharedState = {}
test('test1', () => { sharedState.value = 1 })
test('test2', () => { expect(sharedState.value).toBe(1) })
```

### 4. Mock External Dependencies

```typescript
// ✅ Good
jest.mock('@/lib/prisma')
jest.mock('@/lib/email/config')

// ❌ Bad - Testing external services
test('should send real email', async () => {
  await sendEmail() // This will actually try to send email
})
```

### 5. Test Edge Cases

```typescript
describe('WarrantyHelper - getHealthScore()', () => {
  test('should handle machine without sale', () => {})
  test('should handle expired warranty', () => {})
  test('should handle null service requests', () => {})
  test('should handle division by zero', () => {})
})
```

### 6. Keep Tests Fast

```typescript
// ✅ Good - Use mocks
jest.mock('@/lib/prisma')

// ❌ Bad - Real DB query
test('slow test', async () => {
  const data = await prisma.machine.findMany() // Real query
})
```

### 7. One Assertion Per Test (Generally)

```typescript
// ✅ Good
test('should return correct health score', () => {
  const score = getHealthScore(machine)
  expect(score).toBe(85)
})

test('should return score between 0-100', () => {
  const score = getHealthScore(machine)
  expect(score).toBeGreaterThanOrEqual(0)
  expect(score).toBeLessThanOrEqual(100)
})

// 🟡 Acceptable - Related assertions
test('should send email with correct content', () => {
  expect(emailMock.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'test@example.com',
      subject: expect.stringContaining('Reminder'),
      html: expect.stringContaining('TEST-001')
    })
  )
})
```

### 8. Use Test Helpers

```typescript
// test/helpers/machines.ts
export const createMachineServiceDueIn = (days: number) => {
  return createMockMachine({
    sale: { saleDate: subMonths(addDays(new Date(), days), 3) }
  })
}

// In tests
test('should send reminder 15 days before', () => {
  const machine = createMachineServiceDueIn(15)
  // ...
})
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Set up testing infrastructure

- [ ] Configure Jest for integration tests
- [ ] Set up test database
- [ ] Create mock utilities
- [ ] Create test fixtures
- [ ] Set up GitHub Actions

**Deliverables**:
- Working test infrastructure
- CI/CD pipeline running
- Documentation

---

### Phase 2: Service Layer Tests (Week 2)
**Goal**: Test ReminderService and email templates

- [ ] Write 15 ReminderService tests
- [ ] Write 12 email template tests
- [ ] Create email mocks
- [ ] Add integration tests for services

**Deliverables**:
- 27 new tests
- Service layer coverage >80%

---

### Phase 3: API Layer Tests (Week 3)
**Goal**: Test all API endpoints

- [ ] Write 7 cron endpoint tests
- [ ] Write 12 action log API tests
- [ ] Add request/response validation tests
- [ ] Add error handling tests

**Deliverables**:
- 19 new tests
- API coverage >75%

---

### Phase 4: Integration Tests (Week 4)
**Goal**: Test component interactions

- [ ] Write 8 database integration tests
- [ ] Write 6 service integration tests
- [ ] Test Prisma query performance
- [ ] Test transaction scenarios

**Deliverables**:
- 14 integration tests
- Integration test suite running in CI

---

### Phase 5: E2E Tests (Week 5)
**Goal**: Test critical user journeys

- [ ] Set up Playwright
- [ ] Write 10 E2E tests
- [ ] Test reminder workflow end-to-end
- [ ] Test error scenarios

**Deliverables**:
- 10 E2E tests
- Full workflow coverage

---

### Phase 6: Polish & Optimization (Week 6)
**Goal**: Optimize and document

- [ ] Improve test performance
- [ ] Add missing edge cases
- [ ] Update documentation
- [ ] Generate coverage reports
- [ ] Set up coverage badges

**Deliverables**:
- Complete test suite
- 80%+ coverage
- Full documentation

---

## Summary & Next Steps

### Current State
✅ **Step 2 (WarrantyHelper)**: Fully tested (36 tests)
⚠️ **Step 1 (Database)**: Manual testing only
⚠️ **Step 3 (Email System)**: Manual testing only

### Target State
🎯 **180+ automated tests across all layers**
🎯 **80%+ code coverage**
🎯 **Full CI/CD integration**
🎯 **Fast, reliable test suite**

### Immediate Next Steps

1. **Week 1**: Set up test infrastructure
2. **Week 2**: Implement service layer tests
3. **Week 3**: Implement API tests
4. **Week 4-6**: Integration & E2E tests

### Success Metrics

- ✅ All tests passing in CI
- ✅ Coverage >80%
- ✅ Test execution <5 minutes
- ✅ Zero flaky tests
- ✅ 100% critical path coverage

---

## Appendices

### A. Test File Structure

```
project-root/
├── lib/
│   ├── __tests__/
│   │   ├── warranty-helper.test.ts (✅ Done)
│   │   ├── services/
│   │   │   └── reminder.service.test.ts
│   │   └── email-templates/
│   │       └── service-reminder.test.ts
│   ├── warranty-helper.ts
│   └── services/
│       └── reminder.service.ts
├── app/
│   └── api/
│       └── __tests__/
│           ├── cron/
│           │   └── daily-reminders.test.ts
│           └── actions/
│               └── log.test.ts
├── test/
│   ├── integration/
│   │   ├── database.test.ts
│   │   └── reminder-service.test.ts
│   ├── e2e/
│   │   └── reminder-workflow.spec.ts
│   ├── mocks/
│   │   ├── prisma.ts
│   │   └── email.ts
│   ├── fixtures/
│   │   └── machines.ts
│   └── helpers/
│       └── setup.ts
└── jest.config.js
```

### B. Useful Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test warranty-helper

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Update snapshots
npm test -- -u

# Run tests for changed files
npm test -- --onlyChanged
```

### C. Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright](https://playwright.dev/)
- [Test Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Document Version**: 1.0
**Last Updated**: October 20, 2025
**Maintained By**: Development Team
**Review Cycle**: Monthly
