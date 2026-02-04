'use server'

import { createClient } from "@/lib/supabase/server"

export async function getKPIs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Estimated 1RM (Best ever across all exercises? Or average of top 3? Let's do Max Single Lift for now)
    const { data: bestLift } = await supabase
        .from('exercise_logs')
        .select('estimated_1rm')
        .order('estimated_1rm', { ascending: false })
        .limit(1)
        .single()

    // 2. Total Volume (All time? Or last 30 days? Let's do last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: volumeData } = await supabase
        .from('exercise_logs')
        .select('weight, reps, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())

    const totalVolume = volumeData?.reduce((acc, log) => acc + (Number(log.weight) * Number(log.reps)), 0) || 0

    // 3. Frequency (Sessions per week, avg last 4 weeks)
    const { count: sessionCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('date', thirtyDaysAgo.toISOString())

    const weeklyFrequency = sessionCount ? (sessionCount / 4).toFixed(1) : "0.0"

    // 4. DOTS Score (Requires bodyweight. For now, placeholder or latest bodyweight)
    // We need latest bodyweight and best lift.
    // Simplifying for MVP: just return raw stats.

    return {
        bestLift: bestLift?.estimated_1rm?.toFixed(1) || "0",
        volume: (totalVolume / 1000).toFixed(1) + "k", // displayed in k
        frequency: weeklyFrequency,
        dots: "N/A" // Complex calc, leave for later
    }
}

export async function get1RMTrend(exerciseId: string, periodDays: number = 90) {
    const supabase = await createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const { data } = await supabase
        .from('exercise_logs')
        .select(`
            estimated_1rm,
            created_at,
            workout_sessions!inner(date)
        `)
        .eq('exercise_id', exerciseId)
        .gte('workout_sessions.date', startDate.toISOString())
        .order('created_at', { ascending: true })

    // Aggregate by day (best 1RM per day)
    if (!data) return []

    return data.map(log => ({
        date: log.workout_sessions?.date || log.created_at,
        value: Number(log.estimated_1rm)
    }))
}

export async function getVolumeStats() {
    // Weekly volume for last 12 weeks
    const supabase = await createClient()
    const { data } = await supabase
        .rpc('get_weekly_volume') // Check if RPC exists, if not do in JS

    // Fallback: Fetch all logs last 90 days and aggregate in JS
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select('weight, reps, workout_sessions!inner(date)')
        .gte('workout_sessions.date', ninetyDaysAgo.toISOString())
        .order('workout_sessions(date)', { ascending: true })

    if (!logs) return []

    // Group by week
    const volumeByWeek: Record<string, number> = {}
    logs.forEach(log => {
        // @ts-ignore
        const date = new Date(log.workout_sessions.date)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0]
        const vol = Number(log.weight) * Number(log.reps)
        volumeByWeek[weekStart] = (volumeByWeek[weekStart] || 0) + vol
    })

    return Object.entries(volumeByWeek).map(([date, value]) => ({ date, value }))
}

export async function getPerformanceFeed() {
    const supabase = await createClient()

    // Fetch all logs ordered by date
    // We need to find "improvements".
    // Strategy: Fetch all logs. Group by Exercise. Iterate chronological.
    // If estimated_1rm > current_max, push to feed.

    const { data: logs } = await supabase
        .from('exercise_logs')
        .select(`
            id,
            estimated_1rm,
            weight,
            reps,
            created_at,
            exercises (name),
            workout_sessions!inner(date)
        `)
        .order('workout_sessions(date)', { ascending: true })

    if (!logs) return []

    const feed: any[] = []
    const exerciseMaxes: Record<string, number> = {}

    logs.forEach(log => {
        // @ts-ignore
        const exerciseName = log.exercises?.name || 'Unknown'
        const current1RM = Number(log.estimated_1rm)
        const previousMax = exerciseMaxes[exerciseName] || 0

        if (current1RM > previousMax) {
            // It's a PR / Improvement
            const improvement = previousMax > 0 ? ((current1RM - previousMax) / previousMax) * 100 : 100 // 100% if new

            // Only add significant PRs (e.g. not first log ever unless we want "First Log")
            // Let's exclude "First Log" (improvement = 100) to focus on "Improvements"
            if (previousMax > 0) {
                feed.push({
                    id: log.id,
                    exercise: exerciseName,
                    date: log.workout_sessions?.date,
                    value: current1RM, // 1RM
                    raw: `${log.weight}kg x ${log.reps}`,
                    improvement: improvement.toFixed(1), // %
                    unixTime: new Date(log.workout_sessions?.date).getTime()
                })
            }

            exerciseMaxes[exerciseName] = current1RM
        }
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoTime = thirtyDaysAgo.getTime()

    // Sort by Date DESC, then Improvement % DESC
    return feed
        .filter(item => item.unixTime >= thirtyDaysAgoTime)
        .sort((a, b) => {
            if (b.unixTime !== a.unixTime) return b.unixTime - a.unixTime
            return Number(b.improvement) - Number(a.improvement)
        })
}

export async function getExercisesList() {
    const supabase = await createClient()
    const { data } = await supabase.from('exercises').select('id, name').order('name')
    return data || []
}
