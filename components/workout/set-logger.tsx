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
                className="p-3 rounded-xl border border-primary/30 bg-zinc-900/30 mb-2 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                onClick={() => setIsSaved(false)}
            >
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-300">SET {setNumber}</h4>
                    {previousLog && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <History className="h-3 w-3" />
                            <span>Last: {previousLog.weight}kg x {previousLog.reps} @{previousLog.rir}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2 items-end">
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">KG</label>
                        <div className="bg-zinc-900 border border-primary/30 rounded-md h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-primary">{weight}</span>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">REPS</label>
                        <div className="bg-zinc-900 border border-primary/30 rounded-md h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-white">{reps}</span>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-bold ml-1 mb-1 block">RIR</label>
                        <div className="bg-zinc-900 border border-primary/30 rounded-md h-10 flex items-center justify-center">
                            <span className="text-base font-bold text-white">{rir}</span>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <div className="h-10 w-full rounded-md bg-primary flex items-center justify-center">
                            <Check className="h-5 w-5 text-background-dark" />
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
                "p-3 rounded-xl border mb-2 transition-all duration-300",
                isActive
                    ? "border-primary bg-zinc-900/50 shadow-[0_0_25px_rgba(19,236,109,0.15)] scale-[1.01]"
                    : "border-white/10 bg-zinc-900/30"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h4 className={cn("text-sm font-black tracking-tight", isActive ? "text-primary" : "text-white")}>
                            SET {setNumber}
                        </h4>
                        {isActive && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                                <Timer className="h-3 w-3" />
                                <span>{formatTime(timer)}</span>
                            </div>
                        )}
                    </div>
                    {previousLog && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                            <History className="h-3 w-3" />
                            <span>Last: {previousLog.weight}kg x {previousLog.reps} @{previousLog.rir}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-7 gap-2 items-end">
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-extrabold ml-1 mb-1 block">KG</label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            className={cn(
                                "bg-zinc-950 h-11 text-base font-black text-center transition-all border-white/5",
                                isActive ? "focus:border-primary/50" : "focus:border-white/20",
                                isProgression ? "text-primary" : "text-white"
                            )}
                            placeholder="0"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-extrabold ml-1 mb-1 block">REPS</label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            className={cn(
                                "bg-zinc-950 h-11 text-base font-black text-center transition-all border-white/5",
                                isActive ? "focus:border-primary/50" : "focus:border-white/20",
                                "text-white"
                            )}
                            placeholder="0"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase text-slate-500 font-extrabold ml-1 mb-1 block">RIR</label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            className={cn(
                                "bg-zinc-950 h-11 text-base font-black text-center transition-all border-white/5",
                                isActive ? "focus:border-primary/50" : "focus:border-white/20",
                                "text-white"
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
                                        ? "bg-primary hover:bg-primary/90 text-background-dark shadow-[0_0_20px_rgba(19,236,109,0.3)]"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-white/5")
                                    : "bg-zinc-900/50 text-slate-600 border border-white/5"
                            )}
                        >
                            <Check className={cn("h-6 w-6 stroke-[3]", isActive ? "opacity-100" : "opacity-60")} />
                        </Button>
                    </div>
                </div>
                {weight && reps && (
                    <div className="mt-3 text-center py-1 bg-zinc-950/30 rounded-lg border border-white/5">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Est. 1RM: </span>
                        <span className="text-sm font-black text-primary">{calculate1RM(Number(weight), Number(reps))}KG</span>
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
