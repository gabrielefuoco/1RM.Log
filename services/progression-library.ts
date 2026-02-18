import { createClient } from "@/lib/supabase/client"
import { ProgressionDefinition, ProgressionType } from "@/types/database"

export async function getProgressions() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('progression_definitions')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching progressions:', error)
        return []
    }

    return data as ProgressionDefinition[]
}

export type CreateProgressionInput = Omit<ProgressionDefinition, 'id' | 'created_at' | 'user_id'>

export async function createProgression(input: CreateProgressionInput) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase
        .from('progression_definitions')
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single()

    if (error) throw error
    return data as ProgressionDefinition
}

export async function updateProgression(id: string, updates: Partial<CreateProgressionInput>) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('progression_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as ProgressionDefinition
}

export async function deleteProgression(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('progression_definitions')
        .delete()
        .eq('id', id)

    if (error) throw error
}
