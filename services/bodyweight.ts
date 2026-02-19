import { createClient } from "@/lib/supabase/client"
import { BodyweightLog, CreateBodyweightInput } from "@/types/database"

export async function getBodyweightHistory(limit?: number) {
    const supabase = createClient()

    let query = supabase
        .from('bodyweight_logs')
        .select('*')
        .order('date', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching bodyweight history:', error)
        return []
    }

    return data as BodyweightLog[]
}

export async function addBodyweightLog(input: CreateBodyweightInput) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('bodyweight_logs')
        .insert([input])
        .select()
        .single()

    if (error) throw error
    return data as BodyweightLog
}

export async function deleteBodyweightLog(id: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('bodyweight_logs')
        .delete()
        .eq('id', id)

    if (error) throw error
}
