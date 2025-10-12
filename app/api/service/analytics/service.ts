import { prisma } from "@/lib/prisma"
import { subDays, startOfMonth, endOfMonth, differenceInHours } from "date-fns"
import { auth } from "@/lib/auth"

export interface ServiceEngineerAnalyticsData {
  personalStats: {
    totalAssignedVisits: number
    completedVisits: number
    pendingVisits: number
    averageCompletionTime: number
  }
  issueAnalytics: {
    issueDistribution: Array<{
      type: string
      count: number
      averageCost: number
      averageResolutionTime: number
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
  performanceMetrics: {
    firstTimeFixRate: number
    averageResponseTime: number
    repeatServiceRate: number
    totalCosts: number
  }
}

export async function getServiceEngineerAnalyticsData(engineerId: string): Promise<ServiceEngineerAnalyticsData> {
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)

  // Personal Stats
  const personalStats = await getPersonalStats(engineerId, thirtyDaysAgo, now)

  // Issue Analytics (scoped to this engineer)
  const issueAnalytics = await getEngineerIssueAnalytics(engineerId, thirtyDaysAgo, now)

  // Regional Analytics (scoped to this engineer's service area)
  const regionalAnalytics = await getEngineerRegionalAnalytics(engineerId, thirtyDaysAgo, now)

  // Performance Metrics
  const performanceMetrics = await getEngineerPerformanceMetrics(engineerId, thirtyDaysAgo, now)

  return {
    personalStats,
    issueAnalytics,
    regionalAnalytics,
    performanceMetrics,
  }
}

async function getPersonalStats(engineerId: string, startDate: Date, endDate: Date) {
  const [totalAssignedVisits, completedVisits, pendingVisits, visits] = await Promise.all([
    prisma.serviceVisit.count({
      where: {
        engineerId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.serviceVisit.count({
      where: {
        engineerId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.serviceVisit.count({
      where: {
        engineerId,
        status: 'PENDING',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    prisma.serviceVisit.findMany({
      where: {
        engineerId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        serviceRequest: true
      }
    })
  ])

  // Calculate average completion time
  let totalCompletionTime = 0
  visits.forEach(visit => {
    totalCompletionTime += differenceInHours(visit.createdAt, visit.serviceRequest.createdAt)
  })

  return {
    totalAssignedVisits,
    completedVisits,
    pendingVisits,
    averageCompletionTime: completedVisits > 0 ? totalCompletionTime / completedVisits : 0
  }
}

async function getEngineerIssueAnalytics(engineerId: string, startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      engineerId,
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

  return {
    issueDistribution: distribution
  }
}

async function getEngineerRegionalAnalytics(engineerId: string, startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      engineerId,
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

async function getEngineerPerformanceMetrics(engineerId: string, startDate: Date, endDate: Date) {
  const visits = await prisma.serviceVisit.findMany({
    where: {
      engineerId,
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
  let totalCosts = 0
  let repeatedServices = 0

  visits.forEach(visit => {
    totalResponseTime += differenceInHours(visit.serviceVisitDate, visit.serviceRequest.createdAt)
    totalCosts += visit.totalCost || 0
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
    totalCosts
  }
}
