"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface MultiLineChartProps {
    data: any[]
    lines: {
        key: string
        color: string
        name?: string
    }[]
    yAxisUnit?: string
}

export function MultiLineChart({ data, lines, yAxisUnit }: MultiLineChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground/50 font-mono text-sm uppercase">Insufficient Data</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    tickFormatter={(val) => Math.round(val).toString()}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                    itemStyle={{ fontSize: "12px" }}
                    labelStyle={{ marginBottom: "5px", color: "#999" }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('it-IT')}
                />
                <Legend iconType="circle" />
                {lines.map((line) => (
                    <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        name={line.name || line.key}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}
