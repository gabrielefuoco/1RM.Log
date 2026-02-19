"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts"

interface TrendChartProps {
    data: any[]
    comparisonData?: any[]
    primaryColor: string
    unit?: string
}

export function TrendChart({ data, comparisonData, primaryColor, unit }: TrendChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nessun dato disponibile</div>
    }

    // Determine Y domain padding
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1
    const yDomain = [Math.max(0, min - padding), max + padding]

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={10}
                    tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    stroke="#666"
                    fontSize={10}
                    unit={unit}
                    domain={yDomain}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => Math.round(val).toString()}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: '8px', color: "#fff" }}
                    itemStyle={{ fontSize: "12px", color: primaryColor }}
                    labelStyle={{ marginBottom: "5px", color: "#999", fontSize: '10px', textTransform: 'uppercase' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    formatter={(value: any) => [`${Number(value).toFixed(2)} ${unit || ''}`, 'Valore']}
                />

                {/* Comparison Period if exists */}
                {comparisonData && (
                    <Area
                        type="monotone"
                        data={comparisonData}
                        dataKey="value"
                        stroke="#666"
                        fill="transparent"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        connectNulls
                        isAnimationActive={false}
                    />
                )}

                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={primaryColor}
                    fillOpacity={1}
                    fill="url(#colorTrend)"
                    strokeWidth={3}
                    connectNulls
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
