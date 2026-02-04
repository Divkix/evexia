'use client'

import { AlertTriangle, Info, RefreshCw, Scale } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

type AnomalySeverity = 'warning' | 'high' | 'critical'

interface Anomaly {
  type: string
  message: string
  severity: AnomalySeverity
  value?: string | number
  threshold?: string | number
}

interface EquityConcern {
  metric: string
  patientValue: string | number
  populationAverage: string | number
  gapPercentage: number
  suggestedAction: string
}

export interface Prediction {
  condition: string
  currentRisk: 'low' | 'moderate' | 'high' | 'critical'
  probability: number
  timeframe: string
  trendDirection: 'improving' | 'stable' | 'worsening'
  actionableSteps: string[]
  evidenceBasis: string
}

interface HealthSummaryData {
  id: string
  clinicianSummary: string
  patientSummary: string
  anomalies: Anomaly[]
  equityConcerns?: EquityConcern[]
  predictions?: Prediction[]
  modelUsed: string
  createdAt: string
}

interface HealthSummaryProps {
  patientId: string
}

function HealthSummarySkeleton() {
  return (
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
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface BulletPoint {
  id: string
  text: string
}

function formatBulletPoints(text: string): BulletPoint[] {
  if (!text) return []

  // Handle text that might already have bullet points or be plain text
  const lines = text
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[-*•]\s*/, ''))

  // Generate stable IDs based on content hash
  return lines.map((line, idx) => ({
    id: `${idx}-${line.slice(0, 20).replace(/\s/g, '-')}`,
    text: line,
  }))
}

function getSeverityStyles(severity: AnomalySeverity): {
  variant: 'default' | 'destructive' | 'secondary' | 'outline'
  className: string
} {
  switch (severity) {
    case 'critical':
      return {
        variant: 'destructive',
        className: 'bg-critical text-white',
      }
    case 'high':
      return {
        variant: 'destructive',
        className: 'bg-critical/80 text-white',
      }
    case 'warning':
      return {
        variant: 'secondary',
        className: 'bg-warning text-foreground',
      }
    default:
      return {
        variant: 'secondary',
        className: '',
      }
  }
}

export function HealthSummary({ patientId }: HealthSummaryProps) {
  const [summary, setSummary] = useState<HealthSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/patient/${patientId}/summary`)

      if (!response.ok) {
        if (response.status === 404) {
          setSummary(null)
          return
        }
        throw new Error('Failed to fetch health summary')
      }

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  const regenerateSummary = async () => {
    try {
      setIsRegenerating(true)
      setError(null)

      const response = await fetch(`/api/patient/${patientId}/summary`, {
        method: 'POST',
      })

      // Handle rate limit specifically
      if (response.status === 429) {
        const data = await response.json()
        toast.warning(data.message || 'Please wait before regenerating')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data)
      toast.success('Summary regenerated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to regenerate summary')
    } finally {
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  if (isLoading) {
    return <HealthSummarySkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const clinicianPoints = summary
    ? formatBulletPoints(summary.clinicianSummary)
    : []
  const hasAnomalies = summary?.anomalies && summary.anomalies.length > 0

  return (
    <div className="space-y-6">
      {/* Clinician Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Clinical Summary</CardTitle>
          <CardDescription>
            Key findings for healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary && clinicianPoints.length > 0 ? (
            <ul className="list-inside list-disc space-y-2 text-sm">
              {clinicianPoints.map((point) => (
                <li key={point.id} className="leading-relaxed">
                  {point.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No clinical summary available. Click "Regenerate Summary" to
              generate one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Patient-Friendly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">
            Your Health Summary
          </CardTitle>
          <CardDescription>
            An easy-to-understand overview of your health
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.patientSummary ? (
            <p className="leading-relaxed text-sm">{summary.patientSummary}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No summary available yet. Click "Regenerate Summary" to create
              one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Health Equity Insights */}
      {summary?.equityConcerns && summary.equityConcerns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
              Health Equity Insights
            </CardTitle>
            <CardDescription>
              How your metrics compare to population averages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.equityConcerns.map((concern, index) => (
              <div
                key={`equity-${concern.metric}-${index}`}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{concern.metric}</span>
                  <Badge
                    variant={
                      concern.gapPercentage > 20 ? 'destructive' : 'secondary'
                    }
                  >
                    {concern.gapPercentage}% above average
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>You: {concern.patientValue}</span>
                  <span>|</span>
                  <span>Avg: {concern.populationAverage}</span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (100 / (100 + concern.gapPercentage)) * 100,
                  )}
                  className="h-2"
                />
                <p className="text-sm text-primary">
                  {concern.suggestedAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {hasAnomalies && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <AlertTriangle
                className="h-5 w-5 text-warning"
                aria-hidden="true"
              />
              Detected Anomalies
            </CardTitle>
            <CardDescription>
              Items that may need attention from your healthcare provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.anomalies.map((anomaly, index) => {
                const { className } = getSeverityStyles(anomaly.severity)
                return (
                  <Badge
                    key={`anomaly-${anomaly.type}-${index}`}
                    className={className}
                  >
                    {anomaly.type}
                    {anomaly.value && (
                      <span className="ml-1 opacity-80">({anomaly.value})</span>
                    )}
                  </Badge>
                )
              })}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {summary.anomalies.map((anomaly, index) => (
                <li
                  key={`anomaly-detail-${anomaly.type}-${index}`}
                  className="flex items-start gap-2"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      anomaly.severity === 'critical' ||
                      anomaly.severity === 'high'
                        ? 'bg-critical'
                        : 'bg-warning'
                    }`}
                  />
                  <span>{anomaly.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-end">
        <Button
          onClick={regenerateSummary}
          disabled={isRegenerating}
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isRegenerating ? 'Generating...' : 'Regenerate Summary'}
        </Button>
      </div>

      {/* Medical Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Medical Disclaimer</AlertTitle>
        <AlertDescription>
          This AI-generated summary is for informational purposes only and does
          not constitute medical advice, diagnosis, or treatment. Always consult
          with qualified healthcare professionals for medical decisions. The
          accuracy of this summary depends on the completeness and accuracy of
          your medical records.
        </AlertDescription>
      </Alert>

      {/* Model Attribution */}
      {summary?.modelUsed && (
        <p className="text-muted-foreground text-center text-xs">
          Generated using {summary.modelUsed} on{' '}
          {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
            new Date(summary.createdAt),
          )}
        </p>
      )}
    </div>
  )
}
