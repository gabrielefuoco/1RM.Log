"use client"

import { useState } from "react"
import { Exercise } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Activity, User, Anchor, MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDrawer } from "@/components/ui/confirm-drawer"
import { deleteExercise } from "@/services/exercises"
import { toast } from "sonner"
import { ExerciseDrawer } from "./exercise-drawer"

interface ExerciseListProps {
    exercises: Exercise[]
    isLoading: boolean
    onRefresh?: () => void
}

export function ExerciseList({ exercises, isLoading, onRefresh }: ExerciseListProps) {
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
    const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [editOpen, setEditOpen] = useState(false)

    const handleDelete = async () => {
        if (!exerciseToDelete) return

        setIsDeleting(true)
        try {
            await deleteExercise(exerciseToDelete.id)
            toast.success("Esercizio eliminato correttamente")
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error(error)
            toast.error("Impossibile eliminare l'esercizio (potrebbe essere in uso)")
        } finally {
            setIsDeleting(false)
            setExerciseToDelete(null)
        }
    }

    const openEdit = (exercise: Exercise) => {
        setEditingExercise(exercise)
        setEditOpen(true)
    }

    if (isLoading) {
        return <div className="text-center text-muted-foreground mt-10">Caricamento esercizi...</div>
    }

    if (exercises.length === 0) {
        return <div className="text-center text-muted-foreground mt-10">Nessun esercizio trovato.</div>
    }

    return (
        <>
            <div className="grid gap-3 pb-24">
                {exercises.map((exercise) => (
                    <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onEdit={() => openEdit(exercise)}
                        onDelete={() => setExerciseToDelete(exercise)}
                    />
                ))}
            </div>

            {/* Edit Drawer */}
            <ExerciseDrawer
                mode="edit"
                exercise={editingExercise}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={() => {
                    if (onRefresh) onRefresh()
                    toast.success("Esercizio modificato")
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmDrawer
                open={!!exerciseToDelete}
                onOpenChange={(open) => !open && setExerciseToDelete(null)}
                title="Sei sicuro?"
                description={
                    <>
                        Stai per eliminare <strong>{exerciseToDelete?.name}</strong>.
                        Questa azione non può essere annullata. Se l&apos;esercizio è usato in qualche workout storico, l&apos;eliminazione potrebbe fallire o causare incongruenze.
                    </>
                }
                confirmLabel={isDeleting ? "Eliminazione..." : "Elimina"}
                onConfirm={handleDelete}
                loading={isDeleting}
                variant="destructive"
            />
        </>
    )
}

import { UniversalListCard } from "@/components/ui/universal-list-card"

function ExerciseCard({ exercise, onEdit, onDelete }: { exercise: Exercise, onEdit: () => void, onDelete: () => void }) {
    // Icon mapping based on body part or type
    const getIcon = () => {
        if (exercise.type === 'dumbbell') return <Dumbbell className="h-4 w-4 text-primary" />
        if (exercise.type === 'machine') return <Anchor className="h-4 w-4 text-primary" />
        if (exercise.type === 'bodyweight') return <User className="h-4 w-4 text-primary" />
        return <Activity className="h-4 w-4 text-primary" />
    }

    return (
        <UniversalListCard
            title={exercise.name}
            isCompact={true}
            onClick={onEdit}
            icon={getIcon()}
            subtitle={
                <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] truncate">
                        {exercise.body_parts?.join(', ')} • {exercise.type}
                    </span>
                </div>
            }
            actions={
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                            <DropdownMenuItem onClick={onEdit} className="focus:bg-muted cursor-pointer">
                                <Pencil className="mr-2 h-4 w-4" /> Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="focus:bg-red-900/30 text-red-400 focus:text-red-400 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Elimina
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            }
        />
    )
}
