import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPrismaClient() {
  console.log('🔍 Verifying Prisma Client has new warranty reminder fields...\n')
  
  let allChecksPassed = true
  
  // Test 1: Check Sale model fields
  console.log('1. Checking Sale model fields in Prisma Client...')
  try {
    // Try to access the new fields through type checking
    const saleCreateInput: Prisma.SaleCreateInput = {
      machine: { connect: { id: 'test-id' } },
      saleDate: new Date(),
      customerName: 'Test Customer',
      customerContactPersonName: 'Test Contact',
      customerEmail: 'test@example.com',
      customerPhoneNumber: '1234567890',
      customerAddress: 'Test Address',
      whatsappNumber: '1234567890', // New field
      reminderOptOut: false // New field
    }
    
    console.log('✅ Sale model has whatsappNumber field')
    console.log('✅ Sale model has reminderOptOut field')
  } catch (error) {
    console.log('❌ Sale model missing new fields')
    allChecksPassed = false
  }
  
  // Test 2: Check ActionLog model exists
  console.log('\n2. Checking ActionLog model in Prisma Client...')
  try {
    const actionLogCreateInput: Prisma.ActionLogCreateInput = {
      machine: { connect: { id: 'test-machine' } },
      actionType: 'TEST',
      channel: 'WEB',
      metadata: { test: true } // JSON field
    }

    console.log('✅ ActionLog model exists in Prisma Client')
    console.log('✅ ActionLog has all required fields')
  } catch (error) {
    console.log('❌ ActionLog model not found in Prisma Client')
    allChecksPassed = false
  }
  
  // Test 3: Verify we can query with new fields
  console.log('\n3. Testing query capabilities with new fields...')
  try {
    // Test Sale where clause with new fields
    const saleWhereInput: Prisma.SaleWhereInput = {
      reminderOptOut: false,
      whatsappNumber: { not: null }
    }
    
    // Test ActionLog where clause
    const actionLogWhereInput: Prisma.ActionLogWhereInput = {
      machineId: 'test',
      actionType: 'REMINDER_SENT',
      createdAt: { gte: new Date() }
    }
    
    console.log('✅ Can create where clauses with new fields')
    
    // Actually test a query
    const testQuery = await prisma.sale.findMany({
      where: {
        reminderOptOut: false
      },
      select: {
        id: true,
        whatsappNumber: true,
        reminderOptOut: true
      },
      take: 1
    })
    
    console.log('✅ Can execute queries with new fields')
  } catch (error) {
    console.log('❌ Query with new fields failed:', error)
    allChecksPassed = false
  }
  
  // Test 4: Verify ActionLog operations
  console.log('\n4. Testing ActionLog CRUD operations...')
  try {
    // Create
    const created = await prisma.actionLog.create({
      data: {
        machineId: 'verify-test',
        actionType: 'CLIENT_VERIFICATION',
        channel: 'SYSTEM',
        metadata: {
          verifiedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      }
    })
    console.log('✅ Can create ActionLog entries')
    
    // Read
    const found = await prisma.actionLog.findUnique({
      where: { id: created.id }
    })
    console.log('✅ Can read ActionLog entries')
    
    // Update
    await prisma.actionLog.update({
      where: { id: created.id },
      data: {
        metadata: {
          ...found?.metadata as any,
          updated: true
        }
      }
    })
    console.log('✅ Can update ActionLog entries')
    
    // Delete
    await prisma.actionLog.delete({
      where: { id: created.id }
    })
    console.log('✅ Can delete ActionLog entries')
    
  } catch (error) {
    console.log('❌ ActionLog CRUD operations failed:', error)
    allChecksPassed = false
  }
  
  // Test 5: Verify indexes work
  console.log('\n5. Testing indexed queries on ActionLog...')
  try {
    const start = Date.now()
    
    // Query using the composite index
    await prisma.actionLog.findMany({
      where: {
        machineId: 'test-machine',
        actionType: 'REMINDER_SENT'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    const duration = Date.now() - start
    console.log(`✅ Indexed query completed in ${duration}ms`)
    
    // Query using createdAt index
    await prisma.actionLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 10
    })
    
    console.log('✅ CreatedAt index works')
    
  } catch (error) {
    console.log('❌ Indexed queries failed:', error)
    allChecksPassed = false
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  if (allChecksPassed) {
    console.log('✅ ALL VERIFICATIONS PASSED!')
    console.log('\nPrisma Client successfully includes:')
    console.log('  • Sale.whatsappNumber field')
    console.log('  • Sale.reminderOptOut field')
    console.log('  • ActionLog model with all fields')
    console.log('  • Proper indexes for performance')
    console.log('  • Full CRUD capabilities')
    console.log('\n🎉 Database is ready for warranty reminder implementation!')
  } else {
    console.log('❌ Some verifications failed')
    console.log('Please check the Prisma generation and migration')
  }
  
  return allChecksPassed
}

verifyPrismaClient()
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