"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "@/i18n/routing"
import { getSessionRunnerData, logSet, finishSession, getPreviousLogs, getSessionProgressionTargets } from "@/services/workout"
import { Exercise, ExerciseLog, WorkoutTemplate, ProgressionSettings } from "@/types/database"
import { getProgressionSettings, ProgressionResult } from "@/services/progression" // Integration
import { createClient } from "@/lib/supabase/client"

import { SessionHeader } from "@/components/workout/session-header"
import { SetLogger } from "@/components/workout/set-logger"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronRight, ChevronLeft, Plus, Trash2, Check, History } from "lucide-react"
import { RestTimer } from "@/components/workout/rest-timer"
import { ExercisePicker } from "@/components/exercises/exercise-picker"
import { toast } from "sonner"
import { cn, calculate1RM } from "@/lib/utils"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { DailyReadiness } from "@/components/workout/daily-readiness"

import { WarmupCalculator } from "@/services/warmup"
import { getSessionOneRms } from "@/services/one-rm"
import { EditOneRmDialog } from "@/components/workout/edit-one-rm-dialog"
import { PRConfirmationDialog } from "@/components/workout/pr-confirmation-dialog"
import { useTranslations } from "next-intl"

interface RunnerExerciseState {
    exercise: Exercise
    templateData?: any // If from template
    setsData?: any[] // Per-set configuration from template
    logs: ExerciseLog[] // Logs done in THIS session
    historyLogs: ExerciseLog[] // Previous history
    targetSets: number
    plannedWarmups?: any[] // Will use WarmupSet structure
    progressionTarget?: ProgressionResult // Calculated target from backend
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
    const t = useTranslations("Workout")
    const { sessionId } = use(params)

    const [loading, setLoading] = useState(true)
    const [runnerExercises, setRunnerExercises] = useState<RunnerExerciseState[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progressionSettings, setProgressionSettings] = useState<ProgressionSettings | null>(null)
    const [userOneRmsMap, setUserOneRmsMap] = useState<Record<string, number>>({})
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

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

                // Fetch Progression Targets (New)
                const progressionTargets = await getSessionProgressionTargets(sessionId)

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
                            targetSets: te.target_sets || 3,
                            progressionTarget: progressionTargets[te.id]
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

                // Fetch User 1RMs (Training Max / Overrides)
                const allExerciseIds = Array.from(exercisesMap.keys())
                if (allExerciseIds.length > 0) {
                    const oneRms = await getSessionOneRms(allExerciseIds)
                    const map: Record<string, number> = {}
                    oneRms.forEach(r => map[r.exercise_id] = Number(r.one_rm))
                    setUserOneRmsMap(map)
                }

                setRunnerExercises(Array.from(exercisesMap.values()))

                // Show readiness only for new workouts (no logs yet)
                if (data.logs.length === 0) {
                    setShowReadiness(true)
                }

                if (data.session.date) {
                    setSessionStartTime(new Date(data.session.date).getTime())
                }

            } catch (e) {
                console.error(e)
                toast.error(t("errorLoading"))
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
            toast.error(t("errorSaving"))
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
            toast.info(t("intensityReduced"))
            setIntensityMultiplier(0.9)
        } else if (data.adjustment === 'volume') {
            toast.info(t("volumeReduced"))
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
                toast.success(`${t("swappedWith")} ${exercise.name}`)
            } else {
                // Check if already in list when adding
                const exists = runnerExercises.find(r => r.exercise.id === exercise.id)
                if (exists) {
                    toast.info(t("alreadyExists"))
                    return
                }
                setRunnerExercises(prev => [...prev, newState])
                setCurrentIndex(runnerExercises.length)
                toast.success(`${t("addedEx")} ${exercise.name}`)
            }
        } catch (e) {
            console.error(e)
            toast.error(t("errorAdding"))
        }
    }


    const handleAddWarmup = async () => {
        const currentItem = runnerExercises[currentIndex]
        const bestHistoryLog = currentItem.historyLogs.reduce((prev, curr) => (prev.weight > curr.weight) ? prev : curr, currentItem.historyLogs[0])
        const best1RM = currentItem.historyLogs.length > 0 ? Math.max(...currentItem.historyLogs.map(l => Number(l.estimated_1rm) || 0)) : 0

        // Find if we have a target percentage in the first working set
        // Note: setsData maps to all sets (1-based index usually aligns with 0-based array if carefully managed, but here setsData is array of configurations)
        // We look at the first set's config.
        const firstSetConfig = currentItem.setsData?.[0]
        const firstSetPercent = firstSetConfig?.percentage

        let referenceWeight = 0;

        if (firstSetPercent && best1RM > 0) {
            // Calculate based on %
            const raw = best1RM * (firstSetPercent / 100) * intensityMultiplier
            referenceWeight = Math.round(raw / 2.5) * 2.5
        } else if (bestHistoryLog) {
            // Fallback to history best weight
            referenceWeight = bestHistoryLog.weight
        }

        if (referenceWeight <= 0) {
            // No history or percentage, cannot calculate warmup automatically reliably
            return
        }

        const warmups = WarmupCalculator.calculate(referenceWeight)
        setRunnerExercises(prev => {
            const copy = [...prev]
            const target = { ...copy[currentIndex] }
            target.plannedWarmups = warmups
            copy[currentIndex] = target
            return copy
        })
        toast.success(`${warmups.length} ${t("warmupAdded")} ${referenceWeight}kg`)
    }

    // Deload State
    const [isDeload, setIsDeload] = useState(false)

    // PR Dialog State
    const [prUpdates, setPrUpdates] = useState<{ exerciseName: string, old1Rm: number, new1Rm: number, exerciseId: string }[]>([])
    const [showPrDialog, setShowPrDialog] = useState(false)

    const handleConfirmPRs = async () => {
        try {
            const supabase = createClient()
            for (const update of prUpdates) {
                await supabase.from('user_one_rms').upsert({
                    user_id: (await supabase.auth.getUser()).data.user?.id!,
                    exercise_id: update.exerciseId,
                    one_rm: update.new1Rm,
                    type: 'training_max',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,exercise_id' })
            }
            toast.success("Massimali aggiornati!")
        } catch (e) {
            console.error(e)
            toast.error("Errore aggiornamento massimali")
        } finally {
            setShowPrDialog(false)
            router.push(`/workout/recap/${sessionId}`)
        }
    }

    const finishWorkout = async () => {
        // 1. Check for PRs if policy is not 'manual'
        const policy = progressionSettings?.one_rm_update_policy || 'confirm'

        if (policy !== 'manual') {
            const updates: typeof prUpdates = []

            for (const exercise of runnerExercises) {
                // Find best estimated 1RM in THIS session
                const sessionBest = Math.max(...exercise.logs.filter(l => l.set_type === 'work').map(l => Number(l.estimated_1rm) || 0), 0)

                // Find previous best 1RM (History OR User Override)
                // Priority: User Override > History Best
                const override1Rm = userOneRmsMap[exercise.exercise.id] || 0
                const historyBest = Math.max(...exercise.historyLogs.map(l => Number(l.estimated_1rm) || 0), 0)
                const currentBest = override1Rm > 0 ? override1Rm : historyBest

                // Optimization: Ignore initial "0" records or empty sessions
                if (sessionBest > currentBest && sessionBest > 0) {
                    updates.push({
                        exerciseId: exercise.exercise.id,
                        exerciseName: exercise.exercise.name,
                        old1Rm: currentBest > 0 ? currentBest : sessionBest, // If 0, it's a new baseline
                        new1Rm: sessionBest
                    })
                }
            }

            if (updates.length > 0) {
                if (policy === 'auto') {
                    // Auto update
                    setPrUpdates(updates)
                    await handleConfirmPRs() // Reuse logic (will redirect)
                    return
                } else {
                    // Confirm dialog
                    setPrUpdates(updates)
                    setShowPrDialog(true)
                    return // Stop here, dialog handles the rest (confirm -> update -> redirect, cancel -> redirect)
                }
            }
        }

        // Default path if no PRs or manual
        try {
            // Calculate Duration in Seconds
            const durationSeconds = sessionStartTime
                ? Math.floor((Date.now() - sessionStartTime) / 1000)
                : 0

            await finishSession(sessionId, durationSeconds)
            router.push(`/workout/recap/${sessionId}`)
        } catch (e) {
            console.error(e)
            toast.error(t("errorSaving"))
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
                <h2 className="text-2xl font-bold text-white">{t("emptyTitle")}</h2>
                <p className="text-slate-400">{t("emptySubtitle")}</p>
                <Button onClick={() => setIsPickerOpen(true)} className="bg-primary text-background-dark font-bold px-8 py-6 text-lg rounded-full">
                    <Plus className="mr-2" /> {t("addExercise")}
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
        <div className="min-h-screen bg-background pb-32 lg:pb-0">
            {/* Desktop: Top Bar for global session actions if needed, or just cleaner layout */}

            <div className="max-w-[1600px] mx-auto lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8">

                {/* LEFT COLUMN: Sidebar Navigation (Desktop Only) */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="sticky top-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-tight mb-1">Sessione</h2>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                                {runnerExercises.reduce((acc, ex) => acc + ex.logs.filter(l => l.set_type === 'work').length, 0)} Sets completati
                            </p>
                        </div>

                        <div className="space-y-2 pr-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {runnerExercises.map((exState, idx) => {
                                const isCurrent = idx === currentIndex
                                const isDone = exState.logs.length >= exState.targetSets
                                const setsDone = exState.logs.filter(l => l.set_type === 'work').length

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setCurrentIndex(idx)
                                            window.scrollTo({ top: 0, behavior: 'smooth' })
                                        }}
                                        className={cn(
                                            "p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden",
                                            isCurrent
                                                ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(0,255,163,0.1)]"
                                                : "bg-zinc-900/30 border-transparent hover:bg-zinc-900/50 hover:border-white/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2 relative z-10">
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "font-bold text-sm truncate",
                                                    isCurrent ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                                                )}>
                                                    {exState.exercise.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {setsDone} / {exState.targetSets} Sets
                                                </p>
                                            </div>
                                            {isDone && (
                                                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                            {isCurrent && (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-black animate-pulse">
                                                    <div className="h-2 w-2 bg-black rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Progress Bar Background */}
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/50 transition-all" style={{ width: `${(setsDone / exState.targetSets) * 100}%` }} />
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <Button
                                variant="outline"
                                className="w-full border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20"
                                onClick={() => router.push('/')}
                            >
                                Esci dalla sessione
                            </Button>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Main Work Area */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Header Area (Modified for Desktop/Mobile) */}
                    <div className={cn(
                        "sticky top-0 z-20 glass-header px-4 py-4 space-y-4 lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:glass-header-none",
                        // On desktop, we want to hide the sticky behavior and glass effect
                    )}>
                        <div className="lg:hidden"> {/* Mobile Only Header Controls */}
                            <SessionHeader
                                exercise={currentItem.exercise}
                                templateData={currentItem.templateData}
                                currentExerciseIndex={currentIndex}
                                totalExercises={runnerExercises.length}
                                nextExercise={nextItem?.exercise}
                                nextTemplateData={nextItem?.templateData}
                                isDeload={isDeload}
                                onToggleDeload={() => {
                                    setIsDeload(!isDeload)
                                    toast.info(isDeload ? t("normalMode") : t("deloadMode"))
                                }}
                                onBack={() => {
                                    setAlertConfig({
                                        open: true,
                                        title: t("exitTitle"),
                                        description: t("exitDescription"),
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
                                        title: t("removeExTitle"),
                                        description: t("removeExDescription", { name: currentItem.exercise.name }),
                                        onConfirm: () => {
                                            setRunnerExercises(prev => prev.filter((_, idx) => idx !== currentIndex))
                                            if (currentIndex > 0) setCurrentIndex(c => c - 1)
                                            toast.success(t("exRemoved"))
                                        }
                                    })
                                }}
                            />

                            {/* Progress Dots Mobile */}
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none mt-4">
                                {runnerExercises.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={cn(
                                            "h-1 rounded-full transition-all cursor-pointer",
                                            idx === currentIndex ? "w-8 bg-primary shadow-[0_0_8px_rgba(0,255,163,0.6)]" : "w-2 bg-slate-800"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:block"> {/* Desktop Header */}
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsPickerOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Aggiungi
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsDeload(!isDeload)
                                            toast.info(isDeload ? t("normalMode") : t("deloadMode"))
                                        }}
                                        className={cn(
                                            "text-xs font-bold border transition-all",
                                            isDeload
                                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        {isDeload ? t("deloadOn") : t("deloadOff")}
                                    </Button>
                                </div>
                                <SessionHeader
                                    exercise={currentItem.exercise}
                                    templateData={currentItem.templateData}
                                    currentExerciseIndex={currentIndex}
                                    totalExercises={runnerExercises.length}
                                // No nav needed inside header for desktop
                                />
                            </div>
                        </div>
                    </div>

                    {/* Set Loggers */}
                    <div className="p-4 lg:p-0 space-y-2">
                        {/* 1. Planned Warmup Sets (not yet logged) */}
                        {currentItem.plannedWarmups?.filter(pw =>
                            // Use loose verification for set number to avoid string/number mismatch
                            !currentItem.logs.some(l => l.set_type === 'warmup' && String(l.set_number) === String(pw.set_number))
                        ).map((pw, i) => {
                            const isNextWarmup = i === 0
                            // Active if it's the first in the remaining list AND no logged warmup with this number exists (redundant but safe)
                            const isActive = isNextWarmup

                            return (
                                <SetLogger
                                    key={`planned-warmup-${pw.set_number}`}
                                    setNumber={pw.set_number}
                                    setType="warmup"
                                    targetRir={0}
                                    isActive={isActive}
                                    isFuture={!isActive}
                                    onSave={(w, r, i) => handleLogSet(currentIndex, pw.set_number, w, r, i, 'warmup')}
                                    settings={progressionSettings}
                                    intensityMultiplier={intensityMultiplier}
                                    initialValues={{ weight: pw.weight, reps: pw.reps, rir: 0, set_type: 'warmup' } as any}
                                    isDeload={isDeload}
                                />
                            )
                        })}

                        {/* 2. All Logged Sets (Warmups and Work Sets) grouped together or sorted */}
                        {[...currentItem.logs].sort((a, b) => {
                            if (a.set_type === b.set_type) return a.set_number - b.set_number
                            return a.set_type === 'warmup' ? -1 : 1
                        }).map((log) => {
                            const setTarget = currentItem.setsData?.[log.set_number - 1]
                            const targetRir = setTarget?.rir ?? currentItem.templateData?.target_rir ?? 0
                            const targetRepsMin = setTarget?.reps_min ?? currentItem.templateData?.target_reps_min
                            const targetRepsMax = setTarget?.reps_max ?? currentItem.templateData?.target_reps_max
                            const targetPercentage = setTarget?.percentage

                            const sessionWorkLogs = currentItem.logs.filter(l => l.set_type === 'work')
                            const lastSessionLog = sessionWorkLogs.find(l => l.set_number === log.set_number - 1) || sessionWorkLogs[sessionWorkLogs.length - 1]
                            const effectivePrevLog = lastSessionLog || currentItem.historyLogs[0]

                            return (
                                <SetLogger
                                    key={`set-${log.set_type}-${log.set_number}`}
                                    setNumber={log.set_number}
                                    setType={log.set_type as any}
                                    targetRir={targetRir}
                                    targetRepsMin={targetRepsMin}
                                    targetRepsMax={targetRepsMax}
                                    targetPercentage={targetPercentage}
                                    userBest1RM={(currentItem.historyLogs && currentItem.historyLogs.length > 0)
                                        ? Math.max(...currentItem.historyLogs.map(l => Number(l.estimated_1rm) || 0))
                                        : 0}
                                    onSave={(w, r, i) => handleLogSet(currentIndex, log.set_number, w, r, i, log.set_type as any)}
                                    settings={progressionSettings}
                                    intensityMultiplier={intensityMultiplier}
                                    initialValues={log}
                                    previousLog={effectivePrevLog}
                                    templateSet={setTarget}
                                    previousSetWeight={currentItem.logs.find(l => l.set_number === log.set_number - 1)?.weight}
                                    isDeload={isDeload}
                                    progressionTarget={currentItem.progressionTarget}
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
                            const warmupsDone = currentItem.logs.filter(l => l.set_type === 'warmup').length
                            const warmupsPlanned = currentItem.plannedWarmups?.length || 0
                            const isActive = warmupsDone >= warmupsPlanned && isFirstWorkSet

                            const setTarget = currentItem.setsData?.[setNum - 1]
                            const targetRir = setTarget?.rir ?? currentItem.templateData?.target_rir ?? 0
                            const targetRepsMin = setTarget?.reps_min ?? currentItem.templateData?.target_reps_min
                            const targetRepsMax = setTarget?.reps_max ?? currentItem.templateData?.target_reps_max
                            const targetPercentage = setTarget?.percentage

                            const sessionWorkLogs = currentItem.logs.filter(l => l.set_type === 'work')
                            const effectivePrevLog = sessionWorkLogs[sessionWorkLogs.length - 1] || currentItem.historyLogs[0]

                            return (
                                <SetLogger
                                    key={`set-work-${setNum}`}
                                    setNumber={setNum}
                                    setType="work"
                                    targetRir={targetRir}
                                    targetRepsMin={targetRepsMin}
                                    targetRepsMax={targetRepsMax}
                                    targetPercentage={targetPercentage}
                                    userBest1RM={(currentItem.historyLogs && currentItem.historyLogs.length > 0)
                                        ? Math.max(...currentItem.historyLogs.map(l => Number(l.estimated_1rm) || 0))
                                        : 0}
                                    isActive={isActive}
                                    isFuture={!isActive}
                                    onSave={(w, r, i) => handleLogSet(currentIndex, setNum, w, r, i, 'work')}
                                    settings={progressionSettings}
                                    intensityMultiplier={intensityMultiplier}
                                    previousLog={effectivePrevLog}
                                    templateSet={setTarget}
                                    previousSetWeight={currentItem.logs.find(l => l.set_number === setNum - 1)?.weight}
                                    isDeload={isDeload}
                                    progressionTarget={currentItem.progressionTarget}
                                />
                            )
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 lg:p-0 grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 border-primary/20 bg-primary/5 text-primary font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                            onClick={handleAddWarmup}
                            disabled={currentItem.plannedWarmups && currentItem.plannedWarmups.length > 0}
                        >
                            <Plus className="h-4 w-4" />
                            {t("warmup")}
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
                                toast.success(t("setAdded"))
                                setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            {t("extraSet")}
                        </Button>
                    </div>

                    {/* Footer Mobile / Actions Desktop */}
                    <div className="fixed bottom-0 inset-x-0 p-4 pb-8 glass-nav lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:pb-0">
                        <Button
                            onClick={() => {
                                // Count ONLY work sets for progress (exclude warmups, drops, failures for now unless they count towards target)
                                // Assuming targetSets refers to WORK sets.
                                const workSetsDone = currentItem.logs.filter(l => l.set_type === 'work').length

                                if (workSetsDone < currentItem.targetSets) {
                                    setAlertConfig({
                                        open: true,
                                        title: t("incompleteTitle"),
                                        description: t("incompleteDescription", { done: workSetsDone, total: currentItem.targetSets }),
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
                                        title: t("finishTitle"),
                                        description: t("finishDescription"),
                                        onConfirm: finishWorkout
                                    })
                                }
                            }}
                            variant={currentItem.logs.filter(l => l.set_type === 'work').length >= currentItem.targetSets ? "default" : "secondary"}
                            className={cn(
                                "w-full h-14 text-base font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all",
                                currentItem.logs.filter(l => l.set_type === 'work').length >= currentItem.targetSets
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(0,255,163,0.3)]"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                currentItem.logs.filter(l => l.set_type === 'work').length >= currentItem.targetSets ? "bg-primary-foreground/10" : "bg-background/20"
                            )}>
                                <ChevronRight className="h-5 w-5" />
                            </div>
                            <span>
                                {currentIndex < runnerExercises.length - 1
                                    ? `${t("next")}: ${nextItem?.exercise.name.toUpperCase()}`
                                    : t("finish")
                                }
                            </span>
                        </Button>
                    </div>
                </div>

                {/* RIGHT COLUMN: History Context (Desktop Only) */}
                <div className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-6">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            {t("history")}
                        </h3>

                        {currentItem.historyLogs && currentItem.historyLogs.length > 0 ? (
                            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                {currentItem.historyLogs.map((log) => (
                                    <div key={log.id} className="relative pl-8">
                                        <div className="absolute left-1.5 top-2 h-4 w-4 rounded-full border-2 border-zinc-900 bg-zinc-800 z-10" />
                                        <div className="bg-zinc-900/40 border border-white/5 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold">
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs font-black text-primary">
                                                    {calculate1RM(log.weight, log.reps)}KG <span className="text-[9px] text-slate-500 font-normal">e1RM</span>
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-white">{log.weight}</span>
                                                <span className="text-xs text-slate-500">kg</span>
                                                <span className="text-sm text-slate-600">x</span>
                                                <span className="text-lg font-bold text-white">{log.reps}</span>
                                            </div>
                                            {log.rir !== null && (
                                                <div className="mt-1 flex gap-2">
                                                    <Badge variant="outline" className="text-[9px] bg-transparent border-white/10 text-slate-500 h-5">
                                                        RIR {log.rir}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center">
                                <p className="text-xs text-slate-500">Nessuna storia disponibile per questo esercizio.</p>
                            </div>
                        )}
                    </div>
                </div>
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

            <PRConfirmationDialog
                open={showPrDialog}
                onOpenChange={setShowPrDialog}
                updates={prUpdates}
                onConfirm={handleConfirmPRs}
                onCancel={() => {
                    setShowPrDialog(false)
                    router.push(`/workout/recap/${sessionId}`)
                }}
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
                        <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted font-bold rounded-xl">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={alertConfig.onConfirm}
                            className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-xl shadow-[0_0_15px_rgba(0,255,163,0.2)]"
                        >
                            {t("proceed")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
