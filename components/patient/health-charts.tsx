'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface DataPoint {
  date: string
  value: number
}

interface ChartData {
  bmi: DataPoint[]
  cholesterol: DataPoint[]
  a1c: DataPoint[]
}

interface HealthChartsProps {
  chartData: ChartData
}

// CSS variable references for chart colors
const CHART_COLORS = {
  chart1: { stroke: 'var(--chart-1)', fill: 'hsl(160, 35%, 30%)' }, // Forest green - BMI
  chart2: { stroke: 'var(--chart-2)', fill: 'hsl(140, 25%, 45%)' }, // Sage variant - Cholesterol
  chart3: { stroke: 'var(--chart-3)', fill: 'hsl(45, 35%, 50%)' }, // Muted gold - A1C
}
const REFERENCE_LINE_COLOR = 'var(--accent)'
const MUTED_FOREGROUND = 'var(--muted-foreground)'
const GRID_COLOR = 'var(--border)'
const TOOLTIP_BG = 'var(--card)'
const TOOLTIP_BORDER = 'var(--border)'

interface SingleChartProps {
  title: string
  description: string
  data: DataPoint[]
  referenceLines: { value: number; label: string }[]
  yAxisDomain?: [number, number]
  unit?: string
  chartColor: { stroke: string; fill: string }
  gradientId: string
}

function SingleChart({
  title,
  description,
  data,
  referenceLines,
  yAxisDomain,
  unit = '',
  chartColor,
  gradientId,
}: SingleChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={chartColor.fill}
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor={chartColor.fill}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: MUTED_FOREGROUND }}
              tickLine={{ stroke: MUTED_FOREGROUND }}
              axisLine={{ stroke: MUTED_FOREGROUND }}
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: 12, fill: MUTED_FOREGROUND }}
              tickLine={{ stroke: MUTED_FOREGROUND }}
              axisLine={{ stroke: MUTED_FOREGROUND }}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: TOOLTIP_BG,
                border: `1px solid ${TOOLTIP_BORDER}`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
              labelStyle={{ color: MUTED_FOREGROUND }}
              formatter={(value: number | undefined) =>
                [`${value ?? ''}${unit}`, 'Value'] as [string, string]
              }
            />
            {referenceLines.map((ref) => (
              <ReferenceLine
                key={ref.value}
                y={ref.value}
                stroke={REFERENCE_LINE_COLOR}
                strokeDasharray="5 5"
                label={{
                  value: ref.label,
                  position: 'right',
                  fill: MUTED_FOREGROUND,
                  fontSize: 10,
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor.stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ fill: chartColor.stroke, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: chartColor.stroke }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function HealthCharts({ chartData }: HealthChartsProps) {
  const bmiReferenceLines = [
    { value: 18.5, label: 'Underweight' },
    { value: 25, label: 'Overweight' },
    { value: 30, label: 'Obese' },
  ]

  const cholesterolReferenceLines = [
    { value: 200, label: 'Borderline' },
    { value: 240, label: 'High' },
  ]

  const a1cReferenceLines = [
    { value: 5.7, label: 'Prediabetes' },
    { value: 6.5, label: 'Diabetes' },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <SingleChart
        title="BMI"
        description="Body Mass Index over time"
        data={chartData.bmi}
        referenceLines={bmiReferenceLines}
        yAxisDomain={[15, 40]}
        chartColor={CHART_COLORS.chart1}
        gradientId="bmiGradient"
      />
      <SingleChart
        title="Total Cholesterol"
        description="Cholesterol levels in mg/dL"
        data={chartData.cholesterol}
        referenceLines={cholesterolReferenceLines}
        yAxisDomain={[100, 300]}
        unit=" mg/dL"
        chartColor={CHART_COLORS.chart2}
        gradientId="cholesterolGradient"
      />
      <SingleChart
        title="A1C"
        description="Hemoglobin A1C percentage"
        data={chartData.a1c}
        referenceLines={a1cReferenceLines}
        yAxisDomain={[4, 10]}
        unit="%"
        chartColor={CHART_COLORS.chart3}
        gradientId="a1cGradient"
      />
    </div>
  )
}
