"use client"

import { WorkoutSession } from "@/types/database"
import { UniversalListCard } from "@/components/ui/universal-list-card"
import { Clock, Calendar as CalendarIcon, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { it, enUS } from "date-fns/locale"
import { useRouter } from "@/i18n/routing"
import { useTranslations, useLocale } from "next-intl"

interface HistoryListProps {
    sessions: (WorkoutSession & { workout_template: { name: string } | null })[]
}

export function HistoryList({ sessions }: HistoryListProps) {
    const t = useTranslations("History")
    const locale = useLocale()
    const router = useRouter()
    const dateLocale = locale === "it" ? it : enUS

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <p className="text-zinc-500 font-medium">{t("noWorkouts")}</p>
            </div>
        )
    }

    // Group sessions by Month/Year
    const groupedSessions = sessions.reduce((acc, session) => {
        const date = new Date(session.date)
        const monthYear = format(date, "MMMM yyyy", { locale: dateLocale })
        if (!acc[monthYear]) {
            acc[monthYear] = []
        }
        acc[monthYear].push(session)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="space-y-12">
            {Object.entries(groupedSessions).map(([monthYear, monthSessions]) => {
                const totalWorkouts = monthSessions.length
                const totalDurationSec = monthSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
                const totalMinutes = Math.floor(totalDurationSec / 60)

                return (
                    <div key={monthYear} className="space-y-4">
                        {/* Monthly Summary Header */}
                        <div className="sticky top-[73px] z-30 bg-background/95 backdrop-blur-md pt-4 pb-2 border-b border-primary/10 flex items-end justify-between group">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter transition-colors group-hover:text-primary">
                                    {monthYear}
                                </h3>
                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    <span className="flex items-center gap-1"><span className="text-zinc-300">{totalWorkouts}</span> Workouts</span>
                                    {totalMinutes > 0 && <span className="flex items-center gap-1"><span className="text-zinc-300">{totalMinutes}</span> Minutes</span>}
                                </div>
                            </div>
                            <div className="h-0.5 w-12 bg-primary/20 mb-2 rounded-full" />
                        </div>

                        <div className="space-y-3">
                            {monthSessions.map((session) => {
                                const date = new Date(session.date)
                                const day = format(date, "dd")
                                const time = format(date, "HH:mm")

                                // Process logs for summary
                                const logs = session.exercise_logs || []
                                const setsCount = logs.length
                                const uniqueExercises = new Set(logs.map((l: any) => l.exercise_id)).size

                                return (
                                    <UniversalListCard
                                        key={session.id}
                                        title={session.workout_template?.name || t("freeWorkout")}
                                        index={parseInt(day)} // Day number
                                        onClick={() => router.push(`/history/${session.id}`)}
                                        className="bg-zinc-900/30 border-white/5 hover:border-primary/20"
                                        subtitle={
                                            <div className="space-y-2 mt-1">
                                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon className="h-3 w-3 text-zinc-600" />
                                                        <span className="font-mono text-zinc-400">{time}</span>
                                                    </div>
                                                    {session.duration_seconds && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3 text-zinc-600" />
                                                            <span className="font-mono text-zinc-400">{Math.floor(session.duration_seconds / 60)} min</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-primary/10">
                                                        {uniqueExercises} Exercises
                                                    </div>
                                                    <div className="bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/5">
                                                        {setsCount} Sets
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        actions={
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        }
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
