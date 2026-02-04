import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

// CamelCase types matching Drizzle schema interface
export interface Patient {
  id: string
  authUserId: string | null
  name: string
  email: string
  dateOfBirth: string
  phone: string | null
  createdAt: string
  updatedAt: string
}

export interface NewPatient {
  name: string
  email: string
  dateOfBirth: string
  phone?: string | null
  authUserId?: string | null
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patients')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Patient>(data)
}

export async function getPatientByEmail(
  email: string,
): Promise<Patient | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patients')
    .select()
    .eq('email', email.toLowerCase())
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Patient>(data)
}

export async function getPatientByNameAndDob(
  name: string,
  dateOfBirth: string,
): Promise<Patient | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patients')
    .select()
    .eq('name', name)
    .eq('date_of_birth', dateOfBirth)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Patient>(data)
}

export async function createPatient(data: NewPatient): Promise<Patient> {
  const supabase = createAdminClient()

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      name: data.name,
      email: data.email.toLowerCase(),
      date_of_birth: data.dateOfBirth,
      phone: data.phone ?? null,
      auth_user_id: data.authUserId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return toCamelCase<Patient>(patient)
}

export async function updatePatient(
  id: string,
  data: Partial<Omit<Patient, 'id' | 'createdAt'>>,
): Promise<Patient | null> {
  const supabase = createAdminClient()

  // Transform camelCase input to snake_case for database
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email.toLowerCase()
  if (data.dateOfBirth !== undefined)
    updateData.date_of_birth = data.dateOfBirth
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.authUserId !== undefined) updateData.auth_user_id = data.authUserId

  const { data: patient, error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Patient>(patient)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***.***'

  const lastChar = local.length > 1 ? local[local.length - 1] : ''
  const maskedLocal = `${local[0]}***${lastChar}`
  const [domainName, tld] = domain.split('.')
  const maskedDomain = `${domainName?.[0]}***.${tld}`

  return `${maskedLocal}@${maskedDomain}`
}
