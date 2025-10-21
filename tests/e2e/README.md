# E2E Tests for Warranty Notification System

## Overview

This directory contains comprehensive end-to-end tests for the warranty reminder notification system. These tests validate the complete workflow from database to email delivery.

## Test Coverage

- **Core Reminder Flow** (15 tests): Service due in 15/7/3/0 days, overdue scenarios, email content validation
- **Filtering Logic** (6 tests): Skip machines without email, with opt-out, or expired warranty
- **Deduplication** (3 tests): Prevent same-day duplicates, handle concurrent executions
- **Multi-Machine Processing** (2 tests): Batch processing, large batch performance
- **Error Handling** (4 tests): Email failures, graceful degradation, data integrity

**Total: 30 E2E test scenarios**

## Prerequisites

### 1. Database Setup

E2E tests require a PostgreSQL database. You have two options:

#### Option A: Use Existing Database
```bash
# Set DATABASE_URL in your environment
export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
```

#### Option B: Use Docker (Recommended)
```bash
# Start PostgreSQL container
docker run -d \
  --name postgres-e2e \
  -e POSTGRES_DB=test_db \
  -e POSTGRES_USER=test_user \
  -e POSTGRES_PASSWORD=test_pass \
  -p 5432:5432 \
  postgres:16-alpine

# Set DATABASE_URL
export DATABASE_URL="postgresql://test_user:test_pass@localhost:5432/test_db"
```

### 2. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### 3. Install Dependencies

```bash
npm install
```

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npm run test:e2e -- reminder-flow.e2e.test.ts
```

### Run with Watch Mode
```bash
npm run test:e2e:watch
```

### Run All Tests (Unit + E2E)
```bash
npm run test:all
```

## Test Structure

```
tests/e2e/
├── setup/
│   ├── database.ts          # Test database management
│   ├── email-capture.ts     # Email spy/capture system
│   ├── global-setup.ts      # Global test setup
│   ├── global-teardown.ts   # Global test cleanup
│   └── jest-setup.ts        # Jest configuration
├── factories/
│   └── machine-factory.ts   # Test data factories
├── specs/
│   ├── reminder-flow.e2e.test.ts            # Core reminder flow tests
│   ├── reminder-filtering.e2e.test.ts       # Filtering logic tests
│   ├── reminder-deduplication.e2e.test.ts   # Deduplication tests
│   ├── reminder-multi-machine.e2e.test.ts   # Multi-machine tests
│   └── error-handling.e2e.test.ts           # Error handling tests
└── jest.config.e2e.js       # Jest E2E configuration
```

## Environment Variables

The following environment variables are set automatically by the test setup:

```bash
CRON_SECRET=test-secret-e2e
SERVICE_INTERVAL_MONTHS=3
REMINDER_DAYS_BEFORE=15
AVG_PREVENTIVE_COST=15000
AVG_BREAKDOWN_COST=200000
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test@test.com
SMTP_PASS=testpass
SMTP_FROM=test@jket.in
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## What Gets Mocked

- **Email SMTP Sending**: Emails are captured in-memory for assertions (not actually sent)
- **External APIs**: Any future integrations (SMS, WhatsApp) when implemented

## What Stays Real

- **Database**: Real PostgreSQL with Prisma client
- **Business Logic**: All WarrantyHelper calculations
- **API Endpoints**: Full Next.js API routes
- **Email Template Generation**: Actual HTML generation
- **Date Calculations**: Real date-fns operations

## Test Data Management

Tests use factories to create realistic test data:

```typescript
// Create machine with service due in 15 days
const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

// Create machine with service overdue
const { machine } = await factory.createMachineWithServiceOverdueBy(3)

// Create machine with expired warranty
const { machine } = await factory.createMachineWithExpiredWarranty()
```

Data is automatically cleaned up after each test using `afterEach` hooks.

## Example Test

```typescript
it('should send reminder email with UPCOMING urgency', async () => {
  // Arrange - Create test data in real database
  const { machine, sale } = await factory.createMachineWithServiceDueIn(15)

  // Act - Execute real business logic
  const sentCount = await ReminderService.processReminders()

  // Assert - Verify results
  expect(sentCount).toBe(1)

  // Verify email was captured
  const email = emailCapture.assertEmailSent(sale.customerEmail)
  expect(email.subject).toContain('Service Reminder')
  expect(email.html).toContain(machine.serialNumber)

  // Verify database state
  const actionLog = await testDb.getPrisma().actionLog.findFirst({
    where: { machineId: machine.id }
  })
  expect(actionLog.metadata).toMatchObject({
    daysUntilService: 15,
    urgency: 'UPCOMING'
  })
})
```

## Troubleshooting

### Error: "Prisma client did not initialize"
```bash
# Solution: Generate Prisma client
npx prisma generate
```

### Error: "Connection refused"
```bash
# Solution: Ensure database is running and DATABASE_URL is correct
docker ps  # Check if postgres container is running
echo $DATABASE_URL  # Verify connection string
```

### Error: "Table does not exist"
```bash
# Solution: Run migrations
npx prisma migrate deploy
```

### Tests are slow
```bash
# Solution: Use transaction rollback instead of cleanup
# Or run with fewer workers
npm run test:e2e -- --maxWorkers=1
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
```

## Performance

- Test execution time: ~5-10 seconds for all 30 tests
- Database cleanup: ~100ms per test
- Email capture: No overhead (in-memory)

## Contributing

When adding new E2E tests:

1. Use existing factories for test data creation
2. Clean up data in `afterEach` hook
3. Use descriptive test names: `should [action] when/for [condition]`
4. Verify both email content and database state
5. Use `emailCapture.assertEmailSent()` for email assertions

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the comprehensive test plan: `/docs/warranty-reminder/E2E_TESTING_PLAN.md`
- Create an issue in the repository
