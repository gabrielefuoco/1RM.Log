"use client"

import { useEffect, useState, use } from "react"
import { getSessionWithLogs, deleteSession, updateSessionNotes, deleteExerciseLog, updateExerciseLog } from "@/services/workout"
import { WorkoutSession, ExerciseLog } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar, Clock, Trash2, Save, Pencil, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { useHeader } from "@/components/header-provider"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ConfirmDrawer } from "@/components/ui/confirm-drawer"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card"

// Extended types for join
// Use simpler types for state to avoid strict extension mismatch
type ExtendedSession = WorkoutSession & {
    workout_template: { name: string } | null
}

type ExtendedLog = ExerciseLog & {
    exercise: { name: string; body_parts: string[] }
}

export default function SessionDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter()
    const { id: sessionId } = use(params)

    const [session, setSession] = useState<ExtendedSession | null>(null)
    const [logs, setLogs] = useState<ExtendedLog[]>([])
    const [loading, setLoading] = useState(true)

    // Notes Edit
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [notes, setNotes] = useState("")

    // Delete Session
    const [deleteSessionOpen, setDeleteSessionOpen] = useState(false)
    const [isDeletingSession, setIsDeletingSession] = useState(false)

    // Edit Log
    const [editingLog, setEditingLog] = useState<ExtendedLog | null>(null)
    const [editLogWeight, setEditLogWeight] = useState(0)
    const [editLogReps, setEditLogReps] = useState(0)
    const [editLogRir, setEditLogRir] = useState<number | undefined>(undefined)

    const loadData = async () => {
        setLoading(true)
        try {
            const { session, logs } = await getSessionWithLogs(sessionId)
            setSession(session as ExtendedSession)
            setLogs(logs as ExtendedLog[])
            setNotes(session.notes || "")
        } catch (error) {
            console.error(error)
            toast.error("Errore nel caricamento sessione")
        } finally {
            setLoading(false)
        }
    }

    const { setHeader } = useHeader()

    useEffect(() => {
        loadData()
    }, [sessionId])

    useEffect(() => {
        if (session) {
            setHeader({
                title: session.workout_template?.name || "Free Workout",
                subtitle: format(new Date(session.date), "d MMM yyyy, HH:mm")
            })
        }
    }, [session, setHeader])

    const handleSaveNotes = async () => {
        try {
            await updateSessionNotes(sessionId, notes)
            toast.success("Note salvate")
            setIsEditingNotes(false)
            setSession(prev => prev ? { ...prev, notes } : null)
        } catch (error) {
            console.error(error)
            toast.error("Errore salvataggio note")
        }
    }

    const handleDeleteSession = async () => {
        setIsDeletingSession(true)
        try {
            await deleteSession(sessionId)
            toast.success("Allenamento eliminato")
            router.replace("/history")
        } catch (error) {
            console.error(error)
            toast.error("Errore eliminazione")
            setIsDeletingSession(false)
            setDeleteSessionOpen(false)
        }
    }

    const handleUpdateLog = async () => {
        if (!editingLog) return
        try {
            await updateExerciseLog(editingLog.id, {
                weight: editLogWeight,
                reps: editLogReps,
                rir: editLogRir
            })
            toast.success("Set aggiornato")
            setEditingLog(null)
            loadData() // Refresh full list
        } catch (error) {
            console.error(error)
            toast.error("Errore aggiornamento set")
        }
    }

    const handleDeleteLog = async (logId: string) => {
        if (!confirm("Eliminare questo set?")) return
        try {
            await deleteExerciseLog(logId)
            setLogs(prev => prev.filter(l => l.id !== logId))
            toast.success("Set eliminato")
        } catch (error) {
            console.error(error)
            toast.error("Errore eliminazione set")
        }
    }

    // Group logs by exercise for display
    const groupedLogs = logs.reduce((acc, log) => {
        const key = log.exercise_id
        if (!acc[key]) {
            acc[key] = {
                exerciseName: log.exercise?.name || "Exercise removed",
                exerciseBodyParts: log.exercise?.body_parts || [],
                logs: []
            }
        }
        acc[key].logs.push(log)
        return acc
    }, {} as Record<string, { exerciseName: string; exerciseBodyParts: string[]; logs: ExtendedLog[] }>)


    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
    if (!session) return <div className="p-8 text-center text-red-400">Workout not found</div>

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="-ml-3 w-fit text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to History
                </Button>

                <div className="flex items-center gap-2">
                    {session.duration_seconds && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {Math.floor(session.duration_seconds / 60)} min
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                                onClick={() => setDeleteSessionOpen(true)}
                                className="text-red-400 focus:text-red-400 focus:bg-red-900/20"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Workout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Notes Section */}
            <Card className="border-border/50">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Notes</h3>
                        {!isEditingNotes && (
                            <Button variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingNotes(true)}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {isEditingNotes ? (
                        <div className="space-y-2">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-card border-border min-h-[80px]"
                                placeholder="Write notes..."
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(false)} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                                <Button size="sm" onClick={handleSaveNotes} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">Save</Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {session.notes || "No notes."}
                        </p>
                    )}
                </CardContent>
            </Card>


            {/* Logs List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">Exercises</h2>
                </div>

                <div className="space-y-4">
                    {Object.values(groupedLogs).map((group, idx) => (
                        <WorkoutExerciseCard
                            key={idx}
                            title={group.exerciseName}
                            index={idx}
                            mode="history"
                            items={group.logs}
                            subtitle={
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {group.exerciseBodyParts.map((bp) => (
                                        <Badge key={bp} variant="secondary" className="text-[9px] h-3.5 px-1.5 bg-muted/50 text-muted-foreground border-none font-black uppercase tracking-tighter">
                                            {bp}
                                        </Badge>
                                    ))}
                                </div>
                            }
                            actions={
                                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                    {/* Actions for specific logs would need to be handled differently if we want per-set actions. 
                                        For now, keeping the detail view clean. If the user needs to edit, they can click a 'pencil' which we can add to the card as a global edit or keep per-set if we extend the card.
                                        But to match 'Programs' exactly, let's keep it clean.
                                    */}
                                </div>
                            }
                        />
                    ))}

                    {logs.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-border rounded-xl">
                            <p className="text-muted-foreground">No sets recorded in this session.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Session Alert */}
            <ConfirmDrawer
                open={deleteSessionOpen}
                onOpenChange={setDeleteSessionOpen}
                title="Delete Workout?"
                description="This action will delete the entire session and all recorded sets."
                confirmLabel={isDeletingSession ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                onConfirm={handleDeleteSession}
                loading={isDeletingSession}
                variant="destructive"
            />

            {/* Edit Log Drawer */}
            <Drawer open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
                <DrawerContent className="bg-card border-t border-border">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle>Modify Set</DrawerTitle>
                            <DrawerDescription>{editingLog?.exercise.name}</DrawerDescription>
                        </DrawerHeader>

                        <div className="grid grid-cols-2 gap-4 px-4 py-4">
                            <div className="space-y-2">
                                <Label>Weight (kg)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={editLogWeight}
                                    onChange={(e) => setEditLogWeight(Number(e.target.value))}
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Reps</Label>
                                <Input
                                    type="number"
                                    value={editLogReps}
                                    onChange={(e) => setEditLogReps(Number(e.target.value))}
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>RIR (Optional)</Label>
                                <Input
                                    type="number"
                                    value={editLogRir ?? ""}
                                    onChange={(e) => setEditLogRir(e.target.value ? Number(e.target.value) : undefined)}
                                    className="bg-card border-border"
                                />
                            </div>
                        </div>

                        <DrawerFooter>
                            <Button onClick={handleUpdateLog} className="bg-primary text-primary-foreground font-bold w-full">Save</Button>
                            <Button variant="outline" onClick={() => setEditingLog(null)} className="text-muted-foreground border-border w-full">Cancel</Button>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

        </div>
    )
}
