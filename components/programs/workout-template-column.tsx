"use client"

import { useState } from "react"
import { WorkoutTemplate, TemplateExercise } from "@/types/database"
import { TemplateExerciseCard } from "@/components/programs/template-exercise-card"
import { TemplateExerciseDrawer } from "@/components/programs/template-exercise-drawer"
import { WorkoutTemplateDrawer } from "@/components/programs/workout-template-drawer"
import { ConfirmDrawer } from "@/components/ui/confirm-drawer"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { removeTemplateExercise } from "@/services/exercises"
import { deleteWorkoutTemplate } from "@/services/programs"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableTemplateExerciseCard } from "./sortable-template-exercise-card"

interface WorkoutTemplateColumnProps {
    template: WorkoutTemplate & { template_exercises: any[] }
    exercises: TemplateExercise[] // Controlled exercises
    onRefresh: () => void
}

export function WorkoutTemplateColumn({ template, exercises, onRefresh }: WorkoutTemplateColumnProps) {
    const [editingExercise, setEditingExercise] = useState<TemplateExercise | null>(null)
    const [editTemplateOpen, setEditTemplateOpen] = useState(false)
    const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Droppable for the column itself
    const { setNodeRef } = useDroppable({
        id: template.id,
        data: {
            type: 'Column',
            template
        }
    })

    const handleRemoveExercise = async (id: string, name: string) => {
        if (!confirm(`Rimuovere ${name}?`)) return

        try {
            await removeTemplateExercise(id)
            toast.success("Esercizio rimosso")
            onRefresh()
        } catch (error) {
            console.error(error)
            toast.error("Errore eliminazione")
        }
    }

    const handleDeleteTemplate = async () => {
        setIsDeleting(true)
        try {
            await deleteWorkoutTemplate(template.id)
            toast.success("Scheda eliminata")
            onRefresh()
        } catch (error) {
            console.error(error)
            toast.error("Errore nell'eliminazione della scheda")
        } finally {
            setIsDeleting(false)
            setDeleteTemplateOpen(false)
        }
    }

    return (
        <div className="flex-1 min-w-[400px] flex flex-col h-full bg-black/20 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20 shrink-0 shadow-[0_0_10px_-4px_var(--primary)]">
                        {template.order + 1}
                    </div>
                    <h3 className="font-heading font-bold text-white truncate text-lg tracking-wide" title={template.name}>
                        {template.name}
                    </h3>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white w-40">
                        <DropdownMenuItem onClick={() => setEditTemplateOpen(true)} className="cursor-pointer focus:bg-white/10">
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Rinomina
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={() => setDeleteTemplateOpen(true)}
                            className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                        >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Elimina
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-3">
                <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
                    <div ref={setNodeRef} className="space-y-0 pb-4 min-h-[100px]">
                        {exercises.map((ex, i) => (
                            <SortableTemplateExerciseCard
                                key={ex.id}
                                exercise={ex}
                                index={i}
                                onEdit={setEditingExercise}
                                onRemove={handleRemoveExercise}
                            />
                        ))}

                        {exercises.length === 0 && (
                            <div className="text-center py-12 opacity-50 border border-dashed border-white/10 rounded-lg">
                                <p className="text-xs text-slate-400">Nessun esercizio</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </ScrollArea>

            {/* Footer Add Button */}
            <div className="p-3 border-t border-white/5 bg-zinc-900/30">
                <TemplateExerciseDrawer
                    mode="add"
                    templateId={template.id}
                    currentExercisesCount={exercises.length}
                    onSuccess={onRefresh}
                    trigger={
                        <Button variant="ghost" className="w-full justify-center text-slate-500 hover:text-primary hover:bg-primary/5 border border-dashed border-white/10 hover:border-primary/30 h-10 text-xs font-bold uppercase tracking-widest transition-all">
                            <Plus className="h-4 w-4 mr-2" /> Aggiungi Esercizio
                        </Button>
                    }
                />
            </div>

            {/* Drawers */}
            <TemplateExerciseDrawer
                mode="edit"
                templateExercise={editingExercise}
                open={!!editingExercise}
                onOpenChange={(open) => !open && setEditingExercise(null)}
                onSuccess={onRefresh}
            />

            <WorkoutTemplateDrawer
                mode="edit"
                template={template}
                open={editTemplateOpen}
                onOpenChange={setEditTemplateOpen}
                onSuccess={onRefresh}
            />

            <ConfirmDrawer
                open={deleteTemplateOpen}
                onOpenChange={setDeleteTemplateOpen}
                title={`Eliminare ${template.name}?`}
                description="Sei sicuro? Tutti gli esercizi verranno persi."
                confirmLabel={isDeleting ? "..." : "Elimina"}
                onConfirm={handleDeleteTemplate}
                loading={isDeleting}
                variant="destructive"
            />
        </div>
    )
}
