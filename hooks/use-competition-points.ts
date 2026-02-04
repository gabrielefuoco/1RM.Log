import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useBodyweight } from "./use-bodyweight"
import { getProgressionSettings } from "@/services/progression"
import { calculateDOTS, calculateIPFGL, calculateWilks } from "@/utils/formulas"

export function useCompetitionPoints() {
    const supabase = createClient()
    const { latest: bodyweightEntry } = useBodyweight()

    return useQuery({
        queryKey: ["competition-points"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null

            const settings = await getProgressionSettings(user.id)
            const bodyweight = bodyweightEntry?.weight || 0

            if (bodyweight === 0) return null

            // Fetch best 1RM for SBD
            // We search for exercises containing specific keywords
            const { data: logs } = await supabase
                .from("exercise_logs")
                .select(`
                    estimated_1rm,
                    exercises!inner(name)
                `)
                .eq("workout_sessions.user_id", user.id)

            if (!logs) return null

            const findBest = (keywords: string[]) => {
                const matches = logs.filter(log =>
                    keywords.some(k => (log.exercises as any).name.toLowerCase().includes(k))
                )
                if (matches.length === 0) return 0
                return Math.max(...matches.map(m => Number(m.estimated_1rm) || 0))
            }

            const squat = findBest(["squat", "accosciata"])
            const bench = findBest(["panca", "bench", "chest press"])
            const deadlift = findBest(["stacco", "deadlift"])

            const total = squat + bench + deadlift

            if (total === 0) return { squat, bench, deadlift, total, dots: 0, ipf: 0, wilks: 0 }

            const dots = calculateDOTS(total, bodyweight, settings.sex)
            const ipf = calculateIPFGL(total, bodyweight, settings.sex)
            const wilks = calculateWilks(total, bodyweight, settings.sex)

            return {
                squat,
                bench,
                deadlift,
                total,
                dots,
                ipf,
                wilks,
                sex: settings.sex,
                bodyweight
            }
        }
    })
}
