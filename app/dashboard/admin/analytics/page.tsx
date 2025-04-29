'use client'

import { useEffect, useState } from "react"
import { ChartCard, createBarChartOptions, createPieChartOptions, createGaugeChartOptions } from "@/components/analytics/charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { AnalyticsData } from "@/app/api/admin/analytics/service"

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    fetch('/api/admin/analytics')
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
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Warranty Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Warranty Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Warranty Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Warranty Costs</div>
                  <div className="text-2xl font-bold">₹{data.warrantyAnalytics.totalWarrantyCosts.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average Warranty Cost</div>
                  <div className="text-2xl font-bold">₹{data.warrantyAnalytics.averageWarrantyCost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Claims</div>
                  <div className="text-2xl font-bold">{data.warrantyAnalytics.warrantyClaimsCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ChartCard
            title="Warranty Claims by Model"
            options={createBarChartOptions({
              data: data.warrantyAnalytics.warrantyClaimsByModel.map(model => ({
                name: model.modelName,
                value: model.claimsCount
              })),
              xAxisLabel: "Model",
              yAxisLabel: "Claims"
            })}
          />

          <ChartCard
            title="Warranty Costs by Model"
            options={createBarChartOptions({
              data: data.warrantyAnalytics.warrantyClaimsByModel.map(model => ({
                name: model.modelName,
                value: model.totalCost
              })),
              xAxisLabel: "Model",
              yAxisLabel: "Cost (₹)"
            })}
          />
        </div>
      </section>

      {/* Issue Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Issue Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* Regional Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Regional Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* Service Efficiency Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Service Efficiency</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ChartCard
            title="First Time Fix Rate"
            height={200}
            options={createGaugeChartOptions({
              value: data.serviceEfficiency.firstTimeFixRate * 100,
              title: "First Time Fix Rate"
            })}
          />

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.serviceEfficiency.averageResponseTime.toFixed(1)} hours</div>
              <div className="text-sm text-muted-foreground">Average Response Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.serviceEfficiency.averageResolutionTime.toFixed(1)} hours</div>
              <div className="text-sm text-muted-foreground">Average Resolution Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repeat Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data.serviceEfficiency.repeatServiceRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Repeat Service Rate</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Operational KPIs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Operational KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.operationalKPIs.openServiceRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.operationalKPIs.completedServiceRequests}</div>
            </CardContent>
          </Card>

          <ChartCard
            title="SLA Compliance"
            height={200}
            options={createGaugeChartOptions({
              value: data.operationalKPIs.slaComplianceRate * 100,
              title: "SLA Compliance"
            })}
          />

          <ChartCard
            title="Engineer Utilization"
            height={200}
            options={createGaugeChartOptions({
              value: data.operationalKPIs.engineerUtilization * 100,
              title: "Engineer Utilization"
            })}
          />
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