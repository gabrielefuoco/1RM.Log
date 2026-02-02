"use client"

import { useEffect, useState } from "react"
import { ExerciseLog } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculate1RM } from "@/utils/formulas"
import { Check, History, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

import { ProgressionSettings, ProgressionCalculator } from "@/services/progression"
import { PlateCalculator } from "./plate-calculator"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"

interface SetLoggerProps {
    setNumber: number
    previousLog?: ExerciseLog
    targetRir: number
    targetRepsMin?: number
    targetRepsMax?: number
    isActive?: boolean
    isFuture?: boolean
    onSave: (weight: number, reps: number, rir: number, setType: 'work' | 'warmup' | 'drop' | 'failure') => void
    initialValues?: ExerciseLog
    settings: ProgressionSettings | null
    intensityMultiplier?: number
    setType?: 'work' | 'warmup' | 'drop' | 'failure'
}

export function SetLogger({
    setNumber,
    previousLog,
    targetRir,
    targetRepsMin,
    targetRepsMax,
    isActive = false,
    isFuture = false,
    onSave,
    initialValues,
    settings,
    intensityMultiplier = 1.0,
    setType = 'work'
}: SetLoggerProps) {
    // Progression Algorithm
    const calculateSuggestion = () => {
        if (!previousLog || !settings) return ""

        const result = ProgressionCalculator.calculate(
            previousLog.weight,
            previousLog.reps,
            previousLog.rir ?? null,
            { ...settings, target_rir: targetRir },
        )

        const suggested = result.suggestedWeight * intensityMultiplier
        return suggested.toFixed(1)
    }

    const [weight, setWeight] = useState<string>(initialValues?.weight.toString() || calculateSuggestion() || (previousLog?.weight?.toString() ?? ""))
    const [reps, setReps] = useState<string>(initialValues?.reps.toString() || previousLog?.reps?.toString() || "")
    const [rir, setRir] = useState<string>(initialValues?.rir?.toString() || (targetRir !== undefined ? targetRir.toString() : "0"))
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
            "p-4 rounded-3xl border transition-all duration-300",
            isActive
                ? "border-primary bg-muted/40 shadow-[0_0_25px_rgba(0,255,163,0.1)] scale-[1.01]"
                : isSaved
                    ? "border-white/5 bg-white/5"
                    : "border-border/50 bg-muted/20",
            isFuture && "opacity-40"
        )}
            onClick={() => isSaved && setIsSaved(false)}
        >
            {/* Unified Header */}
            <div className={cn(
                "flex flex-wrap items-center justify-between gap-y-2 mb-3",
                !isActive && "opacity-60"
            )}>
                <div className="flex items-center gap-2">
                    <h4 className={cn(
                        "text-xs font-black tracking-widest uppercase shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                        SET {setNumber}
                    </h4>
                    {setType === 'warmup' && (
                        <span className="text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase tracking-tighter shrink-0">WARMUP</span>
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
                                {(targetRepsMin || targetRir !== undefined) && setType !== 'warmup' && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-[9px] font-bold uppercase tracking-tight px-2 py-1 rounded-lg border transition-colors hover:bg-white/10",
                                        isActive ? "text-slate-200 bg-white/5 border-white/10" : "text-slate-400 bg-white/5 border-white/5"
                                    )}>
                                        <span className="text-slate-500 text-[8px]">TARGET:</span>
                                        <span>
                                            {targetRepsMin}{targetRepsMax ? `-${targetRepsMax}` : ''} <span className="text-slate-500 font-normal">REPS</span>
                                            {targetRir !== undefined && (
                                                <>
                                                    <span className="mx-1 text-white/20">|</span>
                                                    <span className="text-primary/70">RIR {targetRir}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )}
                                {previousLog && (
                                    <div className={cn(
                                        "flex items-center gap-1 text-[9px] uppercase font-black tracking-tight px-2 py-1 rounded-lg border transition-colors hover:bg-white/10",
                                        isActive ? "text-primary/80 bg-primary/5 border-primary/10" : "text-primary/40 bg-primary/5 border-transparent"
                                    )}>
                                        <History className="h-3 w-3 opacity-50" />
                                        <span>{previousLog.weight}KG <span className="opacity-50">×</span> {previousLog.reps} {previousLog.rir !== null ? ` @ RIR ${previousLog.rir}` : ''}</span>
                                    </div>
                                )}
                            </div>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-[90vw] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    DETTAGLI SET {setNumber}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold uppercase text-[10px]">
                                    Informazioni sulla programmazione e performance passate
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {(targetRepsMin || targetRir !== undefined) && setType !== 'warmup' && (
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Odierno</h5>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-3xl font-black text-white">
                                                    {targetRepsMin}{targetRepsMax ? `-${targetRepsMax}` : ''}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Ripetizioni</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-primary">
                                                    {targetRir !== undefined ? `RIR ${targetRir}` : '-'}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Sforzo Target</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {previousLog && (
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ultima Performance</h5>
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-2">
                                            <div className="shrink-0">
                                                <div className="text-2xl font-black text-white">
                                                    {previousLog.weight}<span className="text-xs text-slate-500 ml-0.5 uppercase">kg</span>
                                                    <span className="mx-1.5 text-slate-700">×</span>
                                                    {previousLog.reps}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Performance</div>
                                            </div>
                                            <div className="text-center shrink-0">
                                                <div className="text-2xl font-black text-primary">
                                                    {previousLog.rir !== null ? `RIR ${previousLog.rir}` : '-'}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Sforzo</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-2xl font-black text-primary/80">
                                                    {(previousLog.weight * (1 + (previousLog.reps || 0) / 30)).toFixed(1)}<span className="text-xs ml-0.5 uppercase">kg</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">Est. 1RM</div>
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
                <div className="flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{weight}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">kg</span>
                        <span className="text-xs text-slate-700 mx-1">/</span>
                        <span className="text-2xl font-black text-white">{reps}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">reps</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-primary/60 uppercase tracking-tighter leading-none mb-1">Estimated 1RM</div>
                            <div className="text-sm font-black text-primary leading-none">
                                {calculate1RM(Number(weight), Number(reps))}KG
                            </div>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-black">
                            R{rir}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-2 items-end">
                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">KG</span>
                                {isActive && <PlateCalculator weight={Number(weight) || 0} maxPlateWeight={settings?.max_plate_weight} />}
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5 flex items-center justify-center font-black text-white/20">
                                    {previousLog?.weight || '-'}
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className={cn(
                                        "h-11 bg-white/5 border-white/10 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors",
                                        isProgression && "text-primary shadow-[0_0_15px_rgba(0,255,163,0.1)]"
                                    )}
                                    placeholder="0"
                                />
                            )}
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center gap-1 mb-1.5 ml-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">REPS</span>
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5 flex items-center justify-center font-black text-white/20">
                                    -
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    className="h-11 bg-white/5 border-white/10 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors"
                                    placeholder="0"
                                />
                            )}
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center gap-1 mb-1.5 ml-1">
                                <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-tighter">RIR</span>
                            </div>
                            {isFuture ? (
                                <div className="h-11 w-full bg-white/5 rounded-xl border border-white/5 flex items-center justify-center font-black text-white/20">
                                    -
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={rir}
                                    onChange={(e) => setRir(e.target.value)}
                                    className="h-11 bg-white/5 border-white/10 text-base font-black rounded-xl text-center focus:border-primary/50 transition-colors"
                                    placeholder="-"
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
