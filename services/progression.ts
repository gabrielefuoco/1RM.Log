import { createClient } from "@/lib/supabase/client"
import { ProgressionSettings, ProgressionMode, ExerciseLog, TemplateSet, ProgressionDefinition } from "@/types/database"

export interface ProgressionInput {
    mode: ProgressionMode
    config: any // Specific config for the mode
    state: any // Current state (e.g. current_step for sequences)
    history: ExerciseLog[] // Logs from the LAST session for this exercise
    templateSet: TemplateSet // The target definition from the template
    reference1RM?: number
    progressionSettings: ProgressionSettings // Global user settings
}

export interface ProgressionResult {
    targetWeight: number | null // null if percent based or dynamic
    targetRepsMin: number
    targetRepsMax: number
    targetRir: number
    instruction: string
    new_state?: any // If the progression state needs to update (e.g. sequence step)
    type: 'increase' | 'maintain' | 'decrease' | 'reset'
}

export class ProgressionCalculator {
    static calculate(input: ProgressionInput): ProgressionResult {
        const { mode } = input

        switch (mode) {
            case 'auto_double':
                return this.calculateDoubleProgression(input)
            case 'auto_linear':
                return this.calculateLinearProgression(input)
            case 'custom_sequence':
                return this.calculateSequenceProgression(input)
            case 'static':
            default:
                return this.calculateStatic(input)
        }
    }

    private static calculateStatic(input: ProgressionInput): ProgressionResult {
        const { templateSet } = input
        // Static just returns the template defaults
        // If template has percentage, weight is null (calculated by UI)
        return {
            targetWeight: null, // Let UI calculate from % or use previous weight
            targetRepsMin: templateSet.reps_min,
            targetRepsMax: templateSet.reps_max,
            targetRir: templateSet.rir,
            instruction: "Static target",
            type: 'maintain'
        }
    }

    private static calculateDoubleProgression(input: ProgressionInput): ProgressionResult {
        // Double Progression:
        // 1. Hit Max Reps on ALL sets -> Increase Weight, Reset Reps to Min
        // 2. Else -> Keep Weight, Try to add reps
        const { history, templateSet, config, progressionSettings } = input
        const increment = config?.increment || 2.5 // Default 2.5kg

        if (!history || history.length === 0) {
            return this.calculateStatic(input)
        }

        // Check if all sets in history met the max reps
        // We filter for 'work' sets only
        const workSets = history.filter(h => h.set_type === 'work')
        if (workSets.length === 0) return this.calculateStatic(input)

        // If user did MORE sets than expected, we check them all? Usually yes.
        // Condition: Every logged set must have reps >= templateSet.reps_max
        const allSetsHitMax = workSets.every(s => s.reps >= templateSet.reps_max)

        const lastWeight = workSets[0].weight // Assuming straight sets for now

        if (allSetsHitMax) {
            // PROGRESS: Increase Weight, Reset Reps
            const newWeight = this.roundToPlate(lastWeight + increment, progressionSettings.rounding_increment)
            return {
                targetWeight: newWeight,
                targetRepsMin: templateSet.reps_min,
                targetRepsMax: templateSet.reps_max, // UI usually shows range
                targetRir: templateSet.rir,
                instruction: `Double Progression: Max reps hit! +${increment}kg`,
                type: 'increase'
            }
        } else {
            // MAINTAIN: Keep Weight, Aim for more reps
            return {
                targetWeight: lastWeight,
                targetRepsMin: templateSet.reps_min,
                targetRepsMax: templateSet.reps_max,
                targetRir: templateSet.rir,
                instruction: "Double Progression: Build volume (add reps)",
                type: 'maintain'
            }
        }
    }

    private static calculateLinearProgression(input: ProgressionInput): ProgressionResult {
        // Linear Progression (Strength/RIR based):
        // If RIR was too high (too easy) -> Increase Weight
        const { history, templateSet, config, progressionSettings } = input
        const increment = config?.increment || 2.5
        const targetRir = templateSet.rir
        const rirBuffer = 2 // If actual RIR is target + 2 (e.g. Target 2, Actual 4), it's too easy.

        if (!history || history.length === 0) return this.calculateStatic(input)

        const workSets = history.filter(h => h.set_type === 'work')
        if (workSets.length === 0) return this.calculateStatic(input)

        // Check LAST set RIR (usually the hardest/most indicative)
        const lastSet = workSets[workSets.length - 1]
        const lastWeight = lastSet.weight

        if (lastSet.rir !== null && lastSet.rir >= targetRir + rirBuffer) {
            // Too easy
            const newWeight = this.roundToPlate(lastWeight + increment, progressionSettings.rounding_increment)
            return {
                targetWeight: newWeight,
                targetRepsMin: templateSet.reps_min,
                targetRepsMax: templateSet.reps_max,
                targetRir: templateSet.rir,
                instruction: `Linear: Easy RIR (${lastSet.rir}) -> +${increment}kg`,
                type: 'increase'
            }
        }

        // Check if reps exceeded max significantly?
        if (lastSet.reps > templateSet.reps_max + 2) {
            const newWeight = this.roundToPlate(lastWeight + increment, progressionSettings.rounding_increment)
            return {
                targetWeight: newWeight,
                targetRepsMin: templateSet.reps_min,
                targetRepsMax: templateSet.reps_max,
                targetRir: templateSet.rir,
                instruction: `Linear: Overshot reps -> +${increment}kg`,
                type: 'increase'
            }
        }

        return {
            targetWeight: lastWeight, // Keep previous weight
            targetRepsMin: templateSet.reps_min,
            targetRepsMax: templateSet.reps_max,
            targetRir: templateSet.rir,
            instruction: "Linear: Maintain load",
            type: 'maintain'
        }
    }

    private static calculateSequenceProgression(input: ProgressionInput): ProgressionResult {
        // Custom Sequence (e.g. 5/3/1, Waves)
        // State holds 'current_step_index'
        // We return the target for the current step
        // BUT: We need to know if we should ADVANCE the step.
        // Usually, the state is advanced AFTER the session is marked complete.
        // So here we simply read the current state index and return that config.

        const { config, state } = input
        const steps = config?.steps || []

        if (steps.length === 0) return this.calculateStatic(input)

        let stepIndex = state?.current_step || 0
        if (stepIndex >= steps.length) stepIndex = 0 // Wrap around safety

        const step = steps[stepIndex]

        // If step defines percentage, we might calculate concrete weight if 1RM is provided
        let targetWeight = null
        if (step.percent && input.reference1RM) {
            targetWeight = this.roundToPlate(input.reference1RM * (step.percent / 100), 2.5)
        }

        return {
            targetWeight: targetWeight,
            targetRepsMin: step.reps, // Sequences usually have fixed reps
            targetRepsMax: step.reps,
            targetRir: step.rir ?? input.templateSet.rir,
            instruction: `Phase ${stepIndex + 1}: ${step.name || 'Sequence Step'}`,
            type: 'maintain', // Sequence just moves along, doesn't inherently "increase" logic
            new_state: { current_step: stepIndex } // Just confirm current step
        }
    }

    private static roundToPlate(weight: number, increment: number = 2.5): number {
        return Math.round(weight / increment) * increment
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
