import type { Record } from '@/lib/supabase/queries/records'

export function buildMedicalPrompt(records: Record[]): string {
  const vitals = records.filter((r) => r.category === 'vitals')
  const labs = records.filter((r) => r.category === 'labs')
  const meds = records.filter((r) => r.category === 'meds')
  const encounters = records.filter((r) => r.category === 'encounters')

  return `You are a medical AI assistant analyzing patient health records.
Generate two summaries, identify anomalies, analyze health equity, and provide predictive risk scoring.

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

ANALYSIS REQUIREMENTS:

1. Generate summaries and identify anomalies based on:
   - BMI trends (normal: 18.5-24.9, overweight: 25-29.9, obese: 30+)
   - Blood pressure patterns (normal: <120/80, elevated: 120-129/<80, high: 130+/80+)
   - A1C levels (normal: <5.7%, prediabetes: 5.7-6.4%, diabetes: 6.5%+)
   - Cholesterol (desirable: <200, borderline: 200-239, high: 240+)
   - Medication interactions or duplicates
   - Missing follow-ups or screenings

2. Analyze health equity:
   - Compare patient's BMI, A1C, BP against CDC population averages for their age group
   - Flag metrics that are >15% worse than demographic average
   - Frame positively as "opportunity for early intervention"
   - Output equity_concerns[] with: metric, patient_value, population_average, gap_percentage, suggested_action

3. Analyze temporal trends and predictive risk:
   - For each concerning metric, calculate trajectory over available time period
   - Using clinical progression models (CDC guidelines), estimate probability of condition worsening
   - Cite evidence basis
   - Provide 3 actionable, specific recommendations ranked by impact
   - Flag if trend is IMPROVING (positive reinforcement) vs WORSENING (urgency)
   - Output predictions[] with: condition, current_risk, probability, timeframe, trend_direction, actionable_steps, evidence_basis

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
  ],
  "equity_concerns": [
    {
      "metric": "A1C",
      "patient_value": "7.2%",
      "population_average": "6.1%",
      "gap_percentage": 18,
      "suggested_action": "Discuss diabetes prevention program"
    }
  ],
  "predictions": [
    {
      "condition": "Type 2 Diabetes",
      "current_risk": "low|moderate|high|critical",
      "probability": 0.72,
      "timeframe": "24 months",
      "trend_direction": "improving|stable|worsening",
      "actionable_steps": ["Reduce carb intake", "30 min daily walking", "Quarterly A1C monitoring"],
      "evidence_basis": "Based on CDC diabetes progression models"
    }
  ]
}`
}

export const MEDICAL_DISCLAIMER =
  'DISCLAIMER: This is informational only, not medical advice. AI summaries may be inaccurate. Always verify with original records and consult your healthcare provider.'
