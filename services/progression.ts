import { createClient } from "@/lib/supabase/client"
import { ProgressionSettings } from "@/types/database"

export interface ProgressionResult {
    suggestedWeight: number
    reason: string
    type: 'increase' | 'maintain' | 'decrease'
}

export class ProgressionCalculator {
    static calculate(
        lastWeight: number,
        lastReps: number,
        lastRir: number | null,
        settings: ProgressionSettings,
        targetRepsRange?: { min: number, max: number }
    ): ProgressionResult {
        if (!settings.enable_auto_progression) {
            return { suggestedWeight: lastWeight, reason: "Auto-progression disabled", type: 'maintain' }
        }

        // Logic 1: Failure (RIR < 0 usually means failure/assisted)
        // If user logged negative RIR, it implies they failed the rep target or went to absolute failure.
        // For safety, suggesting maintenance or slight deload is standard.
        // Here we'll stick to maintenance unless it happens repeatedly (which we don't track deeply here yet).
        if (lastRir !== null && lastRir < 0) {
            return {
                suggestedWeight: lastWeight,
                reason: "Failure reached. Maintain weight to consolidate.",
                type: 'maintain'
            }
        }

        // Logic 2: RIR Based Progression
        // If the set was too easy (Last RIR > Target RIR + 1/2 buffer)
        // Example: Target RIR 2. Logged RIR 4. -> Increase.
        if (lastRir !== null && lastRir >= settings.target_rir + 2) {
            const increasedWeight = lastWeight * (1 + settings.progression_rate)
            return {
                suggestedWeight: this.roundToPlate(increasedWeight),
                reason: `RIR ${lastRir} (Easy) -> Increasing load`,
                type: 'increase'
            }
        }

        // Logic 3: Rep Range Overflow
        // If user did more reps than the max target
        if (targetRepsRange && lastReps > targetRepsRange.max) {
            const increasedWeight = lastWeight * (1 + settings.progression_rate)
            return {
                suggestedWeight: this.roundToPlate(increasedWeight),
                reason: `Reps ${lastReps} > Target Max -> Increasing load`,
                type: 'increase'
            }
        }

        // Default: Maintain
        return {
            suggestedWeight: lastWeight,
            reason: "Within target parameters",
            type: 'maintain'
        }
    }

    private static roundToPlate(weight: number): number {
        // Round to nearest 1.25kg or 2.5kg depending on gym. 
        // Defaulting to 2.5kg step for cleanliness, or 1.25 if user wants microloading.
        // Let's assume 2.5kg steps standard (1.25 per side).
        return Math.round(weight / 2.5) * 2.5
    }
}

export async function getProgressionSettings(userId: string): Promise<ProgressionSettings> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('progression_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error || !data) {
        // Return defaults if not found
        return {
            user_id: userId,
            progression_rate: 0.025,
            deload_rate: 0.10,
            target_rir: 2,
            enable_auto_progression: true,
            max_plate_weight: 20,
            intensity_type: 'RIR',
            sex: 'male',
            rounding_increment: 2.5,
            one_rm_update_policy: 'confirm',
            updated_at: new Date().toISOString()
        }
    }

    return data as ProgressionSettings
}
