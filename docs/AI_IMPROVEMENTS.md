# AI Ethics Stack Implementation

## Overview

This document describes the AI-powered features implemented to maximize Principled Innovation (PI) scoring at ScaleU Hackathon 2026. Evexia integrates AI throughout the patient and provider experience to enhance health equity, enable predictive care, and ensure informed consent.

## Features Implemented

### 1. Health Equity Scanner

**What It Does:** Compares patient health metrics against CDC population averages and identifies health disparities.

**PI Principles:** 1 (Understanding Context), 2 (Reflecting Throughout), 5 (Imagining Possibilities)

**How It Works:**
- AI analyzes patient's BMI, A1C, blood pressure against demographic averages
- Flags metrics >15% worse than population average
- Frames findings positively as "opportunities for early intervention"
- Provides actionable suggestions for each identified gap

**Data Structure:**
```typescript
interface EquityConcern {
  metric: string           // e.g., "A1C", "BMI", "LDL Cholesterol"
  patientValue: string     // Current patient value
  populationAverage: string // CDC population average
  gapPercentage: number    // Percentage deviation from average
  suggestedAction: string  // Actionable recommendation
}
```

**Unintended Consequences & Mitigations:**
| Risk | Mitigation |
|------|------------|
| Algorithmic redlining | Compare against medical averages, not socioeconomic proxies |
| Oversimplification | Caveat: "Social factors require deeper provider discussion" |
| Patient anxiety | Frame as opportunity, not problem |
| Data bias | Use CDC national averages, acknowledge limitations |

### 2. Predictive Risk Scoring

**What It Does:** Analyzes temporal health trends and generates forward-looking risk predictions with actionable recommendations.

**PI Principles:** 4 (Inquiring Deeply), 5 (Imagining Possibilities), 6 (Iterating by Action)

**How It Works:**
- Tracks metric trajectories over available time period
- Uses CDC clinical progression models for probability estimation
- Provides specific, actionable steps ranked by impact
- Cites evidence basis for transparency
- Shows trend direction (improving/stable/worsening)

**Data Structure:**
```typescript
interface Prediction {
  condition: string              // e.g., "Type 2 Diabetes"
  currentRisk: 'low' | 'moderate' | 'high'
  probability: number            // 0.0 to 1.0
  timeframe: string              // e.g., "24 months"
  trendDirection: 'improving' | 'stable' | 'worsening'
  actionableSteps: string[]      // Specific actions patient can take
  evidenceBasis: string          // Citation of methodology
}
```

**Unintended Consequences & Mitigations:**
| Risk | Mitigation |
|------|------------|
| False confidence | Caveat: "Predictions are estimates, not diagnoses" |
| Anxiety from high scores | Lead with actions, frame as "preventable" |
| Over-reliance on AI | Every prediction includes provider consultation CTA |
| Self-fulfilling prophecy | Emphasize modifiable risk factors |

### 3. Informed Consent Explainer

**What It Does:** Before sharing data, AI explains what providers can INFER from the combination of shared records.

**PI Principles:** 1 (Understanding Context), 3 (Connecting to Stakeholders), 7 (Communicating Throughout)

**How It Works:**
- Patient selects which record types to share
- AI analyzes what conditions can be inferred from the combination
- Highlights sensitive inferences (mental health, reproductive, substance use)
- Recommends minimum data for stated purpose
- Provides clear explanations in plain language

**Unintended Consequences & Mitigations:**
| Risk | Mitigation |
|------|------------|
| Over-disclosure anxiety | Default to recommended preset |
| Incomplete data -> worse care | Warn: "Limiting data may affect care quality" |
| Slows emergency sharing | Skip explainer for emergency access tokens |
| Information overload | Collapsible sections, progressive disclosure |

## Principled Innovation Matrix

| PI Principle | Features | Implementation |
|--------------|----------|----------------|
| 1. Understanding Context | Equity, Consent | Identifies affected parties, knowledge gaps |
| 2. Reflecting Throughout | Equity, Risk | Built-in pause to check assumptions |
| 3. Connecting to Stakeholders | Consent | Bridges patient-provider information asymmetry |
| 4. Inquiring Deeply | Risk | Uses research-backed progression models |
| 5. Imagining Possibilities | Equity, Risk | Shows multiple futures, creative solutions |
| 6. Iterating by Action | Risk | Enables concrete patient actions |
| 7. Communicating Throughout | Consent | Transparent about data consequences |

## Technical Implementation

### OpenRouter Integration
- Uses throughput sorting for faster responses: `provider: { sort: 'throughput' }`
- Model: `openai/gpt-4o-mini` by default (configurable via `AI_MODEL` env var)
- Fallback to mock data when AI is disabled (`AI_ENABLED=false`)

### Database Schema
Extended summaries table to include:
- `equity_concerns` JSONB array - Health equity analysis results
- `predictions` JSONB array - Predictive risk assessments

Migration: `0003_add_summary_ai_features.sql`

### API Endpoints
- `POST /api/patient/[id]/summary` - Generates/regenerates AI summary with equity + predictions
- `POST /api/patient/[id]/consent-explainer` - Analyzes what can be inferred from shared data

### Environment Variables
```bash
# AI Configuration
AI_ENABLED=true                    # Enable/disable AI features
AI_MODEL=openai/gpt-4o-mini       # Model to use for summaries
OPENROUTER_API_KEY=your_key       # OpenRouter API key
```

## Demo Script for Judges

1. **Open patient dashboard** -> Show existing AI summary
2. **Scroll to Health Equity** -> "Notice how AI flags that my A1C is higher than average - this catches health disparities"
3. **Scroll to Health Trajectory** -> "AI predicts diabetes risk with actionable steps to change outcome"
4. **Navigate to Share Tokens** -> Click "Create Token"
5. **Consent Modal** -> "AI explains not just what I'm sharing, but what the provider can INFER"
6. **Show this document** -> "We explicitly applied all 7 PI principles"

## Files Modified

### Backend
- `lib/db/schema.ts` - Added equity_concerns and predictions columns
- `lib/ai/prompts.ts` - Added equity + prediction analysis instructions
- `lib/ai/summary.ts` - Handle new response fields, throughput optimization
- `lib/ai/mock.ts` - Demo data for offline testing
- `lib/supabase/queries/summaries.ts` - Extended types
- `app/api/patient/[id]/consent-explainer/route.ts` - NEW

### Frontend
- `components/patient/health-summary.tsx` - Added equity insights card
- `components/patient/health-trajectory.tsx` - NEW: Risk visualization
- `components/patient/consent-explainer-modal.tsx` - NEW: Consent flow
- `components/patient/token-manager.tsx` - Integrated consent modal
- `app/patient/page.tsx` - Added trajectory section

### Data
- `scripts/seed.ts` - Demo equity_concerns and predictions
- `drizzle/0003_add_summary_ai_features.sql` - Migration for new columns

## Ethical Considerations

### Data Privacy
- All AI processing happens server-side
- Patient data is never sent to third-party AI providers without consent
- Summaries are stored locally, can be deleted on request

### Algorithmic Transparency
- Every prediction cites its evidence basis
- Patients can see exactly what data contributed to conclusions
- No black-box decision making

### Health Equity Focus
- Explicitly designed to identify and address health disparities
- Compares against population averages, not socioeconomic proxies
- Frames disparities as opportunities for intervention, not deficits

### Patient Autonomy
- Patients control what data is shared
- Clear explanations of inference risks
- Emergency access respects pre-set patient preferences

## Future Enhancements

1. **Multi-language support** - Translate summaries to patient's preferred language
2. **Provider-side predictions** - Help providers prioritize care
3. **Longitudinal tracking** - Show how risk scores change over time
4. **Social determinants integration** - Consider SDOH in recommendations
5. **Care gap detection** - Identify missed preventive care opportunities
