"use client"

import { ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface ScatterPoint {
    x: number
    y: number
    date?: string
}

interface ScatterChartProps {
    data: ScatterPoint[]
    xLabel?: string
    yLabel?: string
    color?: string
}

export function ScatterChart({
    data,
    xLabel = 'Volume (k)',
    yLabel = 'RPE Media',
    color = "#3b82f6"
}: ScatterChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-muted-foreground text-sm uppercase">Insufficient Data</div>
    }

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsScatter margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="x"
                        name={xLabel}
                        stroke="#888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: xLabel, position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#888' }}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name={yLabel}
                        stroke="#888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 10]}
                        label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
                    />
                    <ZAxis type="number" range={[50, 400]} />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const p = payload[0].payload
                                return (
                                    <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-xs">
                                        {p.date && <p className="font-mono text-muted-foreground mb-1">{format(new Date(p.date), 'dd MMM yyyy', { locale: it })}</p>}
                                        <p className="font-heading"><span className="text-muted-foreground">{xLabel}:</span> {Number(p.x).toFixed(2)}</p>
                                        <p className="font-heading"><span className="text-muted-foreground">{yLabel}:</span> {Number(p.y).toFixed(2)}</p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Scatter name="Sessions" data={data} fill={color} strokeWidth={1} />
                </RechartsScatter>
            </ResponsiveContainer>
        </div>
    )
}
