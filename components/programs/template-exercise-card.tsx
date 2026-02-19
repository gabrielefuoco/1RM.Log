"use client"

import { TemplateExercise } from "@/types/database"
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card"
import { useExerciseHistory } from "@/hooks/use-exercise-history"
import { Button } from "@/components/ui/button"
import { Trash2, TrendingUp, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"


interface TemplateExerciseCardProps {
    exercise: TemplateExercise
    index: number
    onEdit: (exercise: TemplateExercise) => void
    onRemove: (id: string, name: string) => void
}

export function TemplateExerciseCard({
    exercise,
    index,
    onEdit,
    onRemove
}: TemplateExerciseCardProps) {
    const sets = exercise.sets_data || []
    const progressionMode = exercise.progression_mode || 'static'
    const bodyParts = exercise.exercise?.body_parts || []

    const { data: historyData } = useExerciseHistory(exercise.exercise_id)

    return (
        <WorkoutExerciseCard
            title={exercise.exercise?.name || "Exercise"}
            index={index}
            mode="template"
            items={sets}
            onClick={() => onEdit(exercise)}

            subtitle={
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex flex-wrap gap-1">
                        {bodyParts.slice(0, 3).map((bp) => (
                            <Badge key={bp} variant="secondary" className="text-[9px] h-3.5 px-1.5 bg-white/5 text-zinc-500 border-none font-black uppercase tracking-tighter">
                                {bp}
                            </Badge>
                        ))}
                    </div>
                    {progressionMode !== 'static' && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1.5 bg-primary/10 border-none text-primary font-black uppercase tracking-tighter flex items-center gap-1">
                            <TrendingUp className="h-2 w-2" />
                            {progressionMode === 'auto_double' ? 'Double' : progressionMode === 'auto_linear' ? 'Linear' : 'Custom'}
                        </Badge>
                    )}
                </div>
            }
            actions={
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove(exercise.id, exercise.exercise?.name || "Esercizio")
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            }
        />
    )
}
