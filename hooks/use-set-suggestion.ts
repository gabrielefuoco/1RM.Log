import { ExerciseLog, ProgressionSettings, TemplateSet } from "@/types/database"
import { ProgressionResult, ProgressionCalculator } from "@/services/progression"
import { calculatePercentFromRepsAndRir } from "@/utils/formulas"

interface SetSuggestionParams {
    previousLog?: ExerciseLog
    targetRir: number
    targetRepsMin?: number
    targetRepsMax?: number
    targetPercentage?: number
    userBest1RM?: number
    settings: ProgressionSettings | null
    intensityMultiplier?: number
    isDeload?: boolean
    templateSet?: TemplateSet
    previousSetWeight?: number
    progressionTarget?: ProgressionResult
}

/**
 * Calculates the suggested weight for a given set based on multiple priority layers:
 * 1. Back-off sets (from previous set weight)
 * 2. Percentage-based (from 1RM)
 * 3. RPE/RIR derived percentage
 * 4. Progression engine fallback
 * 5. Progression target prop (highest priority override)
 */
export function calculateSetSuggestion({
    previousLog,
    targetRir,
    targetRepsMin,
    targetRepsMax,
    targetPercentage,
    userBest1RM,
    settings,
    intensityMultiplier = 1.0,
    isDeload = false,
    templateSet,
    previousSetWeight,
    progressionTarget,
}: SetSuggestionParams): string {
    const rounding = settings?.rounding_increment || 2.5
    let suggestedWeight = 0

    // Priority 0: Back-off Set
    if (templateSet?.is_backoff && templateSet?.backoff_percent && previousSetWeight && previousSetWeight > 0) {
        suggestedWeight = previousSetWeight * (1 - templateSet.backoff_percent / 100)
    }
    // Priority 1: Percentage Target (Explicit or RPE-derived)
    else if (userBest1RM && userBest1RM > 0) {
        let percent = targetPercentage

        // If no explicit %, try to calculate from RPE/RIR + Reps
        if (!percent && targetRir !== undefined && (targetRepsMin || targetRepsMax)) {
            const pct = calculatePercentFromRepsAndRir(targetRepsMin || targetRepsMax || 5, targetRir)
            percent = pct
        }

        if (percent) {
            suggestedWeight = userBest1RM * (percent / 100) * intensityMultiplier
        }
    }

    // Priority 2: Progression Calculator fallback
    if (suggestedWeight === 0 && previousLog && settings) {
        const result = ProgressionCalculator.calculate({
            mode: 'static',
            config: {},
            state: {},
            history: [previousLog],
            templateSet: templateSet || { reps_min: 0, reps_max: 0, rir: 0, type: 'work' } as any,
            progressionSettings: settings
        })
        suggestedWeight = result.targetWeight ? result.targetWeight * intensityMultiplier : 0
    }

    // Priority 3: Progression Target Prop (The Real Progression Engine)
    if (progressionTarget && progressionTarget.targetWeight) {
        suggestedWeight = progressionTarget.targetWeight * intensityMultiplier
    }

    if (suggestedWeight === 0) return ""

    // Apply Deload
    if (isDeload) {
        suggestedWeight = suggestedWeight * (1 - (settings?.deload_rate || 0.10))
    }

    // Apply Rounding
    return (Math.round(suggestedWeight / rounding) * rounding).toFixed(rounding < 1 ? 1 : 1)
}
