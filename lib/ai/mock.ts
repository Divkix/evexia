import type { Record } from '@/lib/supabase/queries/records'
import type { Anomaly, SummaryData } from '@/lib/supabase/queries/summaries'

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

  const vitals = records.filter((r) => r.category === 'vitals')
  const labs = records.filter((r) => r.category === 'labs')
  const meds = records.filter((r) => r.category === 'meds')

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
          message: `Blood pressure of ${data.blood_pressure} indicates hypertension (>=140/90)`,
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
          message: `A1C of ${a1c}% indicates diabetes (>=6.5%)`,
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
          message: `Total cholesterol of ${data.total_cholesterol} mg/dL is high (>=240)`,
        })
      }
    }
  }

  // Build summaries
  const clinicianSummary = buildClinicianSummary(
    latestBmi,
    latestBp,
    latestA1c,
    latestCholesterol,
    meds.length,
    anomalies.length,
  )
  const patientSummary = buildPatientSummary(
    latestBmi,
    latestBp,
    latestA1c,
    latestCholesterol,
    anomalies,
  )

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
  anomalyCount: number,
): string {
  const points: string[] = []

  if (bmi) points.push(`* BMI: ${bmi} (${getBmiCategory(bmi)})`)
  if (bp) points.push(`* Blood Pressure: ${bp}`)
  if (a1c) points.push(`* HbA1c: ${a1c}%`)
  if (cholesterol) points.push(`* Total Cholesterol: ${cholesterol} mg/dL`)
  points.push(`* Active Medications: ${medCount}`)
  if (anomalyCount > 0) points.push(`* Flagged Anomalies: ${anomalyCount}`)

  return points.join('\n')
}

function buildPatientSummary(
  bmi: number | null,
  bp: string | null,
  a1c: number | null,
  cholesterol: number | null,
  anomalies: Anomaly[],
): string {
  const parts: string[] = ["Here's a summary of your recent health data:\n"]

  if (bmi) {
    const category = getBmiCategory(bmi)
    parts.push(
      `Your BMI is ${bmi}, which is in the ${category.toLowerCase()} range.`,
    )
  }

  if (bp) {
    parts.push(`Your most recent blood pressure reading was ${bp}.`)
  }

  if (a1c) {
    parts.push(
      `Your A1C level is ${a1c}%, which measures your average blood sugar over the past 2-3 months.`,
    )
  }

  if (cholesterol) {
    parts.push(`Your total cholesterol is ${cholesterol} mg/dL.`)
  }

  if (anomalies.length > 0) {
    parts.push(
      `\nThere are ${anomalies.length} item(s) that may need attention - please review with your healthcare provider.`,
    )
  } else {
    parts.push(
      '\nNo significant concerns were identified in your recent records.',
    )
  }

  return parts.join(' ')
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}
