"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface ExerciseChartProps {
    title: string
    data: { date: string; value: number }[]
    color?: string
}

export function ExerciseChart({ title, data, color = "#13ec6d" }: ExerciseChartProps) {
    if (data.length === 0) {
        return (
            <Card className="bg-zinc-900/40 border-white/5">
                <CardHeader>
                    <CardTitle className="text-white text-sm uppercase tracking-wider">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                    <p className="text-slate-500 text-xs">Dati insufficienti</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-zinc-900/40 border-white/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm uppercase tracking-wider">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                fontSize={10}
                                tickFormatter={(val) => format(new Date(val), 'd MMM', { locale: it })}
                                minTickGap={30}
                            />
                            <YAxis stroke="#666" fontSize={10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                                itemStyle={{ color: color }}
                                labelFormatter={(val) => format(new Date(val), 'd MMM yyyy', { locale: it })}
                                formatter={(value: any) => [Number(value).toFixed(2), "Kg"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
