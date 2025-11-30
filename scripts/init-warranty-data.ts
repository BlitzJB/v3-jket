import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Initializing warranty reminder preferences...')
  
  try {
    // Count existing sales
    const totalSales = await prisma.sale.count()
    console.log(`Found ${totalSales} sales records`)
    
    if (totalSales > 0) {
      // Get all sales to check their current state
      const allSales = await prisma.sale.findMany({
        select: {
          id: true,
          reminderOptOut: true,
          whatsappNumber: true,
          customerPhoneNumber: true
        }
      })
      
      // Update sales that need defaults
      let updatedCount = 0
      for (const sale of allSales) {
        const updates: any = {}
        
        // Set reminderOptOut to false if it's not already set
        if (sale.reminderOptOut === null || sale.reminderOptOut === undefined) {
          updates.reminderOptOut = false
        }
        
        // Set whatsappNumber from phone number if not set
        if (!sale.whatsappNumber && sale.customerPhoneNumber) {
          updates.whatsappNumber = sale.customerPhoneNumber
        }
        
        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await prisma.sale.update({
            where: { id: sale.id },
            data: updates
          })
          updatedCount++
        }
      }
      
      console.log(`✅ Updated ${updatedCount} sales records with default values`)
    } else {
      console.log('ℹ️  No sales records to update')
    }
    
    // Create a test action log entry to verify the table works
    const testLog = await prisma.actionLog.create({
      data: {
        machineId: 'system-init',
        actionType: 'SYSTEM_INITIALIZED',
        channel: 'SYSTEM',
        metadata: {
          script: 'init-warranty-data.ts',
          timestamp: new Date().toISOString()
        }
      }
    })
    
    console.log('✅ Created test ActionLog entry:', testLog.id)
    
    // Clean up the test entry
    await prisma.actionLog.delete({
      where: { id: testLog.id }
    })
    
    console.log('✅ Warranty reminder initialization complete!')
    
  } catch (error) {
    console.error('❌ Error during initialization:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })