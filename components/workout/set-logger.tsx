"use client"

import { useEffect, useState } from "react"
import { ExerciseLog } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { calculate1RM } from "@/utils/formulas"
import { Check, History, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

import { ProgressionSettings, ProgressionCalculator } from "@/services/progression"

interface SetLoggerProps {
    setNumber: number
    previousLog?: ExerciseLog
    targetRir: number
    isActive?: boolean
    isFuture?: boolean
    onSave: (weight: number, reps: number, rir: number) => void
    initialValues?: ExerciseLog
    settings: ProgressionSettings | null
}

export function SetLogger({ setNumber, previousLog, targetRir, isActive = false, isFuture = false, onSave, initialValues, settings }: SetLoggerProps) {
    // Progression Algorithm
    const calculateSuggestion = () => {
        if (!previousLog || !settings) return ""

        // Use the centralized calculator
        // We assume targetRepsRange is undefined for now, or could Fetch from template if pushed down
        const result = ProgressionCalculator.calculate(
            previousLog.weight,
            previousLog.reps,
            previousLog.rir ?? null,
            { ...settings, target_rir: targetRir }, // Override global RIR with Template RIR if exists? 
            // Actually, usually users want the SETTINGS global RIR to dictate 'easiness', 
            // BUT the template determines what the Goal RIR is.
            // If Template says RIR 2, and I did RIR 4, I should progress.
            // The logic uses settings.target_rir. 
            // Let's pass the Template RIR as the definitive Target.
        )
        return result.suggestedWeight.toString()
    }

    const initialWeight = initialValues?.weight.toString() || calculateSuggestion() || (previousLog?.weight?.toString() ?? "")
    const [weight, setWeight] = useState<string>(initialWeight)
    const [reps, setReps] = useState<string>(initialValues?.reps.toString() || previousLog?.reps?.toString() || "")
    const [rir, setRir] = useState<string>(initialValues?.rir?.toString() || previousLog?.rir?.toString() || "")
    const [isSaved, setIsSaved] = useState(!!initialValues)

    // Timer for active set
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

    const isProgression = previousLog && weight && Number(weight) > previousLog.weight

    const handleSave = () => {
        if (!weight || !reps) return
        onSave(Number(weight), Number(reps), Number(rir) || 0)
        setIsSaved(true)
    }

    // Completed state
    if (isSaved) {
        return (
            <div
                className="p-3 rounded-xl border border-primary/20 bg-muted/20 mb-2 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setIsSaved(false)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">SET {setNumber}</h4>
                    {previousLog && (
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 uppercase font-bold">
                            <History className="h-3 w-3" />
                            <span>Last: {previousLog.weight}kg x {previousLog.reps}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2 items-end">
                    <div className="col-span-2 text-center">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-bold mb-1 block">KG</label>
                        <div className="bg-background/50 border border-primary/10 rounded-lg h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-primary">{weight}</span>
                        </div>
                    </div>
                    <div className="col-span-2 text-center">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-bold mb-1 block">REPS</label>
                        <div className="bg-background/50 border border-border rounded-lg h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-foreground">{reps}</span>
                        </div>
                    </div>
                    <div className="col-span-2 text-center">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-bold mb-1 block">RIR</label>
                        <div className="bg-background/50 border border-border rounded-lg h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-foreground">{rir}</span>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <div className="h-10 w-full rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Active state (showing inputs)
    if (!isSaved) {
        return (
            <div className={cn(
                "p-3 rounded-2xl border mb-2 transition-all duration-300",
                isActive
                    ? "border-primary bg-muted/40 shadow-[0_0_25px_rgba(0,255,163,0.1)] scale-[1.01]"
                    : "border-border/50 bg-muted/20"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h4 className={cn("text-xs font-black tracking-widest uppercase", isActive ? "text-primary" : "text-muted-foreground")}>
                            SET {setNumber}
                        </h4>
                        {isActive && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                                <Timer className="h-3 w-3" />
                                <span>{formatTime(timer)}</span>
                            </div>
                        )}
                    </div>
                    {previousLog && (
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tight">
                            <History className="h-3 w-3" />
                            <span>Last: {previousLog.weight}kg x {previousLog.reps}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2 items-end">
                    <div className="col-span-2">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-black ml-1 mb-1 block">KG</label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            className={cn(
                                "bg-background h-11 text-base font-black text-center transition-all border-border/50 rounded-xl",
                                isActive ? "focus:border-primary/50" : "focus:border-border",
                                isProgression ? "text-primary shadow-[0_0_10px_rgba(0,255,163,0.1)]" : "text-foreground"
                            )}
                            placeholder="0"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-black ml-1 mb-1 block">REPS</label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            className={cn(
                                "bg-background h-11 text-base font-black text-center transition-all border-border/50 rounded-xl",
                                isActive ? "focus:border-primary/50" : "focus:border-border",
                                "text-foreground"
                            )}
                            placeholder="0"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[8px] uppercase text-muted-foreground/60 font-black ml-1 mb-1 block">RIR</label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            className={cn(
                                "bg-background h-11 text-base font-black text-center transition-all border-border/50 rounded-xl",
                                isActive ? "focus:border-primary/50" : "focus:border-border",
                                "text-foreground"
                            )}
                            placeholder="-"
                            value={rir}
                            onChange={(e) => setRir(e.target.value)}
                        />
                    </div>
                    <div className="col-span-1">
                        <Button
                            onClick={handleSave}
                            disabled={!weight || !reps}
                            className={cn(
                                "h-11 w-full p-0 transition-all duration-300 rounded-xl",
                                (weight && reps)
                                    ? (isActive
                                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                                        : "bg-muted hover:bg-muted/80 text-muted-foreground border border-border")
                                    : "bg-muted/30 text-muted-foreground/40 border border-border/20"
                            )}
                        >
                            <Check className={cn("h-6 w-6 stroke-[3]", isActive ? "opacity-100" : "opacity-40")} />
                        </Button>
                    </div>
                </div>
                {weight && reps && (
                    <div className="mt-3 text-center py-2 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">Est. 1RM: </span>
                        <span className="text-sm font-black text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.2)]">{calculate1RM(Number(weight), Number(reps))}KG</span>
                    </div>
                )}
            </div>
        )
    }

    // Future state (dimmed, pre-filled) - should only reach here if isSaved is false AND it's not the current active set
    return (
        <div className="p-3 rounded-xl border border-white/5 bg-zinc-900/20 mb-2 opacity-40">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-400">SET {setNumber}</h4>
                {previousLog && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <History className="h-3 w-3" />
                        <span>Last: {previousLog.weight}kg x {previousLog.reps} @{previousLog.rir}</span>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-7 gap-2 items-end">
                <div className="col-span-2">
                    <label className="text-[9px] uppercase text-slate-600 font-bold ml-1 mb-1 block">KG</label>
                    <div className="bg-zinc-950 border border-white/5 rounded-md h-10 flex items-center justify-center">
                        <span className="text-base font-bold text-slate-500">{weight || "-"}</span>
                    </div>
                </div>
                <div className="col-span-2">
                    <label className="text-[9px] uppercase text-slate-600 font-bold ml-1 mb-1 block">REPS</label>
                    <div className="bg-zinc-950 border border-white/5 rounded-md h-10 flex items-center justify-center">
                        <span className="text-base font-bold text-slate-500">-</span>
                    </div>
                </div>
                <div className="col-span-2">
                    <label className="text-[9px] uppercase text-slate-600 font-bold ml-1 mb-1 block">RIR</label>
                    <div className="bg-zinc-950 border border-white/5 rounded-md h-10 flex items-center justify-center">
                        <span className="text-base font-bold text-slate-500">-</span>
                    </div>
                </div>
                <div className="col-span-1">
                    <div className="h-10 w-full rounded-md bg-zinc-800 flex items-center justify-center">
                        <Check className="h-5 w-5 text-slate-600" />
                    </div>
                </div>
            </div>
        </div>
    )
}
