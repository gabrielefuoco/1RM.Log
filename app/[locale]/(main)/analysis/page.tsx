"use client"

import { useState } from "react"
import { AnalysisGrid, AnalysisGridItem } from "@/components/analysis/analysis-grid"
import { ChartWidget } from "@/components/analysis/chart-widget"
import { TrendChart } from "@/components/analysis/trend-chart"
import { StackedAreaChart } from "@/components/analysis/charts/stacked-area-chart"
import { RadarChart } from "@/components/analysis/charts/radar-chart"
import { HistogramChart } from "@/components/analysis/charts/histogram-chart"
import { PerformanceRail } from "@/components/analysis/performance-rail"
import { CalendarRange, Dumbbell, TrendingUp, Activity } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    getKPIs, get1RMTrend, getVolumeStats, getPerformanceFeed, getExercisesList,
    getSBD1RMTrend, getMuscleBalance, getIntensityDistribution, getNormalizedMultiTrend,
    getBodyweightTrend, getRelativeStrengthTrend, getCompetitionPointsTrend, getVolumeByBodyPart,
    getHardSetsTrend, getFatigueScatter, getDashboardConfig, updateDashboardConfig
} from "@/app/actions/analysis"
import { MultiLineChart } from "@/components/analysis/charts/multi-line-chart"
import { StackedBarChart } from "@/components/analysis/charts/stacked-bar-chart"
import { ScatterChart } from "@/components/analysis/charts/scatter-chart"
import { WidgetManager } from "@/components/analysis/widget-manager"
import { useTranslations } from "next-intl"

export default function AnalysisPage() {
    const queryClient = useQueryClient()
    const t = useTranslations("Analysis")
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
    const [multiSelected, setMultiSelected] = useState<string[]>([])
    const [showComparison, setShowComparison] = useState(false)
    const [compMetric, setCompMetric] = useState<'dots' | 'wilks' | 'ipf'>('dots')

    // Parallel Data Fetching
    const { data: kpis } = useQuery({ queryKey: ['analysis', 'kpis'], queryFn: () => getKPIs() })
    const { data: volumeStats } = useQuery({ queryKey: ['analysis', 'volume', showComparison], queryFn: () => getVolumeStats() })
    const { data: performanceFeed } = useQuery({ queryKey: ['analysis', 'feed'], queryFn: () => getPerformanceFeed() })
    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: () => getExercisesList() })
    const { data: bodyweightData } = useQuery({ queryKey: ['analysis', 'bodyweight'], queryFn: () => getBodyweightTrend() })

    // Default to first exercise if not selected
    const targetExerciseId = selectedExercise || (exercises?.[0]?.id) || null

    const { data: trendStats } = useQuery({
        queryKey: ['analysis', 'trend', targetExerciseId, showComparison],
        queryFn: () => targetExerciseId ? get1RMTrend(targetExerciseId) : { current: [], comparison: [] },
        enabled: !!targetExerciseId
    })

    const { data: relStrengthData } = useQuery({
        queryKey: ['analysis', 'rel-strength', targetExerciseId],
        queryFn: () => targetExerciseId ? getRelativeStrengthTrend(targetExerciseId) : [],
        enabled: !!targetExerciseId
    })

    const { data: normalizedTrend } = useQuery({
        queryKey: ['analysis', 'normalized', multiSelected],
        queryFn: () => getNormalizedMultiTrend(multiSelected),
        enabled: multiSelected.length > 0
    })

    const { data: sbdData } = useQuery({ queryKey: ['analysis', 'sbd'], queryFn: () => getSBD1RMTrend() })
    const { data: muscleBalance } = useQuery({ queryKey: ['analysis', 'muscle-balance'], queryFn: () => getMuscleBalance() })
    const { data: intensityDist } = useQuery({ queryKey: ['analysis', 'intensity'], queryFn: () => getIntensityDistribution() })
    const { data: compPointsTrend } = useQuery({ queryKey: ['analysis', 'comp-points'], queryFn: () => getCompetitionPointsTrend() })
    const { data: volumeByPart } = useQuery({ queryKey: ['analysis', 'volume-part'], queryFn: () => getVolumeByBodyPart() })
    const { data: hardSets } = useQuery({ queryKey: ['analysis', 'hard-sets'], queryFn: () => getHardSetsTrend() })
    const { data: scatterData } = useQuery({ queryKey: ['analysis', 'scatter'], queryFn: () => getFatigueScatter() })
    const { data: dbConfig } = useQuery({ queryKey: ['analysis', 'config'], queryFn: () => getDashboardConfig() })

    const updateConfigMutation = useMutation({
        mutationFn: updateDashboardConfig,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analysis', 'config'] })
    })

    // Dashboard Engine Configuration
    const ALL_WIDGETS = [
        { id: 'trend', title: t('trend1rmTitle') },
        { id: 'volume', title: t('volumeTitle') },
        { id: 'normalized', title: t('normalizedTitle') },
        { id: 'sbd', title: t('sbdTotalTitle') },
        { id: 'muscle_balance', title: t('muscleBalanceTitle') },
        { id: 'intensity', title: t('intensityDistTitle') },
        { id: 'bodyweight', title: t('bodyweightTitle') },
        { id: 'rel_strength', title: t('relativeStrengthTitle') },
        { id: 'dots', title: t('compPointsTrendTitle') },
        { id: 'volume_part', title: t('muscleVolumeTitle') },
        { id: 'hard_sets', title: t('hardSetsTitle') },
        { id: 'fatigue', title: t('fatigueTitle') }
    ]

    const isVisible = (id: string) => dbConfig?.[id] !== false

    const handleToggle = (id: string) => {
        const newConfig = { ...dbConfig, [id]: !isVisible(id) }
        updateConfigMutation.mutate(newConfig)
    }

    const widgetConfig = ALL_WIDGETS.map(w => ({ ...w, visible: isVisible(w.id) }))

    // Latest Points for KPI
    const currentPoints = compPointsTrend?.length ? compPointsTrend[compPointsTrend.length - 1] : null
    const kpiPoints = currentPoints ? (currentPoints as any)[compMetric] : null

    // Memoized options for MultiSelect
    const exerciseOptions = exercises?.map((e: any) => ({ label: e.name, value: e.id })) || []

    const multiChartLines = multiSelected.map((id, index) => {
        const name = exercises?.find((e: any) => e.id === id)?.name || 'Unknown'
        const colors = ['#00ffa3', '#3b82f6', '#f97316', '#ef4444', '#eab308']
        return { key: id, color: colors[index % colors.length], name }
    })

    // Formatted points for MultiLineChart
    const formattedPoints = compPointsTrend?.map((p: any) => ({
        date: p.date,
        value: p[compMetric]
    })) || []

    return (
        <div className="p-4 md:p-8 space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading uppercase tracking-wide">{t("title")}</h2>
                    <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant={showComparison ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowComparison(!showComparison)}
                        className="gap-2 h-8 text-xs font-mono uppercase"
                    >
                        <CalendarRange className="size-4" />
                        {showComparison ? t("comparisonOn") : t("comparisonOff")}
                    </Button>
                    <WidgetManager config={widgetConfig} onToggle={handleToggle} />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="size-12 text-primary" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("bestLiftKpi")}</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.bestLift || '--'}<span className="text-sm text-muted-foreground ml-1">kg</span></h3>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Dumbbell className="size-12 text-blue-400" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("volumeKpi")}</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.volume || '--'}</h3>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="size-12 text- pink-500" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{compMetric.toUpperCase()} {t("scoreKpi")}</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpiPoints || '--'}</h3>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarRange className="size-12 text-orange-400" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("frequencyKpi")}</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.frequency || '--'}</h3>
                        <p className="text-muted-foreground text-xs mt-1">{t("sessionsPerWeek")}</p>
                    </div>
                </div>
            </div>

            {/* Performance Rail */}
            <div className="space-y-4">
                <h3 className="font-heading text-lg uppercase tracking-tight pl-1">{t("improvementFeed")}</h3>
                <PerformanceRail items={performanceFeed || []} />
            </div>

            {/* Main Charts Grid with Conditional Rendering */}
            <AnalysisGrid>
                {isVisible('trend') && (
                    <AnalysisGridItem colSpan={8}>
                        <ChartWidget
                            title={t("trend1rmTitle")}
                            subtitle={t("trendSubtitle")}
                            icon={<TrendingUp className="size-5" />}
                            infoTooltip="Estimated 1RM trend over time."
                            headerAction={
                                <Select onValueChange={setSelectedExercise} defaultValue={selectedExercise || undefined}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                        <SelectValue placeholder={t("selectExercise")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {exercises?.map((ex: any) => (
                                            <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            }
                        >
                            <TrendChart
                                data={(trendStats as any)?.current || []}
                                comparisonData={showComparison ? (trendStats as any)?.comparison : undefined}
                                primaryColor="#00ffa3"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('volume') && (
                    <AnalysisGridItem colSpan={4}>
                        <ChartWidget
                            title={t("volumeTitle")}
                            subtitle={t("weeklyTonnage")}
                            icon={<Dumbbell className="size-5" />}
                            infoTooltip="Total weight lifted per week."
                        >
                            <TrendChart
                                data={(volumeStats as any)?.current || []}
                                comparisonData={showComparison ? (volumeStats as any)?.comparison : undefined}
                                primaryColor="#60a5fa"
                                unit="kg"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('normalized') && (
                    <AnalysisGridItem colSpan={12}>
                        <ChartWidget
                            title={t("normalizedTitle")}
                            subtitle={t("normalizedSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Compare progression speed between exercises. All charts start at 100%."
                            headerAction={
                                <div className="w-[300px]">
                                    <MultiSelect
                                        options={exerciseOptions}
                                        selected={multiSelected}
                                        onChange={setMultiSelected}
                                        placeholder={t("selectExercisesPlaceholder")}
                                    />
                                </div>
                            }
                        >
                            <MultiLineChart
                                data={normalizedTrend || []}
                                lines={multiChartLines}
                                yAxisUnit="%"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('volume_part') && (
                    <AnalysisGridItem colSpan={12}>
                        <ChartWidget
                            title={t("muscleVolumeTitle")}
                            subtitle={t("muscleVolumeSubtitle")}
                            icon={<Dumbbell className="size-5" />}
                            infoTooltip="Breakdown of total volume per week distributed by muscle groups."
                        >
                            <StackedBarChart
                                data={volumeByPart || []}
                                bars={[
                                    { key: 'Chest', color: '#ef4444', name: 'Chest' },
                                    { key: 'Back (Lats)', color: '#3b82f6', name: 'Lats' },
                                    { key: 'Back (Upper/Traps)', color: '#6366f1', name: 'Upper Back' },
                                    { key: 'Shoulders (Front)', color: '#f97316', name: 'Front Delts' },
                                    { key: 'Shoulders (Side)', color: '#f59e0b', name: 'Side Delts' },
                                    { key: 'Quadriceps', color: '#22c55e', name: 'Quads' },
                                    { key: 'Hamstrings', color: '#10b981', name: 'Hams' },
                                    { key: 'Glutes', color: '#ec4899', name: 'Glutes' },
                                    { key: 'Triceps', color: '#a855f7', name: 'Triceps' },
                                    { key: 'Biceps', color: '#d946ef', name: 'Biceps' },
                                    { key: 'Core', color: '#64748b', name: 'Core' }
                                ]}
                                yAxisUnit="kg"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('sbd') && (
                    <AnalysisGridItem colSpan={8}>
                        <ChartWidget
                            title={t("sbdTotalTitle")}
                            subtitle={t("sbdSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Sum of estimated 1RMs for the three big lifts."
                        >
                            <StackedAreaChart
                                data={sbdData || []}
                                areas={[
                                    { key: 'squat', color: '#ef4444', name: 'Squat' },
                                    { key: 'bench', color: '#3b82f6', name: 'Bench' },
                                    { key: 'deadlift', color: '#eab308', name: 'Deadlift' }
                                ]}
                                yAxisUnit="kg"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('muscle_balance') && (
                    <AnalysisGridItem colSpan={4}>
                        <ChartWidget
                            title={t("muscleBalanceTitle")}
                            subtitle={t("muscleBalanceSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Training volume distribution (number of sets) per muscle group."
                        >
                            <RadarChart
                                data={muscleBalance || []}
                                dataKey="value"
                                categoryKey="subject"
                                color="#8b5cf6"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('intensity') && (
                    <AnalysisGridItem colSpan={6}>
                        <ChartWidget
                            title={t("intensityDistTitle")}
                            subtitle={t("intensityDistSubtitle")}
                            icon={<TrendingUp className="size-5" />}
                            infoTooltip="Frequency of intensity levels (RIR). RIR 0 = Failure."
                        >
                            <HistogramChart
                                data={intensityDist || []}
                                xKey="rir"
                                yKey="count"
                                color="#f97316"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('bodyweight') && (
                    <AnalysisGridItem colSpan={6}>
                        <ChartWidget
                            title={t("bodyweightTitle")}
                            subtitle={t("bodyweightTrend")}
                            icon={<Dumbbell className="size-5" />}
                            infoTooltip="Body weight over time (from bodyweight_logs)."
                        >
                            <TrendChart data={bodyweightData || []} primaryColor="#a3a3a3" unit="kg" />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('rel_strength') && (
                    <AnalysisGridItem colSpan={12}>
                        <ChartWidget
                            title={t("relativeStrengthTitle")}
                            subtitle={t("relativeStrengthSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Ratio between estimated 1RM and body weight."
                        >
                            <MultiLineChart
                                data={relStrengthData || []}
                                lines={[{ key: 'value', color: '#ec4899', name: 'Ratio (xBW)' }]}
                                yAxisUnit="x"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('dots') && (
                    <AnalysisGridItem colSpan={12}>
                        <ChartWidget
                            title={t("compPointsTrendTitle")}
                            subtitle={t("compPointsSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Trend based on SBD total and body weight points."
                            headerAction={
                                <Select onValueChange={(v: any) => setCompMetric(v)} defaultValue={compMetric}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                        <SelectValue placeholder="Metric" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dots">DOTS</SelectItem>
                                        <SelectItem value="wilks">Wilks</SelectItem>
                                        <SelectItem value="ipf">IPF GL</SelectItem>
                                    </SelectContent>
                                </Select>
                            }
                        >
                            <MultiLineChart
                                data={formattedPoints}
                                lines={[{ key: 'value', color: '#8b5cf6', name: compMetric.toUpperCase() }]}
                                yAxisUnit="pts"
                            />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('hard_sets') && (
                    <AnalysisGridItem colSpan={6}>
                        <ChartWidget
                            title={t("hardSetsTitle")}
                            subtitle={t("effectiveVolume")}
                            icon={<TrendingUp className="size-5" />}
                            infoTooltip="Number of sets completed with 3 reps or less in reserve."
                        >
                            <TrendChart data={hardSets || []} primaryColor="#facc15" unit="sets" />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}

                {isVisible('fatigue') && (
                    <AnalysisGridItem colSpan={6}>
                        <ChartWidget
                            title={t("fatigueTitle")}
                            subtitle={t("fatigueSubtitle")}
                            icon={<Activity className="size-5" />}
                            infoTooltip="Each point represents a session. Helps understanding perceived load."
                        >
                            <ScatterChart data={scatterData || []} />
                        </ChartWidget>
                    </AnalysisGridItem>
                )}
            </AnalysisGrid>
        </div>
    )
}
