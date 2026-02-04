import { and, eq } from 'drizzle-orm'
import { db } from '../index'
import {
  type NewPatientProvider,
  type PatientProvider,
  patientProviders,
} from '../schema'

export async function getPatientProviders(
  patientId: string,
): Promise<PatientProvider[]> {
  return db
    .select()
    .from(patientProviders)
    .where(eq(patientProviders.patientId, patientId))
    .orderBy(patientProviders.createdAt)
}

export async function getProviderById(
  id: string,
): Promise<PatientProvider | null> {
  const result = await db
    .select()
    .from(patientProviders)
    .where(eq(patientProviders.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function createProvider(
  data: NewPatientProvider,
): Promise<PatientProvider> {
  const result = await db.insert(patientProviders).values(data).returning()

  return result[0]
}

export async function updateProvider(
  id: string,
  data: Partial<Omit<NewPatientProvider, 'id' | 'patientId'>>,
): Promise<PatientProvider | null> {
  const result = await db
    .update(patientProviders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(patientProviders.id, id))
    .returning()

  return result[0] ?? null
}

export async function deleteProvider(id: string): Promise<void> {
  await db.delete(patientProviders).where(eq(patientProviders.id, id))
}

export async function getProviderByPatientAndName(
  patientId: string,
  providerName: string,
): Promise<PatientProvider | null> {
  const result = await db
    .select()
    .from(patientProviders)
    .where(
      and(
        eq(patientProviders.patientId, patientId),
        eq(patientProviders.providerName, providerName),
      ),
    )
    .limit(1)

  return result[0] ?? null
}

export async function getProviderByPatientAndEmployeeId(
  patientId: string,
  employeeId: string,
): Promise<PatientProvider | null> {
  const result = await db
    .select()
    .from(patientProviders)
    .where(
      and(
        eq(patientProviders.patientId, patientId),
        eq(patientProviders.employeeId, employeeId),
      ),
    )
    .limit(1)

  return result[0] ?? null
}
