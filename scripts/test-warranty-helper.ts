import { WarrantyHelper } from '../lib/warranty-helper'
import { addMonths, subMonths, addDays, subDays } from 'date-fns'

/**
 * Comprehensive test suite for WarrantyHelper class
 */

interface TestResult {
  passed: number
  failed: number
  errors: string[]
}

function createTestMachine(options: {
  saleDate: Date
  warrantyPeriodMonths: number
  serviceRequests?: any[]
}) {
  return {
    id: 'test-machine-id',
    serialNumber: 'TEST-001',
    manufacturingDate: subMonths(options.saleDate, 1),
    machineModel: {
      name: 'Test Machine',
      warrantyPeriodMonths: options.warrantyPeriodMonths
    },
    sale: {
      saleDate: options.saleDate,
      customerEmail: 'test@example.com',
      reminderOptOut: false
    },
    serviceRequests: options.serviceRequests || []
  }
}

async function runTests() {
  console.log('🧪 Testing WarrantyHelper class...\n')
  console.log('=' .repeat(60))

  const results: TestResult = {
    passed: 0,
    failed: 0,
    errors: []
  }

  // Test 1: getWarrantyExpiryDate
  console.log('\n📋 Test 1: getWarrantyExpiryDate()')
  try {
    const saleDate = new Date('2024-01-01')
    const machine = createTestMachine({ saleDate, warrantyPeriodMonths: 12 })
    const expiryDate = WarrantyHelper.getWarrantyExpiryDate(machine)

    if (expiryDate && expiryDate.getFullYear() === 2025 && expiryDate.getMonth() === 0) {
      console.log('✅ Correctly calculates warranty expiry (12 months from sale)')
      results.passed++
    } else {
      console.log('❌ Incorrect warranty expiry calculation')
      results.failed++
      results.errors.push('getWarrantyExpiryDate: Wrong expiry date')
    }

    // Test with no sale
    const machineNoSale = { ...machine, sale: null }
    const noSaleResult = WarrantyHelper.getWarrantyExpiryDate(machineNoSale)
    if (noSaleResult === null) {
      console.log('✅ Returns null for machine without sale')
      results.passed++
    } else {
      console.log('❌ Should return null for machine without sale')
      results.failed++
      results.errors.push('getWarrantyExpiryDate: Should handle missing sale')
    }
  } catch (error) {
    console.log('❌ Test 1 failed:', error)
    results.failed += 2
    results.errors.push(`Test 1 error: ${error}`)
  }

  // Test 2: isWarrantyActive
  console.log('\n📋 Test 2: isWarrantyActive()')
  try {
    // Active warranty (sold 6 months ago, 12 month warranty)
    const activeMachine = createTestMachine({
      saleDate: subMonths(new Date(), 6),
      warrantyPeriodMonths: 12
    })
    const isActive = WarrantyHelper.isWarrantyActive(activeMachine)

    if (isActive === true) {
      console.log('✅ Correctly identifies active warranty')
      results.passed++
    } else {
      console.log('❌ Should identify warranty as active')
      results.failed++
      results.errors.push('isWarrantyActive: False negative for active warranty')
    }

    // Expired warranty (sold 13 months ago, 12 month warranty)
    const expiredMachine = createTestMachine({
      saleDate: subMonths(new Date(), 13),
      warrantyPeriodMonths: 12
    })
    const isExpired = WarrantyHelper.isWarrantyActive(expiredMachine)

    if (isExpired === false) {
      console.log('✅ Correctly identifies expired warranty')
      results.passed++
    } else {
      console.log('❌ Should identify warranty as expired')
      results.failed++
      results.errors.push('isWarrantyActive: False positive for expired warranty')
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error)
    results.failed += 2
    results.errors.push(`Test 2 error: ${error}`)
  }

  // Test 3: getNextServiceDue
  console.log('\n📋 Test 3: getNextServiceDue()')
  try {
    // Machine sold 1 month ago (service due in 2 months)
    const machine = createTestMachine({
      saleDate: subMonths(new Date(), 1),
      warrantyPeriodMonths: 12
    })
    const nextService = WarrantyHelper.getNextServiceDue(machine)

    if (nextService) {
      const monthsUntilService = Math.round((nextService.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
      if (monthsUntilService >= 1 && monthsUntilService <= 3) {
        console.log(`✅ Next service correctly calculated (~${monthsUntilService} months away)`)
        results.passed++
      } else {
        console.log(`❌ Next service calculation seems off (${monthsUntilService} months)`)
        results.failed++
        results.errors.push('getNextServiceDue: Incorrect service date calculation')
      }
    } else {
      console.log('❌ Should return a service date')
      results.failed++
      results.errors.push('getNextServiceDue: Should not return null for active warranty')
    }

    // Expired warranty
    const expiredMachine = createTestMachine({
      saleDate: subMonths(new Date(), 15),
      warrantyPeriodMonths: 12
    })
    const noService = WarrantyHelper.getNextServiceDue(expiredMachine)

    if (noService === null) {
      console.log('✅ Returns null for expired warranty')
      results.passed++
    } else {
      console.log('❌ Should return null for expired warranty')
      results.failed++
      results.errors.push('getNextServiceDue: Should handle expired warranty')
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error)
    results.failed += 2
    results.errors.push(`Test 3 error: ${error}`)
  }

  // Test 4: getHealthScore
  console.log('\n📋 Test 4: getHealthScore()')
  try {
    // New machine with no services yet
    const newMachine = createTestMachine({
      saleDate: subDays(new Date(), 30), // Sold 1 month ago
      warrantyPeriodMonths: 12
    })
    const healthScore = WarrantyHelper.getHealthScore(newMachine)

    if (healthScore >= 0 && healthScore <= 100) {
      console.log(`✅ Health score in valid range (${healthScore}/100)`)
      results.passed++
    } else {
      console.log(`❌ Health score out of range (${healthScore})`)
      results.failed++
      results.errors.push('getHealthScore: Score out of valid range')
    }

    // Machine with completed services
    const wellMaintainedMachine = createTestMachine({
      saleDate: subMonths(new Date(), 9),
      warrantyPeriodMonths: 12,
      serviceRequests: [
        {
          id: '1',
          createdAt: subMonths(new Date(), 6),
          serviceVisit: {
            id: 'v1',
            serviceVisitDate: subMonths(new Date(), 6),
            status: 'COMPLETED'
          }
        },
        {
          id: '2',
          createdAt: subMonths(new Date(), 3),
          serviceVisit: {
            id: 'v2',
            serviceVisitDate: subMonths(new Date(), 3),
            status: 'COMPLETED'
          }
        }
      ]
    })
    const goodHealthScore = WarrantyHelper.getHealthScore(wellMaintainedMachine)

    if (goodHealthScore >= 70) {
      console.log(`✅ Well-maintained machine has good health score (${goodHealthScore}/100)`)
      results.passed++
    } else {
      console.log(`❌ Well-maintained machine should have higher score (${goodHealthScore})`)
      results.failed++
      results.errors.push('getHealthScore: Score too low for well-maintained machine')
    }
  } catch (error) {
    console.log('❌ Test 4 failed:', error)
    results.failed += 2
    results.errors.push(`Test 4 error: ${error}`)
  }

  // Test 5: getRiskLevel
  console.log('\n📋 Test 5: getRiskLevel()')
  try {
    const lowRisk = WarrantyHelper.getRiskLevel(85)
    const mediumRisk = WarrantyHelper.getRiskLevel(70)
    const highRisk = WarrantyHelper.getRiskLevel(50)

    if (lowRisk === 'LOW' && mediumRisk === 'MEDIUM' && highRisk === 'HIGH') {
      console.log('✅ Risk levels correctly categorized (85=LOW, 70=MEDIUM, 50=HIGH)')
      results.passed++
    } else {
      console.log(`❌ Risk level categorization incorrect (85=${lowRisk}, 70=${mediumRisk}, 50=${highRisk})`)
      results.failed++
      results.errors.push('getRiskLevel: Incorrect risk categorization')
    }

    // Edge cases
    if (WarrantyHelper.getRiskLevel(80) === 'LOW' &&
        WarrantyHelper.getRiskLevel(79) === 'MEDIUM' &&
        WarrantyHelper.getRiskLevel(60) === 'MEDIUM' &&
        WarrantyHelper.getRiskLevel(59) === 'HIGH') {
      console.log('✅ Edge cases handled correctly (80=LOW, 79=MEDIUM, 60=MEDIUM, 59=HIGH)')
      results.passed++
    } else {
      console.log('❌ Edge case handling incorrect')
      results.failed++
      results.errors.push('getRiskLevel: Edge cases failed')
    }
  } catch (error) {
    console.log('❌ Test 5 failed:', error)
    results.failed += 2
    results.errors.push(`Test 5 error: ${error}`)
  }

  // Test 6: getTotalSavings
  console.log('\n📋 Test 6: getTotalSavings()')
  try {
    const machineWith3Services = createTestMachine({
      saleDate: subMonths(new Date(), 9),
      warrantyPeriodMonths: 12,
      serviceRequests: [
        { id: '1', createdAt: new Date(), serviceVisit: { id: 'v1', serviceVisitDate: new Date(), status: 'COMPLETED' } },
        { id: '2', createdAt: new Date(), serviceVisit: { id: 'v2', serviceVisitDate: new Date(), status: 'COMPLETED' } },
        { id: '3', createdAt: new Date(), serviceVisit: { id: 'v3', serviceVisitDate: new Date(), status: 'COMPLETED' } }
      ]
    })

    const savings = WarrantyHelper.getTotalSavings(machineWith3Services)
    const expectedSavings = 3 * (200000 - 15000) // 3 services * savings per service

    if (savings === expectedSavings) {
      console.log(`✅ Total savings correctly calculated (₹${savings.toLocaleString('en-IN')})`)
      results.passed++
    } else {
      console.log(`❌ Savings calculation incorrect (got ₹${savings}, expected ₹${expectedSavings})`)
      results.failed++
      results.errors.push('getTotalSavings: Incorrect calculation')
    }

    // Machine with no services
    const newMachine = createTestMachine({ saleDate: new Date(), warrantyPeriodMonths: 12 })
    const zeroSavings = WarrantyHelper.getTotalSavings(newMachine)

    if (zeroSavings === 0) {
      console.log('✅ Returns zero for machine with no services')
      results.passed++
    } else {
      console.log(`❌ Should return 0 for no services (got ${zeroSavings})`)
      results.failed++
      results.errors.push('getTotalSavings: Should return 0 for no services')
    }
  } catch (error) {
    console.log('❌ Test 6 failed:', error)
    results.failed += 2
    results.errors.push(`Test 6 error: ${error}`)
  }

  // Test 7: getUrgencyLevel
  console.log('\n📋 Test 7: getUrgencyLevel()')
  try {
    const overdue = WarrantyHelper.getUrgencyLevel(-5)
    const urgent = WarrantyHelper.getUrgencyLevel(2)
    const soon = WarrantyHelper.getUrgencyLevel(5)
    const upcoming = WarrantyHelper.getUrgencyLevel(15)

    if (overdue === 'OVERDUE' && urgent === 'URGENT' && soon === 'SOON' && upcoming === 'UPCOMING') {
      console.log('✅ Urgency levels correctly determined (-5=OVERDUE, 2=URGENT, 5=SOON, 15=UPCOMING)')
      results.passed++
    } else {
      console.log(`❌ Urgency levels incorrect (-5=${overdue}, 2=${urgent}, 5=${soon}, 15=${upcoming})`)
      results.failed++
      results.errors.push('getUrgencyLevel: Incorrect urgency categorization')
    }

    // Edge cases
    if (WarrantyHelper.getUrgencyLevel(0) === 'OVERDUE' &&
        WarrantyHelper.getUrgencyLevel(3) === 'URGENT' &&
        WarrantyHelper.getUrgencyLevel(7) === 'SOON' &&
        WarrantyHelper.getUrgencyLevel(8) === 'UPCOMING') {
      console.log('✅ Edge cases handled correctly (0=OVERDUE, 3=URGENT, 7=SOON, 8=UPCOMING)')
      results.passed++
    } else {
      console.log('❌ Edge case handling incorrect')
      results.failed++
      results.errors.push('getUrgencyLevel: Edge cases failed')
    }
  } catch (error) {
    console.log('❌ Test 7 failed:', error)
    results.failed += 2
    results.errors.push(`Test 7 error: ${error}`)
  }

  // Test 8: shouldSendReminder
  console.log('\n📋 Test 8: shouldSendReminder()')
  try {
    // Create machine with service due in 15 days (trigger day)
    const machine15Days = createTestMachine({
      saleDate: subMonths(addDays(new Date(), 15), 3), // Sale was 3 months minus 15 days ago
      warrantyPeriodMonths: 12
    })

    const shouldSend = WarrantyHelper.shouldSendReminder(machine15Days)

    if (shouldSend === true) {
      console.log('✅ Correctly identifies trigger day (15 days before service)')
      results.passed++
    } else {
      console.log('❌ Should send reminder on trigger day')
      results.failed++
      results.errors.push('shouldSendReminder: Trigger day not detected')
    }

    // Test with reminder already sent today
    const shouldNotSendToday = WarrantyHelper.shouldSendReminder(machine15Days, new Date())

    if (shouldNotSendToday === false) {
      console.log('✅ Prevents duplicate reminders on same day')
      results.passed++
    } else {
      console.log('❌ Should not send reminder twice in one day')
      results.failed++
      results.errors.push('shouldSendReminder: Duplicate prevention failed')
    }

    // Test with reminder sent yesterday
    const shouldSendAfterYesterday = WarrantyHelper.shouldSendReminder(machine15Days, subDays(new Date(), 1))

    if (shouldSendAfterYesterday === true) {
      console.log('✅ Allows reminder after previous day')
      results.passed++
    } else {
      console.log('❌ Should allow reminder after yesterday')
      results.failed++
      results.errors.push('shouldSendReminder: Should allow after previous day')
    }
  } catch (error) {
    console.log('❌ Test 8 failed:', error)
    results.failed += 3
    results.errors.push(`Test 8 error: ${error}`)
  }

  // Test 9: getAllServiceDates
  console.log('\n📋 Test 9: getAllServiceDates()')
  try {
    const machine = createTestMachine({
      saleDate: subMonths(new Date(), 6),
      warrantyPeriodMonths: 12
    })

    const allDates = WarrantyHelper.getAllServiceDates(machine)

    // With 12 month warranty and 3 month intervals, should have 4 service dates
    if (allDates.length === 4) {
      console.log(`✅ Correct number of service dates (${allDates.length})`)
      results.passed++
    } else {
      console.log(`❌ Expected 4 service dates, got ${allDates.length}`)
      results.failed++
      results.errors.push('getAllServiceDates: Incorrect count')
    }

    // Verify dates are 3 months apart
    if (allDates.length > 1) {
      const firstDate = allDates[0]
      const secondDate = allDates[1]
      const monthsDiff = Math.round((secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

      if (monthsDiff === 3) {
        console.log('✅ Service dates are 3 months apart')
        results.passed++
      } else {
        console.log(`❌ Service dates should be 3 months apart (got ${monthsDiff})`)
        results.failed++
        results.errors.push('getAllServiceDates: Incorrect interval')
      }
    }
  } catch (error) {
    console.log('❌ Test 9 failed:', error)
    results.failed += 2
    results.errors.push(`Test 9 error: ${error}`)
  }

  // Test 10: getWarrantyStatus (comprehensive)
  console.log('\n📋 Test 10: getWarrantyStatus() - Comprehensive')
  try {
    const machine = createTestMachine({
      saleDate: subMonths(new Date(), 3),
      warrantyPeriodMonths: 12,
      serviceRequests: [
        {
          id: '1',
          createdAt: new Date(),
          serviceVisit: {
            id: 'v1',
            serviceVisitDate: new Date(),
            status: 'COMPLETED'
          }
        }
      ]
    })

    const status = WarrantyHelper.getWarrantyStatus(machine)

    // Check all required fields exist
    const hasAllFields =
      typeof status.warrantyActive === 'boolean' &&
      (status.warrantyExpiry instanceof Date || status.warrantyExpiry === null) &&
      (status.nextServiceDue instanceof Date || status.nextServiceDue === null) &&
      (typeof status.daysUntilService === 'number' || status.daysUntilService === null) &&
      typeof status.healthScore === 'number' &&
      typeof status.riskLevel === 'string' &&
      (typeof status.urgencyLevel === 'string' || status.urgencyLevel === null) &&
      typeof status.totalSavings === 'number' &&
      typeof status.completedServices === 'number' &&
      typeof status.expectedServices === 'number' &&
      Array.isArray(status.allServiceDates)

    if (hasAllFields) {
      console.log('✅ Warranty status includes all required fields')
      results.passed++
    } else {
      console.log('❌ Warranty status missing fields')
      results.failed++
      results.errors.push('getWarrantyStatus: Missing required fields')
    }

    // Validate values make sense
    if (status.warrantyActive === true &&
        status.healthScore >= 0 && status.healthScore <= 100 &&
        ['LOW', 'MEDIUM', 'HIGH'].includes(status.riskLevel) &&
        status.completedServices === 1 &&
        status.totalSavings === 185000) {
      console.log('✅ Warranty status values are consistent and correct')
      results.passed++
    } else {
      console.log('❌ Warranty status values inconsistent')
      console.log(`   Active: ${status.warrantyActive}, Health: ${status.healthScore}, Risk: ${status.riskLevel}`)
      console.log(`   Completed: ${status.completedServices}, Savings: ${status.totalSavings}`)
      results.failed++
      results.errors.push('getWarrantyStatus: Inconsistent values')
    }
  } catch (error) {
    console.log('❌ Test 10 failed:', error)
    results.failed += 2
    results.errors.push(`Test 10 error: ${error}`)
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total:  ${results.passed + results.failed}`)
  console.log(`🎯 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:')
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }

  if (results.failed === 0) {
    console.log('\n🎉 All WarrantyHelper tests passed! Step 2 implementation complete.')
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the implementation.`)
  }

  return results.failed === 0
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal test error:', error)
    process.exit(1)
  })
