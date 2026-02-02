"use client"

import { Exercise, TemplateExercise } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionHeaderProps {
    exercise: Exercise
    templateData: TemplateExercise
    currentExerciseIndex: number
    totalExercises: number
    nextExercise?: Exercise | null
}

export function SessionHeader({
    exercise,
    templateData,
    currentExerciseIndex,
    totalExercises,
    nextExercise
}: SessionHeaderProps) {
    return (
        <div className="space-y-4">
            {/* Top Row: Badge + Counter + Menu */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge className="bg-zinc-800 text-slate-300 border-0 uppercase text-[10px] tracking-wider font-medium px-2 py-0.5">
                        {exercise.type || 'Esercizio'}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                        {currentExerciseIndex + 1} / {totalExercises}
                    </span>
                </div>
                <Button size="icon" variant="ghost" className="text-slate-400 h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>

            {/* Exercise Name */}
            <div>
                <h1 className="text-2xl font-bold text-white leading-tight">{exercise.name}</h1>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{exercise.body_part}</p>
            </div>

            {/* Stats Bar with Green Accent */}
            <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 overflow-hidden">
                {/* Green left accent */}
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full"></div>

                <div className="flex-1 py-3 pl-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Serie</p>
                    <p className="text-xl font-bold text-white mt-0.5">{templateData.target_sets}</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex-1 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">RIR</p>
                    <p className="text-xl font-bold text-primary mt-0.5">{templateData.target_rir ?? '-'}</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex-1 py-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Reps</p>
                    <p className="text-xl font-bold text-white mt-0.5">
                        {templateData.target_reps_min}-{templateData.target_reps_max}
                    </p>
                </div>
            </div>

            {/* Next Exercise Preview */}
            {nextExercise && (
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">A Seguire:</p>
                        <p className="text-sm text-white font-medium">{nextExercise.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                </div>
            )}
        </div>
    )
}
