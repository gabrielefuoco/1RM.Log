import { createClient } from "@/lib/supabase/client"
import { Exercise, CreateExerciseInput, BodyPart, ExerciseType } from "@/types/database"

export async function getExercises(bodyPart?: BodyPart) {
    const supabase = createClient()
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('CRITICAL: Supabase environment variables are missing!', {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        })
    }

    let query = supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })

    if (bodyPart) {
        query = query.eq('body_part', bodyPart)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching exercises FULL OBJECT:', JSON.stringify(error, null, 2))
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        return []
    }

    return data as Exercise[]
}

export async function createExercise(exercise: CreateExerciseInput) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('exercises')
        .insert([exercise])
        .select()
        .single()

    if (error) throw error
    return data as Exercise
}

export async function searchExercises(searchQuery: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${searchQuery}%`)
        .limit(10)

    if (error) {
        console.error('Error searching exercises:', error)
        return []
    }

    return data as Exercise[]
}

export interface AddTemplateExerciseInput {
    workout_template_id: string
    exercise_id: string
    target_sets: number
    target_reps_min: number | null
    target_reps_max: number | null
    target_rir: number | null
    order: number
}

export async function addTemplateExercise(input: AddTemplateExerciseInput) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('template_exercises')
        .insert([input])
        .select()
        .single()

    if (error) throw error
    return data
}

// === CRUD Operations ===

export interface UpdateExerciseInput {
    name?: string
    body_part?: BodyPart
    type?: ExerciseType
}

export async function updateExercise(id: string, updates: UpdateExerciseInput) {
    const supabase = createClient()

    // 1. Update with count check
    const { error: updateError, count } = await supabase
        .from('exercises')
        .update(updates, { count: 'exact' })
        .eq('id', id)

    if (updateError) throw updateError
    if (count === 0) throw new Error("Non hai i permessi per modificare questo esercizio.")

    // 2. Select updated row
    const { data, error: fetchError } = await supabase
        .from('exercises')
        .select()
        .eq('id', id)
        .single()

    if (fetchError) throw fetchError
    return data as Exercise
}

export async function deleteExercise(id: string) {
    const supabase = createClient()

    const { error, count } = await supabase
        .from('exercises')
        .delete({ count: 'exact' })
        .eq('id', id)

    if (error) throw error
    if (count === 0) throw new Error("Non hai i permessi per eliminare questo esercizio.")
}

// === Template Exercise Operations ===

export async function removeTemplateExercise(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('template_exercises')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export interface UpdateTemplateExerciseInput {
    target_sets?: number
    target_reps_min?: number | null
    target_reps_max?: number | null
    target_rir?: number | null
}

export async function updateTemplateExercise(id: string, updates: UpdateTemplateExerciseInput) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('template_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) throw error
    return data
}
