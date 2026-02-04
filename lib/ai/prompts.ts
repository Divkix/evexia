import type { Record } from '@/lib/supabase/queries/records'

export function buildMedicalPrompt(records: Record[]): string {
  const vitals = records.filter((r) => r.category === 'vitals')
  const labs = records.filter((r) => r.category === 'labs')
  const meds = records.filter((r) => r.category === 'meds')
  const encounters = records.filter((r) => r.category === 'encounters')

  return `You are a medical AI assistant analyzing patient health records.
Generate two summaries and identify any anomalies.

PATIENT HEALTH RECORDS:

VITALS (${vitals.length} records):
${JSON.stringify(
  vitals.map((r) => r.data),
  null,
  2,
)}

LAB RESULTS (${labs.length} records):
${JSON.stringify(
  labs.map((r) => r.data),
  null,
  2,
)}

MEDICATIONS (${meds.length} records):
${JSON.stringify(
  meds.map((r) => r.data),
  null,
  2,
)}

ENCOUNTERS (${encounters.length} records):
${JSON.stringify(
  encounters.map((r) => r.data),
  null,
  2,
)}

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
