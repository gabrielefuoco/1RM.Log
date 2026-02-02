"use client"

import { useState, useEffect } from "react"
import { getExercises, addTemplateExercise } from "@/services/exercises"
import { Exercise } from "@/types/database"
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
import { Plus, Search, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

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
            <DrawerContent className="bg-background border-t border-white/10 max-h-[85vh]">
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
                                <div className="max-h-64 overflow-y-auto space-y-2">
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
                                                <p className="text-xs text-slate-500 capitalize">{exercise.body_part} • {exercise.type}</p>
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
                                    <div>
                                        <p className="font-bold text-white">{selectedExercise.name}</p>
                                        <button
                                            className="text-xs text-primary hover:underline"
                                            onClick={() => setSelectedExercise(null)}
                                        >
                                            Cambia esercizio
                                        </button>
                                    </div>
                                </div>

                                {/* Config */}
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
                            </>
                        )}
                    </div>

                    <DrawerFooter>
                        {selectedExercise && (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90"
                            >
                                {loading ? "Aggiunta..." : "Aggiungi alla Scheda"}
                            </Button>
                        )}
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">
                                Annulla
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
