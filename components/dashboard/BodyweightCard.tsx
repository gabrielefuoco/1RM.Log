"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Scale, Plus, History as HistoryIcon, Loader2 } from "lucide-react"
import { useBodyweight } from "@/hooks/use-bodyweight"
import { useRouter } from "next/navigation"
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function BodyweightCard() {
    const router = useRouter()
    const { history, latest, addWeight, isAdding, isLoading } = useBodyweight(7)
    const [newWeight, setNewWeight] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)

    const handleAdd = async () => {
        if (!newWeight || isAdding) return
        const weight = parseFloat(newWeight)
        if (isNaN(weight)) return

        await addWeight({ weight })
        setNewWeight("")
        setIsExpanded(false)
    }

    // Prepare chart data
    const chartData = [...history].reverse().map(log => ({
        weight: log.weight,
        date: format(new Date(log.date), "dd/MM")
    }))

    return (
        <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/10 bg-secondary/5">
                <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs font-heading font-bold tracking-widest text-muted-foreground uppercase">
                        Peso Corporeo
                    </CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Plus className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                {isExpanded ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Esempio: 82.5"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="h-10 text-lg font-bold"
                                autoFocus
                            />
                            <Button
                                onClick={handleAdd}
                                disabled={!newWeight || isAdding}
                                className="h-10 px-6 font-bold"
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "SALVA"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-4xl font-heading font-black tracking-tighter text-foreground decoration-primary/30 underline-offset-8">
                                {isLoading ? "---" : (latest?.weight?.toFixed(1) || "--")}
                                <span className="text-sm font-bold text-muted-foreground ml-1 uppercase">kg</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                                {latest ? format(new Date(latest.date), "eeee d MMMM", { locale: it }) : "Nessun dato"}
                            </p>
                        </div>

                        {chartData.length > 1 && (
                            <div className="h-16 w-32 ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="var(--color-primary)"
                                            strokeWidth={3}
                                            dot={false}
                                            animationDuration={1000}
                                        />
                                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {!isExpanded && (
                    <Button
                        variant="ghost"
                        className="w-full mt-4 h-8 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-primary border-t border-border/5 rounded-none"
                        onClick={() => router.push('/bodyweight')}
                    >
                        <HistoryIcon className="w-3 h-3 mr-2" />
                        Vedi Storico Completo
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
