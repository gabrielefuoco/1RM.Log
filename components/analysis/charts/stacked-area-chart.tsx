"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface StackedAreaChartProps {
    data: any[]
    areas: {
        key: string
        color: string
        name?: string
    }[]
    yAxisUnit?: string
}

export function StackedAreaChart({ data, areas, yAxisUnit }: StackedAreaChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nessun dato disponibile</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    {areas.map(area => (
                        <linearGradient key={area.key} id={`gravity-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={area.color} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                    dataKey="date"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#666"
                    fontSize={12}
                    unit={yAxisUnit}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                    itemStyle={{ fontSize: "12px" }}
                    labelStyle={{ marginBottom: "5px", color: "#999" }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('it-IT')}
                />
                <Legend iconType="circle" />
                {areas.map((area) => (
                    <Area
                        key={area.key}
                        type="monotone"
                        dataKey={area.key}
                        name={area.name || area.key}
                        stackId="1" // Stack them
                        stroke={area.color}
                        fill={`url(#gravity-${area.key})`}
                        strokeWidth={2}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    )
}
