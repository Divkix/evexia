export function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue
}

export const env = {
  database: {
    url: () => getEnvVar('DATABASE_URL'),
  },
  supabase: {
    url: () => getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: () => getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: () => getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  ai: {
    openRouterKey: () => process.env.OPENROUTER_API_KEY,
    model: () => getOptionalEnvVar('AI_MODEL', 'openai/gpt-4o-mini'),
    enabled: () => process.env.AI_ENABLED === 'true',
  },
  dev: {
    bypassAuth: () => process.env.BYPASS_AUTH_LOCAL === 'true',
  },
}
