import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

export interface WeeklyProgressData {
    days: { day: number; status: "completed" | "pending" }[]
    completedCount: number
    totalDays: number
    percentage: number
}

export function useWeeklyProgress() {
    const supabase = createClient()

    return useQuery({
        queryKey: ["weekly-progress"],
        queryFn: async (): Promise<WeeklyProgressData> => {
            const { data: { user } } = await supabase.auth.getUser()

            const defaultData: WeeklyProgressData = {
                days: [1, 2, 3, 4, 5, 6, 7].map(day => ({ day, status: "pending" as const })),
                completedCount: 0,
                totalDays: 7,
                percentage: 0,
            }

            if (!user) return defaultData

            const now = new Date()
            const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

            // Get sessions this week
            const { data: sessions, error } = await supabase
                .from("workout_sessions")
                .select("date")
                .eq("user_id", user.id)
                .gte("date", weekStart.toISOString())
                .lte("date", weekEnd.toISOString())

            if (error) {
                console.error("Error fetching weekly sessions:", error)
                return defaultData
            }

            const sessionDates = sessions?.map(s => new Date(s.date)) || []
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

            const days = weekDays.map((date, index) => ({
                day: index + 1,
                status: sessionDates.some(sd => isSameDay(sd, date)) ? "completed" as const : "pending" as const
            }))

            const completedCount = days.filter(d => d.status === "completed").length
            const percentage = Math.round((completedCount / 7) * 100)

            return {
                days,
                completedCount,
                totalDays: 7,
                percentage,
            }
        },
    })
}
