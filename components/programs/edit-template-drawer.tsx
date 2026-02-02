"use client"

import { useState, useEffect } from "react"
import { updateWorkoutTemplate } from "@/services/programs"
import { WorkoutTemplate } from "@/types/database"
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
    DrawerClose,
} from "@/components/ui/drawer"

interface EditTemplateDrawerProps {
    template: WorkoutTemplate | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTemplateDrawer({ template, open, onOpenChange, onSuccess }: EditTemplateDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    useEffect(() => {
        if (template) {
            setName(template.name)
        }
    }, [template])

    const handleSubmit = async () => {
        if (!template || !name.trim()) return

        setLoading(true)
        try {
            await updateWorkoutTemplate(template.id, name)
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante la modifica del nome")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t border-white/10">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-white text-xl">Rinomina Scheda</DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name" className="text-white">Nome Scheda</Label>
                            <Input
                                id="template-name"
                                className="bg-zinc-900/50 border-white/10 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-background-dark font-bold hover:bg-primary/90">
                            {loading ? "Salvataggio..." : "Salva Nuvo Nome"}
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
