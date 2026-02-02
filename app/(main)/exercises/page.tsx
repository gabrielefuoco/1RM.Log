"use client"

import { useEffect, useState } from "react"
import { getExercises, searchExercises } from "@/services/exercises"
import { Exercise, BodyPart } from "@/types/database"
import { ExerciseList } from "@/components/exercises/exercise-list"
import { CreateExerciseDrawer } from "@/components/exercises/create-exercise-drawer"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const loadData = async () => {
        setLoading(true)
        const data = await getExercises()
        setExercises(data)
        setLoading(false)
    }

    // Initial load
    useEffect(() => {
        loadData()
    }, [])

    // Search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.length > 1) {
                setLoading(true)
                const results = await searchExercises(search)
                setExercises(results)
                setLoading(false)
            } else if (search.length === 0) {
                loadData()
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [search])


    return (
        <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Esercizi</h1>
                <p className="text-sm text-slate-400">Database personale e preferiti.</p>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                </div>
                <Input
                    placeholder="Cerca esercizio..."
                    className="pl-10 bg-zinc-900/50 border-white/10 text-white rounded-xl h-12"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <ExerciseList exercises={exercises} isLoading={loading} onRefresh={loadData} />

            {/* Create Action */}
            <CreateExerciseDrawer onSuccess={loadData} />
        </div>
    )
}
