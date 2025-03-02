"use client"

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartCardProps {
  title: string
  options: EChartsOption
  loading?: boolean
  className?: string
  height?: string | number
}

export function ChartCard({ title, options, loading, className, height = '400px' }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={options}
          style={{ height }}
          showLoading={loading}
        />
      </CardContent>
    </Card>
  )
}

export function createBarChartOptions({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
}: {
  title?: string
  data: { name: string; value: number }[]
  xAxisLabel?: string
  yAxisLabel?: string
}): EChartsOption {
  return {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      name: xAxisLabel,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel
    },
    series: [
      {
        data: data.map(item => item.value),
        type: 'bar'
      }
    ]
  }
}

export function createPieChartOptions({
  title,
  data,
}: {
  title?: string
  data: { name: string; value: number }[]
}): EChartsOption {
  return {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: title || 'Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '40',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
}

export function createLineChartOptions({
  title,
  data,
  xAxisLabel,
  yAxisLabel,
}: {
  title?: string
  data: { name: string; value: number }[]
  xAxisLabel?: string
  yAxisLabel?: string
}): EChartsOption {
  return {
    title: title ? { text: title } : undefined,
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.name),
      name: xAxisLabel
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel
    },
    series: [
      {
        data: data.map(item => item.value),
        type: 'line',
        areaStyle: {}
      }
    ]
  }
}

export function createGaugeChartOptions({
  title,
  value,
  min = 0,
  max = 100,
}: {
  title?: string
  value: number
  min?: number
  max?: number
}): EChartsOption {
  return {
    title: title ? { text: title } : undefined,
    series: [
      {
        type: 'gauge',
        progress: {
          show: true,
          width: 18
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        axisLabel: {
          distance: 25,
          color: '#999',
          fontSize: 14
        },
        anchor: {
          show: true,
          showAbove: true,
          size: 25,
          itemStyle: {
            borderWidth: 10
          }
        },
        title: {
          show: true
        },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, '70%']
        },
        data: [{
          value: value,
          name: title || ''
        }],
        min,
        max
      }
    ]
  }
} 