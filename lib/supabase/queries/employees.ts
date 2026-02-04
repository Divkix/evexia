import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'
import type { Organization } from './organizations'

// CamelCase type matching Drizzle schema
export interface Employee {
  id: string
  organizationId: string
  employeeId: string
  name: string
  email: string | null
  department: string | null
  isActive: boolean
  createdAt: string
}

export interface EmployeeWithOrganization extends Employee {
  organization: Organization
}

/**
 * @deprecated Use getEmployeeByEmployeeIdAndOrg instead for multi-tenant support
 */
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

/**
 * Get employee by employeeId and organizationId (multi-tenant lookup)
 */
export async function getEmployeeByEmployeeIdAndOrg(
  employeeId: string,
  organizationId: string,
): Promise<Employee | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select()
    .eq('employee_id', employeeId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Employee>(data)
}

/**
 * Get employee with organization details joined
 */
export async function getEmployeeWithOrganization(
  employeeId: string,
  organizationId: string,
): Promise<EmployeeWithOrganization | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      organizations (*)
    `)
    .eq('employee_id', employeeId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  // Transform nested organization data
  const employee = toCamelCase<Employee>(data)
  const orgData = data.organizations as Record<string, unknown>

  return {
    ...employee,
    organization: toCamelCase<Organization>(orgData),
  }
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
