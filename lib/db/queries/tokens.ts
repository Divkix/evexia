import { randomBytes } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../index'
import { type ShareToken, shareTokens } from '../schema'

export interface NewTokenData {
  patientId: string
  scope: string[]
  expiresAt: Date
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createShareToken(
  data: NewTokenData,
): Promise<ShareToken> {
  const token = generateSecureToken()

  const result = await db
    .insert(shareTokens)
    .values({
      patientId: data.patientId,
      token,
      scope: data.scope,
      expiresAt: data.expiresAt,
    })
    .returning()

  return result[0]
}

export async function getShareToken(token: string): Promise<ShareToken | null> {
  const result = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.token, token))
    .limit(1)

  return result[0] ?? null
}

export async function getValidShareToken(
  token: string,
): Promise<ShareToken | null> {
  const now = new Date()

  const result = await db
    .select()
    .from(shareTokens)
    .where(
      and(
        eq(shareTokens.token, token),
        isNull(shareTokens.revokedAt),
        gt(shareTokens.expiresAt, now),
      ),
    )
    .limit(1)

  return result[0] ?? null
}

export async function getPatientTokens(
  patientId: string,
): Promise<ShareToken[]> {
  return db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.patientId, patientId))
    .orderBy(shareTokens.createdAt)
}

export async function revokeToken(id: string): Promise<ShareToken | null> {
  const result = await db
    .update(shareTokens)
    .set({ revokedAt: new Date() })
    .where(eq(shareTokens.id, id))
    .returning()

  return result[0] ?? null
}

export async function deleteToken(id: string): Promise<void> {
  await db.delete(shareTokens).where(eq(shareTokens.id, id))
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
