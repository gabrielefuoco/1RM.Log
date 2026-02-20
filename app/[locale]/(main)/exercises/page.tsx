"use client"

import { useEffect, useState } from "react"
import { getExercises, searchExercises } from "@/services/exercises"
import { Exercise, BodyPart } from "@/types/database"
import { ExerciseList } from "@/components/exercises/exercise-list"
import { ExerciseDrawer } from "@/components/exercises/exercise-drawer"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ExercisesPage() {
    const t = useTranslations("Exercises")
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
        <div className="space-y-8 pt-4 container-padding">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-foreground italic uppercase tracking-tighter leading-none mb-2">{t("title")}</h1>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">{t("subtitle")}</p>
            </div>

            {/* Search */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    placeholder={t("searchPlaceholder")}
                    className="pl-11 bg-muted/50 border-border text-foreground rounded-2xl h-12 focus:border-primary/20 focus:bg-muted/70 transition-all placeholder:text-muted-foreground font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <ExerciseList exercises={exercises} isLoading={loading} onRefresh={loadData} />

            {/* Create Action */}
            <ExerciseDrawer mode="create" onSuccess={loadData} />
        </div>
    )
}
