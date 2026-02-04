# Evexia Next.js Port - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port Evexia medical data aggregation platform from Python/FastAPI to Next.js with Supabase, enhanced auth, and provider management.

**Architecture:** Next.js 16 App Router with API routes for backend logic. Drizzle ORM connects to Supabase PostgreSQL. Supabase Auth handles email OTP. OpenRouter via Vercel AI SDK provides health summaries with mock fallback.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, Supabase (PostgreSQL + Auth), Vercel AI SDK, OpenRouter, shadcn/ui, Tailwind v4, Recharts, Bun, Biome, opennextjs-cloudflare

**Design Document:** `docs/plans/2026-02-03-evexia-nextjs-port-design.md`

---

## Phase 1: Project Foundation

### Task 1: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install database and ORM dependencies**

Run:
```bash
bun add drizzle-orm postgres @supabase/supabase-js @supabase/ssr
bun add -D drizzle-kit
```

**Step 2: Install AI dependencies**

Run:
```bash
bun add ai @openrouter/ai-sdk-provider
```

**Step 3: Install UI dependencies**

Run:
```bash
bun add recharts sonner
bunx shadcn@latest init -y
```

When prompted by shadcn:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 4: Install shadcn components**

Run:
```bash
bunx shadcn@latest add button card input label tabs checkbox dialog table badge skeleton alert form toast
```

**Step 5: Install dev tooling**

Run:
```bash
bun add -D @biomejs/biome knip
```

**Step 6: Install deployment dependencies**

Run:
```bash
bun add -D @opennextjs/cloudflare wrangler
```

**Step 7: Verify installation**

Run:
```bash
bun run type-check || echo "type-check script not yet defined - expected"
```

**Step 8: Commit**

```bash
git add package.json bun.lock components.json tailwind.config.*
git add -A components/ui/
git commit -m "chore: install core dependencies

- Drizzle ORM + Supabase client
- Vercel AI SDK + OpenRouter provider
- shadcn/ui components
- Recharts, Sonner
- Biome, Knip
- opennextjs-cloudflare"
```

---

### Task 2: Configure Biome and Scripts

**Files:**
- Create: `biome.json`
- Modify: `package.json`

**Step 1: Create Biome configuration**

Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "*.config.js",
      "*.config.ts",
      "components/ui/**"
    ]
  }
}
```

**Step 2: Update package.json scripts**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "type-check": "tsc --noEmit",
    "dead-code": "bunx knip",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts",
    "cf:build": "opennextjs-cloudflare build",
    "cf:deploy": "wrangler deploy"
  }
}
```

**Step 3: Run lint to verify**

Run:
```bash
bun run lint
```

Expected: May show some issues in existing template files - that's OK

**Step 4: Fix any lint issues**

Run:
```bash
bun run lint:fix
```

**Step 5: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS (no TypeScript errors)

**Step 6: Commit**

```bash
git add biome.json package.json
git commit -m "chore: configure Biome linting and add npm scripts

- Biome for linting/formatting with sensible defaults
- Scripts for lint, type-check, dead-code detection
- Scripts for Drizzle db operations
- Scripts for Cloudflare deployment"
```

---

### Task 3: Environment Configuration

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored)
- Modify: `.gitignore`

**Step 1: Create .env.example**

Create `.env.example`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-your-key
AI_MODEL=openai/gpt-4o-mini
AI_ENABLED=true

# Development
BYPASS_AUTH_LOCAL=false
```

**Step 2: Create .env.local with placeholders**

Create `.env.local`:
```bash
# Supabase - fill these in from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenRouter AI - get key from openrouter.ai
OPENROUTER_API_KEY=
AI_MODEL=openai/gpt-4o-mini
AI_ENABLED=false

# Development - set to true to bypass auth locally
BYPASS_AUTH_LOCAL=true
```

**Step 3: Update .gitignore**

Add to `.gitignore`:
```
# Environment
.env.local
.env.*.local

# Drizzle
drizzle/meta

# Cloudflare
.open-next
.wrangler
```

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment configuration

- .env.example with all required variables documented
- Updated .gitignore for env files, Drizzle, Cloudflare"
```

---

### Task 4: Create Drizzle Schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `drizzle.config.ts`

**Step 1: Create database schema**

Create `lib/db/schema.ts`:
```typescript
import { pgTable, uuid, text, timestamp, date, jsonb, boolean } from 'drizzle-orm/pg-core'

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  dateOfBirth: date('date_of_birth').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  hospital: text('hospital').notNull(),
  category: text('category').notNull(), // vitals, labs, meds, encounters
  data: jsonb('data').notNull(),
  recordDate: date('record_date'),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  clinicianSummary: text('clinician_summary'),
  patientSummary: text('patient_summary'),
  anomalies: jsonb('anomalies'),
  modelUsed: text('model_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const patientProviders = pgTable('patient_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  providerName: text('provider_name').notNull(),
  providerOrg: text('provider_org'),
  providerEmail: text('provider_email'),
  scope: text('scope').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const shareTokens = pgTable('share_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  scope: text('scope').array().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').references(() => shareTokens.id, { onDelete: 'set null' }),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  providerName: text('provider_name'),
  providerOrg: text('provider_org'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  accessMethod: text('access_method'), // 'otp' or 'token'
  scope: text('scope').array(),
  accessedAt: timestamp('accessed_at').defaultNow().notNull(),
})

// Type exports
export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
export type Record = typeof records.$inferSelect
export type NewRecord = typeof records.$inferInsert
export type Summary = typeof summaries.$inferSelect
export type PatientProvider = typeof patientProviders.$inferSelect
export type ShareToken = typeof shareTokens.$inferSelect
export type AccessLog = typeof accessLogs.$inferSelect
```

**Step 2: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

**Step 3: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle.config.ts
git commit -m "feat: add Drizzle database schema

Tables: patients, records, summaries, patient_providers,
share_tokens, access_logs

Includes type exports for all tables"
```

---

### Task 5: Create Database Client

**Files:**
- Create: `lib/db/index.ts`
- Create: `lib/env.ts`

**Step 1: Create environment validation**

Create `lib/env.ts`:
```typescript
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
```

**Step 2: Create database client**

Create `lib/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

export * from './schema'
```

**Step 3: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add lib/db/index.ts lib/env.ts
git commit -m "feat: add database client and env utilities

- Drizzle client with postgres.js driver
- Type-safe environment variable access
- Centralized env config for Supabase, AI, dev flags"
```

---

### Task 6: Create Supabase Clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`

**Step 1: Create browser client**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware helper**

Create `lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if auth bypass is enabled for local development
  const bypassAuth = process.env.BYPASS_AUTH_LOCAL === 'true'

  // Protected routes that require authentication
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/patient') &&
    !request.nextUrl.pathname.startsWith('/patient/login')

  if (isProtectedRoute && !user && !bypassAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/patient/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 4: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client utilities

- Browser client for client components
- Server client for server components/API routes
- Middleware helper with auth bypass for dev"
```

---

### Task 7: Create Auth Middleware

**Files:**
- Create: `middleware.ts`

**Step 1: Create Next.js middleware**

Create `middleware.ts` in project root:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware

Protects /patient/* routes, redirects to login if unauthenticated
Respects BYPASS_AUTH_LOCAL for development"
```

---

## Phase 2: Database Queries

### Task 8: Patient Queries

**Files:**
- Create: `lib/db/queries/patients.ts`

**Step 1: Create patient query functions**

Create `lib/db/queries/patients.ts`:
```typescript
import { eq, and } from 'drizzle-orm'
import { db } from '../index'
import { patients, type Patient, type NewPatient } from '../schema'

export async function getPatientById(id: string): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.email, email.toLowerCase()))
    .limit(1)

  return result[0] ?? null
}

export async function getPatientByNameAndDob(
  name: string,
  dateOfBirth: string
): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.name, name),
        eq(patients.dateOfBirth, dateOfBirth)
      )
    )
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
  data: Partial<Omit<NewPatient, 'id'>>
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

  const maskedLocal = local[0] + '***' + (local.length > 1 ? local[local.length - 1] : '')
  const [domainName, tld] = domain.split('.')
  const maskedDomain = domainName?.[0] + '***' + '.' + tld

  return `${maskedLocal}@${maskedDomain}`
}
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/db/queries/patients.ts
git commit -m "feat: add patient database queries

- getPatientById, getPatientByEmail, getPatientByNameAndDob
- createPatient, updatePatient
- maskEmail utility for displaying masked emails"
```

---

### Task 9: Records Queries

**Files:**
- Create: `lib/db/queries/records.ts`

**Step 1: Create records query functions**

Create `lib/db/queries/records.ts`:
```typescript
import { eq, and, inArray, desc } from 'drizzle-orm'
import { db } from '../index'
import { records, type Record, type NewRecord } from '../schema'

export type RecordCategory = 'vitals' | 'labs' | 'meds' | 'encounters'

export const RECORD_CATEGORIES: RecordCategory[] = ['vitals', 'labs', 'meds', 'encounters']

export const HOSPITALS = ['Banner Health', 'Mayo Clinic', 'Phoenician Medical Center'] as const

export async function getPatientRecords(
  patientId: string,
  options?: {
    categories?: RecordCategory[]
    hospitals?: string[]
  }
): Promise<Record[]> {
  let query = db
    .select()
    .from(records)
    .where(eq(records.patientId, patientId))
    .$dynamic()

  if (options?.categories?.length) {
    query = query.where(
      and(
        eq(records.patientId, patientId),
        inArray(records.category, options.categories)
      )
    )
  }

  if (options?.hospitals?.length) {
    query = query.where(
      and(
        eq(records.patientId, patientId),
        inArray(records.hospital, options.hospitals)
      )
    )
  }

  return query.orderBy(desc(records.recordDate))
}

export async function createRecord(data: NewRecord): Promise<Record> {
  const result = await db
    .insert(records)
    .values(data)
    .returning()

  return result[0]
}

export async function createManyRecords(data: NewRecord[]): Promise<Record[]> {
  if (data.length === 0) return []

  const result = await db
    .insert(records)
    .values(data)
    .returning()

  return result
}

export async function deletePatientRecords(patientId: string): Promise<void> {
  await db.delete(records).where(eq(records.patientId, patientId))
}

export async function getRecordById(id: string): Promise<Record | null> {
  const result = await db
    .select()
    .from(records)
    .where(eq(records.id, id))
    .limit(1)

  return result[0] ?? null
}
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/db/queries/records.ts
git commit -m "feat: add records database queries

- getPatientRecords with category/hospital filtering
- createRecord, createManyRecords
- deletePatientRecords, getRecordById
- RecordCategory type and constants"
```

---

### Task 10: Summaries Queries

**Files:**
- Create: `lib/db/queries/summaries.ts`

**Step 1: Create summaries query functions**

Create `lib/db/queries/summaries.ts`:
```typescript
import { eq, desc } from 'drizzle-orm'
import { db } from '../index'
import { summaries, type Summary } from '../schema'

export interface Anomaly {
  type: 'high' | 'low' | 'duplicate' | 'missing'
  category: string
  field: string
  value: string | number
  message: string
}

export interface SummaryData {
  clinicianSummary: string
  patientSummary: string
  anomalies: Anomaly[]
  modelUsed: string
}

export async function getPatientSummary(patientId: string): Promise<Summary | null> {
  const result = await db
    .select()
    .from(summaries)
    .where(eq(summaries.patientId, patientId))
    .orderBy(desc(summaries.createdAt))
    .limit(1)

  return result[0] ?? null
}

export async function saveSummary(
  patientId: string,
  data: SummaryData
): Promise<Summary> {
  // Delete existing summaries for this patient
  await db.delete(summaries).where(eq(summaries.patientId, patientId))

  const result = await db
    .insert(summaries)
    .values({
      patientId,
      clinicianSummary: data.clinicianSummary,
      patientSummary: data.patientSummary,
      anomalies: data.anomalies,
      modelUsed: data.modelUsed,
    })
    .returning()

  return result[0]
}

export async function deleteSummary(patientId: string): Promise<void> {
  await db.delete(summaries).where(eq(summaries.patientId, patientId))
}
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/db/queries/summaries.ts
git commit -m "feat: add summaries database queries

- getPatientSummary (latest)
- saveSummary (replaces existing)
- deleteSummary
- Anomaly interface definition"
```

---

### Task 11: Providers Queries

**Files:**
- Create: `lib/db/queries/providers.ts`

**Step 1: Create providers query functions**

Create `lib/db/queries/providers.ts`:
```typescript
import { eq, and } from 'drizzle-orm'
import { db } from '../index'
import { patientProviders, type PatientProvider } from '../schema'

export interface NewProviderData {
  patientId: string
  providerName: string
  providerOrg?: string
  providerEmail?: string
  scope: string[]
}

export async function getPatientProviders(patientId: string): Promise<PatientProvider[]> {
  return db
    .select()
    .from(patientProviders)
    .where(eq(patientProviders.patientId, patientId))
    .orderBy(patientProviders.createdAt)
}

export async function getProviderById(id: string): Promise<PatientProvider | null> {
  const result = await db
    .select()
    .from(patientProviders)
    .where(eq(patientProviders.id, id))
    .limit(1)

  return result[0] ?? null
}

export async function createProvider(data: NewProviderData): Promise<PatientProvider> {
  const result = await db
    .insert(patientProviders)
    .values(data)
    .returning()

  return result[0]
}

export async function updateProvider(
  id: string,
  data: Partial<Omit<NewProviderData, 'patientId'>>
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
  providerName: string
): Promise<PatientProvider | null> {
  const result = await db
    .select()
    .from(patientProviders)
    .where(
      and(
        eq(patientProviders.patientId, patientId),
        eq(patientProviders.providerName, providerName)
      )
    )
    .limit(1)

  return result[0] ?? null
}
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/db/queries/providers.ts
git commit -m "feat: add patient providers database queries

- getPatientProviders, getProviderById
- createProvider, updateProvider, deleteProvider
- getProviderByPatientAndName for lookups"
```

---

### Task 12: Tokens Queries

**Files:**
- Create: `lib/db/queries/tokens.ts`

**Step 1: Create tokens query functions**

Create `lib/db/queries/tokens.ts`:
```typescript
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db } from '../index'
import { shareTokens, type ShareToken } from '../schema'
import { randomBytes } from 'crypto'

export interface NewTokenData {
  patientId: string
  scope: string[]
  expiresAt: Date
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createShareToken(data: NewTokenData): Promise<ShareToken> {
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

export async function getValidShareToken(token: string): Promise<ShareToken | null> {
  const now = new Date()

  const result = await db
    .select()
    .from(shareTokens)
    .where(
      and(
        eq(shareTokens.token, token),
        isNull(shareTokens.revokedAt),
        gt(shareTokens.expiresAt, now)
      )
    )
    .limit(1)

  return result[0] ?? null
}

export async function getPatientTokens(patientId: string): Promise<ShareToken[]> {
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
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add lib/db/queries/tokens.ts
git commit -m "feat: add share tokens database queries

- generateSecureToken using crypto.randomBytes
- createShareToken, getShareToken, getValidShareToken
- getPatientTokens, revokeToken, deleteToken
- Token validation helpers (expired, revoked, valid)"
```

---

### Task 13: Access Logs Queries

**Files:**
- Create: `lib/db/queries/access-logs.ts`
- Create: `lib/db/queries/index.ts`

**Step 1: Create access logs query functions**

Create `lib/db/queries/access-logs.ts`:
```typescript
import { eq, desc } from 'drizzle-orm'
import { db } from '../index'
import { accessLogs, shareTokens, type AccessLog } from '../schema'

export interface LogAccessData {
  tokenId?: string
  patientId: string
  providerName?: string
  providerOrg?: string
  ipAddress?: string
  userAgent?: string
  accessMethod: 'otp' | 'token'
  scope: string[]
}

export async function logAccess(data: LogAccessData): Promise<AccessLog> {
  const result = await db
    .insert(accessLogs)
    .values(data)
    .returning()

  return result[0]
}

export async function getPatientAccessLogs(patientId: string): Promise<AccessLog[]> {
  return db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.patientId, patientId))
    .orderBy(desc(accessLogs.accessedAt))
}

export async function getAccessLogsByToken(tokenId: string): Promise<AccessLog[]> {
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
  patientId: string
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
```

**Step 2: Create queries index**

Create `lib/db/queries/index.ts`:
```typescript
export * from './patients'
export * from './records'
export * from './summaries'
export * from './providers'
export * from './tokens'
export * from './access-logs'
```

**Step 3: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add lib/db/queries/
git commit -m "feat: add access logs queries and queries index

- logAccess (fixed: includes proper commit unlike Python version)
- getPatientAccessLogs, getAccessLogsByToken
- getPatientAccessLogsWithTokens (joined query)
- Re-export all queries from index"
```

---

## Phase 3: AI Integration

### Task 14: AI Summary Generation

**Files:**
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/mock.ts`
- Create: `lib/ai/summary.ts`

**Step 1: Create prompt templates**

Create `lib/ai/prompts.ts`:
```typescript
import type { Record } from '@/lib/db/schema'

export function buildMedicalPrompt(records: Record[]): string {
  const vitals = records.filter(r => r.category === 'vitals')
  const labs = records.filter(r => r.category === 'labs')
  const meds = records.filter(r => r.category === 'meds')
  const encounters = records.filter(r => r.category === 'encounters')

  return `You are a medical AI assistant analyzing patient health records.
Generate two summaries and identify any anomalies.

PATIENT HEALTH RECORDS:

VITALS (${vitals.length} records):
${JSON.stringify(vitals.map(r => r.data), null, 2)}

LAB RESULTS (${labs.length} records):
${JSON.stringify(labs.map(r => r.data), null, 2)}

MEDICATIONS (${meds.length} records):
${JSON.stringify(meds.map(r => r.data), null, 2)}

ENCOUNTERS (${encounters.length} records):
${JSON.stringify(encounters.map(r => r.data), null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "clinician_summary": "Clinical bullet-point summary for healthcare providers. Include key metrics, trends, and concerns.",
  "patient_summary": "Plain-language summary for the patient. Explain what the numbers mean and any lifestyle recommendations.",
  "anomalies": [
    {
      "type": "high|low|duplicate|missing",
      "category": "vitals|labs|meds|encounters",
      "field": "field name",
      "value": "the concerning value",
      "message": "brief explanation"
    }
  ]
}

Focus on:
- BMI trends (normal: 18.5-24.9, overweight: 25-29.9, obese: 30+)
- Blood pressure patterns (normal: <120/80, elevated: 120-129/<80, high: 130+/80+)
- A1C levels (normal: <5.7%, prediabetes: 5.7-6.4%, diabetes: 6.5%+)
- Cholesterol (desirable: <200, borderline: 200-239, high: 240+)
- Medication interactions or duplicates
- Missing follow-ups or screenings`
}

export const MEDICAL_DISCLAIMER =
  'DISCLAIMER: This is informational only, not medical advice. AI summaries may be inaccurate. Always verify with original records and consult your healthcare provider.'
```

**Step 2: Create mock summary generator**

Create `lib/ai/mock.ts`:
```typescript
import type { Record } from '@/lib/db/schema'
import type { Anomaly, SummaryData } from '@/lib/db/queries/summaries'

interface VitalData {
  date?: string
  blood_pressure?: string
  heart_rate?: number
  bmi?: number
  weight?: number
  height?: number
}

interface LabData {
  date?: string
  total_cholesterol?: number
  a1c?: number
  hemoglobin_a1c?: number
}

export function generateMockSummary(records: Record[]): SummaryData {
  const anomalies: Anomaly[] = []

  const vitals = records.filter(r => r.category === 'vitals')
  const labs = records.filter(r => r.category === 'labs')
  const meds = records.filter(r => r.category === 'meds')

  // Analyze vitals
  let latestBmi: number | null = null
  let latestBp: string | null = null

  for (const record of vitals) {
    const data = record.data as VitalData

    if (data.bmi) {
      latestBmi = data.bmi
      if (data.bmi > 30) {
        anomalies.push({
          type: 'high',
          category: 'vitals',
          field: 'bmi',
          value: data.bmi,
          message: `BMI of ${data.bmi} indicates obesity (>30)`,
        })
      } else if (data.bmi < 18.5) {
        anomalies.push({
          type: 'low',
          category: 'vitals',
          field: 'bmi',
          value: data.bmi,
          message: `BMI of ${data.bmi} indicates underweight (<18.5)`,
        })
      }
    }

    if (data.blood_pressure) {
      latestBp = data.blood_pressure
      const [systolic] = data.blood_pressure.split('/').map(Number)
      if (systolic && systolic >= 140) {
        anomalies.push({
          type: 'high',
          category: 'vitals',
          field: 'blood_pressure',
          value: data.blood_pressure,
          message: `Blood pressure of ${data.blood_pressure} indicates hypertension (≥140/90)`,
        })
      }
    }
  }

  // Analyze labs
  let latestA1c: number | null = null
  let latestCholesterol: number | null = null

  for (const record of labs) {
    const data = record.data as LabData

    const a1c = data.a1c ?? data.hemoglobin_a1c
    if (a1c) {
      latestA1c = a1c
      if (a1c >= 6.5) {
        anomalies.push({
          type: 'high',
          category: 'labs',
          field: 'a1c',
          value: a1c,
          message: `A1C of ${a1c}% indicates diabetes (≥6.5%)`,
        })
      } else if (a1c >= 5.7) {
        anomalies.push({
          type: 'high',
          category: 'labs',
          field: 'a1c',
          value: a1c,
          message: `A1C of ${a1c}% indicates prediabetes (5.7-6.4%)`,
        })
      }
    }

    if (data.total_cholesterol) {
      latestCholesterol = data.total_cholesterol
      if (data.total_cholesterol >= 240) {
        anomalies.push({
          type: 'high',
          category: 'labs',
          field: 'total_cholesterol',
          value: data.total_cholesterol,
          message: `Total cholesterol of ${data.total_cholesterol} mg/dL is high (≥240)`,
        })
      }
    }
  }

  // Build summaries
  const clinicianSummary = buildClinicianSummary(latestBmi, latestBp, latestA1c, latestCholesterol, meds.length, anomalies.length)
  const patientSummary = buildPatientSummary(latestBmi, latestBp, latestA1c, latestCholesterol, anomalies)

  return {
    clinicianSummary,
    patientSummary,
    anomalies,
    modelUsed: 'mock-deterministic',
  }
}

function buildClinicianSummary(
  bmi: number | null,
  bp: string | null,
  a1c: number | null,
  cholesterol: number | null,
  medCount: number,
  anomalyCount: number
): string {
  const points: string[] = []

  if (bmi) points.push(`• BMI: ${bmi} (${getBmiCategory(bmi)})`)
  if (bp) points.push(`• Blood Pressure: ${bp}`)
  if (a1c) points.push(`• HbA1c: ${a1c}%`)
  if (cholesterol) points.push(`• Total Cholesterol: ${cholesterol} mg/dL`)
  points.push(`• Active Medications: ${medCount}`)
  if (anomalyCount > 0) points.push(`• Flagged Anomalies: ${anomalyCount}`)

  return points.join('\n')
}

function buildPatientSummary(
  bmi: number | null,
  bp: string | null,
  a1c: number | null,
  cholesterol: number | null,
  anomalies: Anomaly[]
): string {
  const parts: string[] = ['Here\'s a summary of your recent health data:\n']

  if (bmi) {
    const category = getBmiCategory(bmi)
    parts.push(`Your BMI is ${bmi}, which is in the ${category.toLowerCase()} range.`)
  }

  if (bp) {
    parts.push(`Your most recent blood pressure reading was ${bp}.`)
  }

  if (a1c) {
    parts.push(`Your A1C level is ${a1c}%, which measures your average blood sugar over the past 2-3 months.`)
  }

  if (cholesterol) {
    parts.push(`Your total cholesterol is ${cholesterol} mg/dL.`)
  }

  if (anomalies.length > 0) {
    parts.push(`\nThere are ${anomalies.length} item(s) that may need attention - please review with your healthcare provider.`)
  } else {
    parts.push('\nNo significant concerns were identified in your recent records.')
  }

  return parts.join(' ')
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}
```

**Step 3: Create main summary module**

Create `lib/ai/summary.ts`:
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { Record } from '@/lib/db/schema'
import type { SummaryData } from '@/lib/db/queries/summaries'
import { buildMedicalPrompt } from './prompts'
import { generateMockSummary } from './mock'
import { env } from '@/lib/env'

export async function generateSummary(records: Record[]): Promise<SummaryData> {
  // Check if AI is enabled
  if (!env.ai.enabled()) {
    return generateMockSummary(records)
  }

  const apiKey = env.ai.openRouterKey()
  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not set, using mock summary')
    return generateMockSummary(records)
  }

  try {
    const openrouter = createOpenRouter({ apiKey })
    const model = env.ai.model()

    const { text } = await generateText({
      model: openrouter(model),
      prompt: buildMedicalPrompt(records),
      temperature: 0.3,
      maxTokens: 2000,
    })

    return parseAIResponse(text, model)
  } catch (error) {
    console.error('AI summary generation failed:', error)
    return generateMockSummary(records)
  }
}

function parseAIResponse(text: string, model: string): SummaryData {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      clinicianSummary: parsed.clinician_summary ?? '',
      patientSummary: parsed.patient_summary ?? '',
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      modelUsed: model,
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw error
  }
}

export { generateMockSummary } from './mock'
export { MEDICAL_DISCLAIMER } from './prompts'
```

**Step 4: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/ai/
git commit -m "feat: add AI summary generation

- OpenRouter integration via Vercel AI SDK
- Medical prompt template with analysis guidelines
- Deterministic mock fallback for when AI unavailable
- Anomaly detection for BMI, BP, A1C, cholesterol
- Graceful error handling with fallback"
```

---

## Phase 4: API Routes

### Task 15: Auth API Routes

**Files:**
- Create: `app/api/auth/send-otp/route.ts`
- Create: `app/api/auth/verify-otp/route.ts`
- Create: `app/api/auth/session/route.ts`

**Step 1: Create send OTP route**

Create `app/api/auth/send-otp/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPatientByNameAndDob, maskEmail } from '@/lib/db/queries/patients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, dateOfBirth } = body

    if (!name || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Name and date of birth are required' },
        { status: 400 }
      )
    }

    // Find patient by name and DOB
    const patient = await getPatientByNameAndDob(name, dateOfBirth)

    if (!patient) {
      return NextResponse.json(
        { error: 'No patient found with that name and date of birth' },
        { status: 404 }
      )
    }

    // Send OTP via Supabase
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: patient.email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error('Failed to send OTP:', error)
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      maskedEmail: maskEmail(patient.email),
      patientId: patient.id,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create verify OTP route**

Create `app/api/auth/verify-otp/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPatientById, updatePatient } from '@/lib/db/queries/patients'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, code } = body

    if (!patientId || !code) {
      return NextResponse.json(
        { error: 'Patient ID and verification code are required' },
        { status: 400 }
      )
    }

    const patient = await getPatientById(patientId)

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: patient.email,
      token: code,
      type: 'email',
    })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Link auth user to patient if not already linked
    if (data.user && !patient.authUserId) {
      await updatePatient(patient.id, { authUserId: data.user.id })
    }

    return NextResponse.json({
      success: true,
      patientId: patient.id,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create session route**

Create `app/api/auth/session/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPatientById } from '@/lib/db/queries/patients'
import { env } from '@/lib/env'

// Demo patient ID for bypass mode - will be set by seed script
const DEMO_PATIENT_ID = process.env.DEMO_PATIENT_ID

export async function GET() {
  try {
    // Check for auth bypass in development
    if (env.dev.bypassAuth() && DEMO_PATIENT_ID) {
      const patient = await getPatientById(DEMO_PATIENT_ID)
      if (patient) {
        return NextResponse.json({
          authenticated: true,
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
          },
          bypass: true,
        })
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
      })
    }

    // Find patient linked to this auth user
    // For now, we'll need to look up by email
    const { getPatientByEmail } = await import('@/lib/db/queries/patients')
    const patient = user.email ? await getPatientByEmail(user.email) : null

    if (!patient) {
      return NextResponse.json({
        authenticated: true,
        patient: null,
      })
    }

    return NextResponse.json({
      authenticated: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/api/auth/
git commit -m "feat: add auth API routes

- POST /api/auth/send-otp - send verification code
- POST /api/auth/verify-otp - verify code and create session
- GET /api/auth/session - get current session with bypass support"
```

---

### Task 16: Patient Records API

**Files:**
- Create: `app/api/patient/[id]/records/route.ts`
- Create: `app/api/patient/[id]/summary/route.ts`

**Step 1: Create records route**

Create `app/api/patient/[id]/records/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import { getPatientRecords, type RecordCategory } from '@/lib/db/queries/records'
import { extractChartData } from '@/lib/utils/medical'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const categoriesParam = searchParams.get('categories')

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const categories = categoriesParam
      ? (categoriesParam.split(',') as RecordCategory[])
      : undefined

    const records = await getPatientRecords(id, { categories })
    const chartData = extractChartData(records)

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
      },
      records,
      chartData,
    })
  } catch (error) {
    console.error('Get records error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create summary route**

Create `app/api/patient/[id]/summary/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary, saveSummary } from '@/lib/db/queries/summaries'
import { generateSummary, MEDICAL_DISCLAIMER } from '@/lib/ai/summary'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const summary = await getPatientSummary(id)

    if (!summary) {
      return NextResponse.json({
        success: false,
        error: 'No summary generated yet',
      })
    }

    return NextResponse.json({
      success: true,
      clinicianSummary: summary.clinicianSummary,
      patientSummary: summary.patientSummary,
      anomalies: summary.anomalies,
      modelUsed: summary.modelUsed,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Get summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const records = await getPatientRecords(id)

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No records found. Cannot generate summary.',
      })
    }

    const summaryData = await generateSummary(records)
    await saveSummary(id, summaryData)

    return NextResponse.json({
      success: true,
      clinicianSummary: summaryData.clinicianSummary,
      patientSummary: summaryData.patientSummary,
      anomalies: summaryData.anomalies,
      modelUsed: summaryData.modelUsed,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Generate summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create medical utils**

Create `lib/utils/medical.ts`:
```typescript
import type { Record } from '@/lib/db/schema'

interface ChartDataPoint {
  date: string
  value: number
}

export interface ChartData {
  bmi: ChartDataPoint[]
  cholesterol: ChartDataPoint[]
  a1c: ChartDataPoint[]
}

interface VitalData {
  date?: string
  bmi?: number
}

interface LabData {
  date?: string
  total_cholesterol?: number
  a1c?: number
  hemoglobin_a1c?: number
}

export function extractChartData(records: Record[]): ChartData {
  const bmi: ChartDataPoint[] = []
  const cholesterol: ChartDataPoint[] = []
  const a1c: ChartDataPoint[] = []

  for (const record of records) {
    const date = record.recordDate ?? (record.data as { date?: string }).date

    if (!date) continue

    if (record.category === 'vitals') {
      const data = record.data as VitalData
      if (data.bmi) {
        bmi.push({ date, value: data.bmi })
      }
    }

    if (record.category === 'labs') {
      const data = record.data as LabData
      if (data.total_cholesterol) {
        cholesterol.push({ date, value: data.total_cholesterol })
      }
      const a1cValue = data.a1c ?? data.hemoglobin_a1c
      if (a1cValue) {
        a1c.push({ date, value: a1cValue })
      }
    }
  }

  // Sort by date
  const sortByDate = (a: ChartDataPoint, b: ChartDataPoint) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()

  return {
    bmi: bmi.sort(sortByDate),
    cholesterol: cholesterol.sort(sortByDate),
    a1c: a1c.sort(sortByDate),
  }
}
```

**Step 4: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/api/patient/ lib/utils/medical.ts
git commit -m "feat: add patient records and summary API routes

- GET/POST /api/patient/[id]/records - fetch patient records
- GET /api/patient/[id]/summary - get existing summary
- POST /api/patient/[id]/summary - generate new AI summary
- extractChartData utility for chart visualization"
```

---

### Task 17: Patient Providers and Tokens API

**Files:**
- Create: `app/api/patient/[id]/providers/route.ts`
- Create: `app/api/patient/[id]/tokens/route.ts`
- Create: `app/api/patient/[id]/access-logs/route.ts`

**Step 1: Create providers route**

Create `app/api/patient/[id]/providers/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import {
  getPatientProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderById,
} from '@/lib/db/queries/providers'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const providers = await getPatientProviders(id)

    return NextResponse.json({
      success: true,
      providers,
    })
  } catch (error) {
    console.error('Get providers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const { providerName, providerOrg, providerEmail, scope } = body

    if (!providerName) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      )
    }

    const provider = await createProvider({
      patientId: id,
      providerName,
      providerOrg,
      providerEmail,
      scope: scope ?? [],
    })

    return NextResponse.json({
      success: true,
      provider,
    })
  } catch (error) {
    console.error('Create provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { providerId, ...updates } = body

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const existingProvider = await getProviderById(providerId)
    if (!existingProvider || existingProvider.patientId !== id) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    const provider = await updateProvider(providerId, updates)

    return NextResponse.json({
      success: true,
      provider,
    })
  } catch (error) {
    console.error('Update provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const existingProvider = await getProviderById(providerId)
    if (!existingProvider || existingProvider.patientId !== id) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    await deleteProvider(providerId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create tokens route**

Create `app/api/patient/[id]/tokens/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import {
  getPatientTokens,
  createShareToken,
  revokeToken,
  deleteToken,
} from '@/lib/db/queries/tokens'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const tokens = await getPatientTokens(id)

    return NextResponse.json({
      success: true,
      tokens,
    })
  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const { scope, expiryHours } = body

    if (!scope || !Array.isArray(scope) || scope.length === 0) {
      return NextResponse.json(
        { error: 'Scope is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    const hours = expiryHours ?? 24
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    const token = await createShareToken({
      patientId: id,
      scope,
      expiresAt,
    })

    return NextResponse.json({
      success: true,
      token: token.token,
      scope: token.scope,
      expiresAt: token.expiresAt,
    })
  } catch (error) {
    console.error('Create token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { tokenId, action } = body

    if (!tokenId || action !== 'revoke') {
      return NextResponse.json(
        { error: 'Token ID and action=revoke required' },
        { status: 400 }
      )
    }

    const token = await revokeToken(tokenId)

    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('Revoke token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      )
    }

    await deleteToken(tokenId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Create access logs route**

Create `app/api/patient/[id]/access-logs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById } from '@/lib/db/queries/patients'
import { getPatientAccessLogsWithTokens } from '@/lib/db/queries/access-logs'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    const logs = await getPatientAccessLogsWithTokens(id)

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('Get access logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 5: Commit**

```bash
git add app/api/patient/
git commit -m "feat: add providers, tokens, and access logs API routes

- CRUD for /api/patient/[id]/providers
- CRUD for /api/patient/[id]/tokens with revocation
- GET /api/patient/[id]/access-logs with token details"
```

---

### Task 18: Provider Access API

**Files:**
- Create: `app/api/provider/access/route.ts`
- Create: `app/api/provider/otp-access/route.ts`

**Step 1: Create token-based access route**

Create `app/api/provider/access/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPatientById, getPatientByNameAndDob } from '@/lib/db/queries/patients'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary } from '@/lib/db/queries/summaries'
import { getValidShareToken } from '@/lib/db/queries/tokens'
import { logAccess } from '@/lib/db/queries/access-logs'
import { extractChartData } from '@/lib/utils/medical'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/summary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, patientName, dateOfBirth, providerName, providerOrg } = body

    if (!token || !patientName || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Token, patient name, and date of birth are required' },
        { status: 400 }
      )
    }

    // Validate token
    const shareToken = await getValidShareToken(token)
    if (!shareToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      )
    }

    // Verify patient identity
    const patient = await getPatientById(shareToken.patientId)
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check name and DOB match
    const normalizedName = patientName.trim().toLowerCase()
    const storedName = patient.name.trim().toLowerCase()

    if (normalizedName !== storedName) {
      return NextResponse.json(
        { error: 'Patient name does not match' },
        { status: 403 }
      )
    }

    if (patient.dateOfBirth !== dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth does not match' },
        { status: 403 }
      )
    }

    // Log access (this is the bug fix - actually commits to DB)
    const ip = request.headers.get('x-forwarded-for') ??
               request.headers.get('x-real-ip') ??
               'unknown'
    const userAgent = request.headers.get('user-agent') ?? undefined

    await logAccess({
      tokenId: shareToken.id,
      patientId: patient.id,
      providerName,
      providerOrg,
      ipAddress: ip,
      userAgent,
      accessMethod: 'token',
      scope: shareToken.scope,
    })

    // Get scoped records
    const records = await getPatientRecords(patient.id, {
      categories: shareToken.scope as ('vitals' | 'labs' | 'meds' | 'encounters')[],
    })

    const summary = await getPatientSummary(patient.id)
    const chartData = extractChartData(records)

    return NextResponse.json({
      success: true,
      patientName: patient.name,
      dateOfBirth: patient.dateOfBirth,
      scope: shareToken.scope,
      records,
      summary: summary ? {
        clinicianSummary: summary.clinicianSummary,
        patientSummary: summary.patientSummary,
        anomalies: summary.anomalies,
      } : null,
      chartData,
      disclaimer: MEDICAL_DISCLAIMER,
    })
  } catch (error) {
    console.error('Provider access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create OTP-based access route**

Create `app/api/provider/otp-access/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPatientByNameAndDob, maskEmail } from '@/lib/db/queries/patients'
import { getPatientRecords } from '@/lib/db/queries/records'
import { getPatientSummary } from '@/lib/db/queries/summaries'
import { getProviderByPatientAndName } from '@/lib/db/queries/providers'
import { logAccess } from '@/lib/db/queries/access-logs'
import { extractChartData } from '@/lib/utils/medical'
import { MEDICAL_DISCLAIMER } from '@/lib/ai/summary'

// Step 1: Request OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'request-otp') {
      return handleRequestOtp(request, body)
    } else if (action === 'verify-otp') {
      return handleVerifyOtp(request, body)
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "request-otp" or "verify-otp"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Provider OTP access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleRequestOtp(request: NextRequest, body: Record<string, unknown>) {
  const { patientName, dateOfBirth, providerName } = body as {
    patientName?: string
    dateOfBirth?: string
    providerName?: string
  }

  if (!patientName || !dateOfBirth || !providerName) {
    return NextResponse.json(
      { error: 'Patient name, date of birth, and provider name are required' },
      { status: 400 }
    )
  }

  // Find patient
  const patient = await getPatientByNameAndDob(patientName, dateOfBirth)
  if (!patient) {
    return NextResponse.json(
      { error: 'No patient found with that name and date of birth' },
      { status: 404 }
    )
  }

  // Check if provider is authorized
  const provider = await getProviderByPatientAndName(patient.id, providerName)
  if (!provider) {
    return NextResponse.json(
      { error: 'Provider not authorized for this patient. Patient must add you as a provider first.' },
      { status: 403 }
    )
  }

  // Send OTP to patient's email
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: patient.email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code to patient' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Verification code sent to patient. Ask patient to share the code.',
    maskedEmail: maskEmail(patient.email),
    patientId: patient.id,
    providerId: provider.id,
    scope: provider.scope,
  })
}

async function handleVerifyOtp(request: NextRequest, body: Record<string, unknown>) {
  const { patientId, providerId, code, providerName, providerOrg } = body as {
    patientId?: string
    providerId?: string
    code?: string
    providerName?: string
    providerOrg?: string
  }

  if (!patientId || !providerId || !code) {
    return NextResponse.json(
      { error: 'Patient ID, provider ID, and verification code are required' },
      { status: 400 }
    )
  }

  const { getPatientById } = await import('@/lib/db/queries/patients')
  const { getProviderById } = await import('@/lib/db/queries/providers')

  const patient = await getPatientById(patientId)
  if (!patient) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: 404 }
    )
  }

  const provider = await getProviderById(providerId)
  if (!provider || provider.patientId !== patientId) {
    return NextResponse.json(
      { error: 'Provider not found or not authorized' },
      { status: 403 }
    )
  }

  // Verify OTP
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: patient.email,
    token: code,
    type: 'email',
  })

  if (error) {
    return NextResponse.json(
      { error: 'Invalid or expired verification code' },
      { status: 400 }
    )
  }

  // Log access
  const ip = request.headers.get('x-forwarded-for') ??
             request.headers.get('x-real-ip') ??
             'unknown'
  const userAgent = request.headers.get('user-agent') ?? undefined

  await logAccess({
    patientId: patient.id,
    providerName,
    providerOrg,
    ipAddress: ip,
    userAgent,
    accessMethod: 'otp',
    scope: provider.scope,
  })

  // Get scoped records
  const records = await getPatientRecords(patient.id, {
    categories: provider.scope as ('vitals' | 'labs' | 'meds' | 'encounters')[],
  })

  const summary = await getPatientSummary(patient.id)
  const chartData = extractChartData(records)

  return NextResponse.json({
    success: true,
    patientName: patient.name,
    dateOfBirth: patient.dateOfBirth,
    scope: provider.scope,
    records,
    summary: summary ? {
      clinicianSummary: summary.clinicianSummary,
      patientSummary: summary.patientSummary,
      anomalies: summary.anomalies,
    } : null,
    chartData,
    disclaimer: MEDICAL_DISCLAIMER,
  })
}
```

**Step 3: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 4: Commit**

```bash
git add app/api/provider/
git commit -m "feat: add provider access API routes

- POST /api/provider/access - token-based access with identity verification
- POST /api/provider/otp-access - live OTP access flow
  - action=request-otp: send code to patient
  - action=verify-otp: verify and grant access
- Proper access logging (bug fix from Python version)"
```

---

## Phase 5: Seed Script

### Task 19: Create Seed Script

**Files:**
- Create: `scripts/seed.ts`

**Step 1: Create the seed script**

Create `scripts/seed.ts`:
```typescript
import { db } from '../lib/db'
import {
  patients,
  records,
  patientProviders,
} from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const DEMO_PATIENT = {
  name: 'Demo Patient',
  email: 'demo@evexia.health',
  dateOfBirth: '1985-03-15',
  phone: '555-123-4567',
}

const HOSPITALS = ['Banner Health', 'Mayo Clinic', 'Phoenician Medical Center'] as const

async function seed() {
  console.log('🌱 Starting seed...')

  // Check if demo patient exists
  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.email, DEMO_PATIENT.email))
    .limit(1)

  let patientId: string

  if (existing.length > 0) {
    console.log('Demo patient already exists, updating...')
    patientId = existing[0].id
    await db
      .update(patients)
      .set(DEMO_PATIENT)
      .where(eq(patients.id, patientId))
  } else {
    console.log('Creating demo patient...')
    const [patient] = await db
      .insert(patients)
      .values(DEMO_PATIENT)
      .returning()
    patientId = patient.id
  }

  console.log(`Patient ID: ${patientId}`)

  // Clear existing records for clean seed
  await db.delete(records).where(eq(records.patientId, patientId))
  console.log('Cleared existing records')

  // Generate records
  const recordsToInsert = [
    // Banner Health vitals
    ...generateVitals(patientId, 'Banner Health', [
      { date: '2024-01-15', bmi: 26.5, blood_pressure: '128/82', heart_rate: 72 },
      { date: '2024-04-20', bmi: 26.2, blood_pressure: '125/80', heart_rate: 70 },
      { date: '2024-07-10', bmi: 25.8, blood_pressure: '122/78', heart_rate: 68 },
      { date: '2024-10-05', bmi: 25.5, blood_pressure: '120/76', heart_rate: 66 },
    ]),
    // Mayo Clinic vitals
    ...generateVitals(patientId, 'Mayo Clinic', [
      { date: '2024-02-28', bmi: 26.3, blood_pressure: '126/81', heart_rate: 71 },
      { date: '2024-08-15', bmi: 25.6, blood_pressure: '121/77', heart_rate: 67 },
    ]),
    // Banner Health labs
    ...generateLabs(patientId, 'Banner Health', [
      { date: '2024-01-15', total_cholesterol: 215, a1c: 6.2, ldl: 130, hdl: 45 },
      { date: '2024-07-10', total_cholesterol: 205, a1c: 6.0, ldl: 122, hdl: 48 },
    ]),
    // Mayo Clinic labs
    ...generateLabs(patientId, 'Mayo Clinic', [
      { date: '2024-02-28', total_cholesterol: 210, a1c: 6.1, ldl: 126, hdl: 46 },
      { date: '2024-08-15', total_cholesterol: 198, a1c: 5.9, ldl: 118, hdl: 50 },
    ]),
    // Phoenician labs
    ...generateLabs(patientId, 'Phoenician Medical Center', [
      { date: '2024-05-20', total_cholesterol: 208, a1c: 6.0, ldl: 124, hdl: 47 },
    ]),
    // Medications
    ...generateMeds(patientId, 'Banner Health', [
      { medication: 'Lisinopril', dose: '10mg', frequency: 'Once daily', startDate: '2023-06-01' },
      { medication: 'Metformin', dose: '500mg', frequency: 'Twice daily', startDate: '2023-08-15' },
    ]),
    ...generateMeds(patientId, 'Mayo Clinic', [
      { medication: 'Atorvastatin', dose: '20mg', frequency: 'Once daily at bedtime', startDate: '2024-01-20' },
    ]),
    // Encounters
    ...generateEncounters(patientId, 'Banner Health', [
      { date: '2024-01-15', type: 'Annual Physical', provider: 'Dr. Sarah Chen', notes: 'Routine checkup, discussed weight management' },
      { date: '2024-07-10', type: 'Follow-up Visit', provider: 'Dr. Sarah Chen', notes: 'Good progress on lifestyle changes' },
    ]),
    ...generateEncounters(patientId, 'Mayo Clinic', [
      { date: '2024-02-28', type: 'Cardiology Consult', provider: 'Dr. Michael Rivera', notes: 'Cardiovascular risk assessment' },
      { date: '2024-08-15', type: 'Cardiology Follow-up', provider: 'Dr. Michael Rivera', notes: 'Lipid panel improved' },
    ]),
    ...generateEncounters(patientId, 'Phoenician Medical Center', [
      { date: '2024-05-20', type: 'Endocrinology Consult', provider: 'Dr. Emily Watson', notes: 'A1C monitoring, prediabetes management' },
    ]),
  ]

  await db.insert(records).values(recordsToInsert)
  console.log(`Inserted ${recordsToInsert.length} records`)

  // Create sample provider
  await db.delete(patientProviders).where(eq(patientProviders.patientId, patientId))

  await db.insert(patientProviders).values({
    patientId,
    providerName: 'Dr. Sarah Chen',
    providerOrg: 'Banner Health',
    providerEmail: 'sarah.chen@bannerhealth.example',
    scope: ['vitals', 'labs', 'meds', 'encounters'],
  })
  console.log('Created sample provider')

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Add this to your .env.local for auth bypass:')
  console.log(`DEMO_PATIENT_ID=${patientId}`)

  process.exit(0)
}

function generateVitals(patientId: string, hospital: string, data: Array<Record<string, unknown>>) {
  return data.map(d => ({
    patientId,
    hospital,
    category: 'vitals' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

function generateLabs(patientId: string, hospital: string, data: Array<Record<string, unknown>>) {
  return data.map(d => ({
    patientId,
    hospital,
    category: 'labs' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

function generateMeds(patientId: string, hospital: string, data: Array<Record<string, unknown>>) {
  return data.map(d => ({
    patientId,
    hospital,
    category: 'meds' as const,
    data: d,
    recordDate: (d.startDate as string) ?? null,
    source: 'seed',
  }))
}

function generateEncounters(patientId: string, hospital: string, data: Array<Record<string, unknown>>) {
  return data.map(d => ({
    patientId,
    hospital,
    category: 'encounters' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

seed().catch(console.error)
```

**Step 2: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add TypeScript seed script

- Creates demo patient with realistic health data
- Records from 3 hospitals across all categories
- Varied dates for trend visualization
- Sample provider for testing
- Outputs DEMO_PATIENT_ID for env config"
```

---

## Phase 6: UI Components

**Note:** This phase creates the UI components. Due to the length of UI code, each task includes the essential structure. The full implementation should follow the shadcn/ui patterns and the Scandinavian Medical Atelier aesthetic from the design document.

### Task 20: Create Layout and Theme

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/shared/header.tsx`
- Create: `lib/fonts.ts`

**Step 1: Create fonts configuration**

Create `lib/fonts.ts`:
```typescript
import { Fraunces, DM_Sans, JetBrains_Mono } from 'next/font/google'

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
```

**Step 2: Update globals.css**

Replace `app/globals.css`:
```css
@import "tailwindcss";

@theme inline {
  --color-primary: #1a3a2f;
  --color-secondary: #f5f2eb;
  --color-accent: #c9a86c;
  --color-success: #4a7c59;
  --color-warning: #d4a574;
  --color-critical: #a65d57;
  --color-surface: #faf9f7;
  --color-text: #2d2d2d;
  --color-text-muted: #6b6b6b;
  --color-border: rgba(26, 58, 47, 0.1);

  --font-display: var(--font-fraunces);
  --font-body: var(--font-dm-sans);
  --font-mono: var(--font-mono);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  --shadow-sm: 0 1px 2px rgba(26, 58, 47, 0.05);
  --shadow-md: 0 4px 6px rgba(26, 58, 47, 0.08);
  --shadow-lg: 0 10px 15px rgba(26, 58, 47, 0.1);
}

body {
  font-family: var(--font-body), system-ui, sans-serif;
  background-color: var(--color-surface);
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display), serif;
}

code, pre, .font-mono {
  font-family: var(--font-mono), monospace;
}

/* Scandinavian Medical Atelier details */
.card-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-blend-mode: overlay;
}

.accent-underline::after {
  content: '';
  display: block;
  width: 40px;
  height: 2px;
  background-color: var(--color-accent);
  margin-top: 8px;
}
```

**Step 3: Update root layout**

Replace `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { fraunces, dmSans, jetbrainsMono } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Evexia - Patient Medical Data Aggregator',
  description: 'Consolidate your medical records from multiple hospitals into one unified view.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-surface antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
```

**Step 4: Create header component**

Create `components/shared/header.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  patientName?: string
  onLogout?: () => void
}

export function Header({ patientName, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-display font-semibold text-primary">
            Evexia
          </span>
        </Link>

        {patientName && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              {patientName}
            </span>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout}>
                Sign out
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
```

**Step 5: Run type-check**

Run:
```bash
bun run type-check
```

Expected: PASS

**Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css components/shared/header.tsx lib/fonts.ts
git commit -m "feat: add layout and Scandinavian Medical Atelier theme

- Fraunces (display), DM Sans (body), JetBrains Mono (code)
- Custom CSS variables for colors, shadows, radii
- Header component with patient info
- Toaster for notifications"
```

---

### Task 21-30: UI Components and Pages

**Due to length constraints, the remaining tasks follow the same pattern:**

- **Task 21:** Landing page (`app/page.tsx`)
- **Task 22:** Patient login page (`app/(auth)/patient/login/page.tsx`)
- **Task 23:** Patient dashboard layout (`app/patient/layout.tsx`)
- **Task 24:** Patient dashboard page (`app/patient/page.tsx`)
- **Task 25:** Health summary component (`components/patient/health-summary.tsx`)
- **Task 26:** Health charts component (`components/patient/health-charts.tsx`)
- **Task 27:** Medical records component (`components/patient/medical-records.tsx`)
- **Task 28:** Provider manager component (`components/patient/provider-manager.tsx`)
- **Task 29:** Access logs component (`components/patient/access-logs.tsx`)
- **Task 30:** Provider portal page (`app/provider/page.tsx`)

Each task follows the structure:
1. Create file with complete implementation
2. Run type-check
3. Commit with descriptive message

---

## Phase 7: Final Setup

### Task 31: Cloudflare Configuration

**Files:**
- Create: `wrangler.toml`
- Create: `open-next.config.ts`

**Step 1: Create wrangler.toml**

Create `wrangler.toml`:
```toml
name = "evexia"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

# Assets are served from the .open-next directory
# Configuration for opennextjs-cloudflare
```

**Step 2: Create open-next.config.ts**

Create `open-next.config.ts`:
```typescript
import type { OpenNextConfig } from '@opennextjs/cloudflare'

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
    },
  },
}

export default config
```

**Step 3: Commit**

```bash
git add wrangler.toml open-next.config.ts
git commit -m "chore: add Cloudflare Workers configuration

- wrangler.toml for deployment settings
- open-next.config.ts for opennextjs-cloudflare"
```

---

### Task 32: Database Migration and Final Verification

**Step 1: Generate Drizzle migration**

Run:
```bash
bun run db:generate
```

Expected: Migration files created in `drizzle/` directory

**Step 2: Push schema to Supabase (after configuring .env.local)**

Run:
```bash
bun run db:push
```

Expected: Tables created in Supabase

**Step 3: Run seed script**

Run:
```bash
bun run db:seed
```

Expected: Demo patient and records created

**Step 4: Run all checks**

Run:
```bash
bun run type-check && bun run lint && bun run dead-code
```

Expected: All PASS

**Step 5: Start dev server**

Run:
```bash
bun run dev
```

Expected: Server starts at http://localhost:3000

**Step 6: Final commit**

```bash
git add drizzle/
git commit -m "chore: add initial database migration

Generated from Drizzle schema"
```

---

## Summary

This plan implements the complete Evexia Next.js port in 32 tasks across 7 phases:

1. **Project Foundation** (Tasks 1-7): Dependencies, tooling, Supabase setup
2. **Database Queries** (Tasks 8-13): Type-safe Drizzle queries for all tables
3. **AI Integration** (Task 14): OpenRouter + mock fallback
4. **API Routes** (Tasks 15-18): Auth, patient, provider endpoints
5. **Seed Script** (Task 19): Demo data generation
6. **UI Components** (Tasks 20-30): Pages and components
7. **Final Setup** (Tasks 31-32): Cloudflare config, migrations

**Key bug fixes:**
- Access logs now properly commit to database (was missing in Python version)

**New features:**
- Email OTP authentication with dev bypass
- Provider management with scoped permissions
- Live OTP access for real-time patient consent
- Token revocation
- Better error handling and loading states
