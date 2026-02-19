"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TemplateExercise } from "@/types/database"
import { TemplateExerciseCard } from "./template-exercise-card"
import { GripVertical } from "lucide-react"

interface SortableTemplateExerciseCardProps {
    exercise: TemplateExercise
    index: number
    onEdit: (exercise: TemplateExercise) => void
    onRemove: (id: string, name: string) => void
}

export function SortableTemplateExerciseCard({
    exercise,
    index,
    onEdit,
    onRemove
}: SortableTemplateExerciseCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: exercise.id,
        data: {
            type: 'Exercise',
            exercise,
            index
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        // zIndex: isDragging ? 999 : undefined // Handled by DragOverlay usually
    }

    return (
        <div ref={setNodeRef} style={style} className="mb-3">
            <TemplateExerciseCard
                exercise={exercise}
                index={index}
                onEdit={onEdit}
                onRemove={onRemove}
                dragHandle={
                    <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-1 -m-1">
                        <GripVertical className="h-4 w-4" />
                    </div>
                }
            />
        </div>
    )
}
