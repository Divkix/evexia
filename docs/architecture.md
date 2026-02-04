# Evexia Architecture

## Tech Stack Overview

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        PatientPortal["Patient Portal<br/>/patient/*"]
        ProviderPortal["Provider Portal<br/>/provider"]
    end

    subgraph Frontend["Frontend (Next.js 16 + React 19)"]
        Pages["App Router Pages"]
        Components["UI Components<br/>Radix UI + Tailwind 4"]
        Forms["React Hook Form + Zod"]
        Charts["Recharts"]
    end

    subgraph API["API Layer (Next.js Route Handlers)"]
        AuthAPI["/api/auth/*<br/>OTP Send/Verify/Session"]
        PatientAPI["/api/patient/[id]/*<br/>Records/Providers/Tokens"]
        ProviderAPI["/api/provider/*<br/>Token & OTP Access"]
    end

    subgraph Services["Service Layer"]
        SupabaseClient["Supabase Client<br/>(HTTP/Fetch)"]
        AIService["AI Summary<br/>OpenRouter + Vercel AI SDK"]
    end

    subgraph External["External Services"]
        SupabaseAuth["Supabase Auth<br/>OTP Email"]
        SupabaseDB["Supabase PostgreSQL"]
        OpenRouter["OpenRouter API<br/>GPT-4o-mini"]
    end

    subgraph Deployment["Deployment"]
        Cloudflare["Cloudflare Workers<br/>via opennextjs-cloudflare"]
    end

    Client --> Frontend
    Frontend --> API
    API --> Services
    Services --> External
    Cloudflare -.->|hosts| Frontend
    Cloudflare -.->|hosts| API
```

## Data Flow

```mermaid
flowchart LR
    subgraph Patient["Patient Flow"]
        P1["Login<br/>Name + DOB"] --> P2["OTP Sent<br/>to Email"]
        P2 --> P3["Verify OTP"]
        P3 --> P4["View Records"]
        P4 --> P5["Manage Providers<br/>Create Tokens"]
    end

    subgraph Provider["Provider Flow"]
        PR1["Enter Token<br/>or Request OTP"] --> PR2["Access Granted<br/>Scoped Data"]
        PR2 --> PR3["View Patient<br/>Records"]
    end

    subgraph Emergency["Emergency Access"]
        ER1["ER Staff ID<br/>+ Patient Lookup"] --> ER2{Patient Opted In?}
        ER2 -->|Yes| ER3["Full Access<br/>Logged"]
        ER2 -->|No| ER4["Access Denied"]
    end
```

## Database Schema

```mermaid
erDiagram
    organizations ||--o{ employees : has
    patients ||--o{ records : has
    patients ||--o{ summaries : has
    patients ||--o{ patient_providers : has
    patients ||--o{ share_tokens : creates
    patients ||--o{ access_logs : tracked_in
    share_tokens ||--o{ access_logs : generates
    employees ||--o{ patient_providers : linked_to

    patients {
        uuid id PK
        uuid auth_user_id
        text name
        text email UK
        date date_of_birth
        boolean allow_emergency_access
    }

    organizations {
        uuid id PK
        text slug UK
        text name
    }

    employees {
        uuid id PK
        uuid organization_id FK
        text employee_id
        text name
        boolean is_emergency_staff
    }

    records {
        uuid id PK
        uuid patient_id FK
        text hospital
        text category
        jsonb data
        date record_date
    }

    patient_providers {
        uuid id PK
        uuid patient_id FK
        uuid employee_id FK
        text provider_name
        text[] scope
    }

    share_tokens {
        uuid id PK
        uuid patient_id FK
        text token UK
        text[] scope
        timestamp expires_at
    }

    access_logs {
        uuid id PK
        uuid patient_id FK
        uuid token_id FK
        text access_method
        boolean is_emergency_access
    }
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Radix UI, Tailwind CSS 4 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle (schema) + Supabase Client (queries) |
| Auth | Supabase Auth (OTP) |
| AI | OpenRouter + Vercel AI SDK |
| Deployment | Cloudflare Workers |
| Tooling | TypeScript, Biome, Knip |

## Key Design Decisions

1. **Dual Database Layer**: Drizzle for schema/migrations, Supabase HTTP client for runtime queries (Cloudflare Workers can't use TCP sockets)

2. **OTP-Only Auth**: No passwords - patients authenticate via email OTP for simplicity and security

3. **Scoped Access**: Providers only see data categories (vitals, labs, meds, encounters) explicitly granted by patient

4. **Emergency Override**: ER staff can bypass normal auth for opted-in patients, with full audit logging
