import { createAdminClient } from '../admin'
import { toCamelCase } from '../utils'

// CamelCase type matching Drizzle schema
export interface Organization {
  id: string
  slug: string
  name: string
  isActive: boolean
  createdAt: string
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map((o) => toCamelCase<Organization>(o))
}

export async function getOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Organization>(data)
}

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return toCamelCase<Organization>(data)
}
