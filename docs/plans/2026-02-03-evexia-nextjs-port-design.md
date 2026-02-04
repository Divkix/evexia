# Evexia Next.js Port - Design Document

> **Date**: 2026-02-03
> **Status**: Approved
> **Source**: Python app at `/Users/divkix/GitHub/evexia-scaleu-pia-hackathon`

## Overview

Port the Evexia medical data aggregation platform from Python/FastAPI to Next.js with enhanced features, bug fixes, and a refined UI aesthetic.

**Evexia** is a patient-controlled medical data aggregation platform that consolidates records from multiple Arizona hospitals (Banner Health, Mayo Clinic, Phoenician Medical Center) into a unified view with AI-powered health summaries and secure provider sharing.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth (Email OTP) |
| AI | Vercel AI SDK + OpenRouter (GPT OSS 120B) |
| UI | shadcn/ui + Tailwind v4 |
| Charts | Recharts |
| Deployment | Cloudflare Workers (opennextjs-cloudflare) |
| Package Manager | Bun |
| Linting | Biome |
| Dead Code | Knip |
| Type Check | tsc --noEmit |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages (App Router)                                             │
│  ├── /                    → Landing page                        │
│  ├── /patient             → Patient portal (protected)          │
│  ├── /patient/login       → Email OTP auth flow                 │
│  └── /provider            → Provider token access               │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (/app/api)                                          │
│  ├── /api/auth/*          → Supabase auth handlers              │
│  ├── /api/patient/*       → Patient records, tokens, summaries  │
│  ├── /api/provider/*      → Token-based access                  │
│  └── /api/ai/summary      → OpenRouter AI integration           │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├── Drizzle ORM          → Type-safe queries                   │
│  ├── Supabase PostgreSQL  → Hosted database                     │
│  └── Supabase Auth        → Email OTP authentication            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  External Services                                              │
│  ├── OpenRouter API       → GPT OSS 120B for summaries          │
│  └── Cloudflare Workers   → Edge deployment via opennextjs-cf   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Drizzle + Supabase)

### patients
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, gen_random_uuid() |
| auth_user_id | UUID | FK → auth.users, nullable |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL UNIQUE |
| date_of_birth | DATE | NOT NULL |
| phone | TEXT | Masked for display |
| created_at | TIMESTAMP | DEFAULT now() |
| updated_at | TIMESTAMP | DEFAULT now() |

### records
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| patient_id | UUID | FK → patients, NOT NULL |
| hospital | TEXT | Banner Health, Mayo Clinic, etc. |
| category | TEXT | vitals, labs, meds, encounters |
| data | JSONB | Flexible medical data |
| record_date | DATE | Extracted for sorting |
| source | TEXT | Original import source |
| created_at | TIMESTAMP | DEFAULT now() |

### summaries
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| patient_id | UUID | FK → patients, NOT NULL |
| clinician_summary | TEXT | Clinical bullet points |
| patient_summary | TEXT | Plain language |
| anomalies | JSONB | Array of detected issues |
| model_used | TEXT | Track which AI model |
| created_at | TIMESTAMP | DEFAULT now() |

### patient_providers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| patient_id | UUID | FK → patients |
| provider_name | TEXT | NOT NULL |
| provider_org | TEXT | |
| provider_email | TEXT | |
| scope | TEXT[] | vitals, labs, meds, encounters |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### share_tokens
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| patient_id | UUID | FK → patients, NOT NULL |
| token | TEXT | UNIQUE NOT NULL |
| scope | TEXT[] | Array of allowed categories |
| expires_at | TIMESTAMP | NOT NULL |
| revoked_at | TIMESTAMP | NULL = active (NEW) |
| created_at | TIMESTAMP | DEFAULT now() |

### access_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| token_id | UUID | FK → share_tokens, NOT NULL |
| provider_name | TEXT | |
| provider_org | TEXT | |
| ip_address | TEXT | |
| user_agent | TEXT | NEW: browser/device info |
| access_method | TEXT | 'otp' or 'token' (NEW) |
| accessed_at | TIMESTAMP | DEFAULT now() |

---

## Authentication Flows

### Patient Login Flow

```
1. Patient visits /patient
   │
   ├─► If BYPASS_AUTH_LOCAL=true (dev only)
   │   └─► Auto-login as seeded demo patient → /patient dashboard
   │
   └─► If production/no bypass
       │
       ▼
2. Redirect to /patient/login
   │
   ▼
3. Enter name + date of birth
   │
   ▼
4. System looks up patient by name + DOB
   ├─► Not found → "No records found" error
   └─► Found → Show masked email (j***n@gm***.com)
       │
       ▼
5. "Send verification code" button
   │
   ▼
6. Supabase sends 8-digit OTP to email
   │
   ▼
7. Patient enters code (same page, no redirect)
   │
   ▼
8. Supabase verifies → Session created
   │
   ▼
9. Redirect to /patient dashboard
```

### Provider Access Flow

Providers have two access methods:

**Option 1: Live OTP (real-time consent)**
1. Provider enters patient name + DOB
2. System shows patient's masked email
3. Provider clicks "Request Access" → OTP sent to patient
4. Patient shares code with provider verbally/text
5. Provider enters code → access granted (scoped by patient_providers)

**Option 2: Pre-generated Token (async access)**
1. Patient generates token in dashboard with scope + expiration
2. Patient shares token with provider
3. Provider enters token + patient name + DOB
4. System validates → scoped access granted

---

## AI Integration

### Flow

```
1. Patient clicks "Generate Summary"
   │
   ▼
2. API collects all patient records from DB
   │
   ▼
3. Build prompt with structured medical data
   │
   ▼
4. Call OpenRouter API via Vercel AI SDK
   │
   ├─► Success → Parse JSON response
   │
   └─► Failure → Fallback to deterministic mock
   │
   ▼
5. Save to summaries table
   │
   ▼
6. Return with disclaimer
```

### Implementation

```typescript
// lib/ai/summary.ts
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateSummary(records: MedicalRecord[]) {
  if (process.env.AI_ENABLED !== 'true') {
    return generateMockSummary(records);
  }

  try {
    const { text } = await generateText({
      model: openrouter(process.env.AI_MODEL || 'openai/gpt-4o-mini'),
      prompt: buildMedicalPrompt(records),
      temperature: 0.3,
    });
    return parseAIResponse(text);
  } catch {
    return generateMockSummary(records);
  }
}
```

### Mock Fallback Logic

- BMI thresholds: >30 obesity, <18.5 underweight
- A1C thresholds: >6.5 diabetes risk
- Cholesterol: >240 high
- Blood pressure: >140/90 elevated
- Duplicate detection by (category, date, hospital)

---

## UI Design: Scandinavian Medical Atelier

### Typography

| Use | Font | Notes |
|-----|------|-------|
| Display | Fraunces | Serif, warm, trustworthy |
| Body | DM Sans | Geometric sans, accessible |
| Mono | JetBrains Mono | Medical values (BP: 128/82) |

### Color Palette

```css
:root {
  --primary: #1a3a2f;      /* Deep Forest - trust, stability */
  --secondary: #f5f2eb;    /* Warm Cream - calm, approachable */
  --accent: #c9a86c;       /* Muted Gold - premium, highlight */
  --success: #4a7c59;      /* Sage Green - healthy, positive */
  --warning: #d4a574;      /* Warm Amber - attention needed */
  --critical: #a65d57;     /* Muted Coral - urgent, not alarming */
  --surface: #faf9f7;      /* Off-white - background */
  --text: #2d2d2d;         /* Soft Black - readable */
}
```

### Distinctive Elements

- Subtle paper texture overlay on cards (5% opacity noise)
- Soft shadows with warm tint: `rgba(26,58,47,0.08)`
- Rounded corners: 16px cards, 8px buttons, 4px inputs
- Gold accent line under section headings (2px, 40px wide)
- Generous whitespace (32px gaps minimum)

### Motion

- Page load: Staggered fade-up (cards cascade 50ms apart)
- Hover: Cards lift 2px with shadow expansion (150ms ease-out)
- Charts: Draw-in animation on first render (800ms)
- Skeleton: Warm gradient shimmer (cream → gold → cream)
- Anomaly markers: Subtle pulse animation

---

## Project Structure

```
evexia/
├── app/
│   ├── (auth)/
│   │   └── patient/login/page.tsx
│   ├── patient/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── provider/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── patient/
│   │   └── provider/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── patient/
│   ├── provider/
│   └── shared/
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── queries/
│   ├── ai/
│   ├── auth/
│   └── utils/
├── scripts/
│   └── seed.ts
├── drizzle/
│   └── migrations/
├── biome.json
├── drizzle.config.ts
├── wrangler.toml
└── package.json
```

### Scripts

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
    "db:seed": "bun run scripts/seed.ts",
    "deploy": "opennextjs-cloudflare build && wrangler deploy"
  }
}
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenRouter AI
OPENROUTER_API_KEY=
AI_MODEL=openai/gpt-4o-mini
AI_ENABLED=true

# Development
BYPASS_AUTH_LOCAL=false
```

---

## Features Summary

### Ported from Python

- Patient portal with medical record viewing
- Multi-hospital data aggregation
- Record categories: vitals, labs, meds, encounters
- AI-generated health summaries (clinician + patient-friendly)
- Anomaly detection (BMI, A1C, cholesterol, BP thresholds)
- Health trend charts (Recharts)
- Provider access via share tokens with scoped permissions
- Token expiration enforcement
- Access audit logging
- Medical disclaimer on all AI content

### Bug Fixes

- **Access logs not saving** - Original Python code missing `conn.commit()` in `log_access()` function
- **Provider identity verification edge cases** - Proper validation implemented

### New Features

- Email OTP authentication (Supabase Auth)
- `BYPASS_AUTH_LOCAL` for development
- Provider management (add/edit/remove providers)
- Per-provider scope configuration (checkboxes)
- Live OTP access (real-time patient consent)
- Token revocation (soft delete)
- User agent tracking in access logs
- Access method tracking (OTP vs token)
- Loading skeleton states
- Toast notifications
- Better error messages
- AI model tracking
- AI toggle (`AI_ENABLED` env var)

---

## Seed Data

TypeScript seed script (`scripts/seed.ts`) will:

1. Create demo patient with realistic data
2. Populate records from 3 hospitals across all categories
3. Generate varied dates for trend visualization
4. Include some anomalous values for detection testing
5. Pre-create a sample provider for testing

---

## Deployment

**Target**: Cloudflare Workers via `opennextjs-cloudflare`

```bash
# Build and deploy
bun run deploy

# Or manually
opennextjs-cloudflare build
wrangler deploy
```

Configure `wrangler.toml` for Cloudflare Workers settings.

---

## Open Questions

None - design approved and ready for implementation.
