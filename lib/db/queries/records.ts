import { and, desc, eq, inArray, type SQL } from 'drizzle-orm'
import { db } from '../index'
import { type NewRecord, type Record, records } from '../schema'

export type RecordCategory = 'vitals' | 'labs' | 'meds' | 'encounters'

export const RECORD_CATEGORIES: RecordCategory[] = [
  'vitals',
  'labs',
  'meds',
  'encounters',
]

export const HOSPITALS = [
  'Banner Health',
  'Mayo Clinic',
  'Phoenician Medical Center',
] as const

export async function getPatientRecords(
  patientId: string,
  options?: {
    categories?: RecordCategory[]
    hospitals?: string[]
  },
): Promise<Record[]> {
  const conditions: SQL[] = [eq(records.patientId, patientId)]

  if (options?.categories?.length) {
    conditions.push(inArray(records.category, options.categories))
  }

  if (options?.hospitals?.length) {
    conditions.push(inArray(records.hospital, options.hospitals))
  }

  return db
    .select()
    .from(records)
    .where(and(...conditions))
    .orderBy(desc(records.recordDate))
}

export async function createRecord(data: NewRecord): Promise<Record> {
  const result = await db.insert(records).values(data).returning()

  return result[0]
}

export async function createManyRecords(data: NewRecord[]): Promise<Record[]> {
  if (data.length === 0) return []

  const result = await db.insert(records).values(data).returning()

  return result
}

export async function deletePatientRecords(patientId: string): Promise<void> {
  await db.delete(records).where(eq(records.patientId, patientId))
}

export async function getRecordById(id: string): Promise<Record | null> {
  const result = await db
    .select()
    .from(records)
    .where(eq(records.id, id))
    .limit(1)

  return result[0] ?? null
}
