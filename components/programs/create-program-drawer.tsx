"use client"

import { useState } from "react"
import { createProgram } from "@/services/programs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Need to install textarea or use Input
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"
import { Plus } from "lucide-react"

interface CreateProgramDrawerProps {
    onSuccess: () => void
}

export function CreateProgramDrawer({ onSuccess }: CreateProgramDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")

    const handleSubmit = async () => {
        if (!name.trim()) return

        setLoading(true)
        try {
            await createProgram({
                name,
                description: description || null,
                start_date: new Date().toISOString(),
                end_date: null,
                is_active: true // Auto-activate new programs? Usually yes.
            })
            setOpen(false)
            setName("")
            setDescription("")
            onSuccess()
        } catch (error: any) {
            console.error(error)
            alert(`Errore: ${error.message || "Impossibile creare il programma"}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-primary/20 z-40 bg-primary hover:bg-primary/90 text-background-dark p-0">
                    <Plus className="h-8 w-8" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Nuovo Programma</DrawerTitle>
                        <DrawerDescription>Inizia un nuovo blocco di allenamento (es. Mesociclo 1).</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prog-name" className="text-white">Nome Programma</Label>
                            <Input
                                id="prog-name"
                                placeholder="es. Winter Bulk - Week 1-4"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="prog-desc" className="text-white">Descrizione (Opzionale)</Label>
                            <Input
                                id="prog-desc"
                                placeholder="Obiettivi del mesociclo..."
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90">
                            {loading ? "Creazione..." : "Inizia Programma"}
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
