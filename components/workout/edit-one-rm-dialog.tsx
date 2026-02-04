
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { getUserOneRm, upsertUserOneRm, deleteUserOneRm } from "@/services/one-rm"

interface EditOneRmDialogProps {
    exerciseId: string
    exerciseName: string
    history1RM: number
    onUpdate: () => void
    trigger?: React.ReactNode
}

export function EditOneRmDialog({ exerciseId, exerciseName, history1RM, onUpdate, trigger }: EditOneRmDialogProps) {
    const [open, setOpen] = useState(false)
    const [manualOneRm, setManualOneRm] = useState<number | undefined>(undefined)
    const [loading, setLoading] = useState(false)
    const [isOverrideActive, setIsOverrideActive] = useState(false)

    useEffect(() => {
        if (open) {
            loadOneRm()
        }
    }, [open, exerciseId])

    const loadOneRm = async () => {
        setLoading(true)
        try {
            const data = await getUserOneRm(exerciseId)
            if (data && data.one_rm > 0) {
                setManualOneRm(data.one_rm)
                setIsOverrideActive(true)
            } else {
                setManualOneRm(undefined)
                setIsOverrideActive(false)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!manualOneRm || manualOneRm <= 0) {
            toast.error("Inserisci un valore valido")
            return
        }
        setLoading(true)
        try {
            await upsertUserOneRm(exerciseId, manualOneRm)
            toast.success("Massimale aggiornato")
            setOpen(false)
            onUpdate()
        } catch (error) {
            toast.error("Errore nel salvataggio")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        setLoading(true)
        try {
            await deleteUserOneRm(exerciseId)
            toast.success("Ripristinato massimale storico")
            setManualOneRm(undefined)
            setIsOverrideActive(false)
            setOpen(false)
            onUpdate()
        } catch (error) {
            toast.error("Errore nel ripristino")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground gap-1">
                        <Trophy className="h-3 w-3" />
                        {isOverrideActive ? "Override" : "Storico"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Gestisci Massimale (1RM)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Esercizio</span>
                        <p className="font-bold text-lg">{exerciseName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Miglior Storico (Stimato)</Label>
                            <div className="h-10 flex items-center px-3 rounded-md bg-muted/50 border border-transparent font-mono font-bold text-muted-foreground">
                                {history1RM > 0 ? history1RM : "-"} kg
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-amber-500 font-bold">Override Manuale (TM)</Label>
                            <Input
                                type="number"
                                value={manualOneRm || ''}
                                onChange={(e) => setManualOneRm(Number(e.target.value))}
                                className="font-bold font-mono text-amber-500 border-amber-500/20 focus:border-amber-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button onClick={handleSave} disabled={loading} className="w-full gap-2 font-bold bg-amber-500 hover:bg-amber-600 text-black">
                            <Save className="h-4 w-4" />
                            Salva Manualmente
                        </Button>

                        {isOverrideActive && (
                            <Button onClick={handleReset} variant="outline" disabled={loading} className="w-full gap-2 text-muted-foreground">
                                <RotateCcw className="h-4 w-4" />
                                Ripristina da Storico
                            </Button>
                        )}
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                        Impostando un valore manuale, tutti i calcoli percentuali per questo esercizio useranno questo valore invece dello storico.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
