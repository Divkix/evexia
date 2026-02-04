import { createAdminClient } from '../admin'
import type { Json } from '../database.types'
import { toCamelCase } from '../utils'
import type { RecordCategory } from './records'

const FULL_SCOPE: RecordCategory[] = ['vitals', 'labs', 'meds', 'encounters']

/**
 * Checks if the provided scope includes all record categories.
 */
export function hasFullAccess(scope: string[]): boolean {
  return FULL_SCOPE.every((cat) => scope.includes(cat))
}

/**
 * Filters anomalies to only include those matching the provided scope categories.
 */
export function filterAnomaliesByScope(
  anomalies: Anomaly[] | null | undefined,
  scope: string[],
): Anomaly[] {
  if (!anomalies) return []
  return anomalies.filter((a) => scope.includes(a.category))
}

export interface Anomaly {
  type: 'high' | 'low' | 'duplicate' | 'missing'
  category: string
  field: string
  value: string | number
  message: string
}

export interface EquityConcern {
  metric: string
  patientValue: string
  populationAverage: string
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

export interface SummaryData {
  clinicianSummary: string
  patientSummary: string
  anomalies: Anomaly[]
  equityConcerns: EquityConcern[]
  predictions: Prediction[]
  modelUsed: string
}

// CamelCase type matching Drizzle schema
export interface Summary {
  id: string
  patientId: string
  clinicianSummary: string | null
  patientSummary: string | null
  anomalies: Json | null
  equityConcerns: Json | null
  predictions: Json | null
  modelUsed: string | null
  createdAt: string
}

export async function getPatientSummary(
  patientId: string,
): Promise<Summary | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('summaries')
    .select()
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Summary>(data)
}

export async function saveSummary(
  patientId: string,
  data: SummaryData,
): Promise<Summary> {
  const supabase = createAdminClient()

  // Delete existing summaries for this patient
  await supabase.from('summaries').delete().eq('patient_id', patientId)

  const { data: summary, error } = await supabase
    .from('summaries')
    .insert({
      patient_id: patientId,
      clinician_summary: data.clinicianSummary,
      patient_summary: data.patientSummary,
      anomalies: data.anomalies as unknown as Json,
      equity_concerns: data.equityConcerns as unknown as Json,
      predictions: data.predictions as unknown as Json,
      model_used: data.modelUsed,
    })
    .select()
    .single()

  if (error) throw error
  return toCamelCase<Summary>(summary)
}

export async function deleteSummary(patientId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('summaries')
    .delete()
    .eq('patient_id', patientId)

  if (error) throw error
}

const RATE_LIMIT_COOLDOWN_MS = 30_000 // 30 seconds

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
  lastGeneratedAt: string | null
}

export async function checkSummaryRateLimit(
  patientId: string,
): Promise<RateLimitResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('summaries')
    .select('created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // No previous summary exists - allow generation
  if (error?.code === 'PGRST116' || !data) {
    return {
      allowed: true,
      retryAfterMs: 0,
      lastGeneratedAt: null,
    }
  }

  if (error) throw error

  const lastGeneratedAt = data.created_at
  const lastGeneratedTime = new Date(lastGeneratedAt).getTime()
  const now = Date.now()
  const elapsedMs = now - lastGeneratedTime

  // Only rate limit if elapsed time is positive and less than cooldown
  // Negative elapsed (clock skew) means timestamp is in future - allow regeneration
  if (elapsedMs >= 0 && elapsedMs < RATE_LIMIT_COOLDOWN_MS) {
    return {
      allowed: false,
      retryAfterMs: RATE_LIMIT_COOLDOWN_MS - elapsedMs,
      lastGeneratedAt,
    }
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    lastGeneratedAt,
  }
}

/**
 * Parse the stored anomalies JSON to extract anomalies array.
 * Handles both legacy format (object with nested arrays) and new format (plain array).
 */
export function parseSummaryAnomalies(anomaliesJson: Json | null): Anomaly[] {
  if (!anomaliesJson) {
    return []
  }

  // Handle new format: plain array of anomalies
  if (Array.isArray(anomaliesJson)) {
    return anomaliesJson as unknown as Anomaly[]
  }

  // Handle legacy format: object with nested arrays (for backward compatibility)
  const data = anomaliesJson as {
    anomalies?: unknown[]
  }

  return Array.isArray(data.anomalies)
    ? (data.anomalies as unknown as Anomaly[])
    : []
}

/**
 * Parse equity concerns JSON from the dedicated column.
 */
export function parseEquityConcerns(
  equityConcernsJson: Json | null,
): EquityConcern[] {
  if (!equityConcernsJson || !Array.isArray(equityConcernsJson)) {
    return []
  }
  return equityConcernsJson as unknown as EquityConcern[]
}

/**
 * Parse predictions JSON from the dedicated column.
 */
export function parsePredictions(predictionsJson: Json | null): Prediction[] {
  if (!predictionsJson || !Array.isArray(predictionsJson)) {
    return []
  }
  return predictionsJson as unknown as Prediction[]
}
