import { createAdminClient } from '../admin'
import type { Json } from '../database.types'
import { toCamelCase } from '../utils'

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

// CamelCase type matching Drizzle schema
export interface Record {
  id: string
  patientId: string
  hospital: string
  category: string
  data: Json
  recordDate: string | null
  source: string | null
  createdAt: string
}

export interface NewRecord {
  patientId: string
  hospital: string
  category: string
  data: Json
  recordDate?: string | null
  source?: string | null
}

export async function getPatientRecords(
  patientId: string,
  options?: {
    categories?: RecordCategory[]
    hospitals?: string[]
  },
): Promise<Record[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('records')
    .select()
    .eq('patient_id', patientId)
    .order('record_date', { ascending: false })

  if (options?.categories?.length) {
    query = query.in('category', options.categories)
  }

  if (options?.hospitals?.length) {
    query = query.in('hospital', options.hospitals)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []).map((r) => toCamelCase<Record>(r))
}

export async function createRecord(data: NewRecord): Promise<Record> {
  const supabase = createAdminClient()

  const { data: record, error } = await supabase
    .from('records')
    .insert({
      patient_id: data.patientId,
      hospital: data.hospital,
      category: data.category,
      data: data.data,
      record_date: data.recordDate ?? null,
      source: data.source ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toCamelCase<Record>(record)
}

export async function createManyRecords(data: NewRecord[]): Promise<Record[]> {
  if (data.length === 0) return []

  const supabase = createAdminClient()

  const insertData = data.map((d) => ({
    patient_id: d.patientId,
    hospital: d.hospital,
    category: d.category,
    data: d.data,
    record_date: d.recordDate ?? null,
    source: d.source ?? null,
  }))

  const { data: records, error } = await supabase
    .from('records')
    .insert(insertData)
    .select()

  if (error) throw error
  return (records ?? []).map((r) => toCamelCase<Record>(r))
}

export async function deletePatientRecords(patientId: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('records')
    .delete()
    .eq('patient_id', patientId)

  if (error) throw error
}

export async function getRecordById(id: string): Promise<Record | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('records')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Record>(data)
}
