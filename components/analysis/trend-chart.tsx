"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface DataPoint {
    date: string | Date
    value: number
    secondaryValue?: number
}

interface TrendChartProps {
    data: DataPoint[]
    comparisonData?: DataPoint[]
    primaryColor?: string
    unit?: string
}


export function TrendChart({
    data,
    comparisonData,
    primaryColor = "#00ffa3",
    unit = "kg"
}: TrendChartProps) {


    // Fallback if no primary color is passed, utilize CSS variable if possible or default hex
    // Since we are in client component, we use the hex provided or default neon

    const formattedData = useMemo(() => {
        // Find longest array or handle mismatch
        const base = data.map((d, i) => ({
            ...d,
            dateStr: format(new Date(d.date), 'dd MMM', { locale: it }),
            fullDate: format(new Date(d.date), 'dd MMMM yyyy', { locale: it }),
            compareValue: comparisonData?.[i]?.value ?? null
        }))
        return base
    }, [data, comparisonData])

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground/50 font-mono text-sm uppercase">
                Insufficient Data
            </div>
        )
    }


    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="dateStr"
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        fontFamily="var(--font-jetbrains-mono)"
                    />
                    <YAxis
                        stroke="#71717a"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}`}
                        fontFamily="var(--font-jetbrains-mono)"
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload
                                const current = Number(payload[0].value)
                                const compare = data.compareValue !== null ? Number(data.compareValue) : null
                                const diff = compare !== null ? ((current - compare) / compare) * 100 : null

                                return (
                                    <div className="bg-card/95 backdrop-blur border border-border p-3 rounded-lg shadow-xl min-w-[140px]">
                                        <p className="text-[10px] text-muted-foreground font-mono uppercase mb-2 border-b border-border/50 pb-1">
                                            {data.fullDate}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-baseline gap-4">
                                                <span className="text-[10px] text-muted-foreground font-mono uppercase">Attuale</span>
                                                <span className="text-sm font-bold text-foreground">
                                                    {current.toFixed(1)} <span className="text-[10px] text-muted-foreground">{unit}</span>
                                                </span>
                                            </div>
                                            {compare !== null && (
                                                <>
                                                    <div className="flex justify-between items-baseline gap-4">
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">Precedente</span>
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            {compare.toFixed(1)} <span className="text-[10px]">{unit}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-baseline gap-4 pt-1 border-t border-border/30">
                                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">Progresso</span>
                                                        <span className={`text-xs font-bold ${diff! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {diff! >= 0 ? '+' : ''}{diff!.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    {comparisonData && (
                        <Area
                            type="monotone"
                            dataKey="compareValue"
                            stroke="#71717a"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            fill="transparent"
                            activeDot={false}
                        />
                    )}
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={primaryColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#ffffff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
