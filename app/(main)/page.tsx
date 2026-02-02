"use client"

import { TrendingUp, Trophy } from "lucide-react"
import { WorkoutCard } from "@/components/dashboard/WorkoutCard"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function HomePage() {
    const router = useRouter()
    const { data: stats, isLoading } = useDashboardStats()

    const formatGrowth = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "--"
        const sign = value >= 0 ? "+" : ""
        return `${sign}${value.toFixed(1)}%`
    }

    const formatBestLift = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "--"
        return `${Math.round(value)}kg`
    }

    return (
        <div className="space-y-6 pt-4">
            {/* Unified Desktop Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Main Column (Hero + Stats) */}
                <div className="lg:col-span-2 space-y-6">
                    <WorkoutCard />

                    <div className="grid grid-cols-2 gap-6">
                        <StatsCard
                            title="GROWTH 1RM"
                            value={formatGrowth(stats?.growthPercentage)}
                            subtitle="Last 30 days"
                            icon={TrendingUp}
                            trend={stats?.growthPercentage !== null && stats?.growthPercentage !== undefined
                                ? (stats.growthPercentage >= 0 ? "In aumento" : "In calo")
                                : undefined}
                            isPositive={(stats?.growthPercentage ?? 0) >= 0}
                            isLoading={isLoading}
                        />
                        <StatsCard
                            title="BEST LIFT"
                            value={formatBestLift(stats?.bestLift?.value)}
                            subtitle={stats?.bestLift?.exerciseName || "Nessun dato"}
                            icon={Trophy}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Right Side: Widgets Column (Weekly Progress + Quick Actions) */}
                <div className="flex flex-col gap-6">
                    <WeeklyProgress />

                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between pb-2 border-b border-border/30 mb-4 bg-secondary/5">
                            <CardTitle className="text-sm font-heading font-bold tracking-widest text-muted-foreground uppercase">
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 justify-center py-6">
                            <div className="space-y-4">
                                <Button
                                    className="w-full h-12 text-md font-bold"
                                    onClick={async () => {
                                        const { startSession } = await import("@/services/workout")
                                        const { toast } = await import("sonner")
                                        try {
                                            const sId = await startSession(null)
                                            router.push(`/workout/session/${sId}`)
                                        } catch (e) {
                                            toast.error("Errore avvio sessione")
                                        }
                                    }}
                                >
                                    INIZIA WORKOUT VUOTO
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start px-4 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
                                    onClick={() => router.push('/programs')}
                                >
                                    Gestisci Programmi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
