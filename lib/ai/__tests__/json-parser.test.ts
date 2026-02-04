import { describe, expect, test } from 'bun:test'
import { extractJsonFromResponse } from '../summary'

describe('extractJsonFromResponse', () => {
  test('extracts plain JSON object', () => {
    const input = '{"key": "value", "number": 42}'
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({ key: 'value', number: 42 })
  })

  test('extracts JSON from markdown code block', () => {
    const input = `Here is the response:
\`\`\`json
{"clinician_summary": "Patient is stable", "patient_summary": "You are doing well"}
\`\`\`
That's the summary.`
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({
      clinician_summary: 'Patient is stable',
      patient_summary: 'You are doing well',
    })
  })

  test('extracts JSON from markdown code block without json label', () => {
    const input = `\`\`\`
{"key": "value"}
\`\`\``
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({ key: 'value' })
  })

  test('handles nested objects', () => {
    const input = `{"outer": {"inner": {"deep": "value"}}, "array": [1, 2, 3]}`
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({
      outer: { inner: { deep: 'value' } },
      array: [1, 2, 3],
    })
  })

  test('handles strings containing braces', () => {
    const input = `{"message": "Use {brackets} for templates", "code": "if (x) { return y; }"}`
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({
      message: 'Use {brackets} for templates',
      code: 'if (x) { return y; }',
    })
  })

  test('handles escaped quotes in strings', () => {
    const input = `{"quote": "He said \\"hello\\" to me"}`
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({ quote: 'He said "hello" to me' })
  })

  test('extracts first valid JSON when multiple objects present', () => {
    const input = `First object: {"first": true}
Second object: {"second": true}`
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({ first: true })
  })

  test('returns null when no JSON found', () => {
    const input = 'This is just plain text with no JSON'
    const result = extractJsonFromResponse(input)

    expect(result).toBeNull()
  })

  test('returns null for empty string', () => {
    const result = extractJsonFromResponse('')
    expect(result).toBeNull()
  })

  test('returns null for malformed JSON', () => {
    const input = '{key: no quotes around key}'
    const result = extractJsonFromResponse(input)

    expect(result).toBeNull()
  })

  test('handles JSON with anomalies array', () => {
    const input = `\`\`\`json
{
  "clinician_summary": "Summary text",
  "patient_summary": "Patient text",
  "anomalies": [
    {"type": "high", "field": "glucose", "value": 200, "message": "Elevated glucose"}
  ]
}
\`\`\``
    const result = extractJsonFromResponse(input)

    expect(result).toEqual({
      clinician_summary: 'Summary text',
      patient_summary: 'Patient text',
      anomalies: [
        {
          type: 'high',
          field: 'glucose',
          value: 200,
          message: 'Elevated glucose',
        },
      ],
    })
  })
})
