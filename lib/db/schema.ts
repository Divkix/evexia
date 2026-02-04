import {
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

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
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  hospital: text('hospital').notNull(),
  category: text('category').notNull(), // vitals, labs, meds, encounters
  data: jsonb('data').notNull(),
  recordDate: date('record_date'),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  clinicianSummary: text('clinician_summary'),
  patientSummary: text('patient_summary'),
  anomalies: jsonb('anomalies'),
  modelUsed: text('model_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const patientProviders = pgTable('patient_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  providerName: text('provider_name').notNull(),
  providerOrg: text('provider_org'),
  providerEmail: text('provider_email'),
  scope: text('scope').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const shareTokens = pgTable('share_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  scope: text('scope').array().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: uuid('token_id').references(() => shareTokens.id, {
    onDelete: 'set null',
  }),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
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
export type NewSummary = typeof summaries.$inferInsert
export type PatientProvider = typeof patientProviders.$inferSelect
export type NewPatientProvider = typeof patientProviders.$inferInsert
export type ShareToken = typeof shareTokens.$inferSelect
export type NewShareToken = typeof shareTokens.$inferInsert
export type AccessLog = typeof accessLogs.$inferSelect
export type NewAccessLog = typeof accessLogs.$inferInsert
