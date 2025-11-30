import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Import the route handlers
async function testAPIEndpoints() {
  console.log('🌐 Testing warranty API endpoints...\n')
  
  let tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  }
  
  try {
    // First, let's see if we have any machines to test with
    const machine = await prisma.machine.findFirst({
      include: {
        sale: true,
        machineModel: true,
        serviceRequests: {
          include: { serviceVisit: true }
        }
      }
    })
    
    if (!machine) {
      console.log('ℹ️  No machines found for API testing - creating test data...')
      
      // Create a test category
      const category = await prisma.category.create({
        data: {
          name: 'Test Category',
          shortCode: 'TEST',
          description: 'Test category for API validation'
        }
      })
      
      // Create a test machine model
      const machineModel = await prisma.machineModel.create({
        data: {
          name: 'Test Machine Model',
          shortCode: 'TM001',
          description: 'Test machine model',
          warrantyPeriodMonths: 12,
          categoryId: category.id
        }
      })
      
      // Create a test machine
      const testMachine = await prisma.machine.create({
        data: {
          serialNumber: 'TEST-API-001',
          manufacturingDate: new Date(),
          testResultData: {},
          machineModelId: machineModel.id
        }
      })
      
      // Create a test sale
      await prisma.sale.create({
        data: {
          machineId: testMachine.id,
          saleDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          customerName: 'Test Customer',
          customerContactPersonName: 'Test Contact',
          customerEmail: 'test@example.com',
          customerPhoneNumber: '1234567890',
          customerAddress: 'Test Address',
          whatsappNumber: '1234567890',
          reminderOptOut: false
        }
      })
      
      console.log('✅ Created test data for API testing')
      tests.passed++
    }
    
    // Test 1: Health API endpoint
    console.log('\nTest 1: Health API endpoint...')
    try {
      // Get a machine with relations
      const testMachine = await prisma.machine.findFirst({
        where: { sale: { isNot: null } },
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })
      
      if (testMachine) {
        // Import and test the health route handler
        const { GET } = await import('../app/api/machines/[serialNumber]/health/route')
        
        const mockRequest = new NextRequest('http://localhost:3000/api/machines/test/health')
        const mockParams = Promise.resolve({ serialNumber: testMachine.serialNumber })
        
        const response = await GET(mockRequest, { params: mockParams })
        const data = await response.json()
        
        if (response.status === 200 && 
            typeof data.healthScore === 'number' &&
            typeof data.riskLevel === 'string' &&
            typeof data.totalSavings === 'number') {
          console.log('✅ Health API endpoint working correctly')
          console.log(`   - Health Score: ${data.healthScore}`)
          console.log(`   - Risk Level: ${data.riskLevel}`)
          console.log(`   - Total Savings: ₹${data.totalSavings.toLocaleString('en-IN')}`)
          tests.passed++
        } else {
          console.log('❌ Health API endpoint response invalid')
          console.log('Response:', data)
          tests.failed++
          tests.errors.push('Health API endpoint returned invalid data')
        }
      } else {
        console.log('⚠️  No machine with sale found for health API test')
      }
    } catch (error) {
      console.log('❌ Error testing health API endpoint:', error)
      tests.failed++
      tests.errors.push(`Health API test error: ${error}`)
    }
    
    // Test 2: Machine API endpoint (updated with warranty info)
    console.log('\nTest 2: Machine API endpoint with warranty info...')
    try {
      const testMachine = await prisma.machine.findFirst({
        where: { sale: { isNot: null } }
      })
      
      if (testMachine) {
        // Import and test the machine route handler
        const { GET } = await import('../app/api/machines/[serialNumber]/route')
        
        const mockRequest = new NextRequest(`http://localhost:3000/api/machines/${testMachine.serialNumber}`)
        const mockParams = Promise.resolve({ serialNumber: testMachine.serialNumber })
        
        const response = await GET(mockRequest, { params: mockParams })
        const data = await response.json()
        
        if (response.status === 200 && 
            data.warrantyInfo &&
            typeof data.warrantyInfo.healthScore === 'number' &&
            typeof data.warrantyInfo.riskLevel === 'string') {
          console.log('✅ Machine API endpoint includes warranty info')
          console.log(`   - Serial: ${testMachine.serialNumber}`)
          console.log(`   - Warranty Health Score: ${data.warrantyInfo.healthScore}`)
          console.log(`   - Warranty Risk Level: ${data.warrantyInfo.riskLevel}`)
          tests.passed++
        } else {
          console.log('❌ Machine API endpoint missing warranty info')
          console.log('Response:', data)
          tests.failed++
          tests.errors.push('Machine API endpoint missing warranty info')
        }
      } else {
        console.log('⚠️  No machine with sale found for machine API test')
      }
    } catch (error) {
      console.log('❌ Error testing machine API endpoint:', error)
      tests.failed++
      tests.errors.push(`Machine API test error: ${error}`)
    }
    
    // Test 3: Health API with non-existent machine
    console.log('\nTest 3: Health API error handling...')
    try {
      const { GET } = await import('../app/api/machines/[serialNumber]/health/route')
      
      const mockRequest = new NextRequest('http://localhost:3000/api/machines/non-existent/health')
      const mockParams = Promise.resolve({ serialNumber: 'non-existent-serial' })
      
      const response = await GET(mockRequest, { params: mockParams })
      
      if (response.status === 404) {
        console.log('✅ Health API correctly handles non-existent machine')
        tests.passed++
      } else {
        console.log(`❌ Expected 404, got ${response.status}`)
        tests.failed++
        tests.errors.push('Health API error handling failed')
      }
    } catch (error) {
      console.log('❌ Error testing health API error handling:', error)
      tests.failed++
      tests.errors.push(`Health API error handling test error: ${error}`)
    }
    
    // Test 4: Performance test
    console.log('\nTest 4: API performance test...')
    try {
      const machines = await prisma.machine.findMany({
        where: { sale: { isNot: null } },
        take: 5,
        include: {
          sale: true,
          machineModel: true,
          serviceRequests: {
            include: { serviceVisit: true }
          }
        }
      })
      
      if (machines.length > 0) {
        const startTime = Date.now()
        
        // Test calculating warranty info for multiple machines
        for (const machine of machines) {
          const { WarrantyHelper } = await import('../lib/warranty-helper')
          WarrantyHelper.getHealthScore(machine)
          WarrantyHelper.getNextServiceDue(machine)
          WarrantyHelper.getTotalSavings(machine)
          WarrantyHelper.isWarrantyActive(machine)
        }
        
        const endTime = Date.now()
        const duration = endTime - startTime
        const avgPerMachine = duration / machines.length
        
        if (avgPerMachine < 50) { // Should be under 50ms per machine
          console.log(`✅ Performance test passed: ${avgPerMachine.toFixed(2)}ms per machine`)
          tests.passed++
        } else {
          console.log(`❌ Performance test failed: ${avgPerMachine.toFixed(2)}ms per machine (>50ms)`)
          tests.failed++
          tests.errors.push(`Performance too slow: ${avgPerMachine.toFixed(2)}ms per machine`)
        }
      } else {
        console.log('⚠️  No machines for performance test')
      }
    } catch (error) {
      console.log('❌ Error in performance test:', error)
      tests.failed++
      tests.errors.push(`Performance test error: ${error}`)
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during API tests:', error)
    tests.errors.push(`Fatal error: ${error}`)
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('API ENDPOINT TEST SUMMARY')
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
    console.log('\n🎉 All API tests passed! Endpoints are working correctly.')
  } else {
    console.log('\n⚠️  Some API tests failed. Please check the implementation.')
  }
  
  return tests.failed === 0
}

testAPIEndpoints()
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