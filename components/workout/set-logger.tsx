import { useEffect, useState } from "react"
import { ExerciseLog, ProgressionSettings, TemplateSet } from "@/types/database"
import { ProgressionResult } from "@/services/progression"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculate1RM, rirToRpe, rpeToRir } from "@/utils/formulas"
import { Check, History, Timer, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

import { PlateCalculator } from "./plate-calculator"
import { calculateSetSuggestion } from "@/hooks/use-set-suggestion"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"
import { useTranslations } from "next-intl"

interface SetLoggerProps {
    setNumber: number
    previousLog?: ExerciseLog
    targetRir: number
    targetRepsMin?: number
    targetRepsMax?: number
    targetPercentage?: number // New
    userBest1RM?: number // New
    isActive?: boolean
    isFuture?: boolean
    onSave: (weight: number, reps: number, rir: number, setType: 'work' | 'warmup' | 'drop' | 'failure') => void
    onRemove?: () => void
    initialValues?: ExerciseLog
    settings: ProgressionSettings | null
    intensityMultiplier?: number
    setType?: 'work' | 'warmup' | 'drop' | 'failure'
    isDeload?: boolean
    templateSet?: TemplateSet

    previousSetWeight?: number
    progressionTarget?: ProgressionResult
}

export function SetLogger({
    setNumber,
    previousLog,
    targetRir,
    targetRepsMin,
    targetRepsMax,
    targetPercentage,
    userBest1RM,
    isActive = false,
    isFuture = false,
    onSave,
    onRemove,
    initialValues,
    settings,
    intensityMultiplier = 1.0,
    setType = 'work',
    templateSet,
    previousSetWeight,
    isDeload = false,
    progressionTarget
}: SetLoggerProps) {
    const t = useTranslations("Workout")
    // Progression Algorithm
    const calculateSuggestion = () => calculateSetSuggestion({
        previousLog,
        targetRir,
        targetRepsMin,
        targetRepsMax,
        targetPercentage,
        userBest1RM,
        settings,
        intensityMultiplier,
        isDeload,
        templateSet,
        previousSetWeight,
        progressionTarget,
    })

    const [weight, setWeight] = useState<string>(initialValues?.weight.toString() || calculateSuggestion() || (previousLog?.weight?.toString() ?? ""))
    const [reps, setReps] = useState<string>(initialValues?.reps.toString() || previousLog?.reps?.toString() || "")
    const [rir, setRir] = useState<string>(initialValues?.rir?.toString() || (targetRir !== undefined ? targetRir.toString() : "0"))

    // Display value for intensity (RIR or RPE)
    const intensityValue = settings?.intensity_type === 'RPE'
        ? rir !== "" ? rirToRpe(Number(rir)).toString() : ""
        : rir

    const [isSaved, setIsSaved] = useState(!!initialValues)
    const [timer, setTimer] = useState(0)

    useEffect(() => {
        if (isActive && !isSaved) {
            const interval = setInterval(() => setTimer(t => t + 1), 1000)
            return () => clearInterval(interval)
        }
    }, [isActive, isSaved])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleSave = () => {
        if (!weight || !reps) return
        onSave(Number(weight), Number(reps), Number(rir) || 0, setType)
        setIsSaved(true)
    }

    const isProgression = previousLog && weight && Number(weight) > previousLog.weight

    return (
        <div className={cn(
            "p-4 rounded-3xl border transition-all duration-300 relative group",
            isActive
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.01]"
                : isSaved
                    ? "border-border/40 bg-card/60"
                    : "border-border/50 bg-muted/20",
            isFuture && "opacity-40"
        )}
            onClick={() => isSaved && setIsSaved(false)}
        >
            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-400 bg-muted hover:bg-muted/80 rounded-full transition-colors z-10"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Unified Header */}
            <div className={cn(
                "flex flex-wrap items-center justify-between gap-y-2 mb-3 pr-6", // Added pr-6 for close button
                !isActive && "opacity-60"
            )}>
                <div className="flex items-center gap-2">
                    <h4 className={cn(
                        "text-xs font-black tracking-widest uppercase shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                        {t("set")} {setNumber}
                    </h4>
                    {setType === 'warmup' && (
                        <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase tracking-tighter shrink-0">{t("warmup")}</span>
                    )}
                    {isActive && (
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse shrink-0">
                            <Timer className="h-3 w-3" />
                            <span>{formatTime(timer)}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    <Dialog>
                        <DialogTrigger asChild>
                            <div
                                className="flex flex-wrap items-center gap-1.5 cursor-zoom-in"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {(targetRepsMin || targetRir !== undefined || targetPercentage) && setType !== 'warmup' && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-[9px] font-bold uppercase tracking-tight px-2 py-1 rounded-lg border transition-colors hover:bg-muted",
                                        isActive ? "text-foreground bg-accent/40 border-border" : "text-muted-foreground bg-muted border-border/50"
                                    )}>
                                        <span className="text-slate-500 text-[8px]">{t("target")}:</span>
                                        <span>
                                            {targetPercentage ? (
                                                <span className="text-amber-500 mr-1">{targetPercentage}%</span>
                                            ) : null}
                                            {targetRepsMin}{targetRepsMax ? `-${targetRepsMax}` : ''} <span className="text-slate-500 font-normal">{t("reps")}</span>
                                            {targetRir !== undefined && (
                                                <>
                                                    <span className="mx-1 text-white/20">|</span>
                                                    <span className="text-primary/70">
                                                        {settings?.intensity_type === 'RPE' ? `RPE ${rirToRpe(targetRir)}` : `RIR ${targetRir}`}
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {previousLog && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-[9px] uppercase font-black tracking-tight px-2 py-1 rounded-lg border transition-colors hover:bg-muted",
                                        isActive ? "text-primary/80 bg-primary/5 border-primary/20" : "text-primary/40 bg-primary/5 border-transparent"
                                    )}>
                                        <History className="h-3 w-3 opacity-50" />
                                        <span>
                                            {previousLog.weight}KG <span className="opacity-50">×</span> {previousLog.reps}
                                            {previousLog.rir !== null ? (
                                                settings?.intensity_type === 'RPE'
                                                    ? ` @ RPE ${rirToRpe(previousLog.rir)}`
                                                    : ` @ RIR ${previousLog.rir}`
                                            ) : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    {t("setDetails")} {setNumber}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-bold uppercase text-[10px]">
                                    {t("infoDetails")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {(targetRepsMin || targetRir !== undefined || targetPercentage) && setType !== 'warmup' && (
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("targetToday")}</h5>
                                        <div className="bg-muted border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-black text-foreground flex items-baseline gap-2">
                                                    {targetPercentage ? <span className="text-amber-500 text-lg">{targetPercentage}%</span> : null}
                                                    <span>{targetRepsMin}{targetRepsMax ? `-${targetRepsMax}` : ''}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t("objective")}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-primary">
                                                    {targetRir !== undefined
                                                        ? (settings?.intensity_type === 'RPE' ? `RPE ${rirToRpe(targetRir)}` : `RIR ${targetRir}`)
                                                        : '-'}
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t("targetEffort")}</div>
                                            </div>
                                        </div>
                                        {targetPercentage && userBest1RM && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-amber-500 uppercase">{t("calculationBase")} (1RM)</span>
                                                <span className="text-sm font-black text-amber-500">{userBest1RM}KG</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {previousLog && (
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("lastPerformance")}</h5>
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-2">
                                            <div className="shrink-0">
                                                <div className="text-2xl font-black text-foreground">
                                                    {previousLog.weight}<span className="text-xs text-muted-foreground ml-0.5 uppercase">kg</span>
                                                    <span className="mx-1.5 text-slate-700">×</span>
                                                    {previousLog.reps}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">{t("performance")}</div>
                                            </div>
                                            <div className="text-center shrink-0">
                                                <div className="text-2xl font-black text-primary">
                                                    {previousLog.rir !== null
                                                        ? (settings?.intensity_type === 'RPE' ? `RPE ${rirToRpe(previousLog.rir)}` : `RIR ${previousLog.rir}`)
                                                        : '-'}
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t("effort")}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-2xl font-black text-primary/80">
                                                    {(previousLog.weight * (1 + (previousLog.reps || 0) / 30)).toFixed(1)}<span className="text-xs ml-0.5 uppercase">kg</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{t("est1rm")}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isSaved ? (
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-2xl border border-border/40">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-foreground">{weight}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">kg</span>
                        <span className="text-xs text-muted-foreground/30 mx-1">/</span>
                        <span className="text-2xl font-black text-foreground">{reps}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{t("reps")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-primary/60 uppercase tracking-tighter leading-none mb-1">Estimated 1RM</div>
                            <div className="text-sm font-black text-primary leading-none">
                                {calculate1RM(Number(weight), Number(reps))}KG
                            </div>
                        </div>
                        <div className="h-10 min-w-[3rem] px-2 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-black text-xs">
                            {settings?.intensity_type === 'RPE' ? `RPE ${rirToRpe(Number(rir))}` : `RIR ${rir}`}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Progression Hint */}
                    {progressionTarget && progressionTarget.instruction && isActive && (
                        <div className="mb-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                {progressionTarget.instruction}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-7 gap-2 items-end">
                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">{t("weight")}</span>
                                {isActive && <PlateCalculator weight={Number(weight) || 0} maxPlateWeight={settings?.max_plate_weight} />}
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-muted/40 rounded-xl border border-border/40 flex items-center justify-center font-black text-muted-foreground/20">
                                    {previousLog?.weight || '-'}
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className={cn(
                                        "h-11 bg-muted/40 border-border/40 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors",
                                        isProgression && "text-primary shadow-sm shadow-primary/20"
                                    )}
                                    placeholder="0"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                />
                            )}
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center gap-1 mb-1.5 ml-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">{t("reps")}</span>
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-muted/40 rounded-xl border border-border/40 flex items-center justify-center font-black text-muted-foreground/20">
                                    -
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    className="h-11 bg-muted/40 border-border/40 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors"
                                    placeholder="0"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                />
                            )}
                            {/* Suggestion Badge */}
                            {(targetPercentage || (templateSet?.is_backoff && templateSet?.backoff_percent)) && (
                                <div className="flex items-center gap-2 mb-2 justify-center">
                                    {templateSet?.is_backoff && (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-purple-500/10 text-purple-400 border-purple-500/20 px-1.5">
                                            Drop {templateSet.backoff_percent}%
                                        </Badge>
                                    )}
                                    {targetPercentage && (
                                        <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5">
                                            {targetPercentage}% 1RM
                                        </Badge>
                                    )}
                                </div>
                            )}        </div>

                        <div className="col-span-2">
                            <div className="flex items-center gap-1 mb-1.5 ml-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">
                                    {settings?.intensity_type === 'RPE' ? 'RPE' : 'RIR'}
                                </span>
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-muted/40 rounded-xl border border-border/40 flex items-center justify-center font-black text-muted-foreground/20">
                                    -
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={intensityValue}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (settings?.intensity_type === 'RPE') {
                                            const rpe = Number(val)
                                            if (val === "" || (rpe >= 0 && rpe <= 10)) {
                                                const mappedRir = val === "" ? "" : rpeToRir(rpe).toString()
                                                setRir(mappedRir)
                                            }
                                        } else {
                                            setRir(val)
                                        }
                                    }}
                                    className="h-11 bg-muted/40 border-border/40 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors"
                                    placeholder="-"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                />
                            )}
                        </div>

                        <div className="col-span-1">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                }}
                                disabled={!weight || !reps || isFuture}
                                className={cn(
                                    "h-11 w-full rounded-xl p-0",
                                    isActive ? "bg-primary text-black hover:bg-primary/90" : "bg-white/5 text-white/20"
                                )}
                            >
                                <Check className="h-5 w-5 stroke-[3]" />
                            </Button>
                        </div>
                    </div>

                    {isActive && Number(weight) > 0 && Number(reps) > 0 && (
                        <div className="mt-3 py-2 px-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">Est. 1RM:</span>
                            <span className="text-sm font-black text-primary leading-none">{calculate1RM(Number(weight), Number(reps))}KG</span>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
