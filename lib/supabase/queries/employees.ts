import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

// CamelCase type matching Drizzle schema
export interface Employee {
  id: string
  employeeId: string
  name: string
  organization: string
  email: string | null
  department: string | null
  isActive: boolean
  createdAt: string
}

export async function getEmployeeByEmployeeId(
  employeeId: string,
): Promise<Employee | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select()
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Employee>(data)
}

export async function getAllEmployees(): Promise<Employee[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select()
    .eq('is_active', true)
    .order('employee_id', { ascending: true })

  if (error) throw error
  return (data ?? []).map((e) => toCamelCase<Employee>(e))
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Employee>(data)
}
