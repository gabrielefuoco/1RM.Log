"use client"

import { useState, useEffect } from "react"
import { updateProgram } from "@/services/programs"
import { Program } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
} from "@/components/ui/drawer"
import { format } from "date-fns"

interface EditProgramDrawerProps {
    program: Program | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditProgramDrawer({ program, open, onOpenChange, onSuccess }: EditProgramDrawerProps) {
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [startDate, setStartDate] = useState("")

    useEffect(() => {
        if (program) {
            setName(program.name)
            setDescription(program.description || "")
            // Format date for input date type YYYY-MM-DD
            const d = new Date(program.start_date)
            setStartDate(program.start_date ? format(d, 'yyyy-MM-dd') : "")
        }
    }, [program])

    const handleSubmit = async () => {
        if (!program || !name.trim() || !startDate) return

        setLoading(true)
        try {
            await updateProgram(program.id, {
                name,
                description,
                start_date: startDate
            })
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante modifica programma")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Modifica Programma</DrawerTitle>
                        <DrawerDescription>Aggiorna le impostazioni del macrociclo.</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-prog-name" className="text-white">Nome Programma</Label>
                            <Input
                                id="edit-prog-name"
                                placeholder="es. Winter Arc 2026"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-prog-desc" className="text-white">Descrizione (Opzionale)</Label>
                            <Textarea
                                id="edit-prog-desc"
                                placeholder="Obiettivi: Ipertrofia..."
                                className="bg-zinc-900/50 border-white/10 text-white resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-prog-date" className="text-white">Data Inizio</Label>
                            <Input
                                id="edit-prog-date"
                                type="date"
                                className="bg-zinc-900/50 border-white/10 text-white w-full block"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90">
                            {loading ? "Salvataggio..." : "Salva Modifiche"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">Annulla</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
