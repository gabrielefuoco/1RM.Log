"use client"

import { useQuery } from "@tanstack/react-query"
import { getSmartChartData } from "@/app/actions/analysis"
import { SmartChartConfig, SmartChartMetric, SmartChartType } from "@/types/analysis"
import { ChartWidget } from "./chart-widget"
import { TrendChart } from "./trend-chart"
import { StackedAreaChart } from "./charts/stacked-area-chart"
import { RadarChart } from "./charts/radar-chart"
import { HistogramChart } from "./charts/histogram-chart"
import { MultiLineChart } from "./charts/multi-line-chart"
import { StackedBarChart } from "./charts/stacked-bar-chart"
import { ScatterChart } from "./charts/scatter-chart"
import { AnalysisGridItem } from "./analysis-grid"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit2, Trash2, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SmartChartProps {
    config: SmartChartConfig
    onDelete?: (id: string) => void
    onEdit?: (config: SmartChartConfig, isFocusedEdit?: boolean) => void
}

export function SmartChart({ config, onDelete, onEdit }: SmartChartProps) {
    const { data: chartData, isLoading, error } = useQuery({
        queryKey: ['smart-chart', config.metric, config.params],
        queryFn: () => getSmartChartData(config)
    })

    const renderChart = () => {
        if (isLoading) return <div className="h-[300px] flex items-center justify-center"><Skeleton className="w-full h-full opacity-20" /></div>
        if (error) return <div className="h-[300px] flex items-center justify-center text-destructive/50 text-xs font-mono uppercase text-center p-4">Error Loading Data<br /><span className="text-[10px] opacity-50 mt-2">Check your connection or exercise selection</span></div>

        // standardizing data extraction
        const data = (chartData as any)?.points || (chartData as any)?.current || (Array.isArray(chartData) ? chartData : [])
        const comparison = (chartData as any)?.comparison || []
        const namesMap = (chartData as any)?.names || {}
        const exerciseName = (chartData as any)?.exerciseName || ""

        if (data.length === 0) {
            return (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <div className="text-center px-6">
                        <p className="text-xs font-mono uppercase opacity-50">Insufficient Data</p>
                        <p className="text-[10px] mt-1 italic">
                            {config.metric === 'normalized'
                                ? "Seleziona 2 o più esercizi per vedere la progressione relativa"
                                : config.metric === 'rel_strength'
                                    ? "Seleziona un esercizio per vedere la forza relativa (1RM / Peso Corporeo)"
                                    : "Nessun dato registrato per il periodo selezionato"}
                        </p>
                    </div>
                    {onEdit && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[10px] font-mono tracking-tighter uppercase"
                            onClick={() => onEdit(config, true)}
                        >
                            Configura Esercizi
                        </Button>
                    )}
                </div>
            )
        }

        const ids = config.params.exerciseIds || []
        const isMulti = ids.length > 1 || config.metric === 'normalized'
        const effectiveType = isMulti && (config.metric === '1rm' || config.metric === 'rel_strength') ? 'line' : config.type

        switch (effectiveType) {
            case 'area':
                if (config.metric === 'sbd') {
                    return (
                        <StackedAreaChart
                            data={data as any[]}
                            areas={[
                                { key: 'squat', color: '#ef4444', name: 'Squat' },
                                { key: 'bench', color: '#3b82f6', name: 'Bench' },
                                { key: 'deadlift', color: '#eab308', name: 'Deadlift' }
                            ]}
                            yAxisUnit="kg"
                        />
                    )
                }
                return (
                    <TrendChart
                        data={data as any[]}
                        comparisonData={config.params.showComparison ? comparison : undefined}
                        primaryColor={getMetricColor(config.metric)}
                        unit={getMetricUnit(config.metric)}
                    />
                )
            case 'line':
                return (
                    <MultiLineChart
                        data={data as any[]}
                        lines={getLineConfig(config, namesMap)}
                        yAxisUnit={getMetricUnit(config.metric)}
                    />
                )
            case 'bar':
                return (
                    <StackedBarChart
                        data={data as any[]}
                        bars={getBarConfig(config.metric)}
                        yAxisUnit={getMetricUnit(config.metric)}
                    />
                )
            case 'radar':
                return (
                    <RadarChart
                        data={data as any[]}
                        dataKey="value"
                        categoryKey="subject"
                        color={getMetricColor(config.metric)}
                    />
                )
            case 'histogram':
                return (
                    <HistogramChart
                        data={data as any[]}
                        xKey="rir"
                        yKey="count"
                        color={getMetricColor(config.metric)}
                    />
                )
            case 'scatter':
                return <ScatterChart data={data as any[]} />
            default:
                return <div className="h-[300px] flex items-center justify-center">Unknown Metric</div>
        }
    }

    const headerAction = (onDelete || onEdit) ? (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
                {onEdit && (
                    <>
                        <DropdownMenuItem onClick={() => onEdit(config)} className="gap-2 text-xs font-mono uppercase">
                            <Edit2 className="size-3" />
                            Full Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(config, true)} className="gap-2 text-xs font-mono uppercase">
                            <Settings2 className="size-3" />
                            Quick Switch
                        </DropdownMenuItem>
                    </>
                )}
                {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(config.id)} className="gap-2 text-xs font-mono uppercase text-destructive focus:text-destructive">
                        <Trash2 className="size-3" />
                        Delete
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    ) : null

    return (
        <AnalysisGridItem colSpan={config.colSpan}>
            <Card className="border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div
                        className={cn(
                            "flex flex-col gap-0.5 transition-all cursor-default",
                            (config.metric === '1rm' || config.metric === 'rel_strength' || config.metric === 'normalized') && onEdit && "cursor-pointer hover:opacity-70"
                        )}
                        onClick={() => {
                            if (onEdit && (config.metric === '1rm' || config.metric === 'rel_strength' || config.metric === 'normalized')) {
                                onEdit(config, true)
                            }
                        }}
                    >
                        <CardTitle className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            {config.title}
                            {(config.metric === '1rm' || config.metric === 'rel_strength' || config.metric === 'normalized') && onEdit && (
                                <Edit2 className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </CardTitle>
                        <CardDescription className="text-xl font-heading text-foreground tracking-tight leading-none truncate max-w-[200px]">
                            {config.metric === 'sbd' ? 'SBD Total' : (renderHeaderInfo(config, chartData) || '---')}
                        </CardDescription>
                    </div>
                    {headerAction}
                </CardHeader>
                <div className="p-0">
                    <div className="h-[300px] w-full p-4">
                        {renderChart()}
                    </div>
                </div>
            </Card>
        </AnalysisGridItem>
    )
}

const renderHeaderInfo = (config: SmartChartConfig, data: any) => {
    if (!data) return null

    // Handle multi-exercise data structure
    const isMulti = config.params.exerciseIds && config.params.exerciseIds.length > 1
    if (isMulti) {
        return `${config.params.exerciseIds?.length} Esercizi`
    }

    const points = data?.points || (Array.isArray(data) ? data : [])
    const latest = points[points.length - 1]

    if (!latest) return null

    if (config.metric === '1rm') {
        const exId = config.params.exerciseIds?.[0] || (config.params as any).exerciseId
        const val = latest[exId] || latest.value
        return val ? `${val} kg` : null
    }

    if (config.metric === 'rel_strength') {
        const exId = config.params.exerciseIds?.[0] || (config.params as any).exerciseId
        const val = latest[exId] || latest.value
        return val ? `${val} xBW` : null
    }

    if (config.metric === 'dots') {
        return `${latest.dots || latest.value || '---'}`
    }

    return latest.value
}

function getMetricColor(metric: string) {
    const colors: Record<string, string> = {
        '1rm': '#00ffa3',
        'volume': '#3b82f6',
        'bodyweight': '#a3a3a3',
        'hard_sets': '#facc15',
        'intensity': '#f97316',
        'rel_strength': '#ec4899',
        'dots': '#8b5cf6'
    }
    return colors[metric] || '#ffffff'
}

function getMetricUnit(metric: string) {
    const units: Record<string, string> = {
        '1rm': 'kg',
        'volume': 'kg',
        'bodyweight': 'kg',
        'hard_sets': 'sets',
        'rel_strength': 'x',
        'dots': 'pts'
    }
    return units[metric] || ''
}

function getBarConfig(metric: string) {
    if (metric === 'muscle_volume') {
        return [
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
        ]
    }
    return []
}

function getLineConfig(config: SmartChartConfig, namesMap: Record<string, string>) {
    const ids = config.params.exerciseIds || []

    if (config.metric === 'normalized' || (ids.length > 1 && (config.metric === '1rm' || config.metric === 'rel_strength'))) {
        const colors = ['#00ffa3', '#3b82f6', '#f97316', '#ef4444', '#eab308']
        return ids.map((id, i) => ({
            key: id,
            color: colors[i % colors.length],
            name: namesMap[id] || `Ex ${i + 1}`
        }))
    }

    if (config.metric === 'dots') {
        return [{ key: 'value', color: '#8b5cf6', name: config.params.compMetric?.toUpperCase() || 'DOTS' }]
    }
    if (config.metric === 'rel_strength') {
        return [{ key: 'value', color: '#ec4899', name: 'Ratio (xBW)' }]
    }
    if (config.metric === '1rm') {
        return [{ key: 'value', color: '#00ffa3', name: '1RM' }]
    }
    return []
}
