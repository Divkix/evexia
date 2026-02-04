# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evexia is a medical data aggregator that allows patients to view and share their health records with healthcare providers. It features two portals:
- **Patient Portal** (`/patient/*`): Login via OTP, view records, manage authorized providers, create share tokens
- **Provider Portal** (`/provider`): Access patient data via share tokens or OTP verification

## Commands

```bash
# Development
bun run dev              # Start Next.js dev server
bun run build            # Production build
bun run type-check       # TypeScript checking
bun run lint             # Biome linting
bun run lint:fix         # Auto-fix lint issues
bun run dead-code        # Check for unused exports (knip)

# Database (Drizzle + Supabase)
bun run db:generate      # Generate migration from schema changes
bun run db:migrate       # Run migrations
bun run db:seed          # Seed demo data
bun run db:studio        # Open Drizzle Studio

# Database reset (use Supabase CLI, not drizzle-kit push)
supabase db reset --linked   # Reset and re-run migrations on linked remote DB
bun run db:seed              # Re-seed demo data after reset

# Cloudflare Workers deployment
bun run preview          # Build and preview locally
bun run cf:build         # Build for Cloudflare
bun run cf:deploy        # Deploy to Cloudflare Workers
```

## Architecture

### Database Layer (Dual Setup)
- **Schema definition**: `lib/db/schema.ts` (Drizzle) - source of truth for migrations
- **Runtime queries**: `lib/supabase/queries/*` (Supabase HTTP client) - edge-compatible
- The postgres-js driver is only used for local seeding (`scripts/seed.ts`), not in production runtime

Why this split: Cloudflare Workers cannot use TCP sockets (postgres-js), so all API routes use Supabase's fetch-based client.

**Important**: Use `supabase db reset --linked` to reset the database, not `drizzle-kit push`. Drizzle-kit has compatibility issues with Supabase's schema constraints.

### API Routes (`app/api/`)
- `/api/auth/*` - OTP-based authentication via Supabase Auth
- `/api/patient/[id]/*` - Patient data CRUD (records, providers, tokens, access-logs, summary)
- `/api/provider/*` - Provider access endpoints (token-based and OTP-based)

### Key Libraries
- `lib/supabase/admin.ts` - Server-side Supabase client (service role key, bypasses RLS)
- `lib/supabase/server.ts` - Cookie-based Supabase client for auth
- `lib/ai/summary.ts` - AI-powered medical summary generation via OpenRouter
- `lib/env.ts` - Type-safe environment variable access

### Authentication Flow
1. Patient enters name + DOB → system finds patient → sends OTP to registered email
2. Patient verifies OTP → Supabase session created → linked to patient record
3. `BYPASS_AUTH_LOCAL=true` skips auth in development (uses `DEMO_PATIENT_ID`)

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side queries)
- `DATABASE_URL` - PostgreSQL connection string (for migrations/seeding only)

Optional:
- `OPENROUTER_API_KEY` - For AI summaries (falls back to mock if not set)
- `AI_MODEL` - Model to use (default: `openai/gpt-4o-mini`)
- `AI_ENABLED` - Set to `true` to enable AI summaries
- `BYPASS_AUTH_LOCAL` - Set to `true` for dev auth bypass
- `DEMO_PATIENT_ID` - Patient ID to use when auth is bypassed

## Code Style

- Biome for linting/formatting (spaces, single quotes, no semicolons)
- `components/ui/*` is excluded from linting (shadcn/ui generated code)
- Import organization is enforced
- Unused imports/variables are errors
