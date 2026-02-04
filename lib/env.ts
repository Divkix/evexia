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
    /**
     * Auth bypass is ONLY allowed in non-production environments.
     * This is a safety check to prevent BYPASS_AUTH_LOCAL from being
     * accidentally enabled in production builds.
     */
    bypassAuth: () =>
      process.env.NODE_ENV !== 'production' &&
      process.env.BYPASS_AUTH_LOCAL === 'true',
  },
}

/**
 * Validate AI configuration at startup.
 * Logs a warning if AI_ENABLED=true but OPENROUTER_API_KEY is missing.
 * Non-throwing to work with Cloudflare Workers (stateless).
 */
export function validateAIConfig(): void {
  const aiEnabled = env.ai.enabled()
  const apiKey = env.ai.openRouterKey()

  if (aiEnabled && !apiKey) {
    console.warn(
      '[AI Config Warning] AI_ENABLED is true but OPENROUTER_API_KEY is not set. ' +
        'AI summaries will fall back to mock generation.',
    )
  }
}

// Run validation at module load (only on server)
if (typeof window === 'undefined') {
  validateAIConfig()
}
