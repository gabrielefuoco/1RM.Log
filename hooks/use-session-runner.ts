import { use, useEffect, useState } from "react"
import { useRouter } from "@/i18n/routing"
import { getSessionRunnerData, logSet, finishSession, getPreviousLogs, getSessionProgressionTargets } from "@/services/workout"
import { Exercise, ExerciseLog, ProgressionSettings } from "@/types/database"
import { getProgressionSettings, ProgressionResult } from "@/services/progression"
import { createClient } from "@/lib/supabase/client"
import { WarmupCalculator } from "@/services/warmup"
import { getSessionOneRms } from "@/services/one-rm"
import { toast } from "sonner"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useTranslations } from "next-intl"

export interface RunnerExerciseState {
    exercise: Exercise
    templateData?: any
    setsData?: any[]
    logs: ExerciseLog[]
    historyLogs: ExerciseLog[]
    targetSets: number
    plannedWarmups?: any[]
    progressionTarget?: ProgressionResult
}

interface AlertConfig {
    open: boolean
    title: string
    description: string
    onConfirm: () => void
}

export function useSessionRunner(sessionId: string) {
    const router = useRouter()
    const t = useTranslations("Workout")

    const [loading, setLoading] = useState(true)
    const [runnerExercises, setRunnerExercises] = useState<RunnerExerciseState[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progressionSettings, setProgressionSettings] = useState<ProgressionSettings | null>(null)
    const [userOneRmsMap, setUserOneRmsMap] = useState<Record<string, number>>({})
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
    const [showTimer, setShowTimer] = useState(false)
    const [showReadiness, setShowReadiness] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)
    const [pickerMode, setPickerMode] = useState<'add' | 'swap'>('add')
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        open: false, title: "", description: "", onConfirm: () => { }
    })
    const [intensityMultiplier, setIntensityMultiplier] = useState(1.0)
    const [isDeload, setIsDeload] = useState(false)
    const [prUpdates, setPrUpdates] = useState<{ exerciseName: string, old1Rm: number, new1Rm: number, exerciseId: string }[]>([])
    const [showPrDialog, setShowPrDialog] = useState(false)

    const { request: requestWakeLock } = useWakeLock()

    useEffect(() => { requestWakeLock() }, [requestWakeLock])

    // --- Init ---
    useEffect(() => {
        const init = async () => {
            try {
                const data = await getSessionRunnerData(sessionId)

                if (data.session.user_id) {
                    const settings = await getProgressionSettings(data.session.user_id)
                    setProgressionSettings(settings)
                }

                const progressionTargets = await getSessionProgressionTargets(sessionId)
                const exercisesMap = new Map<string, RunnerExerciseState>()

                if (data.template?.template_exercises) {
                    for (const te of data.template.template_exercises) {
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

                const logsByEx = new Map<string, ExerciseLog[]>()
                data.logs.forEach((l: any) => {
                    const current = logsByEx.get(l.exercise_id) || []
                    current.push(l)
                    logsByEx.set(l.exercise_id, current)
                })

                for (const [exId, logs] of logsByEx.entries()) {
                    if (exercisesMap.has(exId)) {
                        const state = exercisesMap.get(exId)!
                        state.logs = logs
                        exercisesMap.set(exId, state)
                    } else {
                        const exerciseInfo = (logs[0] as any).exercise
                        if (exerciseInfo) {
                            const history = await getPreviousLogs(exId)
                            exercisesMap.set(exId, {
                                exercise: exerciseInfo,
                                logs: logs,
                                historyLogs: history,
                                targetSets: 3
                            })
                        }
                    }
                }

                const allExerciseIds = Array.from(exercisesMap.keys())
                if (allExerciseIds.length > 0) {
                    const oneRms = await getSessionOneRms(allExerciseIds)
                    const map: Record<string, number> = {}
                    oneRms.forEach(r => map[r.exercise_id] = Number(r.one_rm))
                    setUserOneRmsMap(map)
                }

                setRunnerExercises(Array.from(exercisesMap.values()))

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

    // --- Handlers ---

    const handleLogSet = async (exIndex: number, setNumber: number, weight: number, reps: number, rir: number, setType: 'work' | 'warmup' | 'drop' | 'failure' = 'work') => {
        const currentItem = runnerExercises[exIndex]
        try {
            const newLog = await logSet(sessionId, currentItem.exercise.id, setNumber, reps, weight, rir, setType)
            setRunnerExercises(prev => {
                const copy = [...prev]
                const target = { ...copy[exIndex] }
                target.logs = [...target.logs.filter(l => l.set_number !== setNumber || l.set_type !== setType), newLog]
                copy[exIndex] = target
                return copy
            })
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
            return newEx
        }))

        if (data.adjustment === 'intensity') {
            toast.info(t("intensityReduced"))
            setIntensityMultiplier(0.9)
        } else if (data.adjustment === 'volume') {
            toast.info(t("volumeReduced"))
        }
    }

    const handleAddExercise = async (exercise: Exercise) => {
        setIsPickerOpen(false)
        try {
            const supabase = createClient()
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
                targetSets: 3
            }

            if (pickerMode === 'swap') {
                setRunnerExercises(prev => {
                    const copy = [...prev]
                    copy[currentIndex] = newState
                    return copy
                })
                toast.success(`${t("swappedWith")} ${exercise.name}`)
            } else {
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

        let referenceWeight = 0

        if (currentItem.progressionTarget?.targetWeight && currentItem.progressionTarget.targetWeight > 0) {
            referenceWeight = currentItem.progressionTarget.targetWeight
        }

        if (referenceWeight === 0 && currentItem.logs.length > 0) {
            referenceWeight = Math.max(...currentItem.logs.map(l => l.weight))
        }

        const firstSetConfig = currentItem.setsData?.[0]
        const firstSetPercent = firstSetConfig?.percentage

        if (referenceWeight === 0 && firstSetPercent && best1RM > 0) {
            const raw = best1RM * (firstSetPercent / 100) * intensityMultiplier
            referenceWeight = Math.round(raw / 2.5) * 2.5
        }

        if (referenceWeight === 0 && bestHistoryLog) {
            referenceWeight = bestHistoryLog.weight
        }

        if (referenceWeight <= 0) {
            toast.error(t("errorWarmupNoRef"))
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
        const policy = progressionSettings?.one_rm_update_policy || 'confirm'

        if (policy !== 'manual') {
            const updates: typeof prUpdates = []

            for (const exercise of runnerExercises) {
                const sessionBest = Math.max(...exercise.logs.filter(l => l.set_type === 'work').map(l => Number(l.estimated_1rm) || 0), 0)
                const override1Rm = userOneRmsMap[exercise.exercise.id] || 0
                const historyBest = Math.max(...exercise.historyLogs.map(l => Number(l.estimated_1rm) || 0), 0)
                const currentBest = override1Rm > 0 ? override1Rm : historyBest

                if (sessionBest > currentBest && sessionBest > 0) {
                    updates.push({
                        exerciseId: exercise.exercise.id,
                        exerciseName: exercise.exercise.name,
                        old1Rm: currentBest > 0 ? currentBest : sessionBest,
                        new1Rm: sessionBest
                    })
                }
            }

            if (updates.length > 0) {
                if (policy === 'auto') {
                    setPrUpdates(updates)
                    await handleConfirmPRs()
                    return
                } else {
                    setPrUpdates(updates)
                    setShowPrDialog(true)
                    return
                }
            }
        }

        try {
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

    const addExtraSet = () => {
        setRunnerExercises(prev => {
            const copy = [...prev]
            const target = { ...copy[currentIndex] }
            target.targetSets += 1
            copy[currentIndex] = target
            return copy
        })
        toast.success(t("setAdded"))
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
    }

    const removeExercise = () => {
        setRunnerExercises(prev => prev.filter((_, idx) => idx !== currentIndex))
        if (currentIndex > 0) setCurrentIndex(c => c - 1)
        toast.success(t("exRemoved"))
    }

    const removeSet = async (exerciseIndex: number, setNumber: number, isLogged: boolean, logId?: string) => {
        if (isLogged && logId) {
            // Delete from DB
            try {
                const supabase = createClient()
                const { error } = await supabase.from('exercise_logs').delete().eq('id', logId)
                if (error) throw error

                // Update State
                setRunnerExercises(prev => {
                    const copy = [...prev]
                    const target = { ...copy[exerciseIndex] }
                    target.logs = target.logs.filter(l => l.id !== logId)

                    // Renumber logs if needed? Ideally we just keep set_number as is or re-index.
                    // For now, let's keep set_number as the identifier. 
                    // But if we delete set 2, set 3 becomes set 2? 
                    // In a live runner, usually we want to "void" it or just remove it.
                    // If we remove it, the next sets shift up.

                    // Let's re-fetch logs to be safe and consistent with DB triggers if any?
                    // Or manual re-indexing:
                    // Actually, if we just remove it, the "Plan" (targetSets) stays the same, 
                    // but the "Logged" count decreases.

                    copy[exerciseIndex] = target
                    return copy
                })
                toast.success(t("setRemoved"))
            } catch (e) {
                console.error(e)
                toast.error(t("errorRemovingSet"))
            }
        } else {
            // It's a planned set (not logged yet), so we just reduce the target sets
            setRunnerExercises(prev => {
                const copy = [...prev]
                const target = { ...copy[exerciseIndex] }
                if (target.targetSets > 0) {
                    target.targetSets -= 1
                }
                copy[exerciseIndex] = target
                return copy
            })
        }
    }

    const toggleDeload = () => {
        setIsDeload(!isDeload)
        toast.info(isDeload ? t("normalMode") : t("deloadMode"))
    }

    const openPicker = (mode: 'add' | 'swap') => {
        setPickerMode(mode)
        setIsPickerOpen(true)
    }

    return {
        // State
        loading,
        runnerExercises,
        currentIndex,
        progressionSettings,
        showTimer,
        showReadiness,
        isPickerOpen,
        alertConfig,
        intensityMultiplier,
        isDeload,
        prUpdates,
        showPrDialog,

        // Derived
        currentItem: runnerExercises[currentIndex],
        nextItem: runnerExercises[currentIndex + 1],

        // Setters
        setCurrentIndex,
        setShowTimer,
        setIsPickerOpen,
        setAlertConfig,
        setShowPrDialog,

        // Handlers
        handleLogSet,
        handleReadinessComplete,
        handleAddExercise,
        handleAddWarmup,
        handleConfirmPRs,
        finishWorkout,
        addExtraSet,
        removeExercise,
        removeSet,
        toggleDeload,
        openPicker,

        // Navigation
        router,
        t,
        sessionId,
    }
}
