"use client"

import { useState, useEffect } from "react"
import { getExercises, addTemplateExercise } from "@/services/exercises"
import { Exercise, TemplateSet } from "@/types/database"
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
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { Plus, Search, Dumbbell, Trash2, ArrowDownRight, Percent } from "lucide-react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"

interface AddTemplateExerciseDrawerProps {
    templateId: string
    currentExercisesCount: number
    onSuccess: () => void
    children?: React.ReactNode
}

export function AddTemplateExerciseDrawer({
    templateId,
    currentExercisesCount,
    onSuccess,
    children
}: AddTemplateExerciseDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Exercise selection
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

    // Exercise config
    const [targetSets, setTargetSets] = useState(3)
    const [targetRepsMin, setTargetRepsMin] = useState(8)
    const [targetRepsMax, setTargetRepsMax] = useState(12)
    const [targetRir, setTargetRir] = useState(2)
    const [setsData, setSetsData] = useState<TemplateSet[]>([
        { reps_min: 8, reps_max: 12, rir: 2, type: 'straight' },
        { reps_min: 8, reps_max: 12, rir: 2, type: 'straight' },
        { reps_min: 8, reps_max: 12, rir: 2, type: 'straight' },
    ])

    const [parent] = useAutoAnimate()

    // Sync global to all sets
    const updateGlobal = (count: number, min: number, max: number, rir: number) => {
        setTargetSets(count)
        setTargetRepsMin(min)
        setTargetRepsMax(max)
        setTargetRir(rir)

        const newSets: TemplateSet[] = Array.from({ length: count }, () => ({
            reps_min: min,
            reps_max: max,
            rir: rir,
            type: 'straight'
        }))
        setSetsData(newSets)
    }

    const updateSingleSet = (index: number, updates: Partial<TemplateSet>) => {
        setSetsData(prev => {
            const next = [...prev]
            const updatedSet = { ...next[index], ...updates }

            // Handle toggling is_backoff
            if (updates.is_backoff !== undefined) {
                updatedSet.weight_mode = updates.is_backoff ? 'percent' : 'absolute'
                updatedSet.percentage = undefined
                updatedSet.backoff_percent = undefined
            }

            // Smart Logic: Update coupled variables
            if (updatedSet.is_backoff) {
                if (updates.backoff_percent !== undefined) {
                    updatedSet.weight_mode = 'percent'
                    updatedSet.percentage = undefined
                } else if ((updates.reps_max !== undefined || updates.rir !== undefined) && !updatedSet.backoff_percent) {
                    updatedSet.weight_mode = 'absolute'
                }
            } else {
                if (updates.percentage !== undefined && updates.percentage > 0) {
                    const repsAvg = (updatedSet.reps_min + updatedSet.reps_max) / 2
                    const estimatedRir = estimateRIR(updates.percentage, repsAvg, 100)
                    updatedSet.rir = Math.max(0, estimatedRir)
                    updatedSet.weight_mode = 'percent'
                    updatedSet.backoff_percent = undefined
                } else if ((updates.reps_max !== undefined || updates.rir !== undefined) && !updatedSet.percentage) {
                    updatedSet.weight_mode = 'absolute'
                }
            }

            // If RIR is manually changed, clear any percentage/backoff_percent
            if (updates.rir !== undefined) {
                updatedSet.percentage = undefined
                updatedSet.backoff_percent = undefined
                updatedSet.weight_mode = 'absolute'
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

    // Load exercises on mount
    useEffect(() => {
        if (open) {
            getExercises().then(setExercises)
        }
    }, [open])

    const filteredExercises = exercises.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSubmit = async () => {
        if (!selectedExercise) return

        setLoading(true)
        try {
            await addTemplateExercise({
                workout_template_id: templateId,
                exercise_id: selectedExercise.id,
                target_sets: targetSets,
                target_reps_min: targetRepsMin,
                target_reps_max: targetRepsMax,
                target_rir: targetRir,
                sets_data: setsData,
                order: currentExercisesCount
            })
            setOpen(false)
            setSelectedExercise(null)
            setSearchQuery("")
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante l'aggiunta dell'esercizio")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                        <Plus className="h-3 w-3 mr-1" />
                        Aggiungi Esercizio
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-white/10 max-h-[90vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">
                            {selectedExercise ? "Configura Esercizio" : "Scegli Esercizio"}
                        </DrawerTitle>
                        <DrawerDescription>
                            {selectedExercise
                                ? `Imposta serie, reps e RIR per ${selectedExercise.name}`
                                : "Seleziona un esercizio dal database"}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        {!selectedExercise ? (
                            <>
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Cerca esercizio..."
                                        className="pl-9 bg-zinc-900/50 border-white/10 text-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {/* Exercise List */}
                                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {filteredExercises.map((exercise) => (
                                        <button
                                            key={exercise.id}
                                            className={cn(
                                                "w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3",
                                                "bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-primary/30"
                                            )}
                                            onClick={() => setSelectedExercise(exercise)}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Dumbbell className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{exercise.name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{exercise.body_parts?.join(', ')} • {exercise.type}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredExercises.length === 0 && (
                                        <p className="text-center text-slate-500 py-4">Nessun esercizio trovato</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Selected exercise */}
                                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-bold text-white leading-tight">{selectedExercise.name}</p>
                                        <button
                                            className="text-[10px] text-primary hover:underline uppercase font-bold tracking-wider"
                                            onClick={() => setSelectedExercise(null)}
                                        >
                                            Cambia esercizio
                                        </button>
                                    </div>
                                </div>

                                {/* Global Config Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Serie</Label>
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
                                        <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1">RIR Target</Label>
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
                                    <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Range Reps Default</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={targetRepsMin}
                                            onChange={(e) => updateGlobal(targetSets, Number(e.target.value), targetRepsMax, targetRir)}
                                            className="bg-zinc-900/50 border-white/5 text-white text-center font-bold h-10"
                                        />
                                        <span className="text-slate-500">—</span>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={targetRepsMax}
                                            onChange={(e) => updateGlobal(targetSets, targetRepsMin, Number(e.target.value), targetRir)}
                                            className="bg-zinc-900/50 border-white/5 text-white text-center font-bold h-10"
                                        />
                                    </div>
                                </div>

                                {/* Per-Set Detail */}
                                <div className="pt-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Dettaglio Serie</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] text-primary hover:bg-primary/10 font-black"
                                            onClick={addSet}
                                        >
                                            + AGGIUNGI
                                        </Button>
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar" ref={parent}>
                                        {setsData.map((set, i) => {
                                            const avgReps = (set.reps_min + set.reps_max) / 2
                                            const suggestedPercent = calculatePercentFromRepsAndRir(avgReps, set.rir)
                                            const isBackoff = set.is_backoff

                                            return (
                                                <div key={i} className="bg-zinc-900/60 rounded-xl p-3 border border-white/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-primary/50 uppercase italic">Serie {i + 1}</span>
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
                                                        <div>
                                                            <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Min</Label>
                                                            <Input
                                                                type="number"
                                                                value={set.reps_min}
                                                                onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                                className="h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold px-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Max</Label>
                                                            <Input
                                                                type="number"
                                                                value={set.reps_max}
                                                                onChange={(e) => updateSingleSet(i, { reps_max: Number(e.target.value) })}
                                                                className="h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold px-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">RIR</Label>
                                                            <Input
                                                                type="number"
                                                                value={set.rir}
                                                                onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })}
                                                                className={cn("h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold px-1", set.percentage && "text-amber-400 border-amber-500/30")}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className={cn("text-[8px] uppercase font-bold mb-1 block text-center", isBackoff ? "text-purple-400" : "text-amber-500")}>
                                                                {isBackoff ? "Drop %" : "%"}
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
                                                                            : "text-amber-500 border-amber-500/20 focus:border-amber-500/50 placeholder:text-amber-500/30"
                                                                    )}
                                                                />
                                                                {!isBackoff && (
                                                                    <Percent className="absolute right-1 top-2 h-3 w-3 text-amber-500/30" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Smart Hint Line */}
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[9px] text-slate-500">
                                                            Intensity Est: <span className="text-slate-300 font-mono">~{suggestedPercent.toFixed(0)}%</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DrawerFooter className="pt-0">
                        {selectedExercise && (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-primary text-background-dark font-black uppercase tracking-widest hover:bg-primary/90 py-6"
                            >
                                {loading ? "Salvataggio..." : "Aggiungi Esercizio"}
                            </Button>
                        )}
                        <DrawerClose asChild>
                            <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                                Chiudi
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
