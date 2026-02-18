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
import { MultiSelect, Option } from "@/components/ui/multi-select"

const BODY_PART_OPTIONS: Option[] = [
    { label: 'Chest', value: 'Chest' },
    { label: 'Back (Lats)', value: 'Back (Lats)' },
    { label: 'Back (Upper/Traps)', value: 'Back (Upper/Traps)' },
    { label: 'Lower Back', value: 'Lower Back' },
    { label: 'Shoulders (Front)', value: 'Shoulders (Front)' },
    { label: 'Shoulders (Side)', value: 'Shoulders (Side)' },
    { label: 'Shoulders (Rear)', value: 'Shoulders (Rear)' },
    { label: 'Biceps', value: 'Biceps' },
    { label: 'Triceps', value: 'Triceps' },
    { label: 'Forearms', value: 'Forearms' },
    { label: 'Quadriceps', value: 'Quadriceps' },
    { label: 'Hamstrings', value: 'Hamstrings' },
    { label: 'Glutes', value: 'Glutes' },
    { label: 'Calves', value: 'Calves' },
    { label: 'Core', value: 'Core' },
    { label: 'Functional', value: 'Functional' },
]

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
    const [bodyParts, setBodyParts] = useState<string[]>([])
    const [type, setType] = useState<ExerciseType>("barbell")

    // Sync form with exercise prop
    useEffect(() => {
        if (exercise) {
            setName(exercise.name)
            setBodyParts(exercise.body_parts || [])
            setType(exercise.type)
        }
    }, [exercise])

    const handleSubmit = async () => {
        if (!exercise || !name.trim() || bodyParts.length === 0) return

        setLoading(true)
        try {
            await updateExercise(exercise.id, {
                name,
                body_parts: bodyParts as BodyPart[],
                type: type,
            })
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Error during exercise modification")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Edit Exercise</DrawerTitle>
                        <DrawerDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Modify exercise details.</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] ml-1">Exercise Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g. Incline Dumbbell Press"
                                className="bg-zinc-900/40 border-white/5 text-white h-11 focus:border-primary/20 transition-all rounded-xl"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] ml-1">Body Parts</Label>
                            <MultiSelect
                                options={BODY_PART_OPTIONS}
                                selected={bodyParts}
                                onChange={setBodyParts}
                                placeholder="Choose categories..."
                                className="bg-zinc-900/40 border-white/5 text-white focus:border-primary/20 transition-all rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] ml-1">Equipment Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as ExerciseType)}>
                                <SelectTrigger className="bg-zinc-900/40 border-white/5 text-white h-11 focus:border-primary/20 transition-all rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {[
                                        { value: 'barbell', label: 'Barbell' },
                                        { value: 'dumbbell', label: 'Dumbbell' },
                                        { value: 'cable', label: 'Cable' },
                                        { value: 'machine', label: 'Machine' },
                                        { value: 'bodyweight', label: 'Bodyweight' },
                                        { value: 'other', label: 'Other' }
                                    ].map(t => (
                                        <SelectItem key={t.value} value={t.value} className="capitalize focus:bg-primary/20 focus:text-primary">{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DrawerFooter className="pt-2">
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-black uppercase tracking-widest hover:bg-primary/90 transition-all h-12 rounded-xl">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-xs h-10">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
