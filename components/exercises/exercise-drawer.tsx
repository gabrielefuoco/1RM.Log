"use client"

import { useState, useEffect } from "react"
import { createExercise, updateExercise } from "@/services/exercises"
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
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Plus, Edit2, Loader2 } from "lucide-react"
import { BODY_PART_OPTIONS, EQUIPMENT_TYPE_OPTIONS } from "@/lib/constants/exercise"
import { toast } from "sonner"

interface ExerciseDrawerProps {
    exercise?: Exercise | null
    mode: 'create' | 'edit'
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function ExerciseDrawer({
    exercise,
    mode,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    onSuccess,
    trigger
}: ExerciseDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
    const setIsOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen

    // Form State
    const [name, setName] = useState("")
    const [bodyParts, setBodyParts] = useState<string[]>(['Chest'])
    const [type, setType] = useState<ExerciseType>("barbell")

    // Sync form with exercise prop when in edit mode
    useEffect(() => {
        if (mode === 'edit' && exercise) {
            setName(exercise.name)
            setBodyParts(exercise.body_parts || [])
            setType(exercise.type)
        } else if (mode === 'create') {
            setName("")
            setBodyParts(['Chest'])
            setType("barbell")
        }
    }, [exercise, mode, isOpen])

    const handleSubmit = async () => {
        if (!name.trim() || bodyParts.length === 0) return

        setLoading(true)
        try {
            if (mode === 'create') {
                await createExercise({
                    name,
                    body_parts: bodyParts as BodyPart[],
                    type: type,
                    image_url: null
                })
            } else if (mode === 'edit' && exercise) {
                await updateExercise(exercise.id, {
                    name,
                    body_parts: bodyParts as BodyPart[],
                    type: type,
                })
            }
            setIsOpen(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error(`Error during exercise ${mode === 'create' ? 'creation' : 'modification'}`)
        } finally {
            setLoading(false)
        }
    }

    const title = mode === 'create' ? "New Exercise" : "Edit Exercise"
    const description = mode === 'create'
        ? "Add a custom exercise to your database."
        : "Modify exercise details."
    const submitText = loading ? "Saving..." : (mode === 'create' ? "Create Exercise" : "Save Changes")

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent className="bg-background border-t border-border">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className={mode === 'edit'
                            ? "text-2xl font-black text-foreground italic uppercase tracking-tighter leading-none mb-1"
                            : "text-foreground text-xl"}>
                            {title}
                        </DrawerTitle>
                        <DrawerDescription className={mode === 'edit'
                            ? "text-muted-foreground font-bold uppercase tracking-widest text-[10px]"
                            : ""}>
                            {description}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="exercise-name" className={mode === 'edit'
                                ? "text-muted-foreground font-bold uppercase tracking-widest text-[9px] ml-1"
                                : "text-white"}>
                                Exercise Name
                            </Label>
                            <Input
                                id="exercise-name"
                                placeholder="e.g. Incline Dumbbell Press"
                                className={mode === 'edit'
                                    ? "bg-card/40 border-border text-foreground h-11 focus:border-primary/20 transition-all rounded-lg"
                                    : "bg-card/50 border-border text-foreground"}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={mode === 'edit'
                                ? "text-muted-foreground font-bold uppercase tracking-widest text-[9px] ml-1"
                                : "text-white"}>
                                Body Parts
                            </Label>
                            <MultiSelect
                                options={BODY_PART_OPTIONS}
                                selected={bodyParts}
                                onChange={setBodyParts}
                                placeholder="Choose categories..."
                                className={mode === 'edit'
                                    ? "bg-card/40 border-border text-foreground focus:border-primary/20 transition-all rounded-lg"
                                    : "bg-card/50 border-border text-foreground"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={mode === 'edit'
                                ? "text-muted-foreground font-bold uppercase tracking-widest text-[9px] ml-1"
                                : "text-foreground"}>
                                Equipment Type
                            </Label>
                            <Select value={type} onValueChange={(v) => setType(v as ExerciseType)}>
                                <SelectTrigger className={mode === 'edit'
                                    ? "bg-card/40 border-border text-foreground h-11 focus:border-primary/20 transition-all rounded-lg"
                                    : "bg-card/50 border-border text-foreground"}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                    {EQUIPMENT_TYPE_OPTIONS.map(t => (
                                        <SelectItem key={t.value} value={t.value} className="capitalize focus:bg-primary/20 focus:text-primary">{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DrawerFooter className={mode === 'edit' ? "pt-2" : ""}>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={mode === 'edit'
                                ? "w-full bg-primary text-primary-foreground font-black uppercase tracking-widest hover:bg-primary/90 transition-all h-12 rounded-lg"
                                : "w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"}>
                            {submitText}
                        </Button>
                        <DrawerClose asChild>
                            <Button
                                variant={mode === 'edit' ? "ghost" : "outline"}
                                className={mode === 'edit'
                                    ? "w-full text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-xs h-10"
                                    : "w-full border-border hover:bg-muted"}>
                                Cancel
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
