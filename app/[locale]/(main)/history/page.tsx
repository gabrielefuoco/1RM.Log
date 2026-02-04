"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { WorkoutSession } from "@/types/database"
import { HistoryList } from "@/components/history/history-list"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { it, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"

export default function HistoryPage() {
    const t = useTranslations("History")
    const locale = useLocale()
    const [sessions, setSessions] = useState<(WorkoutSession & { workout_template: { name: string } | null })[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<Date | undefined>(new Date())

    const dateLocale = locale === "it" ? it : enUS

    useEffect(() => {
        const loadHistory = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('workout_sessions')
                .select(`
                *,
                workout_template:workout_templates(name)
            `)
                .order('date', { ascending: false })
                .limit(20) // Pagination later

            if (data) setSessions(data)
            setLoading(false)
        }
        loadHistory()
    }, [])

    const workoutDays = sessions.map(s => new Date(s.date))

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>

            {/* Calendar Card */}
            <div className="glass-card rounded-3xl p-4 flex justify-center">
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border-0 text-foreground"
                    modifiers={{
                        workout: workoutDays
                    }}
                    modifiersClassNames={{
                        workout: "text-primary font-bold underline decoration-2 underline-offset-4"
                    }}
                    locale={dateLocale}
                />
            </div>

            {/* List */}
            <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t("recent")}</h2>
                {loading ? (
                    <div className="text-center text-muted-foreground text-sm">{t("loading")}</div>
                ) : (
                    <HistoryList sessions={sessions} />
                )}
            </div>
        </div>
    )
}
