import { PrismaClient } from '@prisma/client'
import { addMonths, subMonths, addDays, subDays } from 'date-fns'

export class MachineFactory {
  constructor(private prisma: PrismaClient) {}

  async createCategory(overrides: any = {}) {
    return await this.prisma.category.create({
      data: {
        name: overrides.name || 'Test Category',
        shortCode: overrides.shortCode || `TC-${Date.now()}`,
        description: overrides.description || 'Test category for E2E tests',
        ...overrides
      }
    })
  }

  async createModel(categoryId: string, overrides: any = {}) {
    return await this.prisma.machineModel.create({
      data: {
        name: overrides.name || 'Test Model',
        shortCode: overrides.shortCode || `TM-${Date.now()}`,
        warrantyPeriodMonths: overrides.warrantyPeriodMonths || 12,
        categoryId,
        ...overrides
      }
    })
  }

  async createMachine(modelId: string, overrides: any = {}) {
    return await this.prisma.machine.create({
      data: {
        serialNumber: overrides.serialNumber || `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        machineModelId: modelId,
        manufacturingDate: overrides.manufacturingDate || subMonths(new Date(), 7),
        testResultData: overrides.testResultData || {},
        ...overrides
      }
    })
  }

  async createSale(machineId: string, overrides: any = {}) {
    return await this.prisma.sale.create({
      data: {
        machineId,
        saleDate: overrides.saleDate || subMonths(new Date(), 6),
        customerName: overrides.customerName || 'Test Customer',
        customerEmail: overrides.customerEmail || `customer-${Date.now()}@test.com`,
        customerPhoneNumber: overrides.customerPhoneNumber || '1234567890',
        customerAddress: overrides.customerAddress || 'Test Address',
        customerContactPersonName: overrides.customerContactPersonName || 'Test Contact',
        ...overrides
      }
    })
  }

  async createServiceRequest(machineId: string, overrides: any = {}) {
    return await this.prisma.serviceRequest.create({
      data: {
        machineId,
        complaint: overrides.complaint || 'Test issue',
        ...overrides
      }
    })
  }

  async createServiceVisit(serviceRequestId: string, overrides: any = {}) {
    // First, find an engineer user or create a mock ID
    const engineerId = overrides.engineerId || 'test-engineer-id'

    return await this.prisma.serviceVisit.create({
      data: {
        serviceRequestId,
        engineerId,
        serviceVisitDate: overrides.serviceVisitDate || new Date(),
        status: overrides.status || 'COMPLETED',
        ...overrides
      }
    })
  }

  /**
   * Helper: Create complete machine with sale (service due in X days)
   *
   * Logic:
   * - Next service = saleDate + 3 months
   * - We want: saleDate + 3 months = today + days
   * - So: saleDate = today + days - 3 months
   */
  async createMachineWithServiceDueIn(days: number) {
    const category = await this.createCategory()
    const model = await this.createModel(category.id, {
      warrantyPeriodMonths: 12
    })

    // Calculate sale date such that next service is due in 'days' days
    const saleDate = subMonths(addDays(new Date(), days), 3)

    const machine = await this.createMachine(model.id)
    const sale = await this.createSale(machine.id, { saleDate })

    // Reload machine with relations
    const machineWithRelations = await this.prisma.machine.findUnique({
      where: { id: machine.id },
      include: {
        machineModel: true,
        sale: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })

    return { category, model, machine: machineWithRelations!, sale }
  }

  /**
   * Helper: Create machine with service overdue by X days
   */
  async createMachineWithServiceOverdueBy(days: number) {
    return await this.createMachineWithServiceDueIn(-days)
  }

  /**
   * Helper: Create machine with expired warranty
   */
  async createMachineWithExpiredWarranty() {
    const category = await this.createCategory()
    const model = await this.createModel(category.id, {
      warrantyPeriodMonths: 12
    })

    const machine = await this.createMachine(model.id)
    // Sold 13 months ago - warranty expired
    const sale = await this.createSale(machine.id, {
      saleDate: subMonths(new Date(), 13)
    })

    const machineWithRelations = await this.prisma.machine.findUnique({
      where: { id: machine.id },
      include: {
        machineModel: true,
        sale: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })

    return { category, model, machine: machineWithRelations!, sale }
  }

  /**
   * Helper: Create machine with opt-out
   */
  async createMachineWithOptOut() {
    const { category, model, machine, sale } = await this.createMachineWithServiceDueIn(15)

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: { reminderOptOut: true }
    })

    const updatedMachine = await this.prisma.machine.findUnique({
      where: { id: machine!.id },
      include: {
        machineModel: true,
        sale: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })

    return { category, model, machine: updatedMachine!, sale }
  }

  /**
   * Helper: Create machine without email
   */
  async createMachineWithoutEmail() {
    const { category, model, machine, sale } = await this.createMachineWithServiceDueIn(15)

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: { customerEmail: '' }
    })

    const updatedMachine = await this.prisma.machine.findUnique({
      where: { id: machine!.id },
      include: {
        machineModel: true,
        sale: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })

    return { category, model, machine: updatedMachine!, sale }
  }

  /**
   * Helper: Create machine with completed service visits
   */
  async createMachineWithCompletedServices(serviceCount: number) {
    const { category, model, machine, sale } = await this.createMachineWithServiceDueIn(15)

    // Create service requests and visits
    for (let i = 0; i < serviceCount; i++) {
      const serviceRequest = await this.createServiceRequest(machine!.id)
      await this.createServiceVisit(serviceRequest.id, {
        status: 'COMPLETED',
        serviceVisitDate: subMonths(new Date(), (i + 1) * 3) // Every 3 months
      })
    }

    const updatedMachine = await this.prisma.machine.findUnique({
      where: { id: machine!.id },
      include: {
        machineModel: true,
        sale: true,
        serviceRequests: {
          include: {
            serviceVisit: true
          }
        }
      }
    })

    return { category, model, machine: updatedMachine!, sale }
  }
}
