import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

export class TestDatabase {
  private prisma: PrismaClient | null = null
  private originalDatabaseUrl: string | undefined

  async start() {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      // Use SQLite for testing if no DATABASE_URL
      process.env.DATABASE_URL = 'file:./test.db'
      console.log('⚠️  No DATABASE_URL found, using SQLite for E2E tests')
    } else {
      console.log(`✓ Using database for E2E tests: ${process.env.DATABASE_URL.split('@')[1] || 'configured database'}`)
    }

    this.originalDatabaseUrl = process.env.DATABASE_URL

    try {
      // Initialize Prisma client
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      await this.prisma.$connect()
      console.log('✓ Test database connected')

      return this.prisma
    } catch (error) {
      console.error('✗ Failed to connect to test database:', error)
      throw error
    }
  }

  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Test database not initialized. Call start() first.')
    }
    return this.prisma
  }

  async cleanup() {
    if (!this.prisma) return

    try {
      // Delete in correct order to respect foreign key constraints
      await this.prisma.$transaction([
        this.prisma.serviceVisit.deleteMany(),
        this.prisma.serviceRequest.deleteMany(),
        this.prisma.sale.deleteMany(),
        this.prisma.machine.deleteMany(),
        this.prisma.machineModel.deleteMany(),
        this.prisma.category.deleteMany(),
      ])

      console.log('✓ Test data cleaned up')
    } catch (error) {
      console.error('✗ Failed to cleanup test data:', error)
      throw error
    }
  }

  async stop() {
    if (this.prisma) {
      await this.prisma.$disconnect()
      console.log('✓ Test database disconnected')
    }

    // Restore original DATABASE_URL
    if (this.originalDatabaseUrl) {
      process.env.DATABASE_URL = this.originalDatabaseUrl
    }
  }
}
