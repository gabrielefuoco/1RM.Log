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
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="text-foreground text-sm uppercase tracking-widest font-bold">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-tighter">Dati insufficienti</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-muted/30 border-border/50 overflow-hidden relative">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm uppercase tracking-widest font-bold">{title}</CardTitle>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} strokeOpacity={0.2} />
                            <XAxis
                                dataKey="date"
                                stroke="var(--muted-foreground)"
                                fontSize={10}
                                tickFormatter={(val) => format(new Date(val), 'd MMM', { locale: it })}
                                minTickGap={30}
                                opacity={0.5}
                            />
                            <YAxis stroke="var(--muted-foreground)" fontSize={10} opacity={0.5} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '12px', border: '1px solid var(--border)' }}
                                itemStyle={{ color: color, fontWeight: 'bold' }}
                                labelFormatter={(val) => format(new Date(val), 'd MMM yyyy', { locale: it })}
                                formatter={(value: any) => [Number(value).toFixed(1), "Kg"]}
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
