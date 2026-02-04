import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { env } from '@/lib/env'
import type { Record } from '@/lib/supabase/queries/records'
import type { SummaryData } from '@/lib/supabase/queries/summaries'
import { generateMockSummary } from './mock'
import { buildMedicalPrompt } from './prompts'

export type FallbackReason =
  | 'ai_disabled'
  | 'api_key_missing'
  | 'generation_failed'

export interface GenerateSummaryResult {
  data: SummaryData
  usedFallback: boolean
  fallbackReason?: FallbackReason
}

export async function generateSummary(
  records: Record[],
): Promise<GenerateSummaryResult> {
  // Check if AI is enabled
  if (!env.ai.enabled()) {
    return {
      data: generateMockSummary(records),
      usedFallback: true,
      fallbackReason: 'ai_disabled',
    }
  }

  const apiKey = env.ai.openRouterKey()
  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not set, using mock summary')
    return {
      data: generateMockSummary(records),
      usedFallback: true,
      fallbackReason: 'api_key_missing',
    }
  }

  try {
    const openrouter = createOpenRouter({ apiKey })
    const model = env.ai.model()

    const { text } = await generateText({
      model: openrouter(model),
      prompt: buildMedicalPrompt(records),
      temperature: 0.3,
      maxOutputTokens: 2000,
    })

    const parsed = extractJsonFromResponse(text)
    if (!parsed) {
      console.error('Failed to extract JSON from AI response')
      return {
        data: generateMockSummary(records),
        usedFallback: true,
        fallbackReason: 'generation_failed',
      }
    }

    return {
      data: {
        clinicianSummary: parsed.clinician_summary ?? '',
        patientSummary: parsed.patient_summary ?? '',
        anomalies: Array.isArray(parsed.anomalies)
          ? (parsed.anomalies as SummaryData['anomalies'])
          : [],
        modelUsed: model,
      },
      usedFallback: false,
    }
  } catch (error) {
    console.error('AI summary generation failed:', error)
    return {
      data: generateMockSummary(records),
      usedFallback: true,
      fallbackReason: 'generation_failed',
    }
  }
}

interface AIResponseJson {
  clinician_summary?: string
  patient_summary?: string
  anomalies?: unknown[]
  [key: string]: unknown
}

/**
 * Extract JSON from AI response using multiple strategies:
 * 1. Extract from markdown code blocks (```json ... ```)
 * 2. Balanced brace matching for nested objects
 * 3. Handle escaped quotes in strings
 */
export function extractJsonFromResponse(text: string): AIResponseJson | null {
  if (!text || text.trim() === '') {
    return null
  }

  // Strategy 1: Extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch?.[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 2: Find JSON object using balanced brace matching
  const jsonObject = extractBalancedJson(text)
  if (jsonObject) {
    try {
      return JSON.parse(jsonObject) as AIResponseJson
    } catch {
      // Fall through to return null
    }
  }

  return null
}

/**
 * Extract a balanced JSON object from text by tracking brace depth
 * and handling strings (including escaped quotes)
 */
function extractBalancedJson(text: string): string | null {
  let startIndex = -1
  let depth = 0
  let inString = false
  let escapeNext = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        startIndex = i
      }
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && startIndex !== -1) {
        return text.slice(startIndex, i + 1)
      }
    }
  }

  return null
}

export { generateMockSummary } from './mock'
export { MEDICAL_DISCLAIMER } from './prompts'
