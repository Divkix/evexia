import { and, eq } from 'drizzle-orm'
import { db } from '../index'
import { type NewPatient, type Patient, patients } from '../schema'

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function getPatientByEmail(
  email: string,
): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.email, email.toLowerCase()))
    .limit(1)

  return result[0] ?? null
}

export async function getPatientByNameAndDob(
  name: string,
  dateOfBirth: string,
): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(and(eq(patients.name, name), eq(patients.dateOfBirth, dateOfBirth)))
    .limit(1)

  return result[0] ?? null
}

export async function createPatient(data: NewPatient): Promise<Patient> {
  const result = await db
    .insert(patients)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning()

  return result[0]
}

export async function updatePatient(
  id: string,
  data: Partial<Omit<NewPatient, 'id'>>,
): Promise<Patient | null> {
  const result = await db
    .update(patients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patients.id, id))
    .returning()

  return result[0] ?? null
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
