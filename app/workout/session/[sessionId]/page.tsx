"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSessionRunnerData, logSet, finishSession, getPreviousLogs } from "@/services/workout"
import { Exercise, ExerciseLog, WorkoutTemplate } from "@/types/database"
import { getProgressionSettings, ProgressionSettings } from "@/services/progression" // Integration
import { createClient } from "@/lib/supabase/client"

import { SessionHeader } from "@/components/workout/session-header"
import { SetLogger } from "@/components/workout/set-logger"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react"
import { RestTimer } from "@/components/workout/rest-timer"
import { ExercisePicker } from "@/components/exercises/exercise-picker"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface RunnerExerciseState {
    exercise: Exercise
    templateData?: any // If from template
    logs: ExerciseLog[] // Logs done in THIS session
    historyLogs: ExerciseLog[] // Previous history
    targetSets: number
}

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

export default function SessionRunnerPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const router = useRouter()
    const { sessionId } = use(params)

    const [loading, setLoading] = useState(true)
    const [runnerExercises, setRunnerExercises] = useState<RunnerExerciseState[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progressionSettings, setProgressionSettings] = useState<ProgressionSettings | null>(null)

    // Timer State
    const [showTimer, setShowTimer] = useState(false)

    // Picker State
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        open: boolean
        title: string
        description: string
        onConfirm: () => void
    }>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => { }
    })

    useEffect(() => {
        const init = async () => {
            try {
                const data = await getSessionRunnerData(sessionId)

                // Fetch Progression Settings if user exists
                if (data.session.user_id) {
                    const settings = await getProgressionSettings(data.session.user_id)
                    setProgressionSettings(settings)
                }

                // Build Initial State
                const exercisesMap = new Map<string, RunnerExerciseState>()

                // 1. Add exercises from Template
                if (data.template?.template_exercises) {
                    for (const te of data.template.template_exercises) {
                        // Fetch history
                        const history = await getPreviousLogs(te.exercise_id)
                        exercisesMap.set(te.exercise_id, {
                            exercise: te.exercise,
                            templateData: te,
                            logs: [],
                            historyLogs: history,
                            targetSets: te.target_sets || 3
                        })
                    }
                }

                // 2. Add exercises from Logs (Ad-hoc or filled in)
                const logsByEx = new Map<string, ExerciseLog[]>()
                data.logs.forEach((l: any) => {
                    const current = logsByEx.get(l.exercise_id) || []
                    current.push(l)
                    logsByEx.set(l.exercise_id, current)
                })

                // Process logs
                for (const [exId, logs] of logsByEx.entries()) {
                    if (exercisesMap.has(exId)) {
                        // Update existing (from template)
                        const state = exercisesMap.get(exId)!
                        state.logs = logs
                        exercisesMap.set(exId, state)
                    } else {
                        // New ad-hoc exercise found in logs
                        const exerciseInfo = (logs[0] as any).exercise
                        if (exerciseInfo) {
                            const history = await getPreviousLogs(exId)
                            exercisesMap.set(exId, {
                                exercise: exerciseInfo,
                                logs: logs,
                                historyLogs: history,
                                targetSets: 3 // Default for ad-hoc
                            })
                        }
                    }
                }

                setRunnerExercises(Array.from(exercisesMap.values()))

            } catch (e) {
                console.error(e)
                toast.error("Errore caricamento sessione")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [sessionId])


    const handleLogSet = async (exIndex: number, setNumber: number, weight: number, reps: number, rir: number) => {
        const currentItem = runnerExercises[exIndex]
        try {
            const newLog = await logSet(sessionId, currentItem.exercise.id, setNumber, reps, weight, rir)

            // Update local state
            setRunnerExercises(prev => {
                const copy = [...prev]
                const target = { ...copy[exIndex] }
                target.logs = [...target.logs.filter(l => l.set_number !== setNumber), newLog]
                copy[exIndex] = target
                return copy
            })

            // Trigger Timer
            setShowTimer(true)

        } catch (e) {
            console.error(e)
            toast.error("Errore salvataggio set")
        }
    }

    const handleAddExercise = async (exercise: Exercise) => {
        setIsPickerOpen(false)

        // Check if already in list
        const exists = runnerExercises.find(r => r.exercise.id === exercise.id)
        if (exists) {
            toast.info("Esercizio già presente")
            return
        }

        // Fetch history
        const history = await getPreviousLogs(exercise.id)

        const newRunnerItem: RunnerExerciseState = {
            exercise,
            logs: [],
            historyLogs: history,
            targetSets: 3
        }

        setRunnerExercises(prev => [...prev, newRunnerItem])

        // Go to new exercise
        if (runnerExercises.length === 0) {
            setCurrentIndex(0)
        } else {
            setCurrentIndex(runnerExercises.length)
        }
    }


    const finishWorkout = async () => {
        try {
            await finishSession(sessionId, 3600, "Completed via Runner") // TODO: Calc real duration
            toast.success("Allenamento completato!")
            router.replace('/')
        } catch (e) {
            console.error(e)
            toast.error("Errore durante la chiusura dell'allenamento")
        }
    }

    // Render Helpers
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

    if (runnerExercises.length === 0) {
        // Empty Session View
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
                <h2 className="text-2xl font-bold text-white">Workout Vuoto</h2>
                <p className="text-slate-400">Non ci sono esercizi in questa sessione. Aggiungine uno per iniziare.</p>
                <Button onClick={() => setIsPickerOpen(true)} className="bg-primary text-background-dark font-bold px-8 py-6 text-lg rounded-full">
                    <Plus className="mr-2" /> Aggiungi Esercizio
                </Button>

                <ExercisePicker
                    open={isPickerOpen}
                    onOpenChange={setIsPickerOpen}
                    onSelect={handleAddExercise}
                />
            </div>
        )
    }

    const currentItem = runnerExercises[currentIndex]
    if (!currentItem) return <div>Error state</div>

    const nextItem = runnerExercises[currentIndex + 1]

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header Area */}
            <div className="sticky top-0 z-20 glass-header px-4 py-4 space-y-4">
                <SessionHeader
                    exercise={currentItem.exercise}
                    templateData={currentItem.templateData}
                    currentExerciseIndex={currentIndex}
                    totalExercises={runnerExercises.length}
                    nextExercise={nextItem?.exercise}
                    onBack={() => {
                        setAlertConfig({
                            open: true,
                            title: "Uscire dalla sessione?",
                            description: "I progressi fatti finora sono stati salvati, ma l'allenamento rimarrà attivo. Potrai riprenderlo più tardi.",
                            onConfirm: () => router.push('/')
                        })
                    }}
                    onAddExercise={() => setIsPickerOpen(true)}
                    onRemoveExercise={() => {
                        setAlertConfig({
                            open: true,
                            title: "Rimuovere esercizio?",
                            description: `Sei sicuro di voler rimuovere "${currentItem.exercise.name}" da questa sessione?`,
                            onConfirm: () => {
                                setRunnerExercises(prev => prev.filter((_, idx) => idx !== currentIndex))
                                if (currentIndex > 0) setCurrentIndex(c => c - 1)
                                toast.success("Esercizio rimosso")
                            }
                        })
                    }}
                />

                {/* Progress Dots - Integrated but separate for layout control */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {runnerExercises.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-1 rounded-full transition-all cursor-pointer",
                                idx === currentIndex ? "w-8 bg-primary shadow-[0_0_8px_rgba(0,255,163,0.6)]" : "w-2 bg-muted-foreground/20"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Set Loggers */}
            <div className="p-4 space-y-2">
                {Array.from({ length: Math.max(currentItem.targetSets, currentItem.logs.length) }).map((_, i) => {
                    const setNum = i + 1
                    const log = currentItem.logs.find(l => l.set_number === setNum)
                    const prevLog = currentItem.historyLogs[0] // TODO: Should match specific set number from history if possible?

                    return (
                        <SetLogger
                            key={`${currentItem.exercise.id}-set-${i}`}
                            setNumber={setNum}
                            previousLog={prevLog}
                            targetRir={currentItem.templateData?.target_rir ?? 2}
                            isActive={!log && setNum === (currentItem.logs.length + 1)}
                            isFuture={!log && setNum > (currentItem.logs.length + 1)}
                            onSave={(w, r, rir) => handleLogSet(currentIndex, setNum, w, r, rir)}
                            initialValues={log}
                            settings={progressionSettings} // Integration Point
                        />
                    )
                })}

                <Button
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-primary mt-2"
                    onClick={() => {
                        // Add an extra set by incrementing targetSets
                        setRunnerExercises(prev => {
                            const copy = [...prev]
                            const target = { ...copy[currentIndex] }
                            target.targetSets += 1
                            copy[currentIndex] = target
                            return copy
                        })
                        toast.success("Set Aggiunto")
                        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
                    }}
                >
                    + Aggiungi Set Extra
                </Button>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 inset-x-0 p-4 pb-8 glass-nav">
                <Button
                    onClick={() => {
                        const setsDone = currentItem.logs.length
                        if (setsDone < currentItem.targetSets) {
                            setAlertConfig({
                                open: true,
                                title: "Esercizio Incompleto",
                                description: `Hai completato solo ${setsDone}/${currentItem.targetSets} serie. Passare al prossimo esercizio?`,
                                onConfirm: () => {
                                    if (currentIndex < runnerExercises.length - 1) {
                                        setCurrentIndex(curr => curr + 1)
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    } else {
                                        finishWorkout()
                                    }
                                }
                            })
                            return
                        }

                        if (currentIndex < runnerExercises.length - 1) {
                            setCurrentIndex(curr => curr + 1)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        } else {
                            setAlertConfig({
                                open: true,
                                title: "Terminare l'allenamento?",
                                description: "Stai per chiudere questa sessione. Una volta terminata, non potrai più aggiungere set.",
                                onConfirm: finishWorkout
                            })
                        }
                    }}
                    variant={currentItem.logs.length >= currentItem.targetSets ? "default" : "secondary"}
                    className={cn(
                        "w-full h-14 text-base font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all",
                        currentItem.logs.length >= currentItem.targetSets
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                    )}
                >
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        currentItem.logs.length >= currentItem.targetSets ? "bg-primary-foreground/10" : "bg-background/20"
                    )}>
                        <ChevronRight className="h-5 w-5" />
                    </div>
                    <span>
                        {currentIndex < runnerExercises.length - 1
                            ? `PROSSIMO: ${nextItem?.exercise.name.toUpperCase()}`
                            : "TERMINA ALLENAMENTO"
                        }
                    </span>
                </Button>
            </div>

            {/* Components */}
            <RestTimer
                isOpen={showTimer}
                onClose={() => setShowTimer(false)}
                onComplete={() => setShowTimer(false)}
                initialSeconds={90}
            />

            <ExercisePicker
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={handleAddExercise}
            />

            <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
                <AlertDialogContent className="bg-card border-border text-foreground w-[90%] rounded-2xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading uppercase tracking-widest text-primary">{alertConfig.title}</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-sans">
                            {alertConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted font-bold rounded-xl">Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={alertConfig.onConfirm}
                            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.2)]"
                        >
                            Procedi
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
