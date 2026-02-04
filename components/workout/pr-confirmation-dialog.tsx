"use client"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Trophy } from "lucide-react"

interface PRUpdate {
    exerciseName: string
    old1Rm: number
    new1Rm: number
}

interface PRConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    updates: PRUpdate[]
    onConfirm: () => void
    onCancel: () => void
}

export function PRConfirmationDialog({
    open,
    onOpenChange,
    updates,
    onConfirm,
    onCancel
}: PRConfirmationDialogProps) {
    if (updates.length === 0) return null

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-zinc-950 border-white/10 text-white max-w-md rounded-3xl">
                <AlertDialogHeader>
                    <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-fit mb-2">
                        <Trophy className="h-6 w-6 text-amber-500" />
                    </div>
                    <AlertDialogTitle className="text-xl font-black uppercase tracking-widest text-center">
                        Nuovi Record!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-400">
                        Hai superato i tuoi massimali stimati in {updates.length} esercizi.
                        Vuoi aggiornare il tuo Training Max?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <ScrollArea className="max-h-[200px] my-4 pr-4">
                    <div className="space-y-3">
                        {updates.map((update, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl">
                                <div className="font-bold text-sm truncate max-w-[150px]">
                                    {update.exerciseName}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono">
                                    <span className="text-slate-500 line-through decoration-white/20">
                                        {update.old1Rm}kg
                                    </span>
                                    <span className="text-slate-700">→</span>
                                    <span className="text-primary font-black text-lg">
                                        {update.new1Rm}kg
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <AlertDialogFooter className="flex-col gap-2 sm:gap-2">
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="w-full h-12 bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider rounded-xl hover:bg-primary/90"
                    >
                        <Check className="mr-2 h-4 w-4" /> Aggiorna Tutto
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="w-full h-12 bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white font-bold rounded-xl mt-0"
                    >
                        Non ora
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
