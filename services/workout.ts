import { createClient } from "@/lib/supabase/client"
import { WorkoutSession, ExerciseLog } from "@/types/database"
import { calculate1RM } from "@/utils/formulas"

export async function startSession(templateId: string | null): Promise<string> {
    const supabase = createClient()

    // Create a new session row
    const { data, error } = await supabase
        .from('workout_sessions')
        .insert([{
            workout_template_id: templateId,
            date: new Date().toISOString(),
            // duration defaults to null (active)
        }])
        .select('id')
        .single()

    if (error) throw error
    return data.id
}

export async function logSet(
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    rir: number | null
) {
    const supabase = createClient()

    const estimated1rm = calculate1RM(weight, reps)

    // Check if exists
    const { data: existing } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('session_id', sessionId)
        .eq('exercise_id', exerciseId)
        .eq('set_number', setNumber)
        .single()

    let data, error;

    if (existing) {
        // Update
        const res = await supabase
            .from('exercise_logs')
            .update({
                reps,
                weight,
                rir
            })
            .eq('id', existing.id)
            .select()
            .single()
        data = res.data;
        error = res.error;
    } else {
        // Insert
        const res = await supabase
            .from('exercise_logs')
            .insert([{
                session_id: sessionId,
                exercise_id: exerciseId,
                set_number: setNumber,
                reps,
                weight,
                rir,
            }])
            .select()
            .single()
        data = res.data;
        error = res.error;
    }

    if (error) throw error
    return data
}

export async function finishSession(sessionId: string, durationSeconds: number, notes?: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('workout_sessions')
        .update({
            duration_seconds: durationSeconds,
            notes: notes
        })
        .eq('id', sessionId)

    if (error) throw error
}

export async function getPreviousLogs(exerciseId: string, limit: number = 5) {
    const supabase = createClient()

    // Get last logs for this exercise from ANY session
    const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
            *,
            workout_sessions (
                date
            )
        `)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching prev logs", error)
        return []
    }

    return data
}

/**
 * Get the full workout template with exercises for the runner
 */
export async function getWorkoutRunnerData(templateId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('workout_templates')
        .select(`
            *,
            template_exercises (
                *,
                exercise:exercises(*)
            )
        `)
        .eq('id', templateId)
        .single()

    if (error) throw error

    // Sort exercises by order
    if (data && data.template_exercises) {
        data.template_exercises.sort((a: any, b: any) => a.order - b.order)
    }

    return data
}

/**
 * Get all data needed to run an active session.
 * - Session details
 * - Linked Template (if any)
 * - Existing Logs (to rebuild state)
 */
export async function getSessionRunnerData(sessionId: string) {
    const supabase = createClient()

    // 1. Get Session & Template info (lightweight)
    const { data: session, error: sessError } = await supabase
        .from('workout_sessions')
        .select(`
            *,
            workout_template:workout_templates (
                *,
                template_exercises (
                    *,
                    exercise:exercises(*)
                )
            )
        `)
        .eq('id', sessionId)
        .single()

    if (sessError) throw sessError

    // 2. Get Logs for this session (to see what's done)
    const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
            *,
            exercise:exercises(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (logsError) throw logsError

    // Sort template exercises if they exist
    if (session.workout_template?.template_exercises) {
        session.workout_template.template_exercises.sort((a: any, b: any) => a.order - b.order)
    }

    return {
        session,
        template: session.workout_template,
        logs: logs || []
    }
}

// === HISTORY / SESSION MANAGEMENT ===

export async function getSessionWithLogs(sessionId: string) {
    const supabase = createClient()

    // 1. Get Session Info
    const { data: session, error: sessError } = await supabase
        .from('workout_sessions')
        .select(`
            *,
            workout_template:workout_templates(name)
        `)
        .eq('id', sessionId)
        .single()

    if (sessError) throw sessError

    // 2. Get Logs
    const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
            *,
            exercise:exercises(name, body_part)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (logsError) throw logsError

    return { session, logs }
}

export async function updateExerciseLog(logId: string, updates: Partial<ExerciseLog>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('exercise_logs')
        .update(updates)
        .eq('id', logId)
        .select()
        .maybeSingle()

    if (error) throw error
    return data
}

export async function deleteExerciseLog(logId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('exercise_logs').delete().eq('id', logId)
    if (error) throw error
}

export async function deleteSession(sessionId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId)
    if (error) throw error
}

export async function updateSessionNotes(sessionId: string, notes: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('workout_sessions')
        .update({ notes })
        .eq('id', sessionId)
    if (error) throw error
}
