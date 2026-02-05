"use client"

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"

interface HistogramChartProps {
    data: any[]
    xKey: string
    yKey: string
    color?: string
}

export function HistogramChart({ data, xKey, yKey, color = "#60a5fa" }: HistogramChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nessun dato disponibile</div>
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis
                    dataKey={xKey}
                    stroke="#666"
                    fontSize={12}
                    tickMargin={10}
                />
                <YAxis
                    stroke="#666"
                    fontSize={12}
                    allowDecimals={false}
                />
                <Tooltip
                    cursor={{ fill: '#ffffff10' }}
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                    formatter={(value: any) => Number(value).toFixed(2)}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        // Optional: Dynamic coloring based on value?
                        // For now single color
                        <Cell key={`cell-${index}`} fill={color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
