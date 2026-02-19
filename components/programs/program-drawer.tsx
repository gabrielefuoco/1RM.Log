"use client"

import { useState, useEffect } from "react"
import { createProgram, updateProgram } from "@/services/programs"
import { Program } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormDrawer } from "./form-drawer"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ProgramDrawerProps {
    mode: 'create' | 'edit'
    program?: Program | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess: () => void
    trigger?: React.ReactNode
}

export function ProgramDrawer({ mode, program, open: controlledOpen, onOpenChange: setControlledOpen, onSuccess, trigger }: ProgramDrawerProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [startDate, setStartDate] = useState("")

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setIsOpen = setControlledOpen || setInternalOpen

    useEffect(() => {
        if (mode === 'edit' && program) {
            setName(program.name)
            setDescription(program.description || "")
            const d = new Date(program.start_date)
            setStartDate(program.start_date ? format(d, 'yyyy-MM-dd') : "")
        } else if (mode === 'create' && isOpen) {
            // Reset form on open if create
            if (!name) setName("")
            if (!description) setDescription("")
        }
    }, [mode, program, isOpen])

    const handleSubmit = async () => {
        if (!name.trim()) return
        setLoading(true)
        try {
            if (mode === 'create') {
                await createProgram({
                    name,
                    description: description || null,
                    start_date: new Date().toISOString(), // Default to today, maybe editable later if needed
                    end_date: null,
                    is_active: true
                })
                toast.success("Programma creato!")
            } else {
                if (!program) return
                await updateProgram(program.id, {
                    name,
                    description,
                    start_date: startDate || program.start_date
                })
                toast.success("Programma aggiornato!")
            }
            setIsOpen(false)
            onSuccess()
            if (mode === 'create') {
                setName("")
                setDescription("")
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || `Errore ${mode === 'create' ? 'creazione' : 'modifica'} programma`)
        } finally {
            setLoading(false)
        }
    }

    const defaultTrigger = mode === 'create' ? (
        <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/20 z-40 bg-primary hover:bg-primary/90 text-background-dark p-0">
            <Plus className="h-8 w-8" />
        </Button>
    ) : null

    return (
        <FormDrawer
            open={isOpen}
            onOpenChange={setIsOpen}
            title={mode === 'create' ? "Nuovo Programma" : "Modifica Programma"}
            description={mode === 'create'
                ? "Inizia un nuovo blocco di allenamento (es. Mesociclo 1)."
                : "Aggiorna le impostazioni del macrociclo."}
            trigger={trigger || defaultTrigger}
            submitLabel={mode === 'create' ? "Inizia Programma" : "Salva Modifiche"}
            loadingLabel={loading ? "Salvataggio..." : undefined}
            loading={loading}
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="prog-name" className="text-white">Nome Programma</Label>
                    <Input
                        id="prog-name"
                        placeholder="es. Winter Bulk - Week 1-4"
                        className="bg-card/50 border-border text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="prog-desc" className="text-white">Descrizione (Opzionale)</Label>
                    {mode === 'create' ? (
                        <Input
                            id="prog-desc"
                            placeholder="Obiettivi del mesociclo..."
                            className="bg-card/50 border-border text-white"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    ) : (
                        <Textarea
                            id="prog-desc"
                            placeholder="Obiettivi: Ipertrofia..."
                            className="bg-card/50 border-border text-white resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    )}
                </div>
                {mode === 'edit' && (
                    <div className="space-y-2">
                        <Label htmlFor="prog-date" className="text-white">Data Inizio</Label>
                        <Input
                            id="prog-date"
                            type="date"
                            className="bg-card/50 border-border text-white w-full block"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </FormDrawer>
    )
}
