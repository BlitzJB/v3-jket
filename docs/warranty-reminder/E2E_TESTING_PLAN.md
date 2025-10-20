# End-to-End Testing Plan for Warranty Notification System

## Overview

This document outlines a comprehensive E2E testing strategy for the warranty reminder notification system. E2E tests will validate the entire flow from database to email delivery, mocking only 3rd party services (SMTP email sending).

## Testing Philosophy

### What Gets Mocked
- **SMTP Email Sending**: Use email capture/spy to verify emails without actually sending
- **External APIs**: Any future integrations (SMS, WhatsApp providers)

### What Stays Real
- **Database**: Real PostgreSQL test database
- **Business Logic**: All WarrantyHelper calculations
- **API Endpoints**: Full Next.js API routes
- **Prisma Client**: Real database queries
- **Email Template Generation**: Actual HTML generation
- **Date Calculations**: Real date-fns operations

---

## 1. Infrastructure Setup

### 1.1 Test Database

#### Option A: Testcontainers (Recommended)
```typescript
// tests/e2e/setup/database.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

export class TestDatabase {
  private container: PostgreSqlContainer
  private prisma: PrismaClient

  async start() {
    // Start PostgreSQL container
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_pass')
      .start()

    // Set DATABASE_URL
    const connectionString = this.container.getConnectionString()
    process.env.DATABASE_URL = connectionString

    // Run migrations
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: connectionString }
    })

    // Initialize Prisma client
    this.prisma = new PrismaClient()
    await this.prisma.$connect()

    return this.prisma
  }

  async cleanup() {
    // Clear all tables
    await this.prisma.$transaction([
      this.prisma.actionLog.deleteMany(),
      this.prisma.serviceVisit.deleteMany(),
      this.prisma.serviceRequest.deleteMany(),
      this.prisma.sale.deleteMany(),
      this.prisma.machine.deleteMany(),
      this.prisma.machineModel.deleteMany(),
      this.prisma.category.deleteMany(),
    ])
  }

  async stop() {
    await this.prisma.$disconnect()
    await this.container.stop()
  }
}
```

#### Option B: Dedicated Test Database
```bash
# Create test database
createdb v3_jket_test

# Set up separate migrations
DATABASE_URL="postgresql://user:pass@localhost:5432/v3_jket_test" \
  npx prisma migrate deploy
```

**Recommendation**: Use Testcontainers for CI/CD, dedicated DB for local development

### 1.2 Email Capture Setup

```typescript
// tests/e2e/setup/email-capture.ts
import nodemailer from 'nodemailer'
import { createTransport } from 'nodemailer'

export interface CapturedEmail {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  timestamp: Date
}

export class EmailCapture {
  private emails: CapturedEmail[] = []
  private mockTransport: any

  setup() {
    // Create a mock transporter that captures emails
    this.mockTransport = {
      sendMail: jest.fn(async (mailOptions) => {
        this.emails.push({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text,
          timestamp: new Date()
        })
        return { messageId: `test-${Date.now()}` }
      }),
      verify: jest.fn(async () => true)
    }

    // Mock the email config module
    jest.mock('@/lib/email/config', () => ({
      transporter: this.mockTransport,
      emailConfig: {
        from: 'test@jket.in'
      }
    }))
  }

  getEmails(): CapturedEmail[] {
    return [...this.emails]
  }

  getEmailsTo(email: string): CapturedEmail[] {
    return this.emails.filter(e => e.to === email)
  }

  getLastEmail(): CapturedEmail | undefined {
    return this.emails[this.emails.length - 1]
  }

  clear() {
    this.emails = []
    this.mockTransport.sendMail.mockClear()
  }

  assertEmailSent(to: string, subjectContains?: string) {
    const email = this.emails.find(e =>
      e.to === to &&
      (!subjectContains || e.subject.includes(subjectContains))
    )

    if (!email) {
      throw new Error(
        `Expected email to ${to}${subjectContains ? ` with subject containing "${subjectContains}"` : ''} but none found. ` +
        `Captured ${this.emails.length} email(s): ${this.emails.map(e => `${e.to} - ${e.subject}`).join(', ')}`
      )
    }

    return email
  }
}
```

### 1.3 Test Data Factory

```typescript
// tests/e2e/factories/machine-factory.ts
import { PrismaClient } from '@prisma/client'
import { addMonths, subMonths, addDays, subDays } from 'date-fns'

export class MachineFactory {
  constructor(private prisma: PrismaClient) {}

  async createCategory(overrides = {}) {
    return await this.prisma.category.create({
      data: {
        name: 'Test Category',
        shortCode: 'TC',
        description: 'Test category for E2E tests',
        ...overrides
      }
    })
  }

  async createModel(categoryId: string, overrides = {}) {
    return await this.prisma.machineModel.create({
      data: {
        name: 'Test Model',
        shortCode: 'TM',
        warrantyPeriodMonths: 12,
        categoryId,
        ...overrides
      }
    })
  }

  async createMachine(modelId: string, overrides = {}) {
    return await this.prisma.machine.create({
      data: {
        serialNumber: `TEST-${Date.now()}`,
        machineModelId: modelId,
        manufacturingDate: subMonths(new Date(), 7),
        testResultData: {},
        ...overrides
      }
    })
  }

  async createSale(machineId: string, overrides = {}) {
    return await this.prisma.sale.create({
      data: {
        machineId,
        saleDate: subMonths(new Date(), 6),
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhoneNumber: '1234567890',
        customerAddress: 'Test Address',
        reminderOptOut: false,
        ...overrides
      }
    })
  }

  async createServiceRequest(machineId: string, overrides = {}) {
    return await this.prisma.serviceRequest.create({
      data: {
        machineId,
        complaint: 'Test issue',
        ...overrides
      }
    })
  }

  async createServiceVisit(serviceRequestId: string, overrides = {}) {
    return await this.prisma.serviceVisit.create({
      data: {
        serviceRequestId,
        engineerId: 'test-engineer',
        serviceVisitDate: new Date(),
        status: 'COMPLETED',
        ...overrides
      }
    })
  }

  // Helper: Create complete machine with sale (service due in X days)
  async createMachineWithServiceDueIn(days: number) {
    const category = await this.createCategory()
    const model = await this.createModel(category.id, {
      warrantyPeriodMonths: 12
    })

    // Calculate sale date such that next service is due in 'days' days
    // Next service = saleDate + 3 months
    // We want: saleDate + 3 months = today + days
    // So: saleDate = today + days - 3 months
    const saleDate = subMonths(addDays(new Date(), days), 3)

    const machine = await this.createMachine(model.id)
    const sale = await this.createSale(machine.id, { saleDate })

    return { category, model, machine, sale }
  }

  // Helper: Create machine with service overdue by X days
  async createMachineWithServiceOverdueBy(days: number) {
    return await this.createMachineWithServiceDueIn(-days)
  }

  // Helper: Create machine with expired warranty
  async createMachineWithExpiredWarranty() {
    const category = await this.createCategory()
    const model = await this.createModel(category.id, {
      warrantyPeriodMonths: 12
    })

    const machine = await this.createMachine(model.id)
    // Sold 13 months ago - warranty expired
    const sale = await this.createSale(machine.id, {
      saleDate: subMonths(new Date(), 13)
    })

    return { category, model, machine, sale }
  }
}
```

---

## 2. E2E Test Scenarios

### 2.1 Core Reminder Flow

#### Test: Send reminder for machine due in 15 days
```typescript
describe('Reminder Flow - Due in 15 Days', () => {
  let testDb: TestDatabase
  let emailCapture: EmailCapture
  let factory: MachineFactory

  beforeAll(async () => {
    testDb = new TestDatabase()
    await testDb.start()
    emailCapture = new EmailCapture()
    emailCapture.setup()
    factory = new MachineFactory(testDb.prisma)
  })

  afterAll(async () => {
    await testDb.stop()
  })

  afterEach(async () => {
    await testDb.cleanup()
    emailCapture.clear()
  })

  it('should send reminder email for machine with service due in 15 days', async () => {
    // Arrange
    const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

    // Act
    const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    // Assert API response
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.remindersSent).toBe(1)

    // Assert email was sent
    const email = emailCapture.assertEmailSent(
      sale.customerEmail,
      'Service Reminder'
    )

    expect(email.subject).toContain('Service Reminder')
    expect(email.html).toContain(machine.serialNumber)
    expect(email.html).toContain('15 days')

    // Assert action log was created
    const actionLogs = await testDb.prisma.actionLog.findMany({
      where: {
        machineId: machine.id,
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
```

#### Test: Send URGENT reminder for machine due in 2 days
```typescript
it('should send URGENT reminder with correct subject and styling', async () => {
  // Arrange
  const { machine, sale } = await factory.createMachineWithServiceDueIn(2)

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  expect(response.status).toBe(200)

  const email = emailCapture.assertEmailSent(
    sale.customerEmail,
    '🔴 Urgent'
  )

  expect(email.subject).toContain('🔴 Urgent: Service Due Soon')
  expect(email.html).toContain('#f59e0b') // Orange urgency color
  expect(email.html).toContain('Service due in 2 days')

  const actionLog = await testDb.prisma.actionLog.findFirst({
    where: { machineId: machine.id }
  })

  expect(actionLog?.metadata).toMatchObject({
    urgency: 'URGENT',
    daysUntilService: 2
  })
})
```

#### Test: Send OVERDUE reminder
```typescript
it('should send OVERDUE reminder with warning message', async () => {
  // Arrange
  const { machine, sale } = await factory.createMachineWithServiceOverdueBy(3)

  // Act
  await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const email = emailCapture.assertEmailSent(
    sale.customerEmail,
    '⚠️ Overdue'
  )

  expect(email.subject).toContain('⚠️ Overdue: Service Required')
  expect(email.html).toContain('#dc2626') // Red urgency color
  expect(email.html).toContain('Service 3 days overdue')
  expect(email.html).toContain('⚠️ Important') // Warning box
  expect(email.html).toContain('Delaying service may affect your warranty coverage')

  const actionLog = await testDb.prisma.actionLog.findFirst({
    where: { machineId: machine.id }
  })

  expect(actionLog?.metadata).toMatchObject({
    urgency: 'OVERDUE',
    daysUntilService: -3
  })
})
```

### 2.2 Filtering and Skip Scenarios

#### Test: Skip machines without email
```typescript
it('should skip machines without customer email', async () => {
  // Arrange
  const { machine } = await factory.createMachineWithServiceDueIn(15)
  await testDb.prisma.sale.update({
    where: { machineId: machine.id },
    data: { customerEmail: '' }
  })

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const data = await response.json()
  expect(data.remindersSent).toBe(0)
  expect(emailCapture.getEmails()).toHaveLength(0)
})
```

#### Test: Skip machines with reminderOptOut
```typescript
it('should respect reminderOptOut flag', async () => {
  // Arrange
  const { machine, sale } = await factory.createMachineWithServiceDueIn(15)
  await testDb.prisma.sale.update({
    where: { machineId: machine.id },
    data: { reminderOptOut: true }
  })

  // Act
  await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  expect(emailCapture.getEmails()).toHaveLength(0)
})
```

#### Test: Skip machines with expired warranty
```typescript
it('should skip machines with expired warranty', async () => {
  // Arrange
  await factory.createMachineWithExpiredWarranty()

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const data = await response.json()
  expect(data.remindersSent).toBe(0)
  expect(emailCapture.getEmails()).toHaveLength(0)
})
```

#### Test: Skip non-trigger days
```typescript
it('should only send reminders on trigger days (15, 7, 3, 0, -3)', async () => {
  // Arrange - Create machines due in various days
  await factory.createMachineWithServiceDueIn(10) // Not a trigger day
  await factory.createMachineWithServiceDueIn(15) // Trigger day
  await factory.createMachineWithServiceDueIn(7)  // Trigger day

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const data = await response.json()
  expect(data.remindersSent).toBe(2) // Only 15 and 7 days
  expect(emailCapture.getEmails()).toHaveLength(2)
})
```

### 2.3 Deduplication

#### Test: Prevent duplicate reminders on same day
```typescript
it('should not send duplicate reminders on the same day', async () => {
  // Arrange
  const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

  // Act - Send first reminder
  await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  expect(emailCapture.getEmails()).toHaveLength(1)
  emailCapture.clear()

  // Act - Try to send again on same day
  await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert - No duplicate email sent
  expect(emailCapture.getEmails()).toHaveLength(0)

  // But action log exists from first send
  const actionLogs = await testDb.prisma.actionLog.findMany({
    where: {
      machineId: machine.id,
      actionType: 'REMINDER_SENT'
    }
  })
  expect(actionLogs).toHaveLength(1)
})
```

### 2.4 Multiple Machines

#### Test: Process multiple eligible machines
```typescript
it('should process multiple machines in one batch', async () => {
  // Arrange
  const machines = await Promise.all([
    factory.createMachineWithServiceDueIn(15),
    factory.createMachineWithServiceDueIn(7),
    factory.createMachineWithServiceDueIn(3),
    factory.createMachineWithServiceOverdueBy(3),
  ])

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const data = await response.json()
  expect(data.remindersSent).toBe(4)
  expect(emailCapture.getEmails()).toHaveLength(4)

  // Verify each email went to the right customer
  for (const { sale } of machines) {
    emailCapture.assertEmailSent(sale.customerEmail)
  }

  // Verify action logs for all
  const actionLogs = await testDb.prisma.actionLog.findMany({
    where: {
      actionType: 'REMINDER_SENT'
    }
  })
  expect(actionLogs).toHaveLength(4)
})
```

### 2.5 Health Score and Savings

#### Test: Email includes correct health score and savings
```typescript
it('should calculate and display health score and savings in email', async () => {
  // Arrange
  const { machine, sale, model } = await factory.createMachineWithServiceDueIn(15)

  // Add completed service visits
  const serviceRequest1 = await factory.createServiceRequest(machine.id)
  await factory.createServiceVisit(serviceRequest1.id, {
    status: 'COMPLETED',
    serviceVisitDate: subMonths(new Date(), 3)
  })

  const serviceRequest2 = await factory.createServiceRequest(machine.id)
  await factory.createServiceVisit(serviceRequest2.id, {
    status: 'COMPLETED',
    serviceVisitDate: subMonths(new Date(), 6)
  })

  // Act
  await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert
  const email = emailCapture.assertEmailSent(sale.customerEmail)

  // Health score should be displayed
  expect(email.html).toMatch(/\d+\/100/) // Health score format

  // Savings = 2 completed * (200000 - 15000) = ₹3,70,000
  expect(email.html).toContain('₹3,70,000')

  // Verify metadata in action log
  const actionLog = await testDb.prisma.actionLog.findFirst({
    where: { machineId: machine.id }
  })

  expect(actionLog?.metadata).toMatchObject({
    healthScore: expect.any(Number),
    daysUntilService: 15,
    urgency: 'UPCOMING'
  })

  expect(actionLog!.metadata.healthScore).toBeGreaterThan(0)
})
```

### 2.6 API Endpoints

#### Test: Cron endpoint requires authentication
```typescript
it('should reject unauthorized requests to cron endpoint', async () => {
  // Act - No auth header
  const response1 = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST'
  })

  // Assert
  expect(response1.status).toBe(401)
  const data1 = await response1.json()
  expect(data1.error).toBe('Unauthorized')

  // Act - Wrong token
  const response2 = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer wrong-token'
    }
  })

  // Assert
  expect(response2.status).toBe(401)
})
```

#### Test: Action log API - create and query
```typescript
it('should create and query action logs via API', async () => {
  // Arrange
  const { machine } = await factory.createMachineWithServiceDueIn(15)

  // Act - Create action log
  const createResponse = await fetch('http://localhost:3000/api/actions/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      machineId: machine.id,
      actionType: 'REMINDER_SENT',
      channel: 'EMAIL',
      metadata: {
        testData: 'test'
      }
    })
  })

  // Assert creation
  expect(createResponse.status).toBe(200)
  const createData = await createResponse.json()
  expect(createData.success).toBe(true)
  expect(createData.actionLog.id).toBeDefined()

  // Act - Query logs
  const queryResponse = await fetch(
    `http://localhost:3000/api/actions/log?machineId=${machine.id}`
  )

  // Assert query
  expect(queryResponse.status).toBe(200)
  const queryData = await queryResponse.json()
  expect(queryData.success).toBe(true)
  expect(queryData.actionLogs).toHaveLength(1)
  expect(queryData.actionLogs[0].machineId).toBe(machine.id)
  expect(queryData.actionLogs[0].actionType).toBe('REMINDER_SENT')
})
```

### 2.7 Error Handling

#### Test: Continue processing on email failure
```typescript
it('should continue processing other machines if one email fails', async () => {
  // Arrange
  const machine1 = await factory.createMachineWithServiceDueIn(15)
  const machine2 = await factory.createMachineWithServiceDueIn(7)
  const machine3 = await factory.createMachineWithServiceDueIn(3)

  // Configure email mock to fail for machine1 only
  const originalSendMail = emailCapture.mockTransport.sendMail
  emailCapture.mockTransport.sendMail = jest.fn(async (mailOptions) => {
    if (mailOptions.to === machine1.sale.customerEmail) {
      throw new Error('SMTP error')
    }
    return originalSendMail(mailOptions)
  })

  // Act
  const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  })

  // Assert - Should succeed for 2 out of 3
  const data = await response.json()
  expect(data.remindersSent).toBe(2)
  expect(emailCapture.getEmails()).toHaveLength(2)

  // Verify machine2 and machine3 received emails
  emailCapture.assertEmailSent(machine2.sale.customerEmail)
  emailCapture.assertEmailSent(machine3.sale.customerEmail)
})
```

---

## 3. Test Organization

### 3.1 Directory Structure

```
tests/
├── e2e/
│   ├── setup/
│   │   ├── database.ts         # Test database management
│   │   ├── email-capture.ts    # Email spy/capture
│   │   └── server.ts           # Next.js server management
│   ├── factories/
│   │   ├── machine-factory.ts  # Machine data factory
│   │   └── user-factory.ts     # User data factory (if needed)
│   ├── specs/
│   │   ├── reminder-flow.e2e.test.ts
│   │   ├── reminder-filtering.e2e.test.ts
│   │   ├── reminder-deduplication.e2e.test.ts
│   │   ├── api-endpoints.e2e.test.ts
│   │   └── health-score-calculation.e2e.test.ts
│   └── jest.config.e2e.js
└── unit/                       # Existing unit tests
    └── ...
```

### 3.2 Jest Configuration for E2E

```javascript
// tests/e2e/jest.config.e2e.js
module.exports = {
  displayName: 'e2e',
  testMatch: ['**/tests/e2e/specs/**/*.e2e.test.ts'],
  testEnvironment: 'node',
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/jest-setup.ts'],
  testTimeout: 60000, // E2E tests can take longer
  maxWorkers: 1, // Run E2E tests serially to avoid database conflicts
  globalSetup: '<rootDir>/tests/e2e/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/e2e/setup/global-teardown.ts',
}
```

### 3.3 Global Setup/Teardown

```typescript
// tests/e2e/setup/global-setup.ts
import { TestDatabase } from './database'

export default async function globalSetup() {
  // Start test database container
  const testDb = new TestDatabase()
  await testDb.start()

  // Store connection info globally
  global.__TEST_DB__ = testDb

  // Start Next.js server in test mode
  // (or rely on a running dev server)
}
```

```typescript
// tests/e2e/setup/global-teardown.ts
export default async function globalTeardown() {
  // Stop test database
  if (global.__TEST_DB__) {
    await global.__TEST_DB__.stop()
  }
}
```

---

## 4. Execution Strategy

### 4.1 Local Development

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with watch mode
npm run test:e2e:watch

# Run specific E2E test file
npm run test:e2e -- reminder-flow.e2e.test.ts
```

```json
// package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config jest.config.js",
    "test:e2e": "jest --config tests/e2e/jest.config.e2e.js",
    "test:e2e:watch": "jest --config tests/e2e/jest.config.e2e.js --watch",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

### 4.2 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci

      # Testcontainers will handle database setup
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET_TEST }}
          SMTP_HOST: localhost
          SMTP_PORT: 1025
```

### 4.3 Performance Considerations

#### Parallel Execution Strategy
```typescript
// For independent test suites
// tests/e2e/jest.config.e2e.js
module.exports = {
  // ...
  maxWorkers: 3, // Run up to 3 test suites in parallel

  // Each worker gets its own database
  testEnvironmentOptions: {
    databaseIsolation: 'per-worker'
  }
}
```

#### Database Reset Strategies

**Option 1: Transaction Rollback (Fastest)**
```typescript
beforeEach(async () => {
  await testDb.prisma.$executeRaw`BEGIN`
})

afterEach(async () => {
  await testDb.prisma.$executeRaw`ROLLBACK`
})
```

**Option 2: Truncate Tables (Recommended for E2E)**
```typescript
afterEach(async () => {
  await testDb.cleanup() // Truncate all tables
})
```

**Option 3: Fresh Database Per Test (Slowest, Most Isolated)**
```typescript
beforeEach(async () => {
  // Drop and recreate schema
  await testDb.reset()
})
```

---

## 5. Tools and Dependencies

### 5.1 Required Packages

```json
{
  "devDependencies": {
    "@testcontainers/postgresql": "^10.0.0",
    "testcontainers": "^10.0.0",
    "node-fetch": "^3.3.2",
    "@types/node-fetch": "^2.6.9"
  }
}
```

### 5.2 Alternative: MailHog for Email Testing

If you want to visually inspect emails during development:

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    ports:
      - "5433:5432"

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
```

Configure test environment to use MailHog:
```typescript
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '1025'
```

Visit `http://localhost:8025` to see captured emails.

---

## 6. Advanced Scenarios

### 6.1 Date-Based Testing

```typescript
describe('Time-dependent scenarios', () => {
  let originalDate: typeof Date

  beforeAll(() => {
    // Save original Date
    originalDate = global.Date
  })

  afterAll(() => {
    // Restore original Date
    global.Date = originalDate
  })

  it('should handle date changes correctly', async () => {
    // Mock current date to specific time
    const mockDate = new Date('2025-11-01T10:00:00Z')
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate)
        } else {
          super(...args)
        }
      }

      static now() {
        return mockDate.getTime()
      }
    } as any

    // Create machine with service due on specific date
    const { machine } = await factory.createMachineWithServiceDueIn(15)

    // Process reminders
    await fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    // Assert reminder sent
    expect(emailCapture.getEmails()).toHaveLength(1)
  })
})
```

### 6.2 Concurrency Testing

```typescript
it('should handle concurrent cron executions gracefully', async () => {
  // Arrange
  await factory.createMachineWithServiceDueIn(15)

  // Act - Trigger two concurrent executions
  const [response1, response2] = await Promise.all([
    fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    }),
    fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    })
  ])

  // Assert - Only one email sent (deduplication works)
  expect(emailCapture.getEmails()).toHaveLength(1)

  // Both responses should be successful
  expect(response1.status).toBe(200)
  expect(response2.status).toBe(200)
})
```

---

## 7. Coverage Goals

### 7.1 E2E Coverage Targets

| Component | E2E Scenarios | Priority |
|-----------|--------------|----------|
| Reminder Sending | 15 scenarios | HIGH |
| Email Templates | 8 scenarios | HIGH |
| Filtering Logic | 6 scenarios | HIGH |
| Deduplication | 3 scenarios | HIGH |
| API Endpoints | 8 scenarios | MEDIUM |
| Error Handling | 4 scenarios | MEDIUM |
| Concurrency | 2 scenarios | LOW |

**Total: ~46 E2E test scenarios**

### 7.2 Coverage Metrics

```bash
# Run E2E tests with coverage
npm run test:e2e -- --coverage

# Coverage should focus on integration points:
# - Database queries
# - Email generation
# - API responses
# - Business logic interactions
```

---

## 8. Maintenance and Best Practices

### 8.1 Test Data Management

```typescript
// Use consistent factories
const machine = await factory.createMachineWithServiceDueIn(15)

// Avoid hard-coded IDs
❌ const machineId = 'test-123'
✅ const { machine } = await factory.createMachine()

// Clean up after each test
afterEach(async () => {
  await testDb.cleanup()
  emailCapture.clear()
})
```

### 8.2 Assertion Patterns

```typescript
// Use semantic assertions
expect(data.remindersSent).toBe(1)
expect(email.subject).toContain('Service Reminder')

// Use custom matchers for complex validations
expect(email).toMatchEmailPattern({
  to: sale.customerEmail,
  subjectContains: 'Service',
  htmlContains: [machine.serialNumber, 'Health Score']
})
```

### 8.3 Test Naming Convention

```typescript
// Pattern: should [action] when/for [condition]
it('should send URGENT reminder when service due in 2 days', ...)
it('should skip machines without email', ...)
it('should prevent duplicate reminders on same day', ...)
```

---

## 9. Migration Path

### Phase 1: Infrastructure Setup (Week 1)
- [ ] Set up Testcontainers
- [ ] Create TestDatabase class
- [ ] Create EmailCapture class
- [ ] Create MachineFactory
- [ ] Configure Jest for E2E

### Phase 2: Core E2E Tests (Week 2-3)
- [ ] Reminder flow tests (15, 7, 3, 0, -3 days)
- [ ] Filtering tests (no email, opted out, expired)
- [ ] Deduplication tests
- [ ] Multiple machine tests

### Phase 3: Advanced Tests (Week 4)
- [ ] Health score validation
- [ ] API endpoint tests
- [ ] Error handling tests
- [ ] Concurrency tests

### Phase 4: CI/CD Integration (Week 5)
- [ ] GitHub Actions workflow
- [ ] Performance optimization
- [ ] Documentation

---

## 10. Success Criteria

✅ **E2E tests pass consistently in local environment**
✅ **E2E tests pass in CI/CD pipeline**
✅ **All critical user flows covered**
✅ **Email content validated automatically**
✅ **Database state verified after operations**
✅ **No flaky tests (>99% pass rate)**
✅ **Test execution time < 5 minutes**
✅ **Clear error messages on failures**

---

## Appendix

### A. Example: Complete E2E Test File

```typescript
// tests/e2e/specs/reminder-complete-flow.e2e.test.ts
import { TestDatabase } from '../setup/database'
import { EmailCapture } from '../setup/email-capture'
import { MachineFactory } from '../factories/machine-factory'

describe('Complete Reminder Flow E2E', () => {
  let testDb: TestDatabase
  let emailCapture: EmailCapture
  let factory: MachineFactory

  beforeAll(async () => {
    testDb = new TestDatabase()
    await testDb.start()
    emailCapture = new EmailCapture()
    emailCapture.setup()
    factory = new MachineFactory(testDb.prisma)
  })

  afterAll(async () => {
    await testDb.stop()
  })

  afterEach(async () => {
    await testDb.cleanup()
    emailCapture.clear()
  })

  it('should process complete reminder workflow from database to email', async () => {
    // 1. Set up test data
    const { machine, sale, model } = await factory.createMachineWithServiceDueIn(15)

    // 2. Trigger cron job
    const response = await fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    // 3. Verify API response
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.remindersSent).toBe(1)
    expect(data.timestamp).toBeDefined()

    // 4. Verify email was sent
    const emails = emailCapture.getEmails()
    expect(emails).toHaveLength(1)

    const email = emails[0]
    expect(email.to).toBe(sale.customerEmail)
    expect(email.from).toBe('test@jket.in')
    expect(email.subject).toContain('Service Reminder')
    expect(email.subject).toContain(model.name)

    // 5. Verify email content
    expect(email.html).toContain(sale.customerName)
    expect(email.html).toContain(machine.serialNumber)
    expect(email.html).toContain('15 days')
    expect(email.html).toContain('Schedule Service Now')

    // 6. Verify action log was created
    const actionLogs = await testDb.prisma.actionLog.findMany({
      where: {
        machineId: machine.id,
        actionType: 'REMINDER_SENT',
        channel: 'EMAIL'
      }
    })

    expect(actionLogs).toHaveLength(1)

    const log = actionLogs[0]
    expect(log.metadata).toMatchObject({
      daysUntilService: 15,
      urgency: 'UPCOMING',
      sentTo: sale.customerEmail,
      healthScore: expect.any(Number)
    })

    // 7. Verify idempotency - running again should not send duplicate
    emailCapture.clear()

    await fetch('http://localhost:3000/api/cron/daily-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    expect(emailCapture.getEmails()).toHaveLength(0)

    // 8. Verify action log count unchanged
    const logsAfterSecondRun = await testDb.prisma.actionLog.findMany({
      where: {
        machineId: machine.id,
        actionType: 'REMINDER_SENT'
      }
    })

    expect(logsAfterSecondRun).toHaveLength(1)
  })
})
```

### B. Troubleshooting Guide

**Problem**: Tests fail with "Connection refused"
**Solution**: Ensure test database container is running and DATABASE_URL is correct

**Problem**: Email capture not working
**Solution**: Verify jest.mock() is called before importing modules that use the transporter

**Problem**: Tests are slow
**Solution**:
- Use database truncation instead of full reset
- Run fewer E2E tests (focus on critical paths)
- Use parallel execution with separate databases

**Problem**: Flaky tests
**Solution**:
- Use explicit waits instead of timeouts
- Ensure proper cleanup between tests
- Check for race conditions in date calculations
