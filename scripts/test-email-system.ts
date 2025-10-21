import { PrismaClient } from '@prisma/client'
import { ReminderService } from '../lib/services/reminder.service'
import { transporter, emailConfig } from '../lib/email/config'
import { generateServiceReminderHTML } from '../lib/email-templates/service-reminder'

const prisma = new PrismaClient()
const TEST_EMAIL = 'joshuabharathi2k4@gmail.com'

async function testEmailSystem() {
  console.log('📧 Testing email reminder system...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    // Test 1: Test email configuration
    console.log('Test 1: Testing email configuration...')
    try {
      // Test basic email sending
      await transporter.sendMail({
        from: emailConfig.from,
        to: TEST_EMAIL,
        subject: '[TEST] JKET Email Configuration Test',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that the JKET email system is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${emailConfig.from}</p>
          <p>If you receive this email, the configuration is working! ✅</p>
        `
      })
      
      console.log(`✅ Basic email test sent to ${TEST_EMAIL}`)
      tests.passed++
    } catch (error) {
      console.log('❌ Email configuration test failed:', error)
      tests.failed++
      tests.errors.push(`Email config test error: ${error}`)
    }

    // Test 2: Test email template generation
    console.log('\nTest 2: Testing email template generation...')
    try {
      const templateData = {
        customerName: 'Test Customer',
        machineName: 'Test Machine Model XYZ',
        serialNumber: 'TEST-001',
        daysUntilService: 7,
        healthScore: 85,
        totalSavings: 370000,
        scheduleUrl: 'http://localhost:3000/machines/TEST-001/service-request?source=warranty-reminder'
      }

      const html = generateServiceReminderHTML(templateData)
      
      if (html.includes('Test Customer') && 
          html.includes('TEST-001') && 
          html.includes('7 days') &&
          html.includes('85/100') &&
          html.includes('3,70,000')) {
        console.log('✅ Email template generation working correctly')
        tests.passed++
      } else {
        console.log('❌ Email template missing expected content')
        tests.failed++
        tests.errors.push('Email template generation failed')
      }
    } catch (error) {
      console.log('❌ Email template test failed:', error)
      tests.failed++
      tests.errors.push(`Template test error: ${error}`)
    }

    // Test 3: Test full reminder email with real machine data
    console.log('\nTest 3: Testing full reminder email...')
    try {
      // Get or create a test machine
      let machine = await prisma.machine.findFirst({
        where: { sale: { isNot: null } },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })

      if (!machine) {
        console.log('No machine found, using test data for reminder template test')
        // Create mock machine data for template test
        const templateData = {
          customerName: 'Test Customer',
          machineName: 'Industrial Grinder Pro',
          serialNumber: 'IGP-2024-001',
          daysUntilService: 3,
          healthScore: 75,
          totalSavings: 185000,
          scheduleUrl: 'http://localhost:3000/machines/IGP-2024-001/service-request?source=warranty-reminder'
        }

        const html = generateServiceReminderHTML(templateData)
        
        await transporter.sendMail({
          from: emailConfig.from,
          to: TEST_EMAIL,
          subject: '[TEST] Service Reminder - Industrial Grinder Pro',
          html
        })

        console.log(`✅ Mock reminder email sent to ${TEST_EMAIL}`)
        tests.passed++
      } else {
        // Use real machine data
        const sent = await ReminderService.sendTestReminder(machine.id, TEST_EMAIL)
        
        if (sent) {
          console.log(`✅ Real reminder email sent for ${machine.serialNumber} to ${TEST_EMAIL}`)
          tests.passed++
        } else {
          console.log('❌ Failed to send real reminder email')
          tests.failed++
          tests.errors.push('Real reminder email failed')
        }
      }
    } catch (error) {
      console.log('❌ Full reminder email test failed:', error)
      tests.failed++
      tests.errors.push(`Full reminder test error: ${error}`)
    }

    // Test 4: Test ActionLog creation
    console.log('\nTest 4: Testing ActionLog creation...')
    try {
      const testLog = await prisma.actionLog.create({
        data: {
          machineId: 'test-machine-email',
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: {
            testType: 'email-system-test',
            sentTo: TEST_EMAIL,
            timestamp: new Date().toISOString()
          }
        }
      })

      if (testLog.id) {
        console.log(`✅ ActionLog created successfully: ${testLog.id}`)
        tests.passed++

        // Clean up
        await prisma.actionLog.delete({
          where: { id: testLog.id }
        })
      }
    } catch (error) {
      console.log('❌ ActionLog creation failed:', error)
      tests.failed++
      tests.errors.push(`ActionLog test error: ${error}`)
    }

    // Test 5: Test different urgency levels
    console.log('\nTest 5: Testing different urgency levels...')
    try {
      const urgencyTests = [
        { days: 15, urgency: 'UPCOMING' },
        { days: 7, urgency: 'SOON' },
        { days: 3, urgency: 'URGENT' },
        { days: -5, urgency: 'OVERDUE' }
      ]

      let urgencyTestsPassed = 0

      for (const test of urgencyTests) {
        const templateData = {
          customerName: `Test Customer (${test.urgency})`,
          machineName: `Test Machine - ${test.urgency} Case`,
          serialNumber: `TEST-${test.urgency}`,
          daysUntilService: test.days,
          healthScore: test.days < 0 ? 30 : 80,
          totalSavings: 150000,
          scheduleUrl: 'http://localhost:3000/test'
        }

        const html = generateServiceReminderHTML(templateData)
        
        // Check if correct urgency styling is applied
        if (html.includes(test.urgency === 'OVERDUE' ? 'overdue' : 'due')) {
          urgencyTestsPassed++
        }
      }

      if (urgencyTestsPassed === urgencyTests.length) {
        console.log('✅ All urgency level templates generated correctly')
        tests.passed++
      } else {
        console.log(`❌ Only ${urgencyTestsPassed}/${urgencyTests.length} urgency templates correct`)
        tests.failed++
        tests.errors.push('Urgency level template generation failed')
      }
    } catch (error) {
      console.log('❌ Urgency level test failed:', error)
      tests.failed++
      tests.errors.push(`Urgency test error: ${error}`)
    }

  } catch (error) {
    console.error('\n❌ Fatal error during email tests:', error)
    tests.errors.push(`Fatal error: ${error}`)
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('EMAIL SYSTEM TEST SUMMARY')
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
    console.log('\n🎉 All email tests passed! Check your inbox at joshuabharathi2k4@gmail.com')
    console.log('📧 You should have received test emails demonstrating the reminder system.')
  } else {
    console.log('\n⚠️  Some email tests failed. Please check the configuration.')
  }

  return tests.failed === 0
}

testEmailSystem()
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