"use client"

import { Exercise, TemplateExercise } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, ChevronRight, ChevronLeft, Trash2, Plus, Info, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SessionHeaderProps {
    exercise: Exercise
    templateData?: TemplateExercise | null
    currentExerciseIndex: number
    totalExercises: number
    nextExercise?: Exercise | null
    nextTemplateData?: TemplateExercise | null
    onBack?: () => void
    onAddExercise?: () => void
    onRemoveExercise?: () => void
    onSwapExercise?: () => void
    className?: string
}

export function SessionHeader({
    exercise,
    templateData,
    currentExerciseIndex,
    totalExercises,
    nextExercise,
    nextTemplateData,
    onBack,
    onAddExercise,
    onRemoveExercise,
    onSwapExercise,
    className
}: SessionHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className={cn("space-y-4", className)}>
            {/* Top Row: Back (if provided) + Counter + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={onBack}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <Badge className="bg-muted text-muted-foreground border-transparent uppercase text-[10px] tracking-widest font-bold px-2 py-0.5">
                        {exercise.type || 'Esercizio'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold tracking-tighter uppercase">
                        {currentExerciseIndex + 1} / {totalExercises}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {onRemoveExercise && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
                            onClick={onRemoveExercise}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    {onSwapExercise && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            onClick={onSwapExercise}
                            title="Swap Exercise"
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                    )}
                    {onAddExercise && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/5 h-8 w-8"
                            onClick={onAddExercise}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                    {!onAddExercise && !onRemoveExercise && (
                        <Button size="icon" variant="ghost" className="text-muted-foreground h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Exercise Name */}
            <div>
                <h1 className="text-2xl font-bold text-foreground leading-tight uppercase tracking-tight">{exercise.name}</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold">{exercise.body_part}</p>
            </div>

            {/* Stats Bar (Only if templateData exists) */}
            {templateData && (
                <div className="relative flex items-center bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {/* Green left accent */}
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,163,0.5)]"></div>

                    <div className="flex-1 py-3 pl-4 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Serie</p>
                        <p className="text-xl font-bold text-foreground mt-0.5">{templateData.target_sets}</p>
                    </div>
                    <div className="w-px h-10 bg-border"></div>
                    <div className="flex-1 py-3 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">RIR</p>
                        <p className="text-xl font-bold text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.3)] mt-0.5">{templateData.target_rir ?? '-'}</p>
                    </div>
                    <div className="w-px h-10 bg-border"></div>
                    <div className="flex-1 py-3 text-center">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Reps</p>
                        <p className="text-xl font-bold text-foreground mt-0.5">
                            {templateData.target_reps_min}-{templateData.target_reps_max}
                        </p>
                    </div>
                </div>
            )}

            {/* Next Exercise Preview */}
            {nextExercise && (
                <div
                    className={cn(
                        "transition-all duration-300 ease-in-out cursor-pointer",
                        "bg-muted/20 rounded-xl border border-border/50",
                        isExpanded ? "p-4 space-y-3" : "px-4 py-3"
                    )}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-lg bg-muted flex items-center justify-center transition-transform",
                            isExpanded && "rotate-90 bg-primary/20"
                        )}>
                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground", isExpanded && "text-primary")} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Prossimo:</p>
                            <p className="text-sm text-foreground font-bold">{nextExercise.name}</p>
                        </div>
                        {!isExpanded && <Info className="h-4 w-4 text-muted-foreground/30" />}
                    </div>

                    {isExpanded && nextTemplateData && (
                        <div className="grid grid-cols-3 gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-background/40 rounded-lg p-2 border border-border/20 text-center">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">Serie</p>
                                <p className="text-sm font-bold text-foreground">{nextTemplateData.target_sets}</p>
                            </div>
                            <div className="bg-background/40 rounded-lg p-2 border border-border/20 text-center">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">Reps</p>
                                <p className="text-sm font-bold text-foreground">{nextTemplateData.target_reps_min}-{nextTemplateData.target_reps_max}</p>
                            </div>
                            <div className="bg-background/40 rounded-lg p-2 border border-border/20 text-center">
                                <p className="text-[8px] text-muted-foreground uppercase font-black">RIR</p>
                                <p className="text-sm font-bold text-primary">{nextTemplateData.target_rir ?? '-'}</p>
                            </div>
                        </div>
                    )}

                    {isExpanded && !nextTemplateData && (
                        <p className="text-[10px] text-muted-foreground italic text-center py-1">Nessun obiettivo impostato</p>
                    )}
                </div>
            )}
        </div>
    )
}
