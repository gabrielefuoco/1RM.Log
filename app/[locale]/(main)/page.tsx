"use client"

import { TrendingUp, Trophy } from "lucide-react"
import { WorkoutCard } from "@/components/dashboard/workout-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { WeeklyProgress } from "@/components/dashboard/weekly-progress"
import { BodyweightCard } from "@/components/dashboard/bodyweight-card"
import { CompetitionPointsCard } from "@/components/dashboard/competition-points-card"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { SmartChart } from "@/components/analysis/smart-chart"
import { CHART_PRESETS } from "@/types/analysis"
import { AnalysisGrid } from "@/components/analysis/analysis-grid"

export default function HomePage() {
    const router = useRouter()
    const { data: stats, isLoading } = useDashboardStats()
    const t = useTranslations("Dashboard")

    const formatGrowth = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "--"
        const sign = value >= 0 ? "+" : ""
        return `${sign}${value.toFixed(1)}%`
    }

    const formatBestLift = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "--"
        return `${Math.round(value)}kg`
    }

    // featured charts for home
    const featuredCharts = CHART_PRESETS.filter(p => p.id === 'trend_1rm' || p.id === 'weekly_volume')

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Unified Desktop Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Main Column (Hero + Stats) */}
                <div className="lg:col-span-2 space-y-6">
                    <WorkoutCard />

                    <div className="grid grid-cols-2 gap-6">
                        <StatsCard
                            title={t("growth1RM")}
                            value={formatGrowth(stats?.growthPercentage)}
                            subtitle={t("last30Days")}
                            icon={TrendingUp}
                            trend={stats?.growthPercentage !== null && stats?.growthPercentage !== undefined
                                ? (stats.growthPercentage >= 0 ? t("increasing") : t("decreasing"))
                                : undefined}
                            isPositive={(stats?.growthPercentage ?? 0) >= 0}
                            isLoading={isLoading}
                        />
                        <StatsCard
                            title={t("bestLift")}
                            value={formatBestLift(stats?.bestLift?.value)}
                            subtitle={stats?.bestLift?.exerciseName || t("noData")}
                            icon={Trophy}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Featured Charts Section */}
                    <div className="pt-2">
                        <h3 className="font-heading text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
                            <TrendingUp className="size-5 text-primary" />
                            {t("growth1RM")} & Performance
                        </h3>
                        <AnalysisGrid className="md:grid-cols-1 lg:grid-cols-12">
                            {featuredCharts.map(config => (
                                <SmartChart key={config.id} config={{ ...config, colSpan: config.id === 'trend_1rm' ? 8 : 4 } as any} />
                            ))}
                        </AnalysisGrid>
                    </div>
                </div>

                {/* Right Side: Widgets Column (Weekly Progress + Quick Actions) */}
                <div className="flex flex-col gap-6">
                    <CompetitionPointsCard />
                    <BodyweightCard />
                    <WeeklyProgress />

                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between pb-2 border-b border-border/30 mb-4 bg-secondary/5">
                            <CardTitle className="text-sm font-heading font-bold tracking-widest text-muted-foreground uppercase">
                                {t("quickActions")}
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
                                    {t("startEmptyWorkout")}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start px-4 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
                                    onClick={() => router.push('/programs')}
                                >
                                    {t("managePrograms")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
