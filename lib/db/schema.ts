import {
  boolean,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: uuid('auth_user_id'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  dateOfBirth: date('date_of_birth').notNull(),
  phone: text('phone'),
  allowEmergencyAccess: boolean('allow_emergency_access').default(false).notNull(),
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
  employeeId: uuid('employee_id').references(() => employees.id, {
    onDelete: 'set null',
  }),
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
  accessMethod: text('access_method'), // 'employee_id', 'token', 'otp', or 'emergency'
  scope: text('scope').array(),
  isEmergencyAccess: boolean('is_emergency_access').default(false).notNull(),
  accessedAt: timestamp('accessed_at').defaultNow().notNull(),
})

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: text('employee_id').notNull(),
    name: text('name').notNull(),
    email: text('email'),
    department: text('department'),
    isActive: boolean('is_active').default(true).notNull(),
    isEmergencyStaff: boolean('is_emergency_staff').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('employees_org_employee_id_unique').on(
      table.organizationId,
      table.employeeId,
    ),
  ],
)

// Type exports
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
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
export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
