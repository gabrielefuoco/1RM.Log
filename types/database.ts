export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type ExerciseType = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other'
export type BodyPart = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body'
export type SetType = 'straight' | 'top_set' | 'backoff' | 'warmup' | 'myorep'

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
    updated_at: string | null
}

export interface Exercise {
    id: string
    name: string
    body_part: BodyPart
    type: ExerciseType
    image_url: string | null
    created_at: string
    user_id: string | null // Null for system exercises
}

export interface Program {
    id: string
    user_id: string
    name: string
    description: string | null
    start_date: string
    end_date: string | null
    is_active: boolean
    created_at: string
}

export interface WorkoutTemplate {
    id: string
    program_id: string
    name: string
    order: number
    created_at: string
}

export interface TemplateExercise {
    id: string
    workout_template_id: string
    exercise_id: string
    target_sets: number
    target_reps_min: number | null
    target_reps_max: number | null
    target_rir: number | null
    type: SetType
    order: number
    // Joins
    exercise?: Exercise
}

export interface WorkoutSession {
    id: string
    user_id: string
    workout_template_id: string | null
    date: string
    duration_seconds: number | null
    notes: string | null
    created_at: string
    // Joins
    workout_template?: WorkoutTemplate
}

export interface ExerciseLog {
    id: string
    session_id: string
    exercise_id: string
    set_number: number
    reps: number
    weight: number
    rir: number | null
    estimated_1rm: number // Calculated
    created_at: string
    // Joins
    exercise?: Exercise
}

// Helper types for Insert/Update might be useful later, 
// matching Supabase's Database['public']['Tables']['exercises']['Insert'] structure if we generated types.
// For now, we manually define what we need.
export type CreateExerciseInput = Omit<Exercise, 'id' | 'created_at' | 'user_id'>
export type CreateProgramInput = Omit<Program, 'id' | 'created_at' | 'user_id'>
