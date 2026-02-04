import { createAdminClient } from '../admin'
import type { Json } from '../database.types'
import { toCamelCase } from '../utils'

export interface Anomaly {
  type: 'high' | 'low' | 'duplicate' | 'missing'
  category: string
  field: string
  value: string | number
  message: string
}

export interface SummaryData {
  clinicianSummary: string
  patientSummary: string
  anomalies: Anomaly[]
  modelUsed: string
}

// CamelCase type matching Drizzle schema
export interface Summary {
  id: string
  patientId: string
  clinicianSummary: string | null
  patientSummary: string | null
  anomalies: Json | null
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

  if (elapsedMs < RATE_LIMIT_COOLDOWN_MS) {
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
