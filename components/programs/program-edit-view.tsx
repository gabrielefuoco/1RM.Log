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
import { useState, useEffect } from "react"
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

    // Initialize/Sync State
    useEffect(() => {
        const newItems: Record<string, TemplateExercise[]> = {}
        templates.forEach(t => {
            // Ensure they are sorted by order
            const sorted = [...(t.template_exercises || [])].sort((a, b) => a.order - b.order)
            newItems[t.id] = sorted
        })
        setItems(newItems)
    }, [templates])


    // 2. Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // 3. Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id as string)

        const findContainer = (id: string) => {
            if (id in items) return id
            return Object.keys(items).find(key => items[key].some(e => e.id === id))
        }

        const container = findContainer(active.id as string)
        setOriginalContainer(container || null)

        if (container) {
            const ex = items[container].find(e => e.id === active.id)
            if (ex) setActiveExercise(ex)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find source and destination containers
        const findContainer = (id: string) => {
            if (id in items) return id
            return Object.keys(items).find(key => items[key].some(e => e.id === id))
        }

        const activeContainer = findContainer(activeId)
        const overContainer = findContainer(overId)

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return
        }

        // Moving between containers
        setItems((prev) => {
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

            // Update the pushed item with new template ID immediately?
            // No, the ID in DB is updated on DragEnd.
            // But for rendering, we use local state.

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

        // Commit the final move if needed (same container reorder)
        // If different container, dragOver handled the move, but we might need final reorder.

        const activeId = active.id as string
        const overId = over ? (over.id as string) : null

        let currentState = { ...items }

        const findValContainer = (id: string, currentItems: typeof items) =>
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
                setItems(currentState)
            }
        }

        setActiveId(null)
        setActiveExercise(null)
        setOriginalContainer(null)

        // PERSISTENCE
        // Update DB for affected containers.
        const containersToUpdate = new Set<string>()
        if (activeContainer) containersToUpdate.add(activeContainer)
        if (originalContainer) containersToUpdate.add(originalContainer)

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
            await Promise.all(promises)
            // toast.success("Salvato")
        } catch (e) {
            console.error(e)
            toast.error("Errore salvataggio")
            onRefresh()
        }
    }

    return (
        <div className="h-full w-full">
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
                            <div className="w-[320px] opacity-90 cursor-grabbing bg-black/80 backdrop-blur-xl rounded-xl border border-primary/50 shadow-[0_0_50px_-12px_var(--primary)] overflow-hidden scale-105 rotate-2">
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
