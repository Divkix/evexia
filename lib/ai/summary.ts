import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import type { SummaryData } from '@/lib/db/queries/summaries'
import type { Record } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { generateMockSummary } from './mock'
import { buildMedicalPrompt } from './prompts'

export async function generateSummary(records: Record[]): Promise<SummaryData> {
  // Check if AI is enabled
  if (!env.ai.enabled()) {
    return generateMockSummary(records)
  }

  const apiKey = env.ai.openRouterKey()
  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not set, using mock summary')
    return generateMockSummary(records)
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

    return parseAIResponse(text, model)
  } catch (error) {
    console.error('AI summary generation failed:', error)
    return generateMockSummary(records)
  }
}

function parseAIResponse(text: string, model: string): SummaryData {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      clinicianSummary: parsed.clinician_summary ?? '',
      patientSummary: parsed.patient_summary ?? '',
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      modelUsed: model,
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw error
  }
}

export { generateMockSummary } from './mock'
export { MEDICAL_DISCLAIMER } from './prompts'
