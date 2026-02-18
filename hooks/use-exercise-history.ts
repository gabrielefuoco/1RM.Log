import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useExerciseHistory(exerciseId: string | undefined) {
    const supabase = createClient()

    return useQuery({
        queryKey: ["exercise-history", exerciseId],
        queryFn: async () => {
            if (!exerciseId) return []

            const { data, error } = await supabase
                .from("exercise_logs")
                .select("estimated_1rm, created_at")
                .eq("exercise_id", exerciseId)
                .order("created_at", { ascending: true })
                .limit(20) // Limit to last 20 sessions for sparkline

            if (error) {
                console.error("Error fetching exercise history:", error)
                return []
            }

            // Map to simple array of numbers for sparkline
            return data.map(log => log.estimated_1rm)
        },
        enabled: !!exerciseId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
