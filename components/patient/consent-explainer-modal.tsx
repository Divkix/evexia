'use client'

import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Eye,
  Loader2,
  Shield,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const RECORD_TYPES = [
  {
    id: 'vitals',
    label: 'Vitals',
    description: 'Blood pressure, heart rate, weight',
  },
  { id: 'labs', label: 'Labs', description: 'Blood tests, metabolic panels' },
  {
    id: 'medications',
    label: 'Medications',
    description: 'Prescriptions, dosages',
  },
  {
    id: 'encounters',
    label: 'Encounters',
    description: 'Visit notes, diagnoses',
  },
] as const

type RecordType = (typeof RECORD_TYPES)[number]['id']

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
] as const

interface ConsentResponse {
  sharedData: string[]
  inferredConditions: string[]
  sensitiveInferences: string[]
  minimumRequired: string[]
  recommendation: string
}

interface ConsentExplainerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedTypes: string[], expiryHours: number) => void
  patientId: string
  isCreating?: boolean
}

export function ConsentExplainerModal({
  isOpen,
  onClose,
  onConfirm,
  patientId,
  isCreating = false,
}: ConsentExplainerModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>([])
  const [expiryHours, setExpiryHours] = useState('24')
  const [explanation, setExplanation] = useState<ConsentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExplanation = useCallback(async () => {
    if (selectedTypes.length === 0) {
      setExplanation(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/patient/${patientId}/consent-explainer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordTypes: selectedTypes,
            purpose: 'Healthcare consultation',
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to analyze consent implications')
      }

      const data: ConsentResponse = await response.json()
      setExplanation(data)
    } catch (err) {
      console.error('Consent explanation error:', err)
      setError('Unable to analyze. You can still proceed with token creation.')
    } finally {
      setIsLoading(false)
    }
  }, [patientId, selectedTypes])

  // Debounce the explanation fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedTypes.length > 0) {
        fetchExplanation()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [selectedTypes, fetchExplanation])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTypes([])
      setExplanation(null)
      setError(null)
      setExpiryHours('24')
    }
  }, [isOpen])

  const toggleType = (type: RecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const handleConfirm = () => {
    if (selectedTypes.length === 0) return
    // Convert to title case for API compatibility
    const formattedTypes = selectedTypes.map(
      (t) => t.charAt(0).toUpperCase() + t.slice(1),
    )
    onConfirm(formattedTypes, Number.parseInt(expiryHours, 10))
  }

  const hasSensitiveInferences =
    explanation && explanation.sensitiveInferences.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            Before You Share
          </DialogTitle>
          <DialogDescription>
            Select what you want to share and understand what providers can
            learn from your data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Selection and Preview Grid */}
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* Left Column: Record Type Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Select Records to Share
              </h3>
              <div className="space-y-3">
                {RECORD_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedTypes.includes(type.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      id={`consent-${type.id}`}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={() => toggleType(type.id)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`consent-${type.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Expiry Selection */}
              <div className="pt-2">
                <label
                  htmlFor="consent-expiry"
                  className="block text-sm font-medium mb-2"
                >
                  Token Expiry
                </label>
                <Select value={expiryHours} onValueChange={setExpiryHours}>
                  <SelectTrigger id="consent-expiry">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            {/* Right Column: What They'll See and Infer */}
            <div className="space-y-4">
              {selectedTypes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center p-8 border border-dashed rounded-lg">
                  Select record types to see what providers can access and infer
                </div>
              ) : isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : error ? (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : explanation ? (
                <div className="space-y-4">
                  {/* What They'll See */}
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Eye
                        className="h-4 w-4 text-blue-500"
                        aria-hidden="true"
                      />
                      What They'll See
                    </h4>
                    <ul className="space-y-1">
                      {explanation.sharedData.slice(0, 5).map((item, i) => (
                        <li
                          key={`shared-${i}`}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-1">-</span>
                          {item}
                        </li>
                      ))}
                      {explanation.sharedData.length > 5 && (
                        <li className="text-xs text-muted-foreground italic">
                          +{explanation.sharedData.length - 5} more items
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* What They Can Infer */}
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Brain
                        className="h-4 w-4 text-purple-500"
                        aria-hidden="true"
                      />
                      What They Can Infer
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {explanation.inferredConditions
                        .slice(0, 6)
                        .map((item, i) => (
                          <Badge
                            key={`inferred-${i}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {item}
                          </Badge>
                        ))}
                      {explanation.inferredConditions.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{explanation.inferredConditions.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Recommendation */}
                  {explanation.recommendation && (
                    <p className="text-xs text-muted-foreground italic px-1">
                      {explanation.recommendation}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Sensitive Inferences Warning */}
          {hasSensitiveInferences && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sensitive Information May Be Inferred</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Based on your selection, providers may be able to infer:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {explanation.sensitiveInferences.map((item, i) => (
                    <li key={`sensitive-${i}`} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
                {explanation.minimumRequired.length > 0 && (
                  <p className="mt-3 text-sm font-medium">
                    Tip: {explanation.minimumRequired[0]}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTypes.length === 0 || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Token'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
