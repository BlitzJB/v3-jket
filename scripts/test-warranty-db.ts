import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseChanges() {
  console.log('🧪 Testing warranty reminder database changes...\n')
  
  const tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  }
  
  try {
    // Test 1: Check if Sale table has new fields
    console.log('Test 1: Checking Sale table fields...')
    try {
      const testSale = await prisma.sale.findFirst()
      if (testSale) {
        const hasWhatsappField = 'whatsappNumber' in testSale
        const hasOptOutField = 'reminderOptOut' in testSale
        
        if (hasWhatsappField && hasOptOutField) {
          console.log('✅ Sale table has new fields')
          tests.passed++
        } else {
          console.log('❌ Sale table missing fields')
          tests.failed++
          tests.errors.push('Sale table missing whatsappNumber or reminderOptOut fields')
        }
      } else {
        console.log('⚠️  No sales records found to test')
      }
    } catch (error) {
      console.log('❌ Error checking Sale fields:', error)
      tests.failed++
      tests.errors.push(`Sale field check error: ${error}`)
    }
    
    // Test 2: Check if ActionLog table exists and can be written to
    console.log('\nTest 2: Testing ActionLog table...')
    try {
      const testLog = await prisma.actionLog.create({
        data: {
          machineId: 'test-machine-001',
          actionType: 'TEST_ACTION',
          channel: 'TEST',
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      })
      
      console.log('✅ ActionLog created successfully:', testLog.id)
      tests.passed++
      
      // Clean up test data
      await prisma.actionLog.delete({
        where: { id: testLog.id }
      })
      console.log('✅ ActionLog cleanup successful')
      
    } catch (error) {
      console.log('❌ Error with ActionLog table:', error)
      tests.failed++
      tests.errors.push(`ActionLog table error: ${error}`)
    }
    
    // Test 3: Check ActionLog indexes
    console.log('\nTest 3: Testing ActionLog queries with indexes...')
    try {
      const logs = await prisma.actionLog.findMany({
        where: {
          machineId: 'test-machine-001',
          actionType: 'REMINDER_SENT'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
      
      console.log(`✅ ActionLog query successful (found ${logs.length} records)`)
      tests.passed++
      
    } catch (error) {
      console.log('❌ Error querying ActionLog:', error)
      tests.failed++
      tests.errors.push(`ActionLog query error: ${error}`)
    }
    
    // Test 4: Test default values
    console.log('\nTest 4: Testing default values...')
    try {
      // Check a sale for default values
      const saleWithDefaults = await prisma.sale.findFirst({
        select: {
          id: true,
          reminderOptOut: true,
          whatsappNumber: true
        }
      })
      
      if (saleWithDefaults) {
        const hasCorrectDefaults = 
          saleWithDefaults.reminderOptOut !== null &&
          typeof saleWithDefaults.reminderOptOut === 'boolean'
        
        if (hasCorrectDefaults) {
          console.log('✅ Default values are correctly set')
          console.log(`   - reminderOptOut: ${saleWithDefaults.reminderOptOut}`)
          console.log(`   - whatsappNumber: ${saleWithDefaults.whatsappNumber || 'null/empty'}`)
          tests.passed++
        } else {
          console.log('❌ Default values not properly set')
          tests.failed++
          tests.errors.push('Default values not properly initialized')
        }
      }
    } catch (error) {
      console.log('❌ Error checking default values:', error)
      tests.failed++
      tests.errors.push(`Default values check error: ${error}`)
    }
    
    // Test 5: Test ActionLog metadata field (JSON)
    console.log('\nTest 5: Testing ActionLog metadata (JSON) field...')
    try {
      const complexMetadata = {
        daysUntilService: 7,
        healthScore: 85.5,
        urgency: 'SOON',
        emailSent: true,
        attempts: [
          { timestamp: new Date().toISOString(), status: 'success' }
        ]
      }
      
      const logWithMetadata = await prisma.actionLog.create({
        data: {
          machineId: 'test-machine-002',
          actionType: 'REMINDER_SENT',
          channel: 'EMAIL',
          metadata: complexMetadata
        }
      })
      
      // Verify we can read it back
      const retrieved = await prisma.actionLog.findUnique({
        where: { id: logWithMetadata.id }
      })
      
      if (retrieved && retrieved.metadata) {
        // Check if the metadata was stored (type checking for JSON)
        const metadataStored = typeof retrieved.metadata === 'object'
        
        if (metadataStored) {
          console.log('✅ ActionLog metadata field works correctly')
          console.log(`   - Stored metadata type: ${typeof retrieved.metadata}`)
          tests.passed++
        } else {
          console.log('❌ ActionLog metadata field issue')
          console.log(`   - Retrieved metadata: ${JSON.stringify(retrieved.metadata)}`)
          tests.failed++
          tests.errors.push('Metadata field not storing as JSON object')
        }
      } else {
        console.log('❌ ActionLog metadata field issue - no data retrieved')
        tests.failed++
        tests.errors.push('Metadata field not retrieving data')
      }
      
      // Clean up
      await prisma.actionLog.delete({
        where: { id: logWithMetadata.id }
      })
      
    } catch (error) {
      console.log('❌ Error testing metadata field:', error)
      tests.failed++
      tests.errors.push(`Metadata field error: ${error}`)
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during tests:', error)
    tests.errors.push(`Fatal error: ${error}`)
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('TEST SUMMARY')
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
    console.log('\n🎉 All database tests passed! Ready for warranty reminder implementation.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the migration and try again.')
  }
  
  return tests.failed === 0
}

testDatabaseChanges()
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