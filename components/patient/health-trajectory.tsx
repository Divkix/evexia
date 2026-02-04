'use client'

import {
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'

export interface Prediction {
  condition: string
  currentRisk: 'low' | 'moderate' | 'high' | 'critical'
  probability: number
  timeframe: string
  trendDirection: 'improving' | 'stable' | 'worsening'
  actionableSteps: string[]
  evidenceBasis: string
}

interface HealthTrajectoryProps {
  predictions: Prediction[]
  isLoading: boolean
  isRegenerating: boolean
}

function getRiskConfig(risk: Prediction['currentRisk']) {
  switch (risk) {
    case 'low':
      return {
        variant: 'secondary' as const,
        className: 'bg-success/20 text-success border-success/30',
        progressColor: 'bg-success',
        label: 'Low Risk',
      }
    case 'moderate':
      return {
        variant: 'secondary' as const,
        className: 'bg-warning/20 text-warning border-warning/30',
        progressColor: 'bg-warning',
        label: 'Moderate Risk',
      }
    case 'high':
      return {
        variant: 'destructive' as const,
        className: 'bg-critical/20 text-critical border-critical/30',
        progressColor: 'bg-critical',
        label: 'High Risk',
      }
    case 'critical':
      return {
        variant: 'destructive' as const,
        className: 'bg-critical text-white',
        progressColor: 'bg-critical',
        label: 'Critical Risk',
      }
    default:
      return {
        variant: 'secondary' as const,
        className: '',
        progressColor: 'bg-primary',
        label: 'Unknown',
      }
  }
}

function getTrendIcon(trend: Prediction['trendDirection']) {
  switch (trend) {
    case 'improving':
      return {
        icon: TrendingDown,
        className: 'text-success',
        label: 'Improving',
      }
    case 'stable':
      return {
        icon: Minus,
        className: 'text-muted-foreground',
        label: 'Stable',
      }
    case 'worsening':
      return {
        icon: TrendingUp,
        className: 'text-critical',
        label: 'Worsening',
      }
    default:
      return {
        icon: Minus,
        className: 'text-muted-foreground',
        label: 'Unknown',
      }
  }
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const riskConfig = getRiskConfig(prediction.currentRisk)
  const trendConfig = getTrendIcon(prediction.trendDirection)
  const TrendIcon = trendConfig.icon

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-serif text-lg">
              {prediction.condition}
            </CardTitle>
            <CardDescription className="text-sm">
              {prediction.timeframe} outlook
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title={trendConfig.label}>
              <TrendIcon
                className={`h-4 w-4 ${trendConfig.className}`}
                aria-hidden="true"
              />
              <span className={`text-xs ${trendConfig.className}`}>
                {trendConfig.label}
              </span>
            </div>
            <Badge className={riskConfig.className}>{riskConfig.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Probability Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Probability</span>
            <span className="font-medium">{prediction.probability}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className={`h-full rounded-full ${riskConfig.progressColor} transition-all`}
              style={{ width: `${prediction.probability}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Actionable Steps (Collapsible) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between text-sm font-medium hover:text-primary transition-colors"
            aria-expanded={isExpanded}
          >
            <span>
              Recommended Actions ({prediction.actionableSteps.length})
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {isExpanded && (
            <ul className="space-y-2 pl-4 text-sm">
              {prediction.actionableSteps.map((step, stepIndex) => (
                <li
                  key={`step-${prediction.condition}-${stepIndex}`}
                  className="flex items-start gap-2"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Evidence Basis */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Evidence basis:</span>{' '}
            {prediction.evidenceBasis}
          </p>
        </div>

        {/* Discuss with Provider Button */}
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={() => router.push('/patient/tokens')}
        >
          <Activity className="mr-2 h-4 w-4" aria-hidden="true" />
          Discuss with Your Provider
        </Button>
      </CardContent>
    </Card>
  )
}

function HealthTrajectorySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function HealthTrajectory({
  predictions,
  isLoading,
  isRegenerating,
}: HealthTrajectoryProps) {
  // Show skeleton when loading initial data or regenerating
  if (isLoading || isRegenerating) {
    return <HealthTrajectorySkeleton />
  }

  // Don't render section if no predictions
  if (!predictions || predictions.length === 0) {
    return null
  }

  // Sort predictions by risk level (critical first)
  const riskOrder = { critical: 0, high: 1, moderate: 2, low: 3 }
  const sortedPredictions = [...predictions].sort(
    (a, b) => riskOrder[a.currentRisk] - riskOrder[b.currentRisk],
  )

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="font-serif text-xl font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
          Predictive Health Trajectory
        </h3>
        <p className="text-sm text-muted-foreground">
          AI-powered risk assessments based on your health data trends
        </p>
      </div>

      {/* Prediction Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {sortedPredictions.map((prediction, index) => (
          <PredictionCard
            key={`prediction-${prediction.condition}-${index}`}
            prediction={prediction}
          />
        ))}
      </div>

      {/* Medical Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Important Notice</AlertTitle>
        <AlertDescription>
          These predictions are generated by AI for informational purposes only.
          They are not a diagnosis or medical advice. Risk scores are estimates
          based on available data and may not reflect your actual health
          outcomes. Always consult with your healthcare provider for medical
          decisions.
        </AlertDescription>
      </Alert>
    </div>
  )
}
