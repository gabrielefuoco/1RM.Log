"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, GripVertical, Trash2, Pencil, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { TemplateExerciseDrawer } from "@/components/programs/template-exercise-drawer"
import { removeTemplateExercise } from "@/services/exercises"
import { deleteWorkoutTemplate } from "@/services/programs"
import { toast } from "sonner"
import { TemplateExerciseCard } from "@/components/programs/template-exercise-card"
import { WorkoutTemplateDrawer } from "@/components/programs/workout-template-drawer"
import { WorkoutTemplate, TemplateExercise } from "@/types/database"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ConfirmDrawer } from "@/components/ui/confirm-drawer"


export default function TemplateDetailPage({
    params
}: {
    params: Promise<{ id: string; templateId: string }>
}) {
    const router = useRouter()
    const { id: programId, templateId } = use(params)

    const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
    const [exercises, setExercises] = useState<TemplateExercise[]>([])
    const [loading, setLoading] = useState(true)

    // Edit states
    const [editingExercise, setEditingExercise] = useState<TemplateExercise | null>(null)
    const [templateEditOpen, setTemplateEditOpen] = useState(false)
    const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false)
    const [isDeletingTemplate, setIsDeletingTemplate] = useState(false)

    const loadData = async () => {
        // Keep loading true only on first load to avoid flicker? 
        // Or just spinner handling.
        const supabase = createClient()

        // Get template details
        const { data: templateData } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (templateData) {
            setTemplate(templateData)

            // Get exercises for this template
            const { data: exercisesData } = await supabase
                .from('template_exercises')
                .select(`
                        *,
                        exercise:exercises(*)
                    `)
                .eq('workout_template_id', templateId)
                .order('order', { ascending: true })

            if (exercisesData) {
                setExercises(exercisesData as any as TemplateExercise[])
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [templateId])

    const handleRemoveExercise = async (id: string, name: string) => {
        // Immediate delete or confirm? Immediate is faster for list building.
        // Let's do optimistic UI + toast undo? Or simple confirm.
        // For now simple immediate with toast error if fail.
        if (!confirm(`Rimuovere ${name} dalla scheda?`)) return

        try {
            await removeTemplateExercise(id)
            setExercises(prev => prev.filter(e => e.id !== id))
            toast.success("Esercizio rimosso")
        } catch (error) {
            console.error(error)
            toast.error("Errore eliminazione")
        }
    }

    const handleDeleteTemplate = async () => {
        setIsDeletingTemplate(true)
        try {
            await deleteWorkoutTemplate(templateId)
            toast.success("Scheda eliminata")
            router.replace(`/programs/${programId}`)
        } catch (error) {
            console.error(error)
            toast.error("Errore nell'eliminazione della scheda")
            setIsDeletingTemplate(false)
            setDeleteTemplateOpen(false)
        }
    }


    if (loading) return <div className="p-8 text-center text-muted-foreground">Caricamento scheda...</div>
    if (!template) return <div className="p-8 text-center text-red-400">Scheda non trovata</div>

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 w-fit text-muted-foreground hover:text-foreground"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna al programma
                </Button>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        {template.name}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setTemplateEditOpen(true)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => setTemplateEditOpen(true)}>
                                Rinominia
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                                onClick={() => setDeleteTemplateOpen(true)}
                                className="text-red-400 focus:text-red-400 focus:bg-red-900/20"
                            >
                                Elimina Scheda
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Exercises List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Esercizi</h2>
                    <TemplateExerciseDrawer
                        mode="add"
                        templateId={templateId}
                        currentExercisesCount={exercises.length}
                        onSuccess={loadData}
                    />
                </div>

                <div className="space-y-3">
                    {exercises.map((ex, i) => (
                        <TemplateExerciseCard
                            key={ex.id}
                            exercise={ex}
                            index={i}
                            onEdit={setEditingExercise}
                            onRemove={handleRemoveExercise}
                        />
                    ))}

                    {exercises.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl">
                            <p className="text-muted-foreground">Nessun esercizio aggiunto.</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Clicca "Aggiungi Esercizio" per iniziare.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drawers & Dialogs */}
            <TemplateExerciseDrawer
                mode="edit"
                templateExercise={editingExercise}
                open={!!editingExercise}
                onOpenChange={(open) => !open && setEditingExercise(null)}
                onSuccess={loadData}
            />

            <WorkoutTemplateDrawer
                mode="edit"
                template={template}
                open={templateEditOpen}
                onOpenChange={setTemplateEditOpen}
                onSuccess={loadData}
            />

            <ConfirmDrawer
                open={deleteTemplateOpen}
                onOpenChange={setDeleteTemplateOpen}
                title={`Eliminare ${template.name}?`}
                description="Stai per eliminare questa scheda e tutti i suoi esercizi. L'azione è irreversibile."
                confirmLabel={isDeletingTemplate ? "Eliminazione..." : "Elimina Scheda"}
                onConfirm={handleDeleteTemplate}
                loading={isDeletingTemplate}
                variant="destructive"
            />
        </div>
    )
}
