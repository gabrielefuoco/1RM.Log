"use client"

import { AnalysisGrid, AnalysisGridItem } from "@/components/analysis/analysis-grid"
import { ChartWidget } from "@/components/analysis/chart-widget"
import { TrendChart } from "@/components/analysis/trend-chart"
import { PerformanceRail } from "@/components/analysis/performance-rail"
import { CalendarRange, Dumbbell, TrendingUp, Activity } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getKPIs, get1RMTrend, getVolumeStats, getPerformanceFeed, getExercisesList } from "@/app/actions/analysis"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AnalysisPage() {
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

    // Parallel Data Fetching
    const { data: kpis } = useQuery({ queryKey: ['analysis', 'kpis'], queryFn: () => getKPIs() })
    const { data: volumeData } = useQuery({ queryKey: ['analysis', 'volume'], queryFn: () => getVolumeStats() })
    const { data: performanceFeed } = useQuery({ queryKey: ['analysis', 'feed'], queryFn: () => getPerformanceFeed() })
    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: () => getExercisesList() })

    // Default to first exercise if not selected, or don't fetch if no exercises
    const targetExerciseId = selectedExercise || (exercises?.[0]?.id)

    const { data: trendData } = useQuery({
        queryKey: ['analysis', 'trend', targetExerciseId],
        queryFn: () => targetExerciseId ? get1RMTrend(targetExerciseId) : [],
        enabled: !!targetExerciseId
    })

    return (
        <div className="p-4 md:p-8 space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading uppercase tracking-wide">Analisi Performance</h2>
                    <p className="text-muted-foreground text-sm">Metriche di forza e progressione carichi.</p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="size-12 text-primary" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Best Lift (Est. 1RM)</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.bestLift || '--'}<span className="text-sm text-muted-foreground ml-1">kg</span></h3>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Dumbbell className="size-12 text-blue-400" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Volume (30g)</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.volume || '--'}</h3>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="size-12 text-pink-500" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">DOTS Score</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.dots || '--'}</h3>
                        <p className="text-pink-500 text-xs font-bold flex items-center gap-1 mt-1">
                            Work in Progress
                        </p>
                    </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-lg flex flex-col justify-between h-[120px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarRange className="size-12 text-orange-400" />
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Frequenza</p>
                    <div>
                        <h3 className="text-3xl font-heading text-foreground">{kpis?.frequency || '--'}</h3>
                        <p className="text-muted-foreground text-xs mt-1">
                            Sessioni / Settimana
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance Rail */}
            <div className="space-y-4">
                <h3 className="font-heading text-lg uppercase tracking-tight pl-1">Feed Miglioramenti</h3>
                <PerformanceRail items={performanceFeed || []} />
            </div>

            {/* Main Charts Grid */}
            <AnalysisGrid>
                <AnalysisGridItem colSpan={8}>
                    <ChartWidget
                        title="Trend 1RM Stimato"
                        subtitle="Progressione Carichi"
                        icon={<TrendingUp className="size-5" />}
                        infoTooltip="Andamento del massimale stimato nel tempo."
                        headerAction={
                            <Select onValueChange={setSelectedExercise} defaultValue={selectedExercise || undefined}>
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="Seleziona Esercizio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exercises?.map((ex: any) => (
                                        <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        }
                    >
                        <TrendChart data={trendData || []} primaryColor="#00ffa3" />
                    </ChartWidget>
                </AnalysisGridItem>

                <AnalysisGridItem colSpan={4}>
                    <ChartWidget
                        title="Volume Load"
                        subtitle="Tonnellaggio Settimanale"
                        icon={<Dumbbell className="size-5" />}
                        infoTooltip="Peso totale sollevato per settimana."
                    >
                        <TrendChart data={volumeData || []} primaryColor="#60a5fa" unit="pts" />
                    </ChartWidget>
                </AnalysisGridItem>
            </AnalysisGrid>
        </div>
    )
}
