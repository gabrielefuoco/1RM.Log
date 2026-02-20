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
        <div className="flex-1 min-w-[380px] md:min-w-[450px] flex flex-col h-full bg-muted/30 rounded-lg border border-border/40 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black text-primary border-2 border-primary shadow-[0_0_15px_rgba(0,255,163,0.3)] shrink-0">
                        {template.order + 1}
                    </div>
                    <h3 className="font-heading font-black text-foreground truncate text-2xl tracking-tighter italic" title={template.name}>
                        {template.name}
                    </h3>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border w-40">
                        <DropdownMenuItem onClick={() => setEditTemplateOpen(true)} className="cursor-pointer focus:bg-white/10">
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Rinomina
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
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
                    <div ref={setNodeRef} className="space-y-0 pb-4 pt-1 px-1 -mx-1 min-h-[100px]">
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
                            <div className="text-center py-12 opacity-50 border border-dashed border-border rounded-lg">
                                <p className="text-xs text-muted-foreground">Nessun esercizio</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </ScrollArea>

            {/* Footer Add Button */}
            <div className="p-3 border-t border-border bg-muted/30">
                <TemplateExerciseDrawer
                    mode="add"
                    templateId={template.id}
                    currentExercisesCount={exercises.length}
                    onSuccess={onRefresh}
                    trigger={
                        <Button variant="ghost" className="w-full justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/30 h-12 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all">
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
