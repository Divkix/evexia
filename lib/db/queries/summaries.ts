import { desc, eq } from 'drizzle-orm'
import { db } from '../index'
import { type Summary, summaries } from '../schema'

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

export async function getPatientSummary(
  patientId: string,
): Promise<Summary | null> {
  const result = await db
    .select()
    .from(summaries)
    .where(eq(summaries.patientId, patientId))
    .orderBy(desc(summaries.createdAt))
    .limit(1)

  return result[0] ?? null
}

export async function saveSummary(
  patientId: string,
  data: SummaryData,
): Promise<Summary> {
  // Delete existing summaries for this patient
  await db.delete(summaries).where(eq(summaries.patientId, patientId))

  const result = await db
    .insert(summaries)
    .values({
      patientId,
      clinicianSummary: data.clinicianSummary,
      patientSummary: data.patientSummary,
      anomalies: data.anomalies,
      modelUsed: data.modelUsed,
    })
    .returning()

  return result[0]
}

export async function deleteSummary(patientId: string): Promise<void> {
  await db.delete(summaries).where(eq(summaries.patientId, patientId))
}
