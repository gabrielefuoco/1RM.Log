"use client"

import { useState } from "react"
import { Program } from "@/types/database"
import { UniversalListCard } from "@/components/ui/universal-list-card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight, MoreVertical, Pencil, Trash2, Power, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
    const router = useRouter()
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
            <UniversalListCard
                title={program.name}
                isActive={isActive}
                index={undefined} // Programs don't usually have an order index shown
                onClick={() => router.push(`/programs/${program.id}`)}
                className="mb-0"

                // Construct the subtitle (Dates + Desc)
                subtitle={
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(program.start_date), "d MMM yyyy", { locale: it })}
                            {program.end_date && ` - ${format(new Date(program.end_date), "d MMM yyyy", { locale: it })}`}
                        </div>
                        {program.description && (
                            <span className="text-xs text-slate-500 line-clamp-1">{program.description}</span>
                        )}
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10 text-slate-400">
                                {isActive ? "CURRENT MACROCYCLE" : "ARCHIVED"}
                            </Badge>
                        </div>
                    </div>
                }

                // Actions Menu
                actions={
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
                }
            >
                {/* Content Slot: Optional stats if we had them, distinct from subtitle */}
            </UniversalListCard>

            {/* Wrap in Link for navigation behavior if not using onClick */}
            {/* Actually UniversalCard has onClick. Let's use that for navigation. But Link is better for SEO/Standard. 
                ProgramCard usage in page.tsx wraps it? No.
                Let's use a wrapper or just the onClick prop.
            */}

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
