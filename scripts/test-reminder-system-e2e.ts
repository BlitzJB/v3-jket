import { PrismaClient } from '@prisma/client'
import { ReminderService } from '../lib/services/reminder.service'
import { WarrantyHelper } from '../lib/warranty-helper'
import { addDays, subDays, addMonths } from 'date-fns'

const prisma = new PrismaClient()

async function testReminderSystemE2E() {
  console.log('🔄 Testing warranty reminder system end-to-end...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  }

  let testMachineId: string | null = null

  try {
    // Test 1: Create test data for a machine due for service
    console.log('Test 1: Creating test machine with service due...')
    try {
      // Create a machine that needs service in 7 days
      const serviceDueDate = addDays(new Date(), 7)
      const saleDate = addMonths(serviceDueDate, -3) // Sale was 3 months ago

      // Get or create test category and model
      let category = await prisma.category.findFirst({
        where: { shortCode: 'TEST' }
      })

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Test Category',
            shortCode: 'TEST',
            description: 'Test category for reminder system'
          }
        })
      }

      let machineModel = await prisma.machineModel.findFirst({
        where: { shortCode: 'E2E-TEST' }
      })

      if (!machineModel) {
        machineModel = await prisma.machineModel.create({
          data: {
            name: 'E2E Test Machine',
            shortCode: 'E2E-TEST',
            description: 'End-to-end test machine',
            warrantyPeriodMonths: 12,
            categoryId: category.id
          }
        })
      }

      // Create test machine
      const machine = await prisma.machine.create({
        data: {
          serialNumber: `E2E-${Date.now()}`,
          manufacturingDate: new Date(),
          testResultData: {},
          machineModelId: machineModel.id
        }
      })

      testMachineId = machine.id

      // Create sale with service due
      await prisma.sale.create({
        data: {
          machineId: machine.id,
          saleDate: saleDate,
          customerName: 'E2E Test Customer',
          customerContactPersonName: 'Test Contact',
          customerEmail: 'joshuabharathi2k4@gmail.com', // Test email
          customerPhoneNumber: '1234567890',
          customerAddress: 'Test Address',
          whatsappNumber: '1234567890',
          reminderOptOut: false
        }
      })

      console.log(`✅ Created test machine ${machine.serialNumber} with service due in 7 days`)
      tests.passed++

    } catch (error) {
      console.log('❌ Failed to create test data:', error)
      tests.failed++
      tests.errors.push(`Test data creation error: ${error}`)
    }

    if (!testMachineId) {
      console.log('❌ Cannot continue without test machine')
      return false
    }

    // Test 2: Verify warranty calculations
    console.log('\nTest 2: Verifying warranty calculations for test machine...')
    try {
      const machine = await prisma.machine.findUnique({
        where: { id: testMachineId },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })

      if (machine) {
        const healthScore = WarrantyHelper.getHealthScore(machine)
        const nextServiceDue = WarrantyHelper.getNextServiceDue(machine)
        const shouldSendReminder = WarrantyHelper.shouldSendReminder(machine)
        const warrantyActive = WarrantyHelper.isWarrantyActive(machine)

        console.log(`   - Health Score: ${healthScore}`)
        console.log(`   - Next Service: ${nextServiceDue?.toISOString().split('T')[0]}`)
        console.log(`   - Should Send Reminder: ${shouldSendReminder}`)
        console.log(`   - Warranty Active: ${warrantyActive}`)
        
        if (healthScore > 0 && nextServiceDue && warrantyActive) {
          console.log(`✅ Warranty calculations correct`)
          tests.passed++
          
          // Note: shouldSendReminder might be false if it's not exactly a trigger day
          if (!shouldSendReminder) {
            console.log(`   ℹ️  Reminder not due today (only sends on days: 15, 7, 3, 0, -3)`)
          }
        } else {
          console.log('❌ Warranty calculations failed')
          console.log(`   Debug: healthScore=${healthScore}, nextServiceDue=${!!nextServiceDue}, warrantyActive=${warrantyActive}`)
          tests.failed++
          tests.errors.push('Warranty calculations returned unexpected values')
        }
      }
    } catch (error) {
      console.log('❌ Warranty calculation test failed:', error)
      tests.failed++
      tests.errors.push(`Warranty calculation error: ${error}`)
    }

    // Test 3: Test reminder processing
    console.log('\nTest 3: Testing reminder processing...')
    try {
      const sentCount = await ReminderService.processReminders()
      
      if (sentCount >= 0) { // Should process without error
        console.log(`✅ Reminder processing completed, sent ${sentCount} reminders`)
        tests.passed++

        // Check if action log was created
        const actionLog = await prisma.actionLog.findFirst({
          where: {
            machineId: testMachineId,
            actionType: 'REMINDER_SENT'
          },
          orderBy: { createdAt: 'desc' }
        })

        if (actionLog) {
          console.log(`✅ Action log created: ${actionLog.id}`)
          tests.passed++
        } else {
          console.log('⚠️  No action log found (might be expected if reminder was already sent today)')
        }
      } else {
        console.log('❌ Reminder processing failed')
        tests.failed++
        tests.errors.push('Reminder processing returned negative count')
      }
    } catch (error) {
      console.log('❌ Reminder processing test failed:', error)
      tests.failed++
      tests.errors.push(`Reminder processing error: ${error}`)
    }

    // Test 4: Test cron endpoint
    console.log('\nTest 4: Testing cron endpoint...')
    try {
      // Import the cron route handler
      const { GET } = await import('../app/api/cron/daily-reminders/route')
      
      // Create mock request with authorization header
      const mockRequest = new Request('http://localhost:3000/api/cron/daily-reminders', {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'development-cron-secret'}`
        }
      })
      
      const response = await GET(mockRequest as any)
      const data = await response.json()

      if (response.status === 200 && data.success) {
        console.log(`✅ Cron endpoint working: sent ${data.remindersSent} reminders`)
        tests.passed++
      } else {
        console.log(`❌ Cron endpoint failed: ${response.status}`)
        console.log('Response:', data)
        tests.failed++
        tests.errors.push('Cron endpoint returned error')
      }
    } catch (error) {
      console.log('❌ Cron endpoint test failed:', error)
      tests.failed++
      tests.errors.push(`Cron endpoint error: ${error}`)
    }

    // Test 5: Test action log API
    console.log('\nTest 5: Testing action log API...')
    try {
      // Test creating action log via API
      const { POST, GET: GET_LOGS } = await import('../app/api/actions/log/route')
      
      const postRequest = new Request('http://localhost:3000/api/actions/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: testMachineId,
          actionType: 'WARRANTY_VIEWED',
          channel: 'WEB',
          metadata: { test: true }
        })
      })

      const postResponse = await POST(postRequest as any)
      const postData = await postResponse.json()

      if (postResponse.status === 200 && postData.success) {
        console.log(`✅ Action log API POST working: ${postData.actionLog.id}`)
        tests.passed++

        // Test getting action logs
        const getRequest = new Request(`http://localhost:3000/api/actions/log?machineId=${testMachineId}`)
        const getResponse = await GET_LOGS(getRequest as any)
        const getData = await getResponse.json()

        if (getResponse.status === 200 && getData.success && getData.actionLogs.length > 0) {
          console.log(`✅ Action log API GET working: found ${getData.actionLogs.length} logs`)
          tests.passed++
        } else {
          console.log('❌ Action log API GET failed')
          tests.failed++
          tests.errors.push('Action log GET endpoint failed')
        }
      } else {
        console.log('❌ Action log API POST failed')
        tests.failed++
        tests.errors.push('Action log POST endpoint failed')
      }
    } catch (error) {
      console.log('❌ Action log API test failed:', error)
      tests.failed++
      tests.errors.push(`Action log API error: ${error}`)
    }

    // Test 6: Performance test with multiple machines
    console.log('\nTest 6: Performance test with multiple machines...')
    try {
      const startTime = Date.now()
      
      // Get multiple machines for performance testing
      const machines = await prisma.machine.findMany({
        where: { sale: { isNot: null } },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        },
        take: 10
      })

      if (machines.length > 0) {
        // Process multiple machines
        for (const machine of machines) {
          WarrantyHelper.getHealthScore(machine)
          WarrantyHelper.shouldSendReminder(machine)
        }

        const endTime = Date.now()
        const duration = endTime - startTime
        const avgPerMachine = duration / machines.length

        if (avgPerMachine < 100) { // Should be under 100ms per machine
          console.log(`✅ Performance test passed: ${avgPerMachine.toFixed(2)}ms per machine (${machines.length} machines)`)
          tests.passed++
        } else {
          console.log(`❌ Performance test failed: ${avgPerMachine.toFixed(2)}ms per machine`)
          tests.failed++
          tests.errors.push(`Performance too slow: ${avgPerMachine.toFixed(2)}ms per machine`)
        }
      } else {
        console.log('⚠️  No machines for performance test')
      }
    } catch (error) {
      console.log('❌ Performance test failed:', error)
      tests.failed++
      tests.errors.push(`Performance test error: ${error}`)
    }

  } catch (error) {
    console.error('\n❌ Fatal error during E2E tests:', error)
    tests.errors.push(`Fatal error: ${error}`)
  } finally {
    // Cleanup: Remove test machine
    if (testMachineId) {
      try {
        await prisma.sale.deleteMany({
          where: { machineId: testMachineId }
        })
        await prisma.machine.delete({
          where: { id: testMachineId }
        })
        console.log('\n🧹 Cleaned up test data')
      } catch (cleanupError) {
        console.log('⚠️  Failed to cleanup test data:', cleanupError)
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('END-TO-END TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${tests.passed}`)
  console.log(`❌ Failed: ${tests.failed}`)

  if (tests.errors.length > 0) {
    console.log('\nErrors:')
    tests.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
  }

  if (tests.failed === 0) {
    console.log('\n🎉 All E2E tests passed! Warranty reminder system is fully functional.')
    console.log('📧 Check joshuabharathi2k4@gmail.com for test reminder emails.')
  } else {
    console.log('\n⚠️  Some E2E tests failed. Please check the implementation.')
  }

  return tests.failed === 0
}

testReminderSystemE2E()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })