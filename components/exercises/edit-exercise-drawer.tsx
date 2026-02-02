"use client"

import { useState, useEffect } from "react"
import { updateExercise, UpdateExerciseInput } from "@/services/exercises"
import { Exercise, ExerciseType, BodyPart } from "@/types/database"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditExerciseDrawerProps {
    exercise: Exercise | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditExerciseDrawer({ exercise, open, onOpenChange, onSuccess }: EditExerciseDrawerProps) {
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [bodyPart, setBodyPart] = useState<BodyPart>("chest")
    const [type, setType] = useState<ExerciseType>("barbell")

    // Sync form with exercise prop
    useEffect(() => {
        if (exercise) {
            setName(exercise.name)
            setBodyPart(exercise.body_part)
            setType(exercise.type)
        }
    }, [exercise])

    const handleSubmit = async () => {
        if (!exercise || !name.trim()) return

        setLoading(true)
        try {
            await updateExercise(exercise.id, {
                name,
                body_part: bodyPart,
                type: type,
            })
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante la modifica dell'esercizio")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Modifica Esercizio</DrawerTitle>
                        <DrawerDescription>Modifica i dettagli dell'esercizio.</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-white">Nome Esercizio</Label>
                            <Input
                                id="edit-name"
                                placeholder="es. Panca Piana Manubri"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-white">Body Part</Label>
                                <Select value={bodyPart} onValueChange={(v) => setBodyPart(v as BodyPart)}>
                                    <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                        {['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'].map(bp => (
                                            <SelectItem key={bp} value={bp} className="capitalize focus:bg-primary/20 focus:text-primary">{bp}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white">Tipologia</Label>
                                <Select value={type} onValueChange={(v) => setType(v as ExerciseType)}>
                                    <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                        {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other'].map(t => (
                                            <SelectItem key={t} value={t} className="capitalize focus:bg-primary/20 focus:text-primary">{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
