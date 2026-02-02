import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface DashboardStats {
    bestLift: {
        value: number
        exerciseName: string
    } | null
    growthPercentage: number | null
}

export function useDashboardStats() {
    const supabase = createClient()

    return useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async (): Promise<DashboardStats> => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                return { bestLift: null, growthPercentage: null }
            }

            // Get best lift (highest estimated_1rm ever)
            const { data: bestLiftData } = await supabase
                .from("exercise_logs")
                .select(`
                    estimated_1rm,
                    exercise_id,
                    exercises!inner(name),
                    workout_sessions!inner(user_id)
                `)
                .eq("workout_sessions.user_id", user.id)
                .order("estimated_1rm", { ascending: false })
                .limit(1)
                .single()

            // Get 1RM growth (compare current week avg vs 30 days ago avg)
            const now = new Date()
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

            // Current period (last 30 days) - get max 1RM per exercise
            const { data: currentPeriod } = await supabase
                .from("exercise_logs")
                .select(`
                    estimated_1rm,
                    workout_sessions!inner(user_id, date)
                `)
                .eq("workout_sessions.user_id", user.id)
                .gte("workout_sessions.date", thirtyDaysAgo.toISOString())

            // Previous period (30-60 days ago)
            const { data: previousPeriod } = await supabase
                .from("exercise_logs")
                .select(`
                    estimated_1rm,
                    workout_sessions!inner(user_id, date)
                `)
                .eq("workout_sessions.user_id", user.id)
                .gte("workout_sessions.date", sixtyDaysAgo.toISOString())
                .lt("workout_sessions.date", thirtyDaysAgo.toISOString())

            // Calculate growth percentage
            let growthPercentage: number | null = null
            if (currentPeriod?.length && previousPeriod?.length) {
                const currentMax = Math.max(...currentPeriod.map(l => Number(l.estimated_1rm) || 0))
                const previousMax = Math.max(...previousPeriod.map(l => Number(l.estimated_1rm) || 0))

                if (previousMax > 0) {
                    growthPercentage = ((currentMax - previousMax) / previousMax) * 100
                }
            }

            return {
                bestLift: bestLiftData ? {
                    value: Number(bestLiftData.estimated_1rm),
                    exerciseName: (bestLiftData.exercises as unknown as { name: string })?.name || "Esercizio"
                } : null,
                growthPercentage,
            }
        },
    })
}
