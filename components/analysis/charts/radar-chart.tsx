"use client"

import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from "recharts"

interface RadarChartProps {
    data: any[]
    dataKey: string // The key for value (e.g. "value" or "count")
    categoryKey: string // The key for label (e.g. "subject" or "muscle")
    color?: string
}

export function RadarChart({ data, dataKey, categoryKey, color = "#00ffa3" }: RadarChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nessun dato disponibile</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey={categoryKey} tick={{ fill: '#999', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                    name="Volume"
                    dataKey={dataKey}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                    itemStyle={{ color: color }}
                />
            </RechartsRadar>
        </ResponsiveContainer>
    )
}
