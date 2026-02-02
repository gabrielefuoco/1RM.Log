"use client"

import { useState } from "react"
import { createWorkoutTemplate } from "@/services/programs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface CreateWorkoutTemplateDrawerProps {
    programId: string
    currentTemplatesCount: number
    onSuccess: () => void
    children?: React.ReactNode
}

export function CreateWorkoutTemplateDrawer({
    programId,
    currentTemplatesCount,
    onSuccess,
    children
}: CreateWorkoutTemplateDrawerProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    const handleSubmit = async () => {
        if (!name.trim()) return

        setLoading(true)
        try {
            await createWorkoutTemplate({
                program_id: programId,
                name,
                order: currentTemplatesCount // Next in order
            })
            setOpen(false)
            setName("")
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante la creazione della scheda")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                        <Plus className="h-3 w-3 mr-1" />
                        Aggiungi Giorno
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Nuova Scheda</DrawerTitle>
                        <DrawerDescription>Aggiungi un giorno di allenamento al programma.</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name" className="text-white">Nome Scheda</Label>
                            <Input
                                id="template-name"
                                placeholder="es. Giorno 1 - Upper Body"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !name.trim()}
                            className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90"
                        >
                            {loading ? "Creazione..." : "Crea Scheda"}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 hover:text-white">
                                Annulla
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
