export type SmartChartMetric =
    | '1rm'
    | 'volume'
    | 'sbd'
    | 'intensity'
    | 'muscle_balance'
    | 'muscle_volume'
    | 'bodyweight'
    | 'rel_strength'
    | 'dots'
    | 'hard_sets'
    | 'fatigue'
    | 'normalized'

export type SmartChartType =
    | 'area'
    | 'bar'
    | 'line'
    | 'radar'
    | 'scatter'
    | 'histogram'

export interface SmartChartConfig {
    id: string
    title: string
    subtitle?: string
    metric: SmartChartMetric
    type: SmartChartType
    colSpan: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12
    params: {
        exerciseIds?: string[]
        periodDays: number
        showComparison?: boolean
        compMetric?: 'dots' | 'wilks' | 'ipf'
        squatId?: string
        benchId?: string
        deadliftId?: string
    }
    showInHome?: boolean
    order?: number
}

export const CHART_PRESETS: SmartChartConfig[] = [
    {
        id: 'trend_1rm',
        title: 'Andamento 1RM',
        subtitle: 'Stima del massimale nel tempo',
        metric: '1rm',
        type: 'area',
        colSpan: 8,
        params: { periodDays: 90, showComparison: true }
    },
    {
        id: 'weekly_volume',
        title: 'Volume Settimanale',
        metric: 'volume',
        type: 'area',
        colSpan: 4,
        params: { periodDays: 90, showComparison: true }
    },
    {
        id: 'normalized_trend',
        title: 'Progressione Relativa',
        metric: 'normalized',
        type: 'line',
        colSpan: 12,
        params: { periodDays: 90, exerciseIds: [] }
    },
    {
        id: 'muscle_volume_stack',
        title: 'Volume per Muscolo',
        metric: 'muscle_volume',
        type: 'bar',
        colSpan: 12,
        params: { periodDays: 90 }
    },
    {
        id: 'sbd_total',
        title: 'SBD Total',
        metric: 'sbd',
        type: 'area',
        colSpan: 8,
        params: { periodDays: 180 }
    },
    {
        id: 'muscle_balance_radar',
        title: 'Bilanciamento Muscolare',
        metric: 'muscle_balance',
        type: 'radar',
        colSpan: 4,
        params: { periodDays: 30 }
    },
    {
        id: 'rir_distribution',
        title: 'Distribuzione Intensità',
        metric: 'intensity',
        type: 'histogram',
        colSpan: 6,
        params: { periodDays: 90 }
    },
    {
        id: 'bodyweight_trend',
        title: 'Peso Corporeo',
        metric: 'bodyweight',
        type: 'area',
        colSpan: 6,
        params: { periodDays: 90 }
    },
    {
        id: 'rel_strength_trend',
        title: 'Forza Relativa',
        metric: 'rel_strength',
        type: 'line',
        colSpan: 12,
        params: { periodDays: 90 }
    },
    {
        id: 'comp_points_trend',
        title: 'Punti Competizione',
        metric: 'dots',
        type: 'line',
        colSpan: 12,
        params: { periodDays: 180, compMetric: 'dots' }
    },
    {
        id: 'hard_sets_trend',
        title: 'Sets Allenanti',
        metric: 'hard_sets',
        type: 'area',
        colSpan: 6,
        params: { periodDays: 90 }
    },
    {
        id: 'fatigue_scatter',
        title: 'Analisi Fatica',
        metric: 'fatigue',
        type: 'scatter',
        colSpan: 6,
        params: { periodDays: 90 }
    }
]

export interface DashboardConfig {
    visibility?: Record<string, boolean>
    customCharts?: SmartChartConfig[]
}
