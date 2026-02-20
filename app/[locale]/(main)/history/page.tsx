"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { WorkoutSession } from "@/types/database"
import { HistoryList } from "@/components/history/history-list"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { it, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function HistoryPage() {
    const t = useTranslations("History")
    const locale = useLocale()
    const [sessions, setSessions] = useState<(WorkoutSession & { workout_template: { name: string } | null, exercise_logs: any[] })[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalWorkouts: 0, totalSets: 0, consistency: 0 })
    const [date, setDate] = useState<Date | undefined>(new Date())

    const dateLocale = locale === "it" ? it : enUS

    useEffect(() => {
        const loadHistory = async () => {
            const supabase = createClient()

            // Fetch Lifetime Stats
            const [sessionsRes, logsCountRes] = await Promise.all([
                supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
                supabase.from('exercise_logs').select('*', { count: 'exact', head: true })
            ])

            setStats({
                totalWorkouts: sessionsRes.count || 0,
                totalSets: logsCountRes.count || 0,
                consistency: Math.min(100, Math.round(((sessionsRes.count || 0) / 12) * 100)) // Arbitrary mock consistency
            })

            // Fetch Recent Sessions
            const { data, error } = await supabase
                .from('workout_sessions')
                .select(`
                    *,
                    workout_template:workout_templates(name),
                    exercise_logs(id, exercise_id)
                `)
                .order('date', { ascending: false })
                .limit(20)

            if (data) setSessions(data as any)
            setLoading(false)
        }
        loadHistory()
    }, [])

    const workoutDays = sessions.map(s => new Date(s.date))

    return (
        <div className="space-y-8 pt-4 pb-24 container-padding">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-foreground italic uppercase tracking-tighter leading-none mb-2">{t("title")}</h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">{t("subtitle")}</p>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "WORKOUTS", value: stats.totalWorkouts, color: "text-foreground" },
                    { label: "TOTAL SETS", value: stats.totalSets, color: "text-primary" },
                    { label: "CONSISTENCY", value: `${stats.consistency}%`, color: "text-amber-500" },
                ].map((stat, i) => (
                    <div key={i} className="bg-muted/50 border border-border rounded-2xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-black text-muted-foreground tracking-[0.2em] mb-1">{stat.label}</span>
                        <span className={cn("text-xl font-black italic tracking-tighter", stat.color)}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Card */}
            <div className="bg-card border border-border rounded-3xl p-4 flex justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl pointer-events-none" />
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 text-foreground"
                    classNames={{
                        day: "h-9 w-9 md:h-14 md:w-14 text-center text-sm md:text-xl p-0 relative focus-within:relative focus-within:z-20",
                        day_button: cn(
                            buttonVariants({ variant: "ghost" }),
                            "h-9 w-9 md:h-14 md:w-14 p-0 font-normal aria-selected:opacity-100 font-sans hover:bg-primary/20 hover:text-primary transition-colors md:text-xl"
                        ),
                        weekday: "text-muted-foreground rounded-md w-9 md:w-14 font-black text-[0.6rem] md:text-[0.8rem] uppercase tracking-widest text-center",
                        month_caption: "flex justify-center pt-1 relative items-center mb-4 md:mb-8",
                        caption_label: "text-sm md:text-xl font-black uppercase tracking-widest italic text-foreground",
                    }}
                    modifiers={{
                        workout: workoutDays
                    }}
                    modifiersClassNames={{
                        workout: "text-primary font-black scale-110 relative z-10 before:absolute before:inset-x-1 before:bottom-1 before:top-1 before:bg-primary/20 before:rounded-full before:-z-10"
                    }}
                    locale={dateLocale}
                />
            </div>

            {/* List */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">{t("recent")}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-pulse text-muted-foreground font-black uppercase tracking-widest text-sm">{t("loading")}...</div>
                    </div>
                ) : (
                    <HistoryList sessions={sessions} />
                )}
            </div>
        </div>
    )
}
