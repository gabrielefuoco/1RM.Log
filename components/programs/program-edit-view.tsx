"use client"

import { WorkoutTemplate } from "@/types/database"
import { WorkoutTemplateColumn } from "@/components/programs/workout-template-column"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical } from "lucide-react"
import { WorkoutTemplateDrawer } from "@/components/programs/workout-template-drawer"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState, useEffect, useRef } from "react"
import { TemplateExercise } from "@/types/database"
import { updateTemplateExerciseOrder } from "@/services/exercises"
import { toast } from "sonner"
import { createPortal } from "react-dom"
import { TemplateExerciseCard } from "@/components/programs/template-exercise-card"

interface ProgramEditViewProps {
    programId: string
    templates: (WorkoutTemplate & { template_exercises: any[] })[]
    onRefresh: () => void
}

export function ProgramEditView({ programId, templates, onRefresh }: ProgramEditViewProps) {
    // 1. Local State for DnD (Optimistic UI)
    const [items, setItems] = useState<Record<string, TemplateExercise[]>>({})
    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeExercise, setActiveExercise] = useState<TemplateExercise | null>(null)
    const [originalContainer, setOriginalContainer] = useState<string | null>(null)

    // Refs for accessing latest state in event handlers
    const itemsRef = useRef<Record<string, TemplateExercise[]>>(items)
    const activeIdRef = useRef(activeId)

    // Helper to update items and ref key
    const updateItems = (newItems: Record<string, TemplateExercise[]> | ((prev: Record<string, TemplateExercise[]>) => Record<string, TemplateExercise[]>)) => {
        if (typeof newItems === 'function') {
            setItems(prev => {
                const next = newItems(prev)
                itemsRef.current = next
                return next
            })
        } else {
            setItems(newItems)
            itemsRef.current = newItems
        }
    }

    // Initialize/Sync State
    useEffect(() => {
        const newItems: Record<string, TemplateExercise[]> = {}
        templates.forEach(t => {
            // Ensure they are sorted by order
            const sorted = [...(t.template_exercises || [])].sort((a, b) => a.order - b.order)
            newItems[t.id] = sorted
        })
        updateItems(newItems)
    }, [templates])

    useEffect(() => {
        activeIdRef.current = activeId
    }, [activeId])


    // 2. Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // 3. Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)

        const currentItems = itemsRef.current
        const findContainer = (id: string) => {
            if (id in currentItems) return id
            return Object.keys(currentItems).find(key => currentItems[key].some(e => e.id === id))
        }

        const container = findContainer(active.id as string)
        setOriginalContainer(container || null)

        if (container) {
            const ex = currentItems[container].find(e => e.id === active.id)
            if (ex) setActiveExercise(ex)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find source and destination containers
        const currentItems = itemsRef.current
        const findContainer = (id: string) => {
            if (id in currentItems) return id
            return Object.keys(currentItems).find(key => currentItems[key].some(e => e.id === id))
        }

        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId)

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return
        }

        // Moving between containers
        updateItems((prev) => {
            const activeItems = prev[activeContainer]
            const overItems = prev[overContainer]
            const activeIndex = activeItems.findIndex(i => i.id === activeId)
            const overIndex = overItems.findIndex(i => i.id === overId)

            let newIndex
            if (overId in prev) {
                // Determine if we're hovering over the container itself (empty or end)
                newIndex = overItems.length + 1
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter(item => item.id !== activeId)
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length)
                ]
            }
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        const activeId = active.id as string
        const overId = over ? (over.id as string) : null

        // Use Ref for latest state (crucial!)
        let currentState = { ...itemsRef.current }

        const findValContainer = (id: string, currentItems: typeof currentState) =>
            Object.keys(currentItems).find(key => currentItems[key].some(e => e.id === id))

        const activeContainer = findValContainer(activeId, currentState)
        // Check if overId is a container key itself
        const overContainer = overId ? (overId in currentState ? overId : findValContainer(overId!, currentState)) : null

        if (activeContainer && overContainer && activeContainer === overContainer) {
            const activeIndex = currentState[activeContainer].findIndex(i => i.id === activeId)
            const overIndex = overId! in currentState ? currentState[activeContainer].length : currentState[activeContainer].findIndex(i => i.id === overId)

            if (activeIndex !== overIndex) {
                currentState = {
                    ...currentState,
                    [activeContainer]: arrayMove(currentState[activeContainer], activeIndex, overIndex)
                }
                updateItems(currentState)
            }
        }

        const original = originalContainer // Capture before reset
        setActiveId(null)
        setActiveExercise(null)
        setOriginalContainer(null)

        // PERSISTENCE
        const containersToUpdate = new Set<string>()
        if (activeContainer) containersToUpdate.add(activeContainer)
        if (original) containersToUpdate.add(original)

        try {
            const promises: Promise<any>[] = []
            for (const cid of Array.from(containersToUpdate)) {
                if (!currentState[cid]) continue

                currentState[cid].forEach((ex, index) => {
                    promises.push(updateTemplateExerciseOrder(ex.id, {
                        order: index,
                        workout_template_id: cid
                    }))
                })
            }
            if (promises.length > 0) {
                await Promise.all(promises)
                // toast.success("Ordine salvato")
                onRefresh()
            }
        } catch (e) {
            console.error(e)
            toast.error("Errore salvataggio")
            onRefresh() // Revert on error
        }
    }

    return (
        <div className="h-full w-full">
            <div className="mb-8 px-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    Schede Allenamento
                </h2>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
                    <div className="flex min-w-full w-max space-x-4 p-1 pb-4">
                        {templates.map((template) => (
                            <WorkoutTemplateColumn
                                key={template.id}
                                template={template}
                                exercises={items[template.id] || []}
                                onRefresh={onRefresh}
                            />
                        ))}

                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {createPortal(
                    <DragOverlay>
                        {activeExercise ? (
                            <div className="w-[320px] opacity-90 cursor-grabbing bg-card/95 backdrop-blur-xl rounded-lg border border-primary/40 shadow-lg overflow-hidden scale-105 rotate-2">
                                <TemplateExerciseCard
                                    exercise={activeExercise}
                                    index={0}
                                    onEdit={() => { }}
                                    onRemove={() => { }}
                                    dragHandle={<div className="p-1 text-primary"><GripVertical className="h-5 w-5" /></div>}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    )
}
