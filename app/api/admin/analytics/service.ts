import { prisma } from "@/lib/prisma"
import { subDays, startOfMonth, endOfMonth, format, differenceInHours } from "date-fns"

export interface AnalyticsData {
  warrantyAnalytics: {
    totalWarrantyCosts: number
    averageWarrantyCost: number
    warrantyClaimsCount: number
    warrantyClaimsByModel: Array<{
      modelName: string
      claimsCount: number
      totalCost: number
    }>
  }
  issueAnalytics: {
    issueDistribution: Array<{
      type: string
      count: number
      averageCost: number
      averageResolutionTime: number
    }>
    mostCommonIssues: Array<{
      type: string
      count: number
    }>
  }
  regionalAnalytics: {
    requestsByRegion: Array<{
      region: string
      requestCount: number
      averageResponseTime: number
      totalCosts: number
    }>
  }
  serviceEfficiency: {
    averageResponseTime: number
    firstTimeFixRate: number
    repeatServiceRate: number
    averageResolutionTime: number
  }
  financialMetrics: {
    totalServiceCosts: number
    averageServiceCost: number
    revenueFromServices: number
    costByMachineType: Array<{
      machineType: string
      totalCost: number
      serviceCount: number
    }>
  }
  operationalKPIs: {
    slaComplianceRate: number
    engineerUtilization: number
    openServiceRequests: number
    completedServiceRequests: number
  }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)

  // Warranty Analytics
  const warrantyAnalytics = await getWarrantyAnalytics(thirtyDaysAgo, now)
  
  // Issue Analytics
  const issueAnalytics = await getIssueAnalytics(thirtyDaysAgo, now)
  
  // Regional Analytics
  const regionalAnalytics = await getRegionalAnalytics(thirtyDaysAgo, now)
  
  // Service Efficiency
  const serviceEfficiency = await getServiceEfficiency(thirtyDaysAgo, now)
  
  // Financial Metrics
  const financialMetrics = await getFinancialMetrics(startOfCurrentMonth, endOfCurrentMonth)
  
  // Operational KPIs
  const operationalKPIs = await getOperationalKPIs(now)

  return {
    warrantyAnalytics,
    issueAnalytics,
    regionalAnalytics,
    serviceEfficiency,
    financialMetrics,
    operationalKPIs,
  }
}

async function getWarrantyAnalytics(startDate: Date, endDate: Date) {
  // Get warranty visits with their costs
  const warrantyVisits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED',
      serviceRequest: {
        machine: {
          warrantyCertificate: {
            isNot: null
          }
        }
      }
    },
    include: {
      serviceRequest: {
        include: {
          machine: {
            include: {
              machineModel: true
            }
          }
        }
      }
    }
  })

  // Calculate warranty analytics
  const totalCosts = warrantyVisits.reduce((sum, visit) => sum + (visit.totalCost || 0), 0)
  const averageCost = warrantyVisits.length > 0 ? totalCosts / warrantyVisits.length : 0

  // Group by machine model
  const modelStats = warrantyVisits.reduce((acc, visit) => {
    const modelName = visit.serviceRequest.machine.machineModel.name
    if (!acc[modelName]) {
      acc[modelName] = { count: 0, totalCost: 0 }
    }
    acc[modelName].count++
    acc[modelName].totalCost += visit.totalCost || 0
    return acc
  }, {} as Record<string, { count: number; totalCost: number }>)

  return {
    totalWarrantyCosts: totalCosts,
    averageWarrantyCost: averageCost,
    warrantyClaimsCount: warrantyVisits.length,
    warrantyClaimsByModel: Object.entries(modelStats).map(([modelName, stats]) => ({
      modelName,
      claimsCount: stats.count,
      totalCost: stats.totalCost
    }))
  }
}

async function getIssueAnalytics(startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      typeOfIssue: {
        not: null
      }
    },
    select: {
      typeOfIssue: true,
      totalCost: true,
      createdAt: true,
      status: true,
      serviceRequest: {
        select: {
          createdAt: true
        }
      }
    }
  })

  // Group and calculate metrics
  const issueStats = visits.reduce((acc, visit) => {
    const type = visit.typeOfIssue || 'Unknown'
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        totalCost: 0,
        totalResolutionTime: 0
      }
    }
    acc[type].count++
    acc[type].totalCost += visit.totalCost || 0
    if (visit.status === 'COMPLETED') {
      acc[type].totalResolutionTime += differenceInHours(visit.createdAt, visit.serviceRequest.createdAt)
    }
    return acc
  }, {} as Record<string, { count: number; totalCost: number; totalResolutionTime: number }>)

  const distribution = Object.entries(issueStats).map(([type, stats]) => ({
    type,
    count: stats.count,
    averageCost: stats.count > 0 ? stats.totalCost / stats.count : 0,
    averageResolutionTime: stats.count > 0 ? stats.totalResolutionTime / stats.count : 0
  }))

  const mostCommon = [...distribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ type, count }) => ({ type, count }))

  return {
    issueDistribution: distribution,
    mostCommonIssues: mostCommon
  }
}

async function getRegionalAnalytics(startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      serviceRequest: {
        include: {
          machine: {
            include: {
              warrantyCertificate: true
            }
          }
        }
      }
    }
  })

  // Group by region and calculate metrics
  const regionStats = visits.reduce((acc, visit) => {
    const region = visit.serviceRequest.machine.warrantyCertificate?.state || 'Unknown'
    if (!acc[region]) {
      acc[region] = {
        requestCount: 0,
        totalCosts: 0,
        responseTimeSum: 0
      }
    }
    acc[region].requestCount++
    acc[region].totalCosts += visit.totalCost || 0
    acc[region].responseTimeSum += differenceInHours(visit.serviceVisitDate, visit.serviceRequest.createdAt)
    return acc
  }, {} as Record<string, { requestCount: number; totalCosts: number; responseTimeSum: number }>)

  return {
    requestsByRegion: Object.entries(regionStats).map(([region, stats]) => ({
      region,
      requestCount: stats.requestCount,
      averageResponseTime: stats.requestCount > 0 ? stats.responseTimeSum / stats.requestCount : 0,
      totalCosts: stats.totalCosts
    }))
  }
}

async function getServiceEfficiency(startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      serviceRequest: true
    }
  })

  const totalRequests = visits.length
  const completedFirstTime = visits.filter(v => v.status === 'COMPLETED').length
  
  let totalResponseTime = 0
  let totalResolutionTime = 0
  let repeatedServices = 0

  visits.forEach(visit => {
    totalResponseTime += differenceInHours(visit.serviceVisitDate, visit.serviceRequest.createdAt)
    if (visit.status === 'COMPLETED') {
      totalResolutionTime += differenceInHours(visit.createdAt, visit.serviceRequest.createdAt)
    }
  })

  // Count repeated services (more than one visit per machine in the period)
  const machineVisits = visits.reduce((acc, visit) => {
    const machineId = visit.serviceRequest.machineId
    acc[machineId] = (acc[machineId] || 0) + 1
    if (acc[machineId] > 1) repeatedServices++
    return acc
  }, {} as Record<string, number>)

  return {
    averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
    firstTimeFixRate: totalRequests > 0 ? completedFirstTime / totalRequests : 0,
    repeatServiceRate: totalRequests > 0 ? repeatedServices / totalRequests : 0,
    averageResolutionTime: completedFirstTime > 0 ? totalResolutionTime / completedFirstTime : 0
  }
}

async function getFinancialMetrics(startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'COMPLETED'
    },
    include: {
      serviceRequest: {
        include: {
          machine: {
            include: {
              machineModel: true
            }
          }
        }
      }
    }
  })

  const totalCosts = visits.reduce((sum, visit) => sum + (visit.totalCost || 0), 0)
  
  // Group by machine type
  const machineTypeStats = visits.reduce((acc, visit) => {
    const machineType = visit.serviceRequest.machine.machineModel.name
    if (!acc[machineType]) {
      acc[machineType] = {
        totalCost: 0,
        count: 0
      }
    }
    acc[machineType].totalCost += visit.totalCost || 0
    acc[machineType].count++
    return acc
  }, {} as Record<string, { totalCost: number; count: number }>)

  return {
    totalServiceCosts: totalCosts,
    averageServiceCost: visits.length > 0 ? totalCosts / visits.length : 0,
    revenueFromServices: totalCosts, // Assuming service cost is revenue
    costByMachineType: Object.entries(machineTypeStats).map(([machineType, stats]) => ({
      machineType,
      totalCost: stats.totalCost,
      serviceCount: stats.count
    }))
  }
}

async function getOperationalKPIs(currentDate: Date) {
  const [openRequests, completedRequests, engineers] = await Promise.all([
    prisma.serviceRequest.count({
      where: {
        serviceVisit: {
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        }
      }
    }),
    prisma.serviceRequest.count({
      where: {
        serviceVisit: {
          status: 'COMPLETED'
        }
      }
    }),
    prisma.user.count({
      where: {
        role: 'ENGINEER'
      }
    })
  ])

  // Calculate engineer utilization (assuming 8-hour workday)
  const activeVisits = await prisma.serviceVisit.count({
    where: {
      status: 'IN_PROGRESS'
    }
  })

  const engineerUtilization = engineers > 0 ? Math.min(activeVisits / (engineers * 8), 1) : 0
  
  // Calculate SLA compliance (assuming 24-hour response time SLA)
  const recentVisits = await prisma.serviceVisit.findMany({
    where: {
      createdAt: {
        gte: subDays(currentDate, 30)
      }
    },
    include: {
      serviceRequest: true
    }
  })

  const slaCompliant = recentVisits.filter(visit => {
    const responseTime = differenceInHours(visit.serviceVisitDate, visit.serviceRequest.createdAt)
    return responseTime <= 24
  }).length

  return {
    slaComplianceRate: recentVisits.length > 0 ? slaCompliant / recentVisits.length : 1,
    engineerUtilization,
    openServiceRequests: openRequests,
    completedServiceRequests: completedRequests
  }
} 