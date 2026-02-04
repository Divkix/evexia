'use client'

import { Activity, Building2, Calendar, FileText, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HealthCharts } from '@/components/patient/health-charts'
import { HealthSummary } from '@/components/patient/health-summary'
import { HealthTrajectory } from '@/components/patient/health-trajectory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Patient {
  id: string
  name: string
  email: string
}

interface SessionResponse {
  authenticated: boolean
  patient?: Patient
  bypass?: boolean
  error?: string
}

interface RecordData {
  id: string
  patientId: string
  category: string
  hospital: string
  recordDate: string | null
  data: Record<string, unknown>
  createdAt: string
}

interface ChartDataPoint {
  date: string
  hospital: string
  value: number | null
  label: string
  unit?: string
}

interface ApiChartData {
  bmi: ChartDataPoint[]
  cholesterol: ChartDataPoint[]
  a1c: ChartDataPoint[]
}

interface RecordsResponse {
  patient: {
    id: string
    name: string
    dateOfBirth: string
  }
  records: RecordData[]
  chartData: ApiChartData
}

interface SimpleDataPoint {
  date: string
  value: number
}

interface SimpleChartData {
  bmi: SimpleDataPoint[]
  cholesterol: SimpleDataPoint[]
  a1c: SimpleDataPoint[]
}

const STAT_SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3', 'stat-4'] as const
const CHART_SKELETON_KEYS = ['chart-1', 'chart-2', 'chart-3'] as const

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Skeleton - bento layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hero stat skeleton (spans 2 cols on lg) */}
        <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="size-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-24" />
              <Skeleton className="mt-2 h-4 w-40" />
            </CardContent>
          </Card>
        </div>
        {STAT_SKELETON_KEYS.slice(1).map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {CHART_SKELETON_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health Summary Skeleton */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function transformChartData(apiData: ApiChartData): SimpleChartData {
  const transform = (points: ChartDataPoint[]): SimpleDataPoint[] =>
    points
      .filter((p) => p.value !== null)
      .map((p) => ({
        date: p.date,
        value: p.value as number,
      }))

  return {
    bmi: transform(apiData.bmi),
    cholesterol: transform(apiData.cholesterol),
    a1c: transform(apiData.a1c),
  }
}

export default function PatientDashboardPage() {
  const router = useRouter()
  const [patientId, setPatientId] = useState<string | null>(null)
  const [records, setRecords] = useState<RecordData[]>([])
  const [chartData, setChartData] = useState<SimpleChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate stats from records
  const totalRecords = records.length
  const uniqueHospitals = new Set(records.map((r) => r.hospital)).size
  const lastUpdated =
    records.length > 0
      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          new Date(
            Math.max(...records.map((r) => new Date(r.createdAt).getTime())),
          ),
        )
      : 'N/A'
  const recordCategories = new Set(records.map((r) => r.category)).size

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      // Fetch session to get patientId
      const sessionRes = await fetch('/api/auth/session')
      const sessionData: SessionResponse = await sessionRes.json()

      if (!sessionData.authenticated || !sessionData.patient) {
        router.replace('/patient/login')
        return
      }

      const id = sessionData.patient.id
      setPatientId(id)

      // Fetch records
      const recordsRes = await fetch(`/api/patient/${id}/records`)

      if (!recordsRes.ok) {
        throw new Error('Failed to fetch records')
      }

      const recordsData: RecordsResponse = await recordsRes.json()
      setRecords(recordsData.records)
      setChartData(transformChartData(recordsData.chartData))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true)
            fetchData()
          }}
          className="text-primary underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!patientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          Health Dashboard
        </h2>
        <p className="text-muted-foreground">
          Overview of your health records and insights
        </p>
      </div>

      {/* Quick Stats - Bento Grid Layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hero Stat: Total Records - spans 2 columns on lg */}
        <Card className="card-hover sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Total Records
            </CardTitle>
            <FileText className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary lg:text-6xl">
              {totalRecords}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Medical records on file across all providers
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Healthcare Providers
            </CardTitle>
            <Building2
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueHospitals}</div>
            <p className="text-xs text-muted-foreground">Connected hospitals</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Record Types</CardTitle>
            <Activity
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordCategories}</div>
            <p className="text-xs text-muted-foreground">
              Different categories
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover sm:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lastUpdated}</div>
            <p className="text-xs text-muted-foreground">Most recent record</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Charts */}
      {chartData && <HealthCharts chartData={chartData} />}

      {/* Predictive Health Trajectory */}
      <HealthTrajectory patientId={patientId} />

      {/* Health Summary - Full width */}
      <HealthSummary patientId={patientId} />
    </div>
  )
}
