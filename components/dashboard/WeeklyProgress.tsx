"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeeklyProgress } from "@/hooks/use-weekly-progress"

export function WeeklyProgress() {
    const { data, isLoading } = useWeeklyProgress()

    if (isLoading) {
        return (
            <Card className="border-border/50">
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-10" />
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton key={i} className="w-10 h-10 rounded-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const { days, percentage } = data || { days: [], percentage: 0 }

    return (
        <Card className="">
            <CardHeader className="flex-row items-center justify-between pb-2 border-b border-border/30 mb-4 bg-secondary/5">
                <CardTitle className="text-sm font-heading font-bold tracking-widest text-muted-foreground uppercase">
                    Weekly Focus
                </CardTitle>
                <span className="text-lg font-mono font-bold text-primary">{percentage}%</span>
            </CardHeader>

            <CardContent>
                <div className="flex justify-between items-center gap-2">
                    {days.map((d, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300",
                                d.status === "completed"
                                    ? "bg-primary text-background border-primary shadow-[0_0_10px_rgba(0,255,163,0.4)] scale-105"
                                    : "bg-transparent border-input text-muted-foreground"
                            )}
                        >
                            {d.status === "completed" ? (
                                <Check className="w-5 h-5" strokeWidth={3} />
                            ) : (
                                <span className="text-xs font-mono font-bold">{d.day}</span>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
