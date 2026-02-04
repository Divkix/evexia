import { and, eq } from 'drizzle-orm'
import { db } from '../index'
import { type Employee, employees } from '../schema'

export async function getEmployeeByEmployeeId(
  employeeId: string,
): Promise<Employee | null> {
  const result = await db
    .select()
    .from(employees)
    .where(
      and(eq(employees.employeeId, employeeId), eq(employees.isActive, true)),
    )
    .limit(1)

  return result[0] ?? null
}

export async function getAllEmployees(): Promise<Employee[]> {
  return db
    .select()
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(employees.employeeId)
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1)

  return result[0] ?? null
}
