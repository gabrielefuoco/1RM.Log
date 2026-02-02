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
import { useWakeLock } from "@/hooks/use-wake-lock"
import { DailyReadiness } from "@/components/workout/daily-readiness"

import { WarmupCalculator } from "@/services/warmup"

interface RunnerExerciseState {
    exercise: Exercise
    templateData?: any // If from template
    setsData?: any[] // Per-set configuration from template
    logs: ExerciseLog[] // Logs done in THIS session
    historyLogs: ExerciseLog[] // Previous history
    targetSets: number
    plannedWarmups?: any[] // Will use WarmupSet structure
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

    // Readiness State
    const [showReadiness, setShowReadiness] = useState(false)

    // Picker State
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [pickerMode, setPickerMode] = useState<'add' | 'swap'>('add')

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

    const { request: requestWakeLock } = useWakeLock()

    useEffect(() => {
        requestWakeLock()
    }, [requestWakeLock])

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
                            setsData: te.sets_data,
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

                // Show readiness only for new workouts (no logs yet)
                if (data.logs.length === 0) {
                    setShowReadiness(true)
                }

            } catch (e) {
                console.error(e)
                toast.error("Errore caricamento sessione")
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [sessionId])


    const handleLogSet = async (exIndex: number, setNumber: number, weight: number, reps: number, rir: number, setType: 'work' | 'warmup' | 'drop' | 'failure' = 'work') => {
        const currentItem = runnerExercises[exIndex]
        try {
            const newLog = await logSet(sessionId, currentItem.exercise.id, setNumber, reps, weight, rir, setType)

            // Update local state
            setRunnerExercises(prev => {
                const copy = [...prev]
                const target = { ...copy[exIndex] }
                // Filter by BOTH set_number and set_type to avoid overwriting different set types with same number
                target.logs = [...target.logs.filter(l => l.set_number !== setNumber || l.set_type !== setType), newLog]
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

    const handleReadinessComplete = (data: { score: number, adjustment: 'none' | 'volume' | 'intensity' }) => {
        setShowReadiness(false)
        if (data.adjustment === 'none') return

        setRunnerExercises(prev => prev.map(ex => {
            const newEx = { ...ex }
            if (data.adjustment === 'volume') {
                newEx.targetSets = Math.max(1, ex.targetSets - 1)
            }
            // For 'intensity', we don't change state here, but we could pass it to SetLogger
            // Or better, we apply it to the suggestion in SetLogger. Let's pass a global intensity multiplier.
            return newEx
        }))

        if (data.adjustment === 'intensity') {
            toast.info("Intensità ridotta del 10% per questa sessione")
            setIntensityMultiplier(0.9)
        } else if (data.adjustment === 'volume') {
            toast.info("Volume ridotto (-1 set) per questa sessione")
        }
    }

    const [intensityMultiplier, setIntensityMultiplier] = useState(1.0)

    const handleAddExercise = async (exercise: Exercise) => {
        setIsPickerOpen(false)

        try {
            const supabase = createClient()
            // Fetch history for the new exercise
            const { data: history } = await supabase
                .from('exercise_logs')
                .select('*')
                .eq('exercise_id', exercise.id)
                .order('created_at', { ascending: false })
                .limit(10)

            const newState: RunnerExerciseState = {
                exercise,
                templateData: null,
                logs: [],
                historyLogs: history || [],
                targetSets: 3 // Default for ad-hoc
            }

            if (pickerMode === 'swap') {
                setRunnerExercises(prev => {
                    const copy = [...prev]
                    copy[currentIndex] = newState
                    return copy
                })
                toast.success(`Sostituito con ${exercise.name}`)
            } else {
                // Check if already in list when adding
                const exists = runnerExercises.find(r => r.exercise.id === exercise.id)
                if (exists) {
                    toast.info("Esercizio già presente")
                    return
                }
                setRunnerExercises(prev => [...prev, newState])
                setCurrentIndex(runnerExercises.length)
                toast.success(`Aggiunto ${exercise.name}`)
            }
        } catch (e) {
            console.error(e)
            toast.error("Errore aggiunta esercizio")
        }
    }


    const handleAddWarmup = async () => {
        const currentItem = runnerExercises[currentIndex]
        const bestHistoryLog = currentItem.historyLogs.reduce((prev, curr) => (prev.weight > curr.weight) ? prev : curr, currentItem.historyLogs[0])

        if (!bestHistoryLog) {
            toast.info("Nessuna cronologia trovata per generare warmup automatico.")
            return
        }

        const warmups = WarmupCalculator.calculate(bestHistoryLog.weight)
        setRunnerExercises(prev => {
            const copy = [...prev]
            const target = { ...copy[currentIndex] }
            target.plannedWarmups = warmups
            copy[currentIndex] = target
            return copy
        })
        toast.success(`${warmups.length} set di warmup aggiunti`)
    }


    const finishWorkout = async () => {
        try {
            // We just redirect to recap. The recap page will handle the final finishSession call 
            // once the user fills in RPE and notes.
            // But we should at least update the duration here if possible.
            // For now, simple redirect.
            router.push(`/workout/recap/${sessionId}`)
        } catch (e) {
            console.error(e)
            toast.error("Errore durante la chiusura dell'allenamento")
        }
    }

    // Render Helpers
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

    if (showReadiness) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <DailyReadiness onComplete={handleReadinessComplete} />
                </div>
            </div>
        )
    }

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
                    nextTemplateData={nextItem?.templateData}
                    onBack={() => {
                        setAlertConfig({
                            open: true,
                            title: "Uscire dalla sessione?",
                            description: "I progressi fatti finora sono stati salvati, ma l'allenamento rimarrà attivo. Potrai riprenderlo più tardi.",
                            onConfirm: () => router.push('/')
                        })
                    }}
                    onAddExercise={() => {
                        setPickerMode('add')
                        setIsPickerOpen(true)
                    }}
                    onSwapExercise={() => {
                        setPickerMode('swap')
                        setIsPickerOpen(true)
                    }}
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
                {/* 1. Planned Warmup Sets (not yet logged) */}
                {currentItem.plannedWarmups?.filter(pw =>
                    !currentItem.logs.some(l => l.set_type === 'warmup' && l.set_number === pw.set_number)
                ).map((pw, i) => (
                    <SetLogger
                        key={`planned-warmup-${pw.set_number}`}
                        setNumber={pw.set_number}
                        setType="warmup"
                        targetRir={0}
                        isActive={i === 0 && currentItem.logs.filter(l => l.set_type === 'warmup').length === 0}
                        onSave={(w, r, i) => handleLogSet(currentIndex, pw.set_number, w, r, i, 'warmup')}
                        settings={progressionSettings}
                        intensityMultiplier={intensityMultiplier}
                        initialValues={{ weight: pw.weight, reps: pw.reps, rir: 0, set_type: 'warmup' } as any}
                    />
                ))}

                {/* 2. All Logged Sets (Warmups and Work Sets) grouped together or sorted */}
                {[...currentItem.logs].sort((a, b) => {
                    if (a.set_type === b.set_type) return a.set_number - b.set_number
                    return a.set_type === 'warmup' ? -1 : 1
                }).map((log, i) => {
                    const setTarget = currentItem.setsData?.[log.set_number - 1]
                    const targetRir = setTarget?.rir ?? currentItem.templateData?.target_rir ?? 0
                    const targetRepsMin = setTarget?.reps_min ?? currentItem.templateData?.target_reps_min
                    const targetRepsMax = setTarget?.reps_max ?? currentItem.templateData?.target_reps_max

                    return (
                        <SetLogger
                            key={log.id}
                            setNumber={log.set_number}
                            setType={log.set_type as any}
                            targetRir={targetRir}
                            targetRepsMin={targetRepsMin}
                            targetRepsMax={targetRepsMax}
                            onSave={(w, r, i) => handleLogSet(currentIndex, log.set_number, w, r, i, log.set_type as any)}
                            settings={progressionSettings}
                            intensityMultiplier={intensityMultiplier}
                            initialValues={log}
                            previousLog={currentItem.historyLogs[0]}
                        />
                    )
                })}

                {/* 3. Empty Work Sets (targetSets - loggedWorkSets) */}
                {Array.from({
                    length: Math.max(0, currentItem.targetSets - currentItem.logs.filter(l => l.set_type !== 'warmup').length)
                }).map((_, i) => {
                    const loggedWorkSets = currentItem.logs.filter(l => l.set_type !== 'warmup').length
                    const setNum = loggedWorkSets + i + 1
                    const isFirstWorkSet = i === 0
                    const isActive = currentItem.logs.filter(l => l.set_type === 'warmup').length === (currentItem.plannedWarmups?.length || 0) && isFirstWorkSet

                    const setTarget = currentItem.setsData?.[setNum - 1]
                    const targetRir = setTarget?.rir ?? currentItem.templateData?.target_rir ?? 0
                    const targetRepsMin = setTarget?.reps_min ?? currentItem.templateData?.target_reps_min
                    const targetRepsMax = setTarget?.reps_max ?? currentItem.templateData?.target_reps_max

                    return (
                        <SetLogger
                            key={`empty-work-${i}`}
                            setNumber={setNum}
                            setType="work"
                            targetRir={targetRir}
                            targetRepsMin={targetRepsMin}
                            targetRepsMax={targetRepsMax}
                            isActive={isActive}
                            isFuture={!isActive}
                            onSave={(w, r, i) => handleLogSet(currentIndex, setNum, w, r, i, 'work')}
                            settings={progressionSettings}
                            intensityMultiplier={intensityMultiplier}
                            previousLog={currentItem.historyLogs[0]}
                        />
                    )
                })}
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                <Button
                    variant="outline"
                    className="h-12 border-primary/20 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                    onClick={handleAddWarmup}
                    disabled={currentItem.plannedWarmups && currentItem.plannedWarmups.length > 0}
                >
                    <Plus className="h-4 w-4" />
                    Warmup
                </Button>
                <Button
                    variant="outline"
                    className="h-12 border-white/10 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
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
                    <Plus className="h-4 w-4" />
                    Set Extra
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
