"use client"

import { useState } from "react"
import { createExercise } from "@/services/exercises"
import { ExerciseType, BodyPart } from "@/types/database"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect, Option } from "@/components/ui/multi-select"
import { Plus } from "lucide-react"

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

interface CreateExerciseDrawerProps {
    onSuccess: () => void
}

export function CreateExerciseDrawer({ onSuccess }: CreateExerciseDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [bodyParts, setBodyParts] = useState<string[]>(['Chest'])
    const [type, setType] = useState<ExerciseType>("barbell")

    const handleSubmit = async () => {
        if (!name.trim() || bodyParts.length === 0) return

        setLoading(true)
        try {
            await createExercise({
                name,
                body_parts: bodyParts as BodyPart[],
                type: type,
                image_url: null
            })
            setOpen(false)
            setName("") // Reset
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Error during exercise creation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/20 z-40 bg-primary hover:bg-primary/90 text-background-dark p-0">
                    <Plus className="h-8 w-8" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">New Exercise</DrawerTitle>
                        <DrawerDescription>Add a custom exercise to your database.</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Exercise Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Incline Dumbbell Press"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white">Body Parts</Label>
                            <MultiSelect
                                options={BODY_PART_OPTIONS}
                                selected={bodyParts}
                                onChange={setBodyParts}
                                placeholder="Choose categories..."
                                className="bg-zinc-900/50 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white">Equipment Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as ExerciseType)}>
                                <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
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

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90">
                            {loading ? "Saving..." : "Create Exercise"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
