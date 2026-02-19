"use client"

import { useState, useEffect } from "react"
import { createWorkoutTemplate, updateWorkoutTemplate } from "@/services/programs"
import { WorkoutTemplate } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDrawer } from "./form-drawer"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WorkoutTemplateDrawerProps {
    mode: 'create' | 'edit'
    programId?: string // Required for create
    template?: WorkoutTemplate | null // Required for edit
    currentTemplatesCount?: number // Used for ordering in create mode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess: () => void
}

export function WorkoutTemplateDrawer({
    mode,
    programId,
    template,
    currentTemplatesCount = 0,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    onSuccess
}: WorkoutTemplateDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setIsOpen = setControlledOpen || setInternalOpen

    useEffect(() => {
        if (mode === 'edit' && template) {
            setName(template.name)
        } else if (mode === 'create' && isOpen) {
            // Reset
            if (!name) setName("")
        }
    }, [mode, template, isOpen])

    const handleSubmit = async () => {
        if (!name.trim()) return

        if (mode === 'create' && !programId) {
            toast.error("Program ID mancante")
            return
        }

        setLoading(true)
        try {
            if (mode === 'create') {
                await createWorkoutTemplate({
                    program_id: programId!,
                    name,
                    order: currentTemplatesCount
                })
                toast.success("Scheda creata!")
            } else {
                if (!template) return
                await updateWorkoutTemplate(template.id, name)
                toast.success("Scheda aggiornata!")
            }

            setIsOpen(false)
            onSuccess()
            if (mode === 'create') {
                setName("")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || `Errore ${mode === 'create' ? 'creazione' : 'modifica'} scheda`)
        } finally {
            setLoading(false)
        }
    }

    const defaultTrigger = mode === 'create' ? (
        <Button variant="outline" size="sm" className="h-8 border-dashed border-white/20 hover:border-primary hover:text-primary">
            <Plus className="h-4 w-4 mr-1" />
            Nuova Scheda
        </Button>
    ) : null

    return (
        <FormDrawer
            open={isOpen}
            onOpenChange={setIsOpen}
            title={mode === 'create' ? "Nuova Scheda Allenamento" : "Modifica Scheda"}
            description={mode === 'create'
                ? "Aggiungi una giornata (es. Push A, Upper Body)."
                : "Aggiorna i dettagli della scheda."}
            trigger={defaultTrigger}
            submitLabel={mode === 'create' ? "Crea Scheda" : "Salva Modifiche"}
            loadingLabel={loading ? "Salvataggio..." : undefined}
            loading={loading}
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-white">Nome Scheda</Label>
                    <Input
                        id="template-name"
                        placeholder="es. Upper Body A"
                        className="bg-card/50 border-border text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </div>
        </FormDrawer>
    )
}
