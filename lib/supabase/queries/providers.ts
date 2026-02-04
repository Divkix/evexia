import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

// CamelCase type matching Drizzle schema
export interface PatientProvider {
  id: string
  patientId: string
  employeeId: string | null
  providerName: string
  providerOrg: string | null
  providerEmail: string | null
  scope: string[]
  createdAt: string
  updatedAt: string
}

export interface NewPatientProvider {
  patientId: string
  employeeId?: string | null
  providerName: string
  providerOrg?: string | null
  providerEmail?: string | null
  scope?: string[]
}

export async function getPatientProviders(
  patientId: string,
): Promise<PatientProvider[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_providers')
    .select()
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((p) => toCamelCase<PatientProvider>(p))
}

export async function getProviderById(
  id: string,
): Promise<PatientProvider | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_providers')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<PatientProvider>(data)
}

export async function createProvider(
  data: NewPatientProvider,
): Promise<PatientProvider> {
  const supabase = createAdminClient()

  const { data: provider, error } = await supabase
    .from('patient_providers')
    .insert({
      patient_id: data.patientId,
      employee_id: data.employeeId ?? null,
      provider_name: data.providerName,
      provider_org: data.providerOrg ?? null,
      provider_email: data.providerEmail ?? null,
      scope: data.scope ?? [],
    })
    .select()
    .single()

  if (error) throw error
  return toCamelCase<PatientProvider>(provider)
}

export async function updateProvider(
  id: string,
  data: Partial<Omit<PatientProvider, 'id' | 'patientId' | 'createdAt'>>,
): Promise<PatientProvider | null> {
  const supabase = createAdminClient()

  // Transform camelCase input to snake_case for database
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (data.employeeId !== undefined) updateData.employee_id = data.employeeId
  if (data.providerName !== undefined)
    updateData.provider_name = data.providerName
  if (data.providerOrg !== undefined) updateData.provider_org = data.providerOrg
  if (data.providerEmail !== undefined)
    updateData.provider_email = data.providerEmail
  if (data.scope !== undefined) updateData.scope = data.scope

  const { data: provider, error } = await supabase
    .from('patient_providers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<PatientProvider>(provider)
}

export async function deleteProvider(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('patient_providers')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getProviderByPatientAndName(
  patientId: string,
  providerName: string,
): Promise<PatientProvider | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_providers')
    .select()
    .eq('patient_id', patientId)
    .eq('provider_name', providerName)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<PatientProvider>(data)
}

export async function getProviderByPatientAndEmployeeId(
  patientId: string,
  employeeId: string,
): Promise<PatientProvider | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('patient_providers')
    .select()
    .eq('patient_id', patientId)
    .eq('employee_id', employeeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<PatientProvider>(data)
}
