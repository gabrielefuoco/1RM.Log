"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ExerciseChart } from "@/components/analytics/exercise-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AnalyticsPage() {
    const [exercises, setExercises] = useState<{ id: string, name: string }[]>([])
    const [selectedExercise, setSelectedExercise] = useState<string>("")
    const [chartData, setChartData] = useState<{ date: string, value: number }[]>([])

    // Load exercises list
    useEffect(() => {
        const loadExercises = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('exercises').select('id, name').order('name')
            if (data) {
                setExercises(data)
                if (data.length > 0) setSelectedExercise(data[0].id)
            }
        }
        loadExercises()
    }, [])

    // Load chart data when exercise changes
    useEffect(() => {
        if (!selectedExercise) return

        const loadData = async () => {
            const supabase = createClient()
            // Get estimated 1RM over time, joined with session date
            const { data } = await supabase
                .from('exercise_logs')
                .select(`
                    estimated_1rm,
                    workout_sessions!inner (
                        date
                    )
                `)
                .eq('exercise_id', selectedExercise)
                .order('date', { foreignTable: 'workout_sessions', ascending: true })

            if (data) {
                // Group by date (keep max 1RM per day)
                const bestPerDay = new Map<string, number>()

                data.forEach((log: any) => {
                    if (!log.estimated_1rm || log.estimated_1rm <= 0) return

                    // Normalize date to YYYY-MM-DD to avoid duplicates on same day
                    // Assuming session date is what we want on axis
                    const rawDate = log.workout_sessions?.date
                    if (!rawDate) return

                    // Group by calendar day (ignore time) using ISO string YYYY-MM-DD
                    const dayKey = typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0]

                    const currentMax = bestPerDay.get(dayKey) || 0
                    if (log.estimated_1rm > currentMax) {
                        bestPerDay.set(dayKey, log.estimated_1rm)
                    }
                })

                // Convert back to array
                const formatted = Array.from(bestPerDay.entries()).map(([date, value]) => ({
                    date,
                    value
                }))

                // Sort by date just to be safe
                formatted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                setChartData(formatted)
            }
        }
        loadData()
    }, [selectedExercise])


    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Analisi</h1>
                <p className="text-sm text-slate-400">Trend e progressi.</p>
            </div>

            {/* Controls */}
            <div>
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                        <SelectValue placeholder="Seleziona Esercizio" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-64">
                        {exercises.map(ex => (
                            <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Charts */}
            <div className="space-y-6">
                <ExerciseChart
                    title="Progresso 1RM Stimato (kg)"
                    data={chartData}
                    color="#13ec6d"
                />

                {/* Volume placeholder */}
                <ExerciseChart
                    title="Volume Totale (Dimostrativo)"
                    data={chartData.map(d => ({ ...d, value: d.value * 5 }))}
                    color="#3b82f6"
                />
            </div>
        </div>
    )
}
