import { createClient } from "@/lib/supabase/client"
import { Program, CreateProgramInput, WorkoutTemplate } from "@/types/database"

export async function getActiveProgram() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .single()

    if (error) return null // No active program or error

    return data as Program
}

export async function getProgramTemplates(programId: string) {
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
        .eq('program_id', programId)
        .order('order', { ascending: true })

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }

    return data as (WorkoutTemplate & { template_exercises: any[] })[]
}

export async function createProgram(program: CreateProgramInput) {
    const supabase = createClient()

    // First, set all other programs to inactive if this one is active
    if (program.is_active) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('programs')
                .update({ is_active: false })
                .eq('user_id', user.id)
                .eq('is_active', true) // Only update active ones
        }
    }

    const { data, error } = await supabase
        .from('programs')
        .insert([program])
        .select()
        .single()

    if (error) throw error
    return data as Program
}

export interface CreateWorkoutTemplateInput {
    program_id: string
    name: string
    order: number
}

export async function createWorkoutTemplate(template: CreateWorkoutTemplateInput) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('workout_templates')
        .insert([template])
        .select()
        .single()

    if (error) throw error
    return data as WorkoutTemplate
}

// === CRUD Operations ===

export interface UpdateProgramInput {
    name?: string
    description?: string | null
    start_date?: string
    end_date?: string | null
    is_active?: boolean
}

export async function updateProgram(id: string, updates: UpdateProgramInput) {
    const supabase = createClient()

    // If setting to active, deactivate others first
    if (updates.is_active) {
        await supabase
            .from('programs')
            .update({ is_active: false })
            .neq('id', 'placeholder')
    }

    const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) throw error
    return data as Program
}

export async function deleteProgram(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function toggleProgramActive(id: string) {
    const supabase = createClient()

    // 1. Deactivate all (for this user)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    await supabase
        .from('programs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)

    // 2. Activate target
    const { data, error } = await supabase
        .from('programs')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) throw error
    return data as Program
}

// === Template Operations ===

export async function updateWorkoutTemplate(id: string, name: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('workout_templates')
        .update({ name })
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) throw error
    return data as WorkoutTemplate
}

export async function deleteWorkoutTemplate(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id)

    if (error) throw error
}
