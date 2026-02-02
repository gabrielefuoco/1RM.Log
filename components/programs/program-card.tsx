"use client"

import { useState } from "react"
import { Program } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight, MoreVertical, Pencil, Trash2, Power, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
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
import { deleteProgram, toggleProgramActive } from "@/services/programs"
import { toast } from "sonner"
import { EditProgramDrawer } from "./edit-program-drawer"

interface ProgramCardProps {
    program: Program
    onRefresh?: () => void
}

export function ProgramCard({ program, onRefresh }: ProgramCardProps) {
    const isActive = program.is_active
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteProgram(program.id)
            toast.success("Programma eliminato")
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error(error)
            toast.error("Errore nell'eliminazione")
        } finally {
            setIsDeleting(false)
            setDeleteOpen(false)
        }
    }

    const handleToggleActive = async () => {
        try {
            await toggleProgramActive(program.id)
            toast.success("Programma attivato")
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error(error)
            toast.error("Errore nell'attivazione")
        }
    }

    return (
        <>
            <Card className={`relative transition-all hover:bg-zinc-900/60 border-white/5 ${isActive ? 'bg-zinc-900/40 border-primary/30 shadow-[0_0_15px_rgba(19,236,109,0.1)]' : 'bg-transparent opacity-80'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                    <Link href={`/programs/${program.id}`} className="flex-1 min-w-0 pr-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {isActive && <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-primary/20 h-5 text-[10px]">ATTIVO</Badge>}
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(program.start_date), "d MMM yyyy", { locale: it })}
                                </span>
                            </div>
                            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {program.name}
                            </h3>
                            {program.description && (
                                <p className="text-xs text-slate-500 line-clamp-1 mt-1">{program.description}</p>
                            )}
                        </div>
                    </Link>

                    <div className="shrink-0 flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10 text-white">
                                {!isActive && (
                                    <DropdownMenuItem onClick={handleToggleActive} className="focus:bg-primary/20 text-primary focus:text-primary cursor-pointer">
                                        <Power className="mr-2 h-4 w-4" /> Imposta Attivo
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setEditOpen(true)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" /> Modifica
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="focus:bg-red-900/30 text-red-400 focus:text-red-400 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" /> Elimina
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            <EditProgramDrawer
                program={program}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={() => {
                    toast.success("Programma aggiornato")
                    if (onRefresh) onRefresh()
                }}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminare {program.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Stai per eliminare questo Programma e <strong>tutti i suoi Workout Templates</strong> associati.
                            <br /><br />
                            <span className="flex items-center gap-2 text-yellow-500">
                                <AlertTriangle className="h-4 w-4" />
                                Le sessioni storiche rimarranno, ma perderanno il riferimento al template originale.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Eliminazione..." : "Elimina Tutto"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
