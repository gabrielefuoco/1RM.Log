"use client"

import { Exercise, TemplateExercise } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, ChevronRight, ChevronLeft, Trash2, Plus, Info, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTranslations } from "next-intl"

interface SessionHeaderProps {
    exercise: Exercise
    templateData?: TemplateExercise | null
    currentExerciseIndex: number
    totalExercises: number
    nextExercise?: Exercise | null
    nextTemplateData?: TemplateExercise | null
    isDeload?: boolean
    onToggleDeload?: () => void
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
    isDeload,
    onToggleDeload,
    onBack,
    onAddExercise,
    onRemoveExercise,
    onSwapExercise,
    className
}: SessionHeaderProps) {
    const t = useTranslations("Workout")
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
                    <Badge className="bg-muted/50 text-muted-foreground border-border uppercase text-[9px] tracking-[0.1em] font-black px-2 py-0.5">
                        {exercise.type || t("exercise")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground/70 font-black tracking-tighter uppercase">
                        {currentExerciseIndex + 1} / {totalExercises}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {onToggleDeload && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleDeload}
                            className={cn(
                                "h-7 px-2 text-[9px] font-black uppercase tracking-[0.15em] border transition-all mr-1",
                                isDeload
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                            )}
                        >
                            {isDeload ? "DL ON" : "DL"}
                        </Button>
                    )}
                    {onRemoveExercise && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-900/40 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 transition-colors"
                            onClick={onRemoveExercise}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    {onSwapExercise && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground/70 hover:text-primary h-8 w-8 transition-colors"
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
                            className="text-primary hover:bg-primary/5 h-8 w-8 transition-colors"
                            onClick={onAddExercise}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Exercise Name */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-foreground italic leading-[0.9] uppercase tracking-tighter">
                    {exercise.name}
                </h1>
                <p className="text-[9px] text-primary/60 uppercase tracking-[0.25em] font-black">
                    {Array.isArray(exercise.body_parts) ? exercise.body_parts.join(' • ') : exercise.body_parts}
                </p>
            </div>

            {/* Target Card: Redesigned for Industrial Look */}
            {templateData && (
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative flex items-center bg-muted/60 rounded-2xl border border-border overflow-hidden">
                        {/* Status bar left accent */}
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 transition-colors shadow-sm shadow-primary/40",
                            isDeload ? "bg-purple-500 shadow-sm shadow-purple-500/40" : "bg-primary"
                        )}></div>

                        <div className="flex-1 py-4 pl-4 text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{t("sets")}</p>
                            <p className="text-2xl font-black text-foreground mt-0.5 leading-none">{templateData.target_sets}</p>
                        </div>
                        <div className="w-px h-10 bg-border"></div>
                        <div className="flex-1 py-4 text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">RIR</p>
                            <p className={cn(
                                "text-2xl font-black mt-0.5 leading-none",
                                isDeload ? "text-purple-400" : "text-primary shadow-primary/20"
                            )}>
                                {templateData.target_rir ?? '-'}
                            </p>
                        </div>
                        <div className="w-px h-10 bg-border"></div>
                        <div className="flex-1 py-4 text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{t("reps")}</p>
                            <p className="text-2xl font-black text-foreground mt-0.5 leading-none">
                                {templateData.target_reps_min}<span className="text-xs text-muted-foreground/70 mx-0.5">-</span>{templateData.target_reps_max}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Next Exercise Preview */}
            {nextExercise && (
                <div
                    className={cn(
                        "transition-all duration-300 ease-in-out cursor-pointer",
                        "bg-muted/30 rounded-2xl border border-border",
                        isExpanded ? "p-4 space-y-4" : "px-4 py-3"
                    )}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center transition-all duration-300",
                            isExpanded && "bg-primary/20 shadow-sm shadow-primary/30"
                        )}>
                            <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-all", isExpanded && "text-primary rotate-90")} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-[0.1em] font-black">{t("nextPrefix")}:</p>
                            <p className="text-base font-black text-foreground italic truncate">{nextExercise.name.toUpperCase()}</p>
                        </div>
                        {!isExpanded && <Info className="h-4 w-4 text-muted-foreground/50" />}
                    </div>

                    {isExpanded && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            {nextTemplateData ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-muted/50 rounded-xl p-2 border border-border text-center">
                                        <p className="text-[9px] text-muted-foreground uppercase font-black">{t("sets")}</p>
                                        <p className="text-lg font-black text-foreground">{nextTemplateData.target_sets}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-2 border border-border text-center">
                                        <p className="text-[9px] text-muted-foreground uppercase font-black">{t("reps")}</p>
                                        <p className="text-lg font-black text-foreground">{nextTemplateData.target_reps_min}-{nextTemplateData.target_reps_max}</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-xl p-2 border border-border text-center">
                                        <p className="text-[9px] text-muted-foreground uppercase font-black">RIR</p>
                                        <p className="text-lg font-black text-primary">{nextTemplateData.target_rir ?? '-'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic text-center py-2 bg-muted/30 rounded-xl border border-border">{t("noTarget")}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
