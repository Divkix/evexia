# Evexia

A medical data aggregator that unifies patient health records from multiple hospitals into one secure platform. Patients can view their complete health history, get AI-powered insights, and share records with providers on their terms.

## Features

- **Multi-Hospital Data Aggregation** - Connect and view medical records from multiple healthcare providers in a unified dashboard
- **AI-Powered Summaries** - Intelligent health summaries with actionable insights via OpenRouter (supports various LLM models)
- **Health Equity Analysis** - AI-driven detection of potential healthcare disparities and social determinants of health
- **Predictive Risk Scoring** - Trajectory analysis and risk predictions based on health data patterns
- **Secure Provider Sharing** - Time-limited access tokens and OTP-based verification for controlled record sharing
- **Emergency Access** - Configurable emergency access for critical care situations
- **Provider Portal** - Dedicated interface for healthcare providers to access shared patient data

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Runtime**: Cloudflare Workers (edge deployment)
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle (schema/migrations) + Supabase Client (runtime queries)
- **Auth**: Supabase Auth (OTP-based)
- **AI**: OpenRouter API with configurable models
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Validation**: Zod
- **Charts**: Recharts
- **Animations**: Framer Motion

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for database management)
- Supabase project (or local Supabase instance)
- OpenRouter API key (optional, for AI features)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone https://github.com/Divkix/evexia.git
cd evexia
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# OpenRouter AI (optional)
OPENROUTER_API_KEY=sk-or-v1-your-key
AI_MODEL=openai/gpt-4o-mini
AI_ENABLED=true

# Development (optional)
BYPASS_AUTH_LOCAL=true  # Skip OTP auth in development
```

### 3. Set up the database

Link your Supabase project and run migrations:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
bun run db:migrate

# Seed demo data
bun run db:seed
```

### 4. Start development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Commands

### Development

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run type-check` | TypeScript type checking |
| `bun run lint` | Run Biome linter |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run dead-code` | Check for unused exports (knip) |
| `bun run test` | Run tests |

### Database

| Command | Description |
|---------|-------------|
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:seed` | Seed demo data |
| `bun run db:studio` | Open Drizzle Studio (DB GUI) |
| `supabase db reset --linked` | Reset remote DB and re-run migrations |

### Deployment (Cloudflare Workers)

| Command | Description |
|---------|-------------|
| `bun run preview` | Build and preview locally |
| `bun run cf:build` | Build for Cloudflare Workers |
| `bun run cf:deploy` | Deploy to Cloudflare Workers |
| `bun run deploy` | Build and deploy in one command |

## Project Structure

```
evexia/
├── app/
│   ├── api/
│   │   ├── auth/           # OTP authentication endpoints
│   │   ├── patient/[id]/   # Patient data CRUD
│   │   ├── provider/       # Provider access endpoints
│   │   └── organizations/  # Organization lookup
│   ├── patient/            # Patient portal pages
│   ├── provider/           # Provider portal
│   └── page.tsx            # Landing page
├── components/
│   ├── patient/            # Patient-specific components
│   ├── ui/                 # shadcn/ui components
│   └── brand/              # Branding components
├── lib/
│   ├── ai/                 # AI summary generation
│   ├── db/                 # Drizzle schema
│   ├── supabase/           # Supabase clients & queries
│   └── utils/              # Utility functions
├── drizzle/                # Database migrations
└── scripts/                # Seed scripts
```

## Architecture

### Database Layer (Dual Setup)

The project uses a dual database setup for edge compatibility:

- **Schema & Migrations**: Drizzle ORM (`lib/db/schema.ts`) - source of truth
- **Runtime Queries**: Supabase HTTP Client (`lib/supabase/queries/*`) - edge-compatible

This split exists because Cloudflare Workers cannot use TCP sockets (required by postgres-js), so all API routes use Supabase's fetch-based client.

### Authentication Flow

1. Patient enters name + DOB
2. System finds matching patient record
3. OTP sent to registered email via Supabase Auth
4. Patient verifies OTP → session created
5. Session linked to patient record for subsequent requests

For development, set `BYPASS_AUTH_LOCAL=true` to skip OTP verification.

### API Routes

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/send-otp` | Send OTP to patient email |
| `POST /api/auth/verify-otp` | Verify OTP and create session |
| `GET /api/patient/[id]/records` | Get patient medical records |
| `GET /api/patient/[id]/providers` | Get authorized providers |
| `GET /api/patient/[id]/tokens` | Get share tokens |
| `POST /api/patient/[id]/summary` | Generate AI health summary |
| `POST /api/provider/access` | Provider access via token |
| `POST /api/provider/otp-access` | Provider access via OTP |
| `POST /api/provider/emergency-access` | Emergency access request |

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `DATABASE_URL` | PostgreSQL connection string |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | Mock responses |
| `AI_MODEL` | AI model to use | `openai/gpt-4o-mini` |
| `AI_ENABLED` | Enable AI summaries | `false` |
| `BYPASS_AUTH_LOCAL` | Skip OTP in development | `false` |
| `DEMO_PATIENT_ID` | Patient ID for auth bypass | - |

## Code Style

- **Formatter/Linter**: Biome (spaces, single quotes, no semicolons)
- **Import Organization**: Enforced via Biome
- **Type Safety**: Strict TypeScript
- **Generated Code**: `components/ui/*` excluded from linting (shadcn/ui)

## Deployment

### Cloudflare Workers

The app is configured for Cloudflare Workers deployment using OpenNext:

```bash
# Set environment variables in Cloudflare dashboard or wrangler.jsonc
# Then deploy:
bun run deploy
```

### Environment Variables on Cloudflare

Set secrets via Wrangler CLI:

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
# etc.
```

Public variables can be set in `wrangler.jsonc` under `vars`.

## Demo Data

The seed script creates:
- 1 demo patient with comprehensive medical history
- Multiple healthcare organizations
- Medical records across categories (vitals, labs, medications, encounters)
- Sample authorized providers
- Access logs

Run `bun run db:seed` after database setup to populate demo data.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the code style
4. Run `bun run lint` and `bun run type-check`
5. Submit a pull request

## License

Private - All rights reserved.
