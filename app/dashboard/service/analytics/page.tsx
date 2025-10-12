'use client'

import { useEffect, useState } from "react"
import { ChartCard, createBarChartOptions, createPieChartOptions, createGaugeChartOptions } from "@/components/analytics/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ServiceEngineerAnalyticsData } from "@/app/api/service/analytics/service"

export default function ServiceEngineerAnalyticsDashboard() {
  const [data, setData] = useState<ServiceEngineerAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/service/analytics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch analytics data')
        return res.json()
      })
      .then(setData)
      .catch(err => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (loading || !data) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">My Analytics</h1>
      <p className="text-muted-foreground">Performance metrics and statistics for your assigned service visits</p>

      {/* Personal Stats Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Personal Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.personalStats.totalAssignedVisits}</div>
              <div className="text-sm text-muted-foreground">Last 30 days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.personalStats.completedVisits}</div>
              <div className="text-sm text-muted-foreground">Successfully completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.personalStats.pendingVisits}</div>
              <div className="text-sm text-muted-foreground">Awaiting completion</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avg. Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.personalStats.averageCompletionTime.toFixed(1)} hrs</div>
              <div className="text-sm text-muted-foreground">Per service visit</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Issue Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Issue Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.issueAnalytics.issueDistribution.length > 0 ? (
            <>
              <ChartCard
                title="Issue Distribution"
                options={createPieChartOptions({
                  data: data.issueAnalytics.issueDistribution.map(issue => ({
                    name: issue.type,
                    value: issue.count
                  }))
                })}
              />

              <ChartCard
                title="Average Cost by Issue Type"
                options={createBarChartOptions({
                  data: data.issueAnalytics.issueDistribution.map(issue => ({
                    name: issue.type,
                    value: issue.averageCost
                  })),
                  xAxisLabel: "Issue Type",
                  yAxisLabel: "Average Cost (₹)"
                })}
              />
            </>
          ) : (
            <Card className="col-span-2">
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">No issue data available yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Regional Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Regional Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.regionalAnalytics.requestsByRegion.length > 0 ? (
            <>
              <ChartCard
                title="Requests by Region"
                options={createBarChartOptions({
                  data: data.regionalAnalytics.requestsByRegion.map(region => ({
                    name: region.region,
                    value: region.requestCount
                  })),
                  xAxisLabel: "Region",
                  yAxisLabel: "Requests"
                })}
              />

              <ChartCard
                title="Total Costs by Region"
                options={createBarChartOptions({
                  data: data.regionalAnalytics.requestsByRegion.map(region => ({
                    name: region.region,
                    value: region.totalCosts
                  })),
                  xAxisLabel: "Region",
                  yAxisLabel: "Cost (₹)"
                })}
              />
            </>
          ) : (
            <Card className="col-span-2">
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground">No regional data available yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Performance Metrics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard
            title="First Time Fix Rate"
            height={200}
            options={createGaugeChartOptions({
              value: data.performanceMetrics.firstTimeFixRate * 100,
              title: "First Time Fix Rate"
            })}
          />

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performanceMetrics.averageResponseTime.toFixed(1)} hours</div>
              <div className="text-sm text-muted-foreground">Average Response Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repeat Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data.performanceMetrics.repeatServiceRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Repeat Service Rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Service Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.performanceMetrics.totalCosts.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Last 30 days</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-36" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-[300px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
