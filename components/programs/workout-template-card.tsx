"use client"

import { WorkoutTemplate, TemplateExercise } from "@/types/database"
import { UniversalListCard } from "@/components/ui/universal-list-card"
import { Button } from "@/components/ui/button"
import { Play, Dumbbell, Calendar, Clock, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WorkoutTemplateCardProps {
    template: WorkoutTemplate & { template_exercises: any[] }
    index: number
    onPlay: (id: string) => void
    onClick: (id: string) => void
}

export function WorkoutTemplateCard({
    template,
    index,
    onPlay,
    onClick
}: WorkoutTemplateCardProps) {
    const exercises = template.template_exercises || []
    const exerciseCount = exercises.length

    // Extract unique body parts from exercises if available
    // Note: The joined data might need to include the exercise details (body_parts)
    // We'll handle this gracefully if data is missing
    const bodyParts = Array.from(new Set(
        exercises.flatMap(e => e.exercise?.body_parts || [])
    )).slice(0, 3) as string[]

    const mainMuscles = bodyParts.length > 0 ? bodyParts : []

    return (
        <UniversalListCard
            title={template.name}
            index={index}
            onClick={() => onClick(template.id)}
            // Primary Action: Play/Start Workout
            onPrimaryAction={() => onPlay(template.id)}
            primaryActionIcon={<Play className="h-4 w-4 fill-current ml-0.5" />}

            subtitle={
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                        <Dumbbell className="h-3 w-3" />
                        {exerciseCount} Exercises
                    </span>
                    {/* Placeholder for duration */}
                </div>
            }
        >
            {/* Content Slot: Exercise Preview */}
            {exercises.length > 0 ? (
                <div className="space-y-3 pt-2">
                    {/* Muscle Badges */}
                    {mainMuscles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {mainMuscles.map(mp => (
                                <Badge key={mp} variant="secondary" className="text-[9px] h-4 px-1.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-none font-medium">
                                    {mp}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Exercise List Preview (Top 3) */}
                    <div className="space-y-1">
                        {exercises.slice(0, 3).map((ex, i) => (
                            <div key={ex.id || i} className="flex items-center gap-2 text-xs text-zinc-400">
                                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="truncate">{ex.exercise?.name || "Exercise"}</span>
                                <span className="text-zinc-600 ml-auto font-mono text-[10px]">
                                    {ex.target_sets} sets
                                </span>
                            </div>
                        ))}
                        {exercises.length > 3 && (
                            <div className="text-[10px] text-zinc-600 pl-3 italic">
                                + {exercises.length - 3} more...
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-zinc-600 italic pt-2">
                    No exercises added yet.
                </div>
            )}
        </UniversalListCard>
    )
}
