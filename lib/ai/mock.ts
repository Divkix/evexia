import type { Record } from '@/lib/supabase/queries/records'
import type {
  Anomaly,
  EquityConcern,
  Prediction,
  SummaryData,
} from '@/lib/supabase/queries/summaries'

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
  const equityConcerns: EquityConcern[] = []
  const predictions: Prediction[] = []

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

  // Generate health equity concerns based on detected anomalies
  generateEquityConcerns(
    equityConcerns,
    latestBmi,
    latestBp,
    latestA1c,
    latestCholesterol,
  )

  // Generate predictive risk scores based on trends
  generatePredictions(predictions, latestBmi, latestA1c, latestBp, anomalies)

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
    equityConcerns,
    predictions,
    modelUsed: 'mock-deterministic',
  }
}

function generateEquityConcerns(
  concerns: EquityConcern[],
  bmi: number | null,
  bp: string | null,
  a1c: number | null,
  cholesterol: number | null,
): void {
  // CDC population averages (approximate adult averages)
  const CDC_AVG_BMI = 26.5
  const CDC_AVG_A1C = 5.5
  const CDC_AVG_SYSTOLIC = 122
  const CDC_AVG_CHOLESTEROL = 192

  if (bmi && bmi > CDC_AVG_BMI) {
    const gapPercentage = Math.round(((bmi - CDC_AVG_BMI) / CDC_AVG_BMI) * 100)
    if (gapPercentage > 15) {
      concerns.push({
        metric: 'BMI',
        patientValue: bmi.toString(),
        populationAverage: CDC_AVG_BMI.toString(),
        gapPercentage,
        suggestedAction:
          'Opportunity for early intervention with nutrition counseling and physical activity program',
      })
    }
  }

  if (a1c && a1c > CDC_AVG_A1C) {
    const gapPercentage = Math.round(((a1c - CDC_AVG_A1C) / CDC_AVG_A1C) * 100)
    if (gapPercentage > 15) {
      concerns.push({
        metric: 'A1C',
        patientValue: `${a1c}%`,
        populationAverage: `${CDC_AVG_A1C}%`,
        gapPercentage,
        suggestedAction:
          'Discuss diabetes prevention program and lifestyle modifications',
      })
    }
  }

  if (bp) {
    const [systolic] = bp.split('/').map(Number)
    if (systolic && systolic > CDC_AVG_SYSTOLIC) {
      const gapPercentage = Math.round(
        ((systolic - CDC_AVG_SYSTOLIC) / CDC_AVG_SYSTOLIC) * 100,
      )
      if (gapPercentage > 15) {
        concerns.push({
          metric: 'Blood Pressure (Systolic)',
          patientValue: bp,
          populationAverage: `${CDC_AVG_SYSTOLIC}/80`,
          gapPercentage,
          suggestedAction:
            'Consider DASH diet education and sodium intake reduction counseling',
        })
      }
    }
  }

  if (cholesterol && cholesterol > CDC_AVG_CHOLESTEROL) {
    const gapPercentage = Math.round(
      ((cholesterol - CDC_AVG_CHOLESTEROL) / CDC_AVG_CHOLESTEROL) * 100,
    )
    if (gapPercentage > 15) {
      concerns.push({
        metric: 'Total Cholesterol',
        patientValue: `${cholesterol} mg/dL`,
        populationAverage: `${CDC_AVG_CHOLESTEROL} mg/dL`,
        gapPercentage,
        suggestedAction:
          'Discuss heart-healthy diet and potential statin therapy evaluation',
      })
    }
  }
}

function generatePredictions(
  predictions: Prediction[],
  bmi: number | null,
  a1c: number | null,
  bp: string | null,
  anomalies: Anomaly[],
): void {
  // Generate diabetes risk prediction if A1C is elevated
  if (a1c && a1c >= 5.7) {
    const isPrediabetes = a1c >= 5.7 && a1c < 6.5
    const isDiabetes = a1c >= 6.5

    if (isPrediabetes) {
      predictions.push({
        condition: 'Type 2 Diabetes',
        currentRisk: 'moderate',
        probability: 0.58,
        timeframe: '36 months',
        trendDirection: 'worsening',
        actionableSteps: [
          'Enroll in CDC-recognized Diabetes Prevention Program',
          'Target 7% body weight loss through diet and exercise',
          'Schedule quarterly A1C monitoring',
        ],
        evidenceBasis:
          'Based on CDC Diabetes Prevention Program outcomes data showing 58% progression rate without intervention',
      })
    } else if (isDiabetes) {
      predictions.push({
        condition: 'Diabetic Complications',
        currentRisk: 'high',
        probability: 0.72,
        timeframe: '24 months',
        trendDirection: 'worsening',
        actionableSteps: [
          'Initiate comprehensive diabetes management plan',
          'Schedule annual retinopathy and nephropathy screening',
          'Consider referral to endocrinology',
        ],
        evidenceBasis:
          'Based on ADA guidelines for diabetes management and complication prevention',
      })
    }
  }

  // Generate cardiovascular risk prediction if BP is elevated
  if (bp) {
    const [systolic] = bp.split('/').map(Number)
    if (systolic && systolic >= 130) {
      const risk = systolic >= 140 ? 'high' : 'moderate'
      const probability = systolic >= 140 ? 0.65 : 0.42

      predictions.push({
        condition: 'Cardiovascular Disease',
        currentRisk: risk,
        probability,
        timeframe: '60 months',
        trendDirection: systolic >= 140 ? 'worsening' : 'stable',
        actionableSteps: [
          'Implement DASH diet with sodium restriction to <2300mg/day',
          'Target 150 minutes moderate aerobic activity weekly',
          'Monitor home blood pressure twice daily',
        ],
        evidenceBasis:
          'Based on Framingham Heart Study risk calculations and ACC/AHA hypertension guidelines',
      })
    }
  }

  // Generate obesity-related risk if BMI is elevated
  if (bmi && bmi >= 30) {
    const risk = bmi >= 35 ? 'high' : 'moderate'
    const probability = bmi >= 35 ? 0.68 : 0.45

    predictions.push({
      condition: 'Obesity-Related Metabolic Syndrome',
      currentRisk: risk,
      probability,
      timeframe: '24 months',
      trendDirection: 'stable',
      actionableSteps: [
        'Referral to registered dietitian for personalized meal planning',
        'Structured exercise program starting with 30 min daily walking',
        'Consider behavioral therapy for sustainable lifestyle changes',
      ],
      evidenceBasis:
        'Based on NIH obesity management guidelines and metabolic syndrome diagnostic criteria',
    })
  }

  // If no concerning metrics, add a positive prediction
  if (predictions.length === 0 && anomalies.length === 0) {
    predictions.push({
      condition: 'Overall Health Maintenance',
      currentRisk: 'low',
      probability: 0.15,
      timeframe: '12 months',
      trendDirection: 'improving',
      actionableSteps: [
        'Continue current healthy lifestyle practices',
        'Maintain routine preventive care schedule',
        'Complete age-appropriate health screenings',
      ],
      evidenceBasis:
        'Based on USPSTF preventive care recommendations for healthy adults',
    })
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
