"use client"

import { useState } from "react"
import { AnalysisGrid } from "@/components/analysis/analysis-grid"
import { PerformanceRail } from "@/components/analysis/performance-rail"
import { CalendarRange, Dumbbell, TrendingUp, Activity } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
    getKPIs, getPerformanceFeed, getExercisesList,
    getCompetitionPointsTrend, getDashboardConfig, updateDashboardConfig
} from "@/app/actions/analysis"
import { WidgetManager } from "@/components/analysis/widget-manager"
import { useTranslations } from "next-intl"
import { CHART_PRESETS, SmartChartConfig, DashboardConfig } from "@/types/analysis"
import { SmartChart } from "@/components/analysis/smart-chart"
import { SmartChartConfigurator } from "@/components/analysis/smart-chart-configurator"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useHeader } from "@/components/header-provider"
import { useEffect } from "react"

export default function AnalysisPage() {
    const queryClient = useQueryClient()
    const t = useTranslations("Analysis")
    const [showComparison, setShowComparison] = useState(false)
    const [compMetric, setCompMetric] = useState<'dots' | 'wilks' | 'ipf'>('dots')
    const { setHeader } = useHeader()

    // Configurator State
    const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
    const [editingChart, setEditingChart] = useState<Partial<SmartChartConfig> | null>(null)
    const [isFocusedEdit, setIsFocusedEdit] = useState(false)

    const handleAddChart = () => {
        setEditingChart(null)
        setIsFocusedEdit(false)
        setConfigDrawerOpen(true)
    }

    const handleEditChart = (config: SmartChartConfig, focused: boolean = false) => {
        setEditingChart(config)
        setIsFocusedEdit(focused)
        setConfigDrawerOpen(true)
    }

    // Parallel Data Fetching
    const { data: kpis } = useQuery({ queryKey: ['analysis', 'kpis'], queryFn: () => getKPIs() })
    const { data: performanceFeed } = useQuery({ queryKey: ['analysis', 'feed'], queryFn: () => getPerformanceFeed() })
    const { data: compPointsTrend } = useQuery({ queryKey: ['analysis', 'comp-points'], queryFn: () => getCompetitionPointsTrend() })
    const { data: dbConfig } = useQuery({ queryKey: ['analysis', 'config'], queryFn: () => getDashboardConfig() }) as any

    const supabase = createClient()

    const { mutate: saveConfig } = useMutation({
        mutationFn: async (updatedConfig: Partial<DashboardConfig>) => {
            return await updateDashboardConfig(updatedConfig)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analysis', 'config'] })
            toast.success("Dashboard aggiornata", {
                description: "Le modifiche ai grafici sono state salvate.",
                duration: 2000
            })
        },
        onError: (err) => {
            console.error("Save Error:", err)
            toast.error("Errore durante il salvataggio")
        }
    })

    // Latest Points for KPI
    const currentPoints = compPointsTrend?.length ? compPointsTrend[compPointsTrend.length - 1] : null
    const kpiPoints = currentPoints ? (currentPoints as any)[compMetric] : null

    // Effective Config combining Presets + Custom User Charts
    const isVisible = (id: string) => dbConfig?.visibility?.[id] !== false

    const customCharts = (dbConfig as DashboardConfig)?.customCharts || []

    const handleToggle = (id: string) => {
        const newVisibility = { ...(dbConfig?.visibility || {}), [id]: !isVisible(id) }
        saveConfig({ ...dbConfig, visibility: newVisibility })
    }

    const handleSaveCustomChart = (newConfig: SmartChartConfig) => {
        let newCustomCharts = [...customCharts]
        const index = newCustomCharts.findIndex(c => c.id === newConfig.id)

        if (index >= 0) {
            newCustomCharts[index] = newConfig
        } else {
            newCustomCharts.push(newConfig)
        }

        saveConfig({ ...dbConfig, customCharts: newCustomCharts })
    }

    const handleDeleteCustomChart = (id: string) => {
        const newCustomCharts = customCharts.filter(c => c.id !== id)
        saveConfig({ ...dbConfig, customCharts: newCustomCharts })
    }

    // Total pool of visible charts - Deduplicate by ID prioritizing customCharts (overrides)
    const allConfigsMap = new Map<string, SmartChartConfig>()
    CHART_PRESETS.forEach(p => allConfigsMap.set(p.id, p))
    customCharts.forEach(c => allConfigsMap.set(c.id, c))

    const activeConfigs: SmartChartConfig[] = Array.from(allConfigsMap.values())
        .filter(c => isVisible(c.id))
        .map(base => {
            const config = { ...base }

            // Inject page-level states into dynamic configs
            if (config.params) {
                config.params = {
                    ...config.params,
                    showComparison: showComparison
                }
                if (config.metric === 'dots') {
                    config.params.compMetric = compMetric
                }
            }

            return config
        })

    const widgetConfig = CHART_PRESETS.map(w => ({ id: w.id, title: w.title, visible: isVisible(w.id) }))

    // Set dynamic header — avoid widgetConfig in deps (unstable reference → infinite loop)
    useEffect(() => {
        setHeader({
            title: t("title"),
            subtitle: t("subtitle"),
        })
    }, [t, setHeader])

    return (
        <div className="p-4 md:p-8 space-y-8 pb-32">

            {/* Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddChart}
                    className="gap-2 h-8 text-[10px] md:text-xs font-mono uppercase bg-primary/5 border-primary/20 hover:bg-primary/10"
                >
                    <Plus className="size-3 md:size-4" />
                    <span className="hidden xs:inline">Add Chart</span>
                    <span className="xs:hidden">Add</span>
                </Button>
                <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className="gap-2 h-8 text-[10px] md:text-xs font-mono uppercase"
                >
                    <CalendarRange className="size-3 md:size-4" />
                    {showComparison ? t("comparisonOn") : t("comparisonOff")}
                </Button>
                <WidgetManager config={widgetConfig} onToggle={handleToggle} />
            </div>

            {/* Configurator */}
            <SmartChartConfigurator
                open={configDrawerOpen}
                onOpenChange={setConfigDrawerOpen}
                onSave={handleSaveCustomChart}
                initialConfig={editingChart || undefined}
                isFocusedEdit={isFocusedEdit}
            />

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
                        <Activity className="size-12 text-pink-500" />
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

            {/* Dynamic Smart Charts Grid */}
            <AnalysisGrid>
                {activeConfigs.map(config => (
                    <SmartChart
                        key={config.id}
                        config={config}
                        onEdit={handleEditChart}
                        onDelete={handleDeleteCustomChart}
                    />
                ))}
            </AnalysisGrid>
        </div>
    )
}
