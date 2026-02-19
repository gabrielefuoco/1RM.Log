import { createClient } from "@/lib/supabase/client"
import { UserOneRm } from "@/types/database"

export async function getUserOneRm(exerciseId: string): Promise<UserOneRm | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('user_one_rms')
        .select('*')
        .eq('exercise_id', exerciseId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user 1rm:', error)
    }

    return data
}

export async function getSessionOneRms(exerciseIds: string[]): Promise<UserOneRm[]> {
    if (exerciseIds.length === 0) return []

    const supabase = createClient()
    const { data, error } = await supabase
        .from('user_one_rms')
        .select('*')
        .in('exercise_id', exerciseIds)

    if (error) {
        console.error('Error fetching session one rms:', error)
        return []
    }

    return data || []
}

export async function upsertUserOneRm(exerciseId: string, oneRm: number, type: 'manual' | 'training_max' = 'manual') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
        .from('user_one_rms')
        .upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            one_rm: oneRm,
            type
        }, { onConflict: 'user_id, exercise_id' })

    if (error) throw error
}

export async function deleteUserOneRm(exerciseId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('user_one_rms')
        .delete()
        .eq('exercise_id', exerciseId)

    if (error) throw error
}
