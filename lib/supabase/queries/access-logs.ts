import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

export interface LogAccessData {
  tokenId?: string
  patientId: string
  providerName?: string
  providerOrg?: string
  ipAddress?: string
  userAgent?: string
  accessMethod: 'employee_id' | 'token' | 'otp' | 'emergency'
  scope: string[]
  isEmergencyAccess?: boolean
}

// CamelCase type matching Drizzle schema
export interface AccessLog {
  id: string
  tokenId: string | null
  patientId: string
  providerName: string | null
  providerOrg: string | null
  ipAddress: string | null
  userAgent: string | null
  accessMethod: string | null
  scope: string[] | null
  isEmergencyAccess: boolean
  accessedAt: string
}

export interface AccessLogWithToken extends AccessLog {
  token?: string
}

export async function logAccess(data: LogAccessData): Promise<AccessLog> {
  const supabase = createAdminClient()

  const insertData: Record<string, unknown> = {
    token_id: data.tokenId ?? null,
    patient_id: data.patientId,
    provider_name: data.providerName ?? null,
    provider_org: data.providerOrg ?? null,
    ip_address: data.ipAddress ?? null,
    user_agent: data.userAgent ?? null,
    access_method: data.accessMethod,
    scope: data.scope,
    is_emergency_access: data.isEmergencyAccess ?? false,
  }

  const { data: log, error } = await supabase
    .from('access_logs')
    // biome-ignore lint/suspicious/noExplicitAny: dynamic insert based on schema
    .insert(insertData as any)
    .select()
    .single()

  if (error) throw error
  return toCamelCase<AccessLog>(log)
}

export async function getPatientAccessLogs(
  patientId: string,
): Promise<AccessLog[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('access_logs')
    .select()
    .eq('patient_id', patientId)
    .order('accessed_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((l) => toCamelCase<AccessLog>(l))
}

export async function getAccessLogsByToken(
  tokenId: string,
): Promise<AccessLog[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('access_logs')
    .select()
    .eq('token_id', tokenId)
    .order('accessed_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((l) => toCamelCase<AccessLog>(l))
}

export async function getPatientAccessLogsWithTokens(
  patientId: string,
): Promise<AccessLogWithToken[]> {
  const supabase = createAdminClient()

  // Supabase supports joining via foreign key references
  const { data, error } = await supabase
    .from('access_logs')
    .select(`
      *,
      share_tokens (token)
    `)
    .eq('patient_id', patientId)
    .order('accessed_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((log) => {
    const camelLog = toCamelCase<AccessLogWithToken>(log)
    // Extract token from nested share_tokens object
    const tokenData = log.share_tokens as { token: string } | null
    return {
      ...camelLog,
      token: tokenData?.token ?? undefined,
      shareTokens: undefined, // Remove the nested object
    } as AccessLogWithToken
  })
}
