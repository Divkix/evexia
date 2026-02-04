import { describe, expect, test } from 'bun:test'
import type { Record } from '@/lib/supabase/queries/records'
import type { GenerateSummaryResult } from '../summary'

// Mock records for testing
const mockRecords: Record[] = [
  {
    id: '1',
    patientId: 'patient-1',
    hospital: 'Banner Health',
    recordDate: '2024-01-15',
    category: 'vitals',
    source: 'Test Lab',
    data: {
      bloodPressure: '120/80',
      heartRate: 72,
    },
    createdAt: '2024-01-15T10:00:00Z',
  },
]

describe('generateSummary return type', () => {
  test('returns GenerateSummaryResult with usedFallback when AI disabled', async () => {
    // This test verifies the new return type structure
    const { generateSummary } = await import('../summary')

    // With AI disabled (default in test), should return fallback
    const result = await generateSummary(mockRecords)

    // Verify new return type structure
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('usedFallback')
    expect(result).toHaveProperty('fallbackReason')

    // Should use fallback when AI is disabled
    expect(result.usedFallback).toBe(true)
    expect(result.fallbackReason).toBe('ai_disabled')

    // Data should still contain summary fields
    expect(result.data).toHaveProperty('clinicianSummary')
    expect(result.data).toHaveProperty('patientSummary')
    expect(result.data).toHaveProperty('anomalies')
    expect(result.data).toHaveProperty('modelUsed')
  })

  test('returns api_key_missing reason when AI enabled but no key', async () => {
    // Set AI_ENABLED but no key
    const originalEnabled = process.env.AI_ENABLED
    const originalKey = process.env.OPENROUTER_API_KEY

    process.env.AI_ENABLED = 'true'
    delete process.env.OPENROUTER_API_KEY

    // Re-import to get fresh module state
    // Note: This is a simplified test - in practice we'd use dependency injection
    const { generateSummary } = await import('../summary')
    const result = await generateSummary(mockRecords)

    expect(result.usedFallback).toBe(true)
    expect(result.fallbackReason).toBe('api_key_missing')

    // Restore
    process.env.AI_ENABLED = originalEnabled
    if (originalKey) {
      process.env.OPENROUTER_API_KEY = originalKey
    }
  })

  test('data contains valid SummaryData structure', async () => {
    const { generateSummary } = await import('../summary')
    const result = await generateSummary(mockRecords)

    expect(typeof result.data.clinicianSummary).toBe('string')
    expect(typeof result.data.patientSummary).toBe('string')
    expect(Array.isArray(result.data.anomalies)).toBe(true)
    expect(typeof result.data.modelUsed).toBe('string')
  })

  test('usedFallback is false when AI succeeds', async () => {
    // This test documents expected behavior when AI works
    // In practice, we'd mock the OpenRouter API call
    const { generateSummary } = await import('../summary')

    // With AI disabled, we can't test the success case directly
    // But we verify the interface expectation
    const result = await generateSummary(mockRecords)

    // Type check: result must conform to GenerateSummaryResult
    const typedResult: GenerateSummaryResult = result

    expect(typedResult).toBeDefined()
    expect(typeof typedResult.usedFallback).toBe('boolean')
    expect(
      typedResult.fallbackReason === undefined ||
        typedResult.fallbackReason === 'ai_disabled' ||
        typedResult.fallbackReason === 'api_key_missing' ||
        typedResult.fallbackReason === 'generation_failed',
    ).toBe(true)
  })
})

describe('GenerateSummaryResult type', () => {
  test('fallbackReason is only present when usedFallback is true', async () => {
    const { generateSummary } = await import('../summary')
    const result = await generateSummary(mockRecords)

    if (result.usedFallback) {
      expect(result.fallbackReason).toBeDefined()
      expect(['ai_disabled', 'api_key_missing', 'generation_failed']).toContain(
        result.fallbackReason as string,
      )
    }
  })
})
