"use client"

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
import { Dumbbell, Trash2 } from "lucide-react"
import { useAutoAnimate } from "@formkit/auto-animate/react"

interface EditTemplateExerciseDrawerProps {
    templateExercise: any // TemplateExercise joined with Exercise
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

            // Load sets data or generate from defaults if missing
            if (templateExercise.sets_data && Array.isArray(templateExercise.sets_data) && templateExercise.sets_data.length > 0) {
                setSetsData(templateExercise.sets_data)
            } else {
                // Backward compatibility: generate from global targets
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
            next[index] = { ...next[index], ...updates }
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
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl uppercase italic font-black">Configura Serie</DrawerTitle>
                        <DrawerDescription>
                            Modifica la progressione per {templateExercise.exercise?.name}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                            <Dumbbell className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-bold text-white leading-tight">{templateExercise.exercise?.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black">{templateExercise.exercise?.body_part} • {templateExercise.exercise?.type}</p>
                            </div>
                        </div>

                        {/* Global Config Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">Serie Totali</Label>
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
                                <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">RIR Target</Label>
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
                            <Label className="text-[10px] uppercase text-slate-500 font-bold ml-1 tracking-wider">Range Reps Default</Label>
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

                        {/* Per-Set Detail */}
                        <div className="pt-2 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Dettaglio Serie</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-primary hover:bg-primary/10 font-bold uppercase"
                                    onClick={addSet}
                                >
                                    + Aggiungi
                                </Button>
                            </div>

                            <div className="space-y-2 pr-1" ref={parent}>
                                {setsData.map((set, i) => (
                                    <div key={i} className="bg-zinc-900/40 rounded-xl p-3 border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-primary/40 uppercase italic">Serie {i + 1}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => removeSet(i)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Min</Label>
                                                <Input
                                                    type="number"
                                                    value={set.reps_min}
                                                    onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                    className="h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">Max</Label>
                                                <Input
                                                    type="number"
                                                    value={set.reps_max}
                                                    onChange={(e) => updateSingleSet(i, { reps_max: Number(e.target.value) })}
                                                    className="h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[8px] uppercase text-slate-600 mb-1 block font-bold text-center">RIR</Label>
                                                <Input
                                                    type="number"
                                                    value={set.rir}
                                                    onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })}
                                                    className="h-8 bg-zinc-950/50 border-white/5 text-xs text-center font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-primary text-background-dark font-black uppercase tracking-widest hover:bg-primary/90 py-6"
                        >
                            {loading ? "Salvataggio..." : "Salva Configurazione"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                                Annulla
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
