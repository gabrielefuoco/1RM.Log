export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type ExerciseType = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other'
export type BodyPart =
    | 'Chest'
    | 'Back (Lats)'
    | 'Back (Upper/Traps)'
    | 'Lower Back'
    | 'Shoulders (Front)'
    | 'Shoulders (Side)'
    | 'Shoulders (Rear)'
    | 'Biceps'
    | 'Triceps'
    | 'Forearms'
    | 'Quadriceps'
    | 'Hamstrings'
    | 'Glutes'
    | 'Calves'
    | 'Core'
    | 'Functional'

export type SetType = 'straight' | 'top_set' | 'backoff' | 'warmup' | 'myorep'
export type IntensityType = 'RIR' | 'RPE'
export type UserSex = 'male' | 'female'

export interface TemplateSet {
    reps_min: number
    reps_max: number
    rir: number
    percentage?: number
    weight_absolute?: number
    weight_mode?: 'percent' | 'absolute' | 'rpe'
    is_backoff?: boolean
    backoff_percent?: number
    type: SetType
}

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
    body_parts: BodyPart[]
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
    sets_data: TemplateSet[]
    order: number
    // Progression
    progression_mode?: ProgressionMode
    progression_config?: any // Json
    progression_state?: any // Json
    // Joins
    exercise?: Exercise
}

export interface WorkoutSession {
    id: string
    user_id: string
    workout_template_id: string | null
    date: string
    duration_seconds: number | null
    session_rpe: number | null
    notes: string | null
    created_at: string
    // Joins
    workout_template?: WorkoutTemplate
}

export interface ExerciseLog {
    id: string
    session_id: string
    exercise_id: string
    set_type: 'work' | 'warmup' | 'drop' | 'failure'
    set_number: number
    reps: number
    weight: number
    rir: number | null
    estimated_1rm: number // Calculated
    bodyweight_at_time?: number | null
    created_at: string
    // Joins
    exercise?: Exercise
}

export interface BodyweightLog {
    id: string
    user_id: string
    weight: number
    date: string
    created_at: string
}

export interface ProgressionSettings {
    user_id: string
    progression_rate: number
    deload_rate: number
    target_rir: number
    max_plate_weight: number
    enable_auto_progression: boolean
    intensity_type: IntensityType
    sex: UserSex
    rounding_increment: number
    one_rm_update_policy: 'manual' | 'confirm' | 'auto'
    updated_at: string
}

export type ProgressionType = 'double' | 'linear' | 'percentage_sequence' | 'rir_match'
export type ProgressionMode = 'static' | 'auto_double' | 'auto_linear' | 'custom_sequence'

export interface ProgressionDefinition {
    id: string
    user_id: string
    name: string
    description: string | null
    type: ProgressionType
    config: any // Json
    created_at: string
}

export interface UserOneRm {
    id: string
    user_id: string
    exercise_id: string
    one_rm: number
    type: 'manual' | 'training_max'
    updated_at: string
}

export type CreateExerciseInput = Omit<Exercise, 'id' | 'created_at' | 'user_id'>
export type CreateProgramInput = Omit<Program, 'id' | 'created_at' | 'user_id'>
export type CreateBodyweightInput = Omit<BodyweightLog, 'id' | 'user_id' | 'created_at' | 'date'> & { date?: string }
