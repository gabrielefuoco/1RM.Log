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
        <div className="w-full h-[350px] w-full">
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
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-card/95 backdrop-blur border border-border/50 p-3 rounded-lg shadow-xl">
                                        <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">{payload[0].payload.fullDate}</p>
                                        <p className="text-lg font-heading text-foreground font-bold flex items-center gap-2">
                                            {Number(payload[0].value).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                                        </p>
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
