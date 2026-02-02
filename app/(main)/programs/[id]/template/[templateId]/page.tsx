"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, GripVertical, Trash2, Pencil, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { AddTemplateExerciseDrawer } from "@/components/programs/add-template-exercise-drawer"
import { removeTemplateExercise } from "@/services/exercises"
import { deleteWorkoutTemplate } from "@/services/programs"
import { toast } from "sonner"
import { EditTemplateExerciseDrawer } from "@/components/programs/edit-template-exercise-drawer"
import { EditTemplateDrawer } from "@/components/programs/edit-template-drawer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TemplateExercise {
    id: string
    exercise_id: string
    target_sets: number
    target_reps_min: number | null
    target_reps_max: number | null
    target_rir: number | null
    order: number
    exercise: {
        id: string
        name: string
        body_part: string
        type: string
    }
}

interface WorkoutTemplate {
    id: string
    name: string
    order: number
    program_id: string
}

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
                setExercises(exercisesData as TemplateExercise[])
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


    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento scheda...</div>
    if (!template) return <div className="p-8 text-center text-red-400">Scheda non trovata</div>

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 w-fit text-slate-400 hover:text-white"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna al programma
                </Button>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {template.name}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-white"
                            onClick={() => setTemplateEditOpen(true)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </h1>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                            <DropdownMenuItem onClick={() => setTemplateEditOpen(true)}>
                                Rinominia
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
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
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Esercizi</h2>
                    <AddTemplateExerciseDrawer
                        templateId={templateId}
                        currentExercisesCount={exercises.length}
                        onSuccess={loadData}
                    />
                </div>

                <div className="space-y-3">
                    {exercises.map((ex) => (
                        <Card
                            key={ex.id}
                            className="bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                            onClick={() => setEditingExercise(ex)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="text-slate-600 font-mono text-xs">
                                    {(ex.order + 1).toString().padStart(2, '0')}
                                </div>
                                {/* <GripVertical className="h-5 w-5 text-slate-600 cursor-grab opacity-0 group-hover:opacity-100" /> */}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base truncate">{ex.exercise.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {ex.target_sets} serie × {ex.target_reps_min || "?"}-{ex.target_reps_max || "?"} reps
                                        {ex.target_rir !== null && ` @ RIR ${ex.target_rir}`}
                                    </p>
                                </div>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10 z-10"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveExercise(ex.id, ex.exercise.name)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {exercises.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-slate-500">Nessun esercizio aggiunto.</p>
                            <p className="text-xs text-slate-600 mt-1">Clicca "Aggiungi Esercizio" per iniziare.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drawers & Dialogs */}
            <EditTemplateExerciseDrawer
                templateExercise={editingExercise}
                open={!!editingExercise}
                onOpenChange={(open) => !open && setEditingExercise(null)}
                onSuccess={loadData}
            />

            <EditTemplateDrawer
                template={template}
                open={templateEditOpen}
                onOpenChange={setTemplateEditOpen}
                onSuccess={loadData}
            />

            <AlertDialog open={deleteTemplateOpen} onOpenChange={setDeleteTemplateOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare {template.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Stai per eliminare questa scheda e tutti i suoi esercizi. L'azione è irreversibile.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteTemplate()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={isDeletingTemplate}
                        >
                            {isDeletingTemplate ? "Eliminazione..." : "Elimina Scheda"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
