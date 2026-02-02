"use client"

import { useState, useEffect } from "react"
import { updateTemplateExercise, UpdateTemplateExerciseInput } from "@/services/exercises"
import { TemplateExercise } from "@/types/database" // Define properly or import
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
import { Dumbbell } from "lucide-react"

// Temporary interface if not exported from types
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

    // Config State
    const [targetSets, setTargetSets] = useState(3)
    const [targetRepsMin, setTargetRepsMin] = useState(8)
    const [targetRepsMax, setTargetRepsMax] = useState(12)
    const [targetRir, setTargetRir] = useState(2)

    useEffect(() => {
        if (templateExercise) {
            setTargetSets(templateExercise.target_sets)
            setTargetRepsMin(templateExercise.target_reps_min || 8)
            setTargetRepsMax(templateExercise.target_reps_max || 12)
            setTargetRir(templateExercise.target_rir ?? 2)
        }
    }, [templateExercise])

    const handleSubmit = async () => {
        if (!templateExercise) return

        setLoading(true)
        try {
            await updateTemplateExercise(templateExercise.id, {
                target_sets: targetSets,
                target_reps_min: targetRepsMin,
                target_reps_max: targetRepsMax,
                target_rir: targetRir
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
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Modifica Set & Reps</DrawerTitle>
                        <DrawerDescription>
                            Configurazione per {templateExercise.exercise?.name}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="p-3 rounded-xl bg-secondary/10 border border-white/5 flex items-center gap-3">
                            <Dumbbell className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="font-bold text-white">{templateExercise.exercise?.name}</p>
                                <p className="text-xs text-slate-400 capitalize">{templateExercise.exercise?.body_part} • {templateExercise.exercise?.type}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">Serie</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={targetSets}
                                    onChange={(e) => setTargetSets(Number(e.target.value))}
                                    className="bg-zinc-900/50 border-white/10 text-white text-center text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">RIR Target</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={5}
                                    value={targetRir}
                                    onChange={(e) => setTargetRir(Number(e.target.value))}
                                    className="bg-zinc-900/50 border-white/10 text-white text-center text-lg font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white">Range Reps</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={targetRepsMin}
                                    onChange={(e) => setTargetRepsMin(Number(e.target.value))}
                                    className="bg-zinc-900/50 border-white/10 text-white text-center font-bold"
                                />
                                <span className="text-slate-500">—</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={targetRepsMax}
                                    onChange={(e) => setTargetRepsMax(Number(e.target.value))}
                                    className="bg-zinc-900/50 border-white/10 text-white text-center font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90">
                            {loading ? "Salvataggio..." : "Salva Modifiche"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">Annulla</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
