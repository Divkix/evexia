import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

export interface NewTokenData {
  patientId: string
  scope: string[]
  expiresAt: Date
}

// CamelCase type matching Drizzle schema
export interface ShareToken {
  id: string
  patientId: string
  token: string
  scope: string[]
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

/**
 * Generates a secure random token using Web Crypto API.
 * Edge-compatible replacement for Node.js crypto.randomBytes.
 */
export function generateSecureToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function createShareToken(
  data: NewTokenData,
): Promise<ShareToken> {
  const supabase = createAdminClient()
  const token = generateSecureToken()

  const { data: shareToken, error } = await supabase
    .from('share_tokens')
    .insert({
      patient_id: data.patientId,
      token,
      scope: data.scope,
      expires_at: data.expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return toCamelCase<ShareToken>(shareToken)
}

export async function getTokenById(id: string): Promise<ShareToken | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('share_tokens')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<ShareToken>(data)
}

export async function getShareToken(token: string): Promise<ShareToken | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('share_tokens')
    .select()
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<ShareToken>(data)
}

export async function getValidShareToken(
  token: string,
): Promise<ShareToken | null> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('share_tokens')
    .select()
    .eq('token', token)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<ShareToken>(data)
}

export async function getPatientTokens(
  patientId: string,
): Promise<ShareToken[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('share_tokens')
    .select()
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((t) => toCamelCase<ShareToken>(t))
}

export async function revokeToken(id: string): Promise<ShareToken | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<ShareToken>(data)
}

export async function deleteToken(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('share_tokens').delete().eq('id', id)

  if (error) throw error
}

export function isTokenExpired(token: ShareToken): boolean {
  return new Date() > new Date(token.expiresAt)
}

export function isTokenRevoked(token: ShareToken): boolean {
  return token.revokedAt !== null
}

export function isTokenValid(token: ShareToken): boolean {
  return !isTokenExpired(token) && !isTokenRevoked(token)
}
