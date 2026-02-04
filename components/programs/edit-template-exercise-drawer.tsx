import { useState, useEffect } from "react"
import { updateTemplateExercise } from "@/services/exercises"
import { TemplateSet } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer"
import { Trash2, Plus, Dumbbell, AlertTriangle, ArrowDownRight, Percent } from "lucide-react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"
import { cn } from "@/lib/utils"

interface EditTemplateExerciseDrawerProps {
    templateExercise: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTemplateExerciseDrawer({
    templateExercise,
    open,
    onOpenChange,
    onSuccess
}: EditTemplateExerciseDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [parent] = useAutoAnimate()

    // Config State
    const [targetSets, setTargetSets] = useState(3)
    const [targetRepsMin, setTargetRepsMin] = useState(8)
    const [targetRepsMax, setTargetRepsMax] = useState(12)
    const [targetRir, setTargetRir] = useState(2)
    const [setsData, setSetsData] = useState<TemplateSet[]>([])

    useEffect(() => {
        if (templateExercise && open) {
            setTargetSets(templateExercise.target_sets)
            setTargetRepsMin(templateExercise.target_reps_min || 8)
            setTargetRepsMax(templateExercise.target_reps_max || 12)
            setTargetRir(templateExercise.target_rir ?? 2)

            if (templateExercise.sets_data && Array.isArray(templateExercise.sets_data) && templateExercise.sets_data.length > 0) {
                setSetsData(templateExercise.sets_data)
            } else {
                const generated = Array.from({ length: templateExercise.target_sets }, () => ({
                    reps_min: templateExercise.target_reps_min || 8,
                    reps_max: templateExercise.target_reps_max || 12,
                    rir: templateExercise.target_rir ?? 2,
                    type: 'straight' as const
                }))
                setSetsData(generated)
            }
        }
    }, [templateExercise, open])

    const updateGlobal = (count: number, min: number, max: number, rir: number) => {
        setTargetSets(count)
        setTargetRepsMin(min)
        setTargetRepsMax(max)
        setTargetRir(rir)

        const newSets: TemplateSet[] = Array.from({ length: count }, () => {
            // Keep existing sets if possible to preserve overrides? 
            // For now, hard reset to global defaults for simplicity as user is changing "Global" target.
            return {
                reps_min: min,
                reps_max: max,
                rir: rir,
                type: 'straight'
            }
        })
        setSetsData(newSets)
    }

    const updateSingleSet = (index: number, updates: Partial<TemplateSet>) => {
        setSetsData(prev => {
            const next = [...prev]
            const updatedSet = { ...next[index], ...updates }

            // Handle toggling is_backoff
            if (updates.is_backoff !== undefined) {
                updatedSet.weight_mode = updates.is_backoff ? 'percent' : 'absolute';
                // Clear percentage/backoff_percent when toggling type
                updatedSet.percentage = undefined;
                updatedSet.backoff_percent = undefined;
            }

            // Smart Logic: Update coupled variables
            if (updatedSet.is_backoff) {
                // If it's a back-off set, only backoff_percent matters for percentage-based calculation
                if (updates.backoff_percent !== undefined) {
                    updatedSet.weight_mode = 'percent';
                    updatedSet.percentage = undefined; // Ensure percentage is cleared if backoff_percent is set
                } else if ((updates.reps_max !== undefined || updates.rir !== undefined) && !updatedSet.backoff_percent) {
                    updatedSet.weight_mode = 'absolute';
                }
            } else {
                // If not a back-off set, handle regular percentage logic
                if (updates.percentage !== undefined && updates.percentage > 0) {
                    const repsAvg = (updatedSet.reps_min + updatedSet.reps_max) / 2
                    const estimatedRir = estimateRIR(updates.percentage, repsAvg, 100)
                    updatedSet.rir = Math.max(0, estimatedRir)
                    updatedSet.weight_mode = 'percent'
                    updatedSet.backoff_percent = undefined; // Ensure backoff_percent is cleared if percentage is set
                } else if ((updates.reps_max !== undefined || updates.rir !== undefined) && !updatedSet.percentage) {
                    updatedSet.weight_mode = 'absolute'
                }
            }

            // If RIR is manually changed, clear any percentage/backoff_percent
            if (updates.rir !== undefined) {
                updatedSet.percentage = undefined;
                updatedSet.backoff_percent = undefined;
                updatedSet.weight_mode = 'absolute';
            }

            next[index] = updatedSet
            return next
        })
    }

    const addSet = () => {
        const lastSet = setsData[setsData.length - 1] || { reps_min: 8, reps_max: 12, rir: 2, type: 'straight' }
        setSetsData(prev => [...prev, { ...lastSet }])
        setTargetSets(prev => prev + 1)
    }

    const removeSet = (index: number) => {
        if (setsData.length <= 1) return
        setSetsData(prev => prev.filter((_, i) => i !== index))
        setTargetSets(prev => prev - 1)
    }

    const handleSubmit = async () => {
        if (!templateExercise) return
        setLoading(true)
        try {
            await updateTemplateExercise(templateExercise.id, {
                target_sets: targetSets,
                target_reps_min: targetRepsMin,
                target_reps_max: targetRepsMax,
                target_rir: targetRir,
                sets_data: setsData
            })
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante la modifica")
        } finally {
            setLoading(false)
        }
    }

    if (!templateExercise) return null

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-white/10 max-h-[90vh]">
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl uppercase italic font-black">Configure Sets</DrawerTitle>
                        <DrawerDescription>
                            Edit progression for {templateExercise.exercise?.name}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                            <Dumbbell className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-bold text-white leading-tight">{templateExercise.exercise?.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black">{templateExercise.exercise?.body_parts?.join(', ')} • {templateExercise.exercise?.type}</p>
                            </div>
                        </div>

                        {/* Global Config Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">Total Sets</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={targetSets}
                                    onChange={(e) => updateGlobal(Number(e.target.value), targetRepsMin, targetRepsMax, targetRir)}
                                    className="bg-zinc-900/50 border-white/5 text-white text-center text-lg font-bold h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">Global Target RIR</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={5}
                                    value={targetRir}
                                    onChange={(e) => updateGlobal(targetSets, targetRepsMin, targetRepsMax, Number(e.target.value))}
                                    className="bg-zinc-900/50 border-white/5 text-white text-center text-lg font-bold h-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">Default Rep Range</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={targetRepsMin}
                                    onChange={(e) => updateGlobal(targetSets, Number(e.target.value), targetRepsMax, targetRir)}
                                    className="bg-zinc-900/50 border-white/5 text-white text-center font-bold h-10 flex-1"
                                />
                                <span className="text-slate-500 font-black">—</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={targetRepsMax}
                                    onChange={(e) => updateGlobal(targetSets, targetRepsMin, Number(e.target.value), targetRir)}
                                    className="bg-zinc-900/50 border-white/5 text-white text-center font-bold h-10 flex-1"
                                />
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Set Details</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-primary hover:bg-primary/10 font-bold uppercase"
                                    onClick={addSet}
                                >
                                    + Add Set
                                </Button>
                            </div>

                            <div className="space-y-2 pr-1" ref={parent}>
                                {setsData.map((set, i) => {
                                    // Calc validation info
                                    const avgReps = (set.reps_min + set.reps_max) / 2
                                    const suggestedPercent = calculatePercentFromRepsAndRir(avgReps, set.rir)
                                    const isImpossible = set.percentage ? (estimateRIR(set.percentage, avgReps, 100) < 0) : false
                                    const isBackoff = set.is_backoff

                                    return (
                                        <div key={i} className="bg-zinc-900/40 rounded-xl p-3 border border-white/5 space-y-3 relative group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-primary/40 uppercase italic">Set {i + 1}</span>
                                                    {isImpossible && (
                                                        <span className="flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            IMPOSSIBLE
                                                        </span>
                                                    )}
                                                    {i > 0 && (
                                                        <button
                                                            onClick={() => updateSingleSet(i, { is_backoff: !set.is_backoff })}
                                                            className={cn(
                                                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors",
                                                                isBackoff
                                                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                                    : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
                                                            )}
                                                        >
                                                            <ArrowDownRight className="h-3 w-3" />
                                                            BACK-OFF
                                                        </button>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={() => removeSet(i)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="col-span-1">
                                                    <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Min Reps</Label>
                                                    <Input type="number" value={set.reps_min} onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })} className="h-8 text-xs text-center font-bold px-1" />
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Max Reps</Label>
                                                    <Input type="number" value={set.reps_max} onChange={(e) => updateSingleSet(i, { reps_max: Number(e.target.value) })} className="h-8 text-xs text-center font-bold px-1" />
                                                </div>
                                                <div className="col-span-1 relative">
                                                    <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">RIR</Label>
                                                    <Input
                                                        type="number"
                                                        value={set.rir}
                                                        onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })} // Clearing percent if manual RIR
                                                        className={cn("h-8 text-xs text-center font-bold px-1", set.percentage && "text-amber-400 border-amber-500/30")}
                                                    />
                                                    {/* {set.percentage && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />} */}
                                                </div>
                                                <div className="col-span-1">
                                                    <Label className={cn("text-[9px] uppercase font-bold ml-1", isBackoff ? "text-purple-400" : "text-amber-500")}>
                                                        {isBackoff ? "Drop %" : "Load %"}
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            placeholder={isBackoff ? "10" : suggestedPercent.toFixed(0)}
                                                            value={isBackoff ? (set.backoff_percent || '') : (set.percentage || '')}
                                                            onChange={(e) => updateSingleSet(i, isBackoff
                                                                ? { backoff_percent: e.target.value ? Number(e.target.value) : undefined }
                                                                : { percentage: e.target.value ? Number(e.target.value) : undefined }
                                                            )}
                                                            className={cn(
                                                                "h-8 text-xs text-center font-bold px-1",
                                                                isBackoff
                                                                    ? "text-purple-400 border-purple-500/20 focus:border-purple-500 placeholder:text-purple-500/20"
                                                                    : "text-amber-500 border-amber-500/20 focus:border-amber-500/50"
                                                            )}
                                                        />
                                                        {!isBackoff && (
                                                            <Percent className="absolute right-1 top-2 h-3 w-3 text-amber-500/30" />
                                                        )}
                                                        {isBackoff && (
                                                            <span className="absolute right-2 top-2 text-[10px] text-purple-500/50 font-bold">%</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Smart Hint Line */}
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[9px] text-slate-500">
                                                    Intensity Est: <span className="text-slate-300 font-mono">~{suggestedPercent}%</span>
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-primary text-background-dark font-black uppercase tracking-widest hover:bg-primary/90 py-6"
                        >
                            {loading ? "Saving..." : "Save Configuration"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
