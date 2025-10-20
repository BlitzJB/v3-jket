import { subMonths, addDays, subDays } from 'date-fns'

export const createMockMachine = (overrides: any = {}) => {
  const defaultMachine = {
    id: 'test-machine-1',
    serialNumber: 'TEST-001',
    manufacturingDate: new Date('2024-01-01'),
    machineModel: {
      name: 'Test Machine Model',
      warrantyPeriodMonths: 12
    },
    sale: {
      saleDate: subMonths(new Date(), 6),
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhoneNumber: '1234567890',
      customerAddress: 'Test Address',
      reminderOptOut: false,
      whatsappNumber: '1234567890'
    },
    serviceRequests: []
  }

  return {
    ...defaultMachine,
    ...overrides,
    machineModel: {
      ...defaultMachine.machineModel,
      ...(overrides.machineModel || {})
    },
    sale: overrides.sale === null ? null : {
      ...defaultMachine.sale,
      ...(overrides.sale || {})
    },
    serviceRequests: overrides.serviceRequests || []
  }
}

export const createMachineServiceDueIn = (days: number) => {
  return createMockMachine({
    sale: {
      saleDate: subMonths(addDays(new Date(), days), 3) // Service due in 'days' days
    }
  })
}

export const createMachineServiceOverdueBy = (days: number) => {
  return createMockMachine({
    sale: {
      saleDate: subMonths(subDays(new Date(), days), 3) // Service overdue by 'days' days
    }
  })
}

export const createMachineWithExpiredWarranty = () => {
  return createMockMachine({
    sale: {
      saleDate: subMonths(new Date(), 15) // Warranty expired (12 month warranty)
    },
    machineModel: {
      warrantyPeriodMonths: 12
    }
  })
}

export const createMachineWithOptOut = () => {
  return createMockMachine({
    sale: {
      reminderOptOut: true
    }
  })
}

export const createMachineWithoutEmail = () => {
  return createMockMachine({
    sale: {
      customerEmail: ''
    }
  })
}

export const createMachineWithCompletedServices = (count: number) => {
  const serviceRequests = []
  for (let i = 0; i < count; i++) {
    serviceRequests.push({
      id: `service-${i}`,
      createdAt: subMonths(new Date(), i * 3),
      serviceVisit: {
        id: `visit-${i}`,
        serviceVisitDate: subMonths(new Date(), i * 3),
        status: 'COMPLETED'
      }
    })
  }

  return createMockMachine({
    serviceRequests
  })
}
