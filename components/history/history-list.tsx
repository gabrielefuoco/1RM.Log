"use client"

import { WorkoutSession } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Trophy } from "lucide-react"
import { format } from "date-fns"
import { it, enUS } from "date-fns/locale"
import { Link } from "@/i18n/routing"
import { useTranslations, useLocale } from "next-intl"

interface HistoryListProps {
    sessions: (WorkoutSession & { workout_template: { name: string } | null })[]
}

export function HistoryList({ sessions }: HistoryListProps) {
    const t = useTranslations("History")
    const locale = useLocale()
    const dateLocale = locale === "it" ? it : enUS

    if (sessions.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed border-muted rounded-xl">
                <p className="text-muted-foreground">{t("noWorkouts")}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <Link href={`/history/${session.id}`} key={session.id} className="block group">
                    <div className="glass-card rounded-2xl p-4 transition-all hover:bg-white/5 border border-white/5 group-hover:border-primary/20">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                                    {session.workout_template?.name || t("freeWorkout")}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(session.date), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                                </div>
                            </div>
                            {/* Duration Badge if available */}
                            {session.duration_seconds && (
                                <Badge variant="outline" className="border-primary/20 text-primary font-normal bg-primary/5">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {Math.floor(session.duration_seconds / 60)} min
                                </Badge>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
