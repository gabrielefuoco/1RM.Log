"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface StackedBarChartProps {
    data: any[]
    bars: { key: string, color: string, name: string }[]
    yAxisUnit?: string
}

export function StackedBarChart({ data, bars, yAxisUnit = '' }: StackedBarChartProps) {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}${yAxisUnit}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '12px' }}
                        itemStyle={{ padding: '0px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    {bars.map(bar => (
                        <Bar
                            key={bar.key}
                            dataKey={bar.key}
                            name={bar.name}
                            stackId="a"
                            fill={bar.color}
                            radius={[2, 2, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
