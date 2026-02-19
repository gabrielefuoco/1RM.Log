"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Exercise } from "@/types/database"
import { getExercises, searchExercises } from "@/services/exercises" // Need to ensure searchExercises is available
import { Input } from "@/components/ui/input"
import { Search, Plus, Dumbbell } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ExercisePickerProps {
    onSelect: (exercise: Exercise) => void
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function ExercisePicker({ onSelect, trigger, open, onOpenChange }: ExercisePickerProps) {
    const [query, setQuery] = useState("")
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Initial load
    useEffect(() => {
        if (open) {
            loadExercises()
        }
    }, [open])

    const loadExercises = async () => {
        setIsLoading(true)
        try {
            const data = await getExercises()
            setExercises(data || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent className="h-[85vh] bg-background border-border">
                <DrawerHeader>
                    <DrawerTitle className="text-center mb-4">Add Exercise</DrawerTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search..."
                            className="bg-card border-border pl-10"
                        />
                    </div>
                </DrawerHeader>

                <div className="px-4 pb-4 flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1">
                        <div className="grid gap-2">
                            {exercises.length === 0 && !isLoading && (
                                <div className="text-center text-muted-foreground py-10">
                                    No exercises found.
                                </div>
                            )}

                            {filteredExercises.map(ex => (
                                <Button
                                    key={ex.id}
                                    variant="ghost"
                                    className="w-full justify-start h-auto py-3 px-3 hover:bg-card border border-transparent hover:border-primary/20 rounded-lg"
                                    onClick={() => onSelect(ex)}
                                >
                                    <div className="h-10 w-10 rounded-full bg-card/80 flex items-center justify-center mr-4 shrink-0">
                                        <Dumbbell className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">{ex.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{ex.body_parts?.join(', ')} • {ex.type}</div>
                                    </div>
                                    <Plus className="ml-auto h-5 w-5 text-muted-foreground" />
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
