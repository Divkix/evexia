import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

type RecordType = 'vitals' | 'labs' | 'medications' | 'encounters'

interface ConsentRequest {
  recordTypes: RecordType[]
  purpose?: string
}

interface ConsentResponse {
  sharedData: string[]
  inferredConditions: string[]
  sensitiveInferences: string[]
  minimumRequired: string[]
  recommendation: string
}

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ConsentResponse | { error: string }>> {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID required' },
        { status: 400 },
      )
    }

    const body: ConsentRequest = await request.json()

    if (!body.recordTypes || body.recordTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one record type is required' },
        { status: 400 },
      )
    }

    // Validate record types
    const validTypes: RecordType[] = [
      'vitals',
      'labs',
      'medications',
      'encounters',
    ]
    const invalidTypes = body.recordTypes.filter((t) => !validTypes.includes(t))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid record types: ${invalidTypes.join(', ')}` },
        { status: 400 },
      )
    }

    // Use AI or return mock data if AI disabled
    if (!env.ai.enabled() || !env.ai.openRouterKey()) {
      return NextResponse.json(getMockConsentExplanation(body.recordTypes))
    }

    const prompt = buildConsentPrompt(body.recordTypes, body.purpose)

    try {
      const openrouter = createOpenRouter({
        apiKey: env.ai.openRouterKey()!,
      })

      const { text } = await generateText({
        model: openrouter(env.ai.model()),
        prompt,
        temperature: 0.3,
        maxOutputTokens: 1000,
      })

      const parsed = extractJsonFromResponse(text)
      if (!parsed) {
        console.error('Failed to parse consent explainer response')
        return NextResponse.json(getMockConsentExplanation(body.recordTypes))
      }

      return NextResponse.json({
        sharedData: parsed.shared_data ?? [],
        inferredConditions: parsed.inferred_conditions ?? [],
        sensitiveInferences: parsed.sensitive_inferences ?? [],
        minimumRequired: parsed.minimum_required ?? [],
        recommendation: parsed.recommendation ?? '',
      })
    } catch (aiError) {
      console.error('Consent explainer AI error:', aiError)
      return NextResponse.json(getMockConsentExplanation(body.recordTypes))
    }
  } catch (error) {
    console.error('Consent explainer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

function buildConsentPrompt(
  recordTypes: RecordType[],
  purpose?: string,
): string {
  const typeDescriptions: Record<RecordType, string> = {
    vitals:
      'vital signs (blood pressure, heart rate, temperature, weight, height, BMI)',
    labs: 'laboratory results (blood tests, urine tests, metabolic panels)',
    medications: 'medication records (prescriptions, dosages, refill history)',
    encounters:
      'clinical encounters (visit notes, diagnoses, procedures, referrals)',
  }

  const typesDescription = recordTypes
    .map((t) => typeDescriptions[t])
    .join(', ')

  return `You are a healthcare privacy advisor helping patients understand what they're sharing.

A patient is about to share the following medical record types with a healthcare provider:
- ${recordTypes.map((t) => typeDescriptions[t]).join('\n- ')}

The stated purpose is: ${purpose || 'General healthcare consultation'}

Explain in plain, non-alarming language:
1. What specific data will the provider see from these record types?
2. What health conditions could be INFERRED from this combination of data (even if not explicitly stated)?
3. Are there any SENSITIVE inferences that could be made? (mental health indicators, reproductive health, substance use patterns, HIV status, genetic conditions)
4. What would be the MINIMUM data needed for the stated purpose?

Be helpful and educational, not alarming. Help the patient make an informed choice.

Respond ONLY with valid JSON in this exact format:
{
  "shared_data": ["list of specific data types they will see"],
  "inferred_conditions": ["health conditions that can be inferred from this data"],
  "sensitive_inferences": ["sensitive information that could potentially be inferred"],
  "minimum_required": ["minimum data typically needed for the stated purpose"],
  "recommendation": "A brief, balanced recommendation (1-2 sentences)"
}`
}

interface ParsedConsentResponse {
  shared_data?: string[]
  inferred_conditions?: string[]
  sensitive_inferences?: string[]
  minimum_required?: string[]
  recommendation?: string
}

function extractJsonFromResponse(text: string): ParsedConsentResponse | null {
  if (!text || text.trim() === '') {
    return null
  }

  // Try markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch?.[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Fall through
    }
  }

  // Try extracting JSON object with balanced braces
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Fall through
    }
  }

  return null
}

function getMockConsentExplanation(recordTypes: RecordType[]): ConsentResponse {
  const sharedData: string[] = []
  const inferredConditions: string[] = []
  const sensitiveInferences: string[] = []
  const minimumRequired: string[] = []

  // Build realistic mock data based on selected types
  if (recordTypes.includes('vitals')) {
    sharedData.push(
      'Blood pressure readings over time',
      'Heart rate measurements',
      'Body weight and BMI trends',
      'Temperature readings',
    )
    inferredConditions.push(
      'Hypertension or hypotension patterns',
      'Weight management challenges',
      'Potential cardiovascular concerns',
    )
  }

  if (recordTypes.includes('labs')) {
    sharedData.push(
      'Blood glucose levels (A1C, fasting glucose)',
      'Cholesterol panel (LDL, HDL, triglycerides)',
      'Complete blood count results',
      'Kidney and liver function markers',
    )
    inferredConditions.push(
      'Diabetes or pre-diabetes status',
      'Metabolic syndrome indicators',
      'Organ function concerns',
    )
    sensitiveInferences.push(
      'Substance use patterns from liver enzymes',
      'HIV/STI testing history if included',
    )
  }

  if (recordTypes.includes('medications')) {
    sharedData.push(
      'Current prescriptions and dosages',
      'Medication history and changes',
      'Refill patterns and compliance',
    )
    inferredConditions.push(
      'Chronic conditions being treated',
      'Mental health treatment history',
      'Pain management needs',
    )
    sensitiveInferences.push(
      'Psychiatric conditions from psychotropic medications',
      'Substance use disorder treatment (if applicable)',
      'Reproductive health choices from contraceptives',
    )
  }

  if (recordTypes.includes('encounters')) {
    sharedData.push(
      'Visit dates and reasons',
      'Diagnoses and ICD codes',
      'Provider notes and assessments',
      'Referrals and follow-up plans',
    )
    inferredConditions.push(
      'Full diagnostic history',
      'Specialist consultations',
      'Treatment outcomes',
    )
    sensitiveInferences.push(
      'Mental health visit history',
      'Reproductive health consultations',
      'Substance use counseling records',
    )
  }

  // Determine minimum required based on common purposes
  if (recordTypes.length === 4) {
    minimumRequired.push(
      'For routine care: Vitals and recent labs are usually sufficient',
      'Medications may be needed for prescribing safety',
      'Full encounters rarely needed for initial consultation',
    )
  } else if (recordTypes.length > 0) {
    minimumRequired.push(
      'Your selection appears focused',
      'Consider if all selected types are necessary for the consultation',
    )
  }

  // Generate recommendation
  const hasSensitive = sensitiveInferences.length > 0
  let recommendation = ''

  if (hasSensitive && recordTypes.includes('medications')) {
    recommendation =
      'Sharing medications may reveal treatment for sensitive conditions. Consider if this level of detail is necessary for your visit purpose.'
  } else if (recordTypes.length >= 3) {
    recommendation =
      'You are sharing comprehensive data. This is appropriate for establishing care with a new primary provider, but may be more than needed for a specialist consultation.'
  } else {
    recommendation =
      'Your selection provides focused access appropriate for most consultation types.'
  }

  return {
    sharedData,
    inferredConditions,
    sensitiveInferences: [...new Set(sensitiveInferences)], // Remove duplicates
    minimumRequired,
    recommendation,
  }
}
