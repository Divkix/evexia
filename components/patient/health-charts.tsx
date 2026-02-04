'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
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

// Theme colors from globals.css
const DEEP_FOREST = 'hsl(160, 35%, 20%)'
const SAGE = 'hsl(140, 20%, 75%)'
const MUTED_FOREGROUND = 'hsl(220, 10%, 40%)'

interface SingleChartProps {
  title: string
  description: string
  data: DataPoint[]
  referenceLines: { value: number; label: string }[]
  yAxisDomain?: [number, number]
  unit?: string
}

function SingleChart({
  title,
  description,
  data,
  referenceLines,
  yAxisDomain,
  unit = '',
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
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 15%, 85%)" />
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
                backgroundColor: 'hsl(45, 25%, 98%)',
                border: '1px solid hsl(160, 15%, 80%)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
              labelStyle={{ color: MUTED_FOREGROUND }}
              formatter={(value) => [`${value ?? ''}${unit}`, 'Value']}
            />
            {referenceLines.map((ref) => (
              <ReferenceLine
                key={ref.value}
                y={ref.value}
                stroke={SAGE}
                strokeDasharray="5 5"
                label={{
                  value: ref.label,
                  position: 'right',
                  fill: MUTED_FOREGROUND,
                  fontSize: 10,
                }}
              />
            ))}
            <Line
              type="monotone"
              dataKey="value"
              stroke={DEEP_FOREST}
              strokeWidth={2}
              dot={{ fill: DEEP_FOREST, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: DEEP_FOREST }}
            />
          </LineChart>
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
      />
      <SingleChart
        title="Total Cholesterol"
        description="Cholesterol levels in mg/dL"
        data={chartData.cholesterol}
        referenceLines={cholesterolReferenceLines}
        yAxisDomain={[100, 300]}
        unit=" mg/dL"
      />
      <SingleChart
        title="A1C"
        description="Hemoglobin A1C percentage"
        data={chartData.a1c}
        referenceLines={a1cReferenceLines}
        yAxisDomain={[4, 10]}
        unit="%"
      />
    </div>
  )
}
