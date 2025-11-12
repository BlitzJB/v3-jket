import { PrismaClient } from '@prisma/client'
import { WarrantyHelper } from '../lib/warranty-helper'
import { addMonths, subDays, addDays, differenceInDays } from 'date-fns'

const prisma = new PrismaClient()

async function testWarrantyCalculations() {
  console.log('🧮 Testing warranty calculation logic...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  }
  
  // Create mock machine data for testing
  const mockMachineNew = {
    id: 'test-new',
    serialNumber: 'NEW-001',
    sale: null,
    machineModel: {
      warrantyPeriodMonths: 12,
      name: 'Test Machine'
    },
    serviceRequests: []
  } as any
  
  const mockMachineWithSale = {
    id: 'test-sale',
    serialNumber: 'SALE-001',
    sale: {
      saleDate: subDays(new Date(), 30), // 30 days ago - recent sale
      customerName: 'Test Customer'
    },
    machineModel: {
      warrantyPeriodMonths: 12,
      name: 'Test Machine'
    },
    serviceRequests: []
  } as any
  
  const mockMachineWithServices = {
    id: 'test-services',
    serialNumber: 'SERV-001',
    sale: {
      saleDate: subDays(new Date(), 200), // 200 days ago
      customerName: 'Test Customer'
    },
    machineModel: {
      warrantyPeriodMonths: 12,
      name: 'Test Machine'
    },
    serviceRequests: [
      {
        serviceVisit: {
          status: 'COMPLETED',
          serviceVisitDate: subDays(new Date(), 100) // 100 days ago
        }
      },
      {
        serviceVisit: {
          status: 'COMPLETED',
          serviceVisitDate: subDays(new Date(), 50) // 50 days ago
        }
      },
      {
        serviceVisit: {
          status: 'PENDING',
          serviceVisitDate: subDays(new Date(), 10) // 10 days ago
        }
      }
    ]
  } as any
  
  const mockMachineOverdue = {
    id: 'test-overdue',
    serialNumber: 'OVER-001',
    sale: {
      saleDate: subDays(new Date(), 150), // 5+ months ago
      customerName: 'Test Customer'
    },
    machineModel: {
      warrantyPeriodMonths: 12,
      name: 'Test Machine'
    },
    serviceRequests: []
  } as any
  
  try {
    // Test 1: New machine (no sale) should have 100 health score
    console.log('Test 1: New machine health score...')
    try {
      const healthScore = WarrantyHelper.getHealthScore(mockMachineNew)
      if (healthScore === 100) {
        console.log('✅ New machine has 100 health score')
        tests.passed++
      } else {
        console.log(`❌ Expected 100, got ${healthScore}`)
        tests.failed++
        tests.errors.push(`New machine health score: expected 100, got ${healthScore}`)
      }
    } catch (error) {
      console.log('❌ Error testing new machine health score:', error)
      tests.failed++
      tests.errors.push(`New machine test error: ${error}`)
    }
    
    // Test 2: Machine with recent sale should have high health score
    console.log('\nTest 2: Recent sale health score...')
    try {
      const healthScore = WarrantyHelper.getHealthScore(mockMachineWithSale)
      if (healthScore >= 70 && healthScore <= 100) {
        console.log(`✅ Recent sale has good health score: ${healthScore}`)
        tests.passed++
      } else {
        console.log(`❌ Expected 70-100, got ${healthScore}`)
        tests.failed++
        tests.errors.push(`Recent sale health score out of range: ${healthScore}`)
      }
    } catch (error) {
      console.log('❌ Error testing recent sale health score:', error)
      tests.failed++
      tests.errors.push(`Recent sale test error: ${error}`)
    }
    
    // Test 3: Overdue machine should have lower health score
    console.log('\nTest 3: Overdue machine health score...')
    try {
      const healthScore = WarrantyHelper.getHealthScore(mockMachineOverdue)
      if (healthScore < 100) {
        console.log(`✅ Overdue machine has reduced health score: ${healthScore}`)
        tests.passed++
      } else {
        console.log(`❌ Expected < 100, got ${healthScore}`)
        tests.failed++
        tests.errors.push(`Overdue machine should have reduced health score: ${healthScore}`)
      }
    } catch (error) {
      console.log('❌ Error testing overdue machine health score:', error)
      tests.failed++
      tests.errors.push(`Overdue machine test error: ${error}`)
    }
    
    // Test 4: Risk level calculation
    console.log('\nTest 4: Risk level calculation...')
    try {
      const riskLow = WarrantyHelper.getRiskLevel(85)
      const riskMedium = WarrantyHelper.getRiskLevel(65)
      const riskHigh = WarrantyHelper.getRiskLevel(45)
      const riskCritical = WarrantyHelper.getRiskLevel(25)
      
      if (riskLow === 'LOW' && riskMedium === 'MEDIUM' && riskHigh === 'HIGH' && riskCritical === 'CRITICAL') {
        console.log('✅ Risk levels calculated correctly')
        tests.passed++
      } else {
        console.log(`❌ Risk levels incorrect: ${riskLow}, ${riskMedium}, ${riskHigh}, ${riskCritical}`)
        tests.failed++
        tests.errors.push('Risk level calculation failed')
      }
    } catch (error) {
      console.log('❌ Error testing risk levels:', error)
      tests.failed++
      tests.errors.push(`Risk level test error: ${error}`)
    }
    
    // Test 5: Next service due calculation
    console.log('\nTest 5: Next service due calculation...')
    try {
      const nextDue = WarrantyHelper.getNextServiceDue(mockMachineWithSale)
      const expectedDue = addMonths(mockMachineWithSale.sale.saleDate, 3)
      
      if (nextDue && nextDue.getTime() === expectedDue.getTime()) {
        console.log(`✅ Next service due calculated correctly: ${nextDue}`)
        tests.passed++
      } else {
        console.log(`❌ Expected ${expectedDue}, got ${nextDue}`)
        tests.failed++
        tests.errors.push(`Next service due calculation incorrect`)
      }
    } catch (error) {
      console.log('❌ Error testing next service due:', error)
      tests.failed++
      tests.errors.push(`Next service due test error: ${error}`)
    }
    
    // Test 6: Total savings calculation
    console.log('\nTest 6: Total savings calculation...')
    try {
      const savings = WarrantyHelper.getTotalSavings(mockMachineWithServices)
      const expectedSavings = 2 * (200000 - 15000) // 2 completed services
      
      if (savings === expectedSavings) {
        console.log(`✅ Total savings calculated correctly: ₹${savings.toLocaleString('en-IN')}`)
        tests.passed++
      } else {
        console.log(`❌ Expected ₹${expectedSavings.toLocaleString('en-IN')}, got ₹${savings.toLocaleString('en-IN')}`)
        tests.failed++
        tests.errors.push(`Total savings calculation incorrect`)
      }
    } catch (error) {
      console.log('❌ Error testing total savings:', error)
      tests.failed++
      tests.errors.push(`Total savings test error: ${error}`)
    }
    
    // Test 7: Warranty active check
    console.log('\nTest 7: Warranty active check...')
    try {
      const activeRecent = WarrantyHelper.isWarrantyActive(mockMachineWithSale)
      const activeOld = WarrantyHelper.isWarrantyActive({
        ...mockMachineWithSale,
        sale: {
          ...mockMachineWithSale.sale,
          saleDate: subDays(new Date(), 400) // Very old sale - over a year ago
        }
      })
      
      if (activeRecent === true && activeOld === false) {
        console.log('✅ Warranty active check works correctly')
        tests.passed++
      } else {
        console.log(`❌ Warranty active check failed: recent=${activeRecent}, old=${activeOld}`)
        tests.failed++
        tests.errors.push('Warranty active check failed')
      }
    } catch (error) {
      console.log('❌ Error testing warranty active:', error)
      tests.failed++
      tests.errors.push(`Warranty active test error: ${error}`)
    }
    
    // Test 8: Reminder timing logic
    console.log('\nTest 8: Reminder timing logic...')
    try {
      // Create a machine where service is due in exactly 7 days
      const today = new Date()
      const targetServiceDate = addDays(today, 7) // Service due in 7 days
      const saleDate = addMonths(targetServiceDate, -3) // Sale was 3 months before service due
      
      const machineReminder = {
        ...mockMachineWithSale,
        sale: {
          ...mockMachineWithSale.sale,
          saleDate: saleDate
        }
      }
      
      // Debug: Check what the actual calculation gives us
      const nextDue = WarrantyHelper.getNextServiceDue(machineReminder)
      const daysUntilDue = nextDue ? differenceInDays(nextDue, new Date()) : null
      
      console.log(`   Debug: Sale date: ${saleDate.toISOString().split('T')[0]}`)
      console.log(`   Debug: Next due: ${nextDue?.toISOString().split('T')[0]}`)
      console.log(`   Debug: Days until due: ${daysUntilDue}`)
      
      const shouldSend = WarrantyHelper.shouldSendReminder(machineReminder)
      
      if (shouldSend === true) {
        console.log('✅ Reminder timing logic works correctly')
        tests.passed++
      } else {
        console.log(`❌ Expected reminder to be sent, got ${shouldSend}`)
        tests.failed++
        tests.errors.push(`Reminder timing logic failed - days until due: ${daysUntilDue}`)
      }
    } catch (error) {
      console.log('❌ Error testing reminder timing:', error)
      tests.failed++
      tests.errors.push(`Reminder timing test error: ${error}`)
    }
    
    // Test 9: Urgency level calculation
    console.log('\nTest 9: Urgency level calculation...')
    try {
      const overdue = WarrantyHelper.getUrgencyLevel(-5)
      const urgent = WarrantyHelper.getUrgencyLevel(2)
      const soon = WarrantyHelper.getUrgencyLevel(5)
      const upcoming = WarrantyHelper.getUrgencyLevel(10)
      
      if (overdue === 'OVERDUE' && urgent === 'URGENT' && soon === 'SOON' && upcoming === 'UPCOMING') {
        console.log('✅ Urgency levels calculated correctly')
        tests.passed++
      } else {
        console.log(`❌ Urgency levels incorrect: ${overdue}, ${urgent}, ${soon}, ${upcoming}`)
        tests.failed++
        tests.errors.push('Urgency level calculation failed')
      }
    } catch (error) {
      console.log('❌ Error testing urgency levels:', error)
      tests.failed++
      tests.errors.push(`Urgency level test error: ${error}`)
    }
    
    // Test 10: Date formatting
    console.log('\nTest 10: Date formatting...')
    try {
      const formatted = WarrantyHelper.formatServiceDate(new Date('2024-04-15'))
      
      if (formatted && formatted.includes('April') && formatted.includes('15') && formatted.includes('2024')) {
        console.log(`✅ Date formatting works correctly: ${formatted}`)
        tests.passed++
      } else {
        console.log(`❌ Date formatting failed: ${formatted}`)
        tests.failed++
        tests.errors.push('Date formatting failed')
      }
    } catch (error) {
      console.log('❌ Error testing date formatting:', error)
      tests.failed++
      tests.errors.push(`Date formatting test error: ${error}`)
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during calculation tests:', error)
    tests.errors.push(`Fatal error: ${error}`)
  }
  
  // Test with real database if machines exist
  console.log('\n' + '='.repeat(50))
  console.log('TESTING WITH REAL DATABASE')
  console.log('='.repeat(50))
  
  try {
    const realMachine = await prisma.machine.findFirst({
      where: { sale: { isNot: null } },
      include: {
        sale: true,
        machineModel: true,
        serviceRequests: {
          include: { serviceVisit: true }
        }
      }
    })
    
    if (realMachine) {
      console.log(`\nTesting with real machine: ${realMachine.serialNumber}`)
      
      const healthScore = WarrantyHelper.getHealthScore(realMachine)
      const nextService = WarrantyHelper.getNextServiceDue(realMachine)
      const savings = WarrantyHelper.getTotalSavings(realMachine)
      const warrantyActive = WarrantyHelper.isWarrantyActive(realMachine)
      
      console.log(`- Health Score: ${healthScore}/100`)
      console.log(`- Risk Level: ${WarrantyHelper.getRiskLevel(healthScore)}`)
      console.log(`- Next Service: ${nextService ? WarrantyHelper.formatServiceDate(nextService) : 'N/A'}`)
      console.log(`- Total Savings: ₹${savings.toLocaleString('en-IN')}`)
      console.log(`- Warranty Active: ${warrantyActive}`)
      
      console.log('✅ Real machine calculations completed successfully')
      tests.passed++
    } else {
      console.log('ℹ️  No machines with sales found for real-world testing')
    }
  } catch (error) {
    console.log('❌ Error testing with real machine:', error)
    tests.failed++
    tests.errors.push(`Real machine test error: ${error}`)
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('CALCULATION TEST SUMMARY')
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
    console.log('\n🎉 All calculation tests passed! Warranty helper is working correctly.')
  } else {
    console.log('\n⚠️  Some calculation tests failed. Please check the implementation.')
  }
  
  return tests.failed === 0
}

testWarrantyCalculations()
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