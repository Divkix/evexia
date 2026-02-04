import { and, eq } from 'drizzle-orm'
import { db } from '../lib/db'
import {
  employees,
  organizations,
  patientProviders,
  patients,
  records,
} from '../lib/db/schema'

const DEMO_PATIENTS = [
  {
    name: 'Maria Santos',
    email: 'demo@evexia.health',
    dateOfBirth: '1985-03-15',
    phone: '555-123-4567',
    allowEmergencyAccess: true, // Enable emergency ER access for demo
  },
  {
    name: 'Manushri Kumar',
    email: 'manushrimkumar@gmail.com',
    dateOfBirth: '2005-02-15',
    phone: '555-234-5678',
    allowEmergencyAccess: false,
  },
  {
    name: 'Shriya Vallabha',
    email: 'Shriya.vallabha@gmail.com',
    dateOfBirth: '2005-06-07',
    phone: '555-345-6789',
    allowEmergencyAccess: false,
  },
]

const DEMO_ORGANIZATIONS = [
  { slug: 'banner-health', name: 'Banner Health' },
  { slug: 'mayo-clinic', name: 'Mayo Clinic' },
  { slug: 'phoenician-medical', name: 'Phoenician Medical Center' },
]

type DemoEmployee = {
  employeeId: string
  name: string
  orgSlug: string
  email: string
  department: string
  isEmergencyStaff?: boolean
}

const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    employeeId: 'EMP-001',
    name: 'Dr. Sarah Chen',
    orgSlug: 'banner-health',
    email: 'sarah.chen@bannerhealth.example',
    department: 'Primary Care',
  },
  {
    employeeId: 'EMP-001', // Same ID, different org!
    name: 'Dr. John Smith',
    orgSlug: 'mayo-clinic',
    email: 'john.smith@mayoclinic.example',
    department: 'Internal Medicine',
  },
  {
    employeeId: 'EMP-002',
    name: 'Dr. Michael Rivera',
    orgSlug: 'mayo-clinic',
    email: 'michael.rivera@mayoclinic.example',
    department: 'Cardiology',
  },
  {
    employeeId: 'EMP-003',
    name: 'Dr. Emily Watson',
    orgSlug: 'phoenician-medical',
    email: 'emily.watson@phoenicianmed.example',
    department: 'Endocrinology',
  },
  {
    employeeId: 'ER-001',
    name: 'Dr. Emergency Response',
    orgSlug: 'banner-health',
    email: 'er.doctor@bannerhealth.example',
    department: 'Emergency',
    isEmergencyStaff: true,
  },
]

async function seed() {
  console.log('Starting seed...')

  // Seed demo organizations first
  console.log('Seeding demo organizations...')
  const orgIds: Record<string, string> = {}

  for (const org of DEMO_ORGANIZATIONS) {
    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, org.slug))
      .limit(1)

    if (existing.length === 0) {
      const [inserted] = await db.insert(organizations).values(org).returning()
      orgIds[org.slug] = inserted.id
      console.log(`Created organization: ${org.name}`)
    } else {
      await db
        .update(organizations)
        .set({ name: org.name })
        .where(eq(organizations.slug, org.slug))
      orgIds[org.slug] = existing[0].id
      console.log(`Updated organization: ${org.name}`)
    }
  }
  console.log('Demo organizations seeded')

  // Seed demo employees (needed for linking providers)
  console.log('Seeding demo employees...')
  const employeeIds: Record<string, string> = {}

  for (const emp of DEMO_EMPLOYEES) {
    const orgId = orgIds[emp.orgSlug]
    if (!orgId) {
      console.error(`Organization not found for slug: ${emp.orgSlug}`)
      continue
    }

    // Check if employee exists for this org
    const existing = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.employeeId, emp.employeeId),
          eq(employees.organizationId, orgId),
        ),
      )
      .limit(1)

    const employeeData = {
      employeeId: emp.employeeId,
      organizationId: orgId,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      isEmergencyStaff: emp.isEmergencyStaff ?? false,
    }

    if (existing.length === 0) {
      const [inserted] = await db
        .insert(employees)
        .values(employeeData)
        .returning()
      employeeIds[`${emp.orgSlug}:${emp.employeeId}`] = inserted.id
      console.log(
        `Created employee: ${emp.employeeId} at ${emp.orgSlug} - ${emp.name}`,
      )
    } else {
      await db
        .update(employees)
        .set(employeeData)
        .where(eq(employees.id, existing[0].id))
      employeeIds[`${emp.orgSlug}:${emp.employeeId}`] = existing[0].id
      console.log(
        `Updated employee: ${emp.employeeId} at ${emp.orgSlug} - ${emp.name}`,
      )
    }
  }
  console.log('Demo employees seeded')

  // Seed all demo patients
  const patientIds: string[] = []

  for (const demoPatient of DEMO_PATIENTS) {
    console.log(`\nProcessing patient: ${demoPatient.name}`)

    // Check if patient exists
    const existing = await db
      .select()
      .from(patients)
      .where(eq(patients.email, demoPatient.email))
      .limit(1)

    let patientId: string

    if (existing.length > 0) {
      console.log(`Patient ${demoPatient.name} already exists, updating...`)
      patientId = existing[0].id
      await db
        .update(patients)
        .set(demoPatient)
        .where(eq(patients.id, patientId))
    } else {
      console.log(`Creating patient: ${demoPatient.name}...`)
      const [patient] = await db
        .insert(patients)
        .values(demoPatient)
        .returning()
      patientId = patient.id
    }

    console.log(`Patient ID: ${patientId}`)
    patientIds.push(patientId)

    // Clear existing records for clean seed
    await db.delete(records).where(eq(records.patientId, patientId))
    console.log(`Cleared existing records for ${demoPatient.name}`)

    // Generate records with realistic medical data
    const recordsToInsert = [
      // Banner Health vitals
      ...generateVitals(patientId, 'Banner Health', [
        {
          date: '2024-01-15',
          bmi: 26.5,
          blood_pressure: '128/82',
          heart_rate: 72,
          weight: 165,
        },
        {
          date: '2024-04-20',
          bmi: 26.2,
          blood_pressure: '125/80',
          heart_rate: 70,
          weight: 163,
        },
        {
          date: '2024-07-10',
          bmi: 25.8,
          blood_pressure: '122/78',
          heart_rate: 68,
          weight: 160,
        },
        {
          date: '2024-10-05',
          bmi: 25.5,
          blood_pressure: '120/76',
          heart_rate: 66,
          weight: 158,
        },
      ]),
      // Mayo Clinic vitals
      ...generateVitals(patientId, 'Mayo Clinic', [
        {
          date: '2024-02-28',
          bmi: 26.3,
          blood_pressure: '126/81',
          heart_rate: 71,
          weight: 164,
        },
        {
          date: '2024-08-15',
          bmi: 25.6,
          blood_pressure: '121/77',
          heart_rate: 67,
          weight: 159,
        },
      ]),
      // Banner Health labs
      ...generateLabs(patientId, 'Banner Health', [
        {
          date: '2024-01-15',
          total_cholesterol: 215,
          a1c: 6.2,
          ldl: 130,
          hdl: 45,
          triglycerides: 180,
        },
        {
          date: '2024-07-10',
          total_cholesterol: 205,
          a1c: 6.0,
          ldl: 122,
          hdl: 48,
          triglycerides: 165,
        },
      ]),
      // Mayo Clinic labs
      ...generateLabs(patientId, 'Mayo Clinic', [
        {
          date: '2024-02-28',
          total_cholesterol: 210,
          a1c: 6.1,
          ldl: 126,
          hdl: 46,
          triglycerides: 175,
        },
        {
          date: '2024-08-15',
          total_cholesterol: 198,
          a1c: 5.9,
          ldl: 118,
          hdl: 50,
          triglycerides: 155,
        },
      ]),
      // Phoenician Medical Center labs
      ...generateLabs(patientId, 'Phoenician Medical Center', [
        {
          date: '2024-05-20',
          total_cholesterol: 208,
          a1c: 6.0,
          ldl: 124,
          hdl: 47,
          triglycerides: 170,
        },
      ]),
      // Medications from Banner Health
      ...generateMeds(patientId, 'Banner Health', [
        {
          medication: 'Lisinopril',
          dose: '10mg',
          frequency: 'Once daily',
          startDate: '2023-06-01',
          indication: 'Hypertension',
        },
        {
          medication: 'Metformin',
          dose: '500mg',
          frequency: 'Twice daily',
          startDate: '2023-08-15',
          indication: 'Prediabetes',
        },
      ]),
      // Medications from Mayo Clinic
      ...generateMeds(patientId, 'Mayo Clinic', [
        {
          medication: 'Atorvastatin',
          dose: '20mg',
          frequency: 'Once daily at bedtime',
          startDate: '2024-01-20',
          indication: 'Hyperlipidemia',
        },
      ]),
      // Encounters at Banner Health
      ...generateEncounters(patientId, 'Banner Health', [
        {
          date: '2024-01-15',
          type: 'Annual Physical',
          provider: 'Dr. Sarah Chen',
          notes:
            'Routine checkup, discussed weight management and lifestyle changes',
        },
        {
          date: '2024-07-10',
          type: 'Follow-up Visit',
          provider: 'Dr. Sarah Chen',
          notes:
            'Good progress on lifestyle changes, weight down 5 lbs, continue current medications',
        },
      ]),
      // Encounters at Mayo Clinic
      ...generateEncounters(patientId, 'Mayo Clinic', [
        {
          date: '2024-02-28',
          type: 'Cardiology Consult',
          provider: 'Dr. Michael Rivera',
          notes:
            'Cardiovascular risk assessment, recommended statin therapy, lifestyle modifications',
        },
        {
          date: '2024-08-15',
          type: 'Cardiology Follow-up',
          provider: 'Dr. Michael Rivera',
          notes:
            'Lipid panel improved significantly, continue current regimen, recheck in 6 months',
        },
      ]),
      // Encounters at Phoenician Medical Center
      ...generateEncounters(patientId, 'Phoenician Medical Center', [
        {
          date: '2024-05-20',
          type: 'Endocrinology Consult',
          provider: 'Dr. Emily Watson',
          notes:
            'A1C monitoring for prediabetes, metformin working well, dietary counseling provided',
        },
      ]),
    ]

    await db.insert(records).values(recordsToInsert)
    console.log(`Inserted ${recordsToInsert.length} records for ${demoPatient.name}`)

    // Create sample provider relationship for testing OTP access
    await db
      .delete(patientProviders)
      .where(eq(patientProviders.patientId, patientId))

    await db.insert(patientProviders).values({
      patientId,
      employeeId: employeeIds['banner-health:EMP-001'], // Link to Dr. Sarah Chen
      providerName: 'Dr. Sarah Chen',
      providerOrg: 'Banner Health',
      providerEmail: 'sarah.chen@bannerhealth.example',
      scope: ['vitals', 'labs', 'meds', 'encounters'],
    })
    console.log(`Created provider relationship for ${demoPatient.name}`)
  }

  console.log('\n=== Seed complete! ===')
  console.log(`\nCreated ${patientIds.length} patients:`)
  DEMO_PATIENTS.forEach((p, i) => {
    console.log(`  ${p.name} (${p.email}): ${patientIds[i]}`)
  })
  console.log('\nFor auth bypass in .env.local, use any of the patient IDs above.')

  process.exit(0)
}

function generateVitals(
  patientId: string,
  hospital: string,
  data: Array<Record<string, unknown>>,
) {
  return data.map((d) => ({
    patientId,
    hospital,
    category: 'vitals' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

function generateLabs(
  patientId: string,
  hospital: string,
  data: Array<Record<string, unknown>>,
) {
  return data.map((d) => ({
    patientId,
    hospital,
    category: 'labs' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

function generateMeds(
  patientId: string,
  hospital: string,
  data: Array<Record<string, unknown>>,
) {
  return data.map((d) => ({
    patientId,
    hospital,
    category: 'meds' as const,
    data: d,
    recordDate: (d.startDate as string) ?? null,
    source: 'seed',
  }))
}

function generateEncounters(
  patientId: string,
  hospital: string,
  data: Array<Record<string, unknown>>,
) {
  return data.map((d) => ({
    patientId,
    hospital,
    category: 'encounters' as const,
    data: d,
    recordDate: d.date as string,
    source: 'seed',
  }))
}

seed().catch(console.error)
