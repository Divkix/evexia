import { desc, eq } from 'drizzle-orm'
import { db } from '../index'
import { type AccessLog, accessLogs, shareTokens } from '../schema'

export interface LogAccessData {
  tokenId?: string
  patientId: string
  providerName?: string
  providerOrg?: string
  ipAddress?: string
  userAgent?: string
  accessMethod: 'employee_id' | 'token' | 'otp'
  scope: string[]
}

export async function logAccess(data: LogAccessData): Promise<AccessLog> {
  const result = await db.insert(accessLogs).values(data).returning()

  return result[0]
}

export async function getPatientAccessLogs(
  patientId: string,
): Promise<AccessLog[]> {
  return db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.patientId, patientId))
    .orderBy(desc(accessLogs.accessedAt))
}

export async function getAccessLogsByToken(
  tokenId: string,
): Promise<AccessLog[]> {
  return db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.tokenId, tokenId))
    .orderBy(desc(accessLogs.accessedAt))
}

export interface AccessLogWithToken extends AccessLog {
  token?: string
}

export async function getPatientAccessLogsWithTokens(
  patientId: string,
): Promise<AccessLogWithToken[]> {
  const logs = await db
    .select({
      log: accessLogs,
      token: shareTokens.token,
    })
    .from(accessLogs)
    .leftJoin(shareTokens, eq(accessLogs.tokenId, shareTokens.id))
    .where(eq(accessLogs.patientId, patientId))
    .orderBy(desc(accessLogs.accessedAt))

  return logs.map(({ log, token }) => ({
    ...log,
    token: token ?? undefined,
  }))
}
