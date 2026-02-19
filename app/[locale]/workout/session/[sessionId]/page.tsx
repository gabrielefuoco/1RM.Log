"use client"

import { use } from "react"
import { useSessionRunner } from "@/hooks/use-session-runner"

import { SessionHeader } from "@/components/workout/session-header"
import { SetLogger } from "@/components/workout/set-logger"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronRight, Plus, Check, History } from "lucide-react"
import { RestTimer } from "@/components/workout/rest-timer"
import { ExercisePicker } from "@/components/exercises/exercise-picker"
import { cn } from "@/lib/utils"
import { calculate1RM } from "@/utils/formulas"
import { DailyReadiness } from "@/components/workout/daily-readiness"
import { EditOneRmDialog } from "@/components/workout/edit-one-rm-dialog"
import { PRConfirmationDialog } from "@/components/workout/pr-confirmation-dialog"
import { ConfirmDrawer } from "@/components/ui/confirm-drawer"

export default function SessionRunnerPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params)
    const s = useSessionRunner(sessionId)

    // Render Helpers
    if (s.loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

    if (s.showReadiness) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <DailyReadiness onComplete={s.handleReadinessComplete} />
                </div>
            </div>
        )
    }

    if (s.runnerExercises.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
                <h2 className="text-2xl font-bold text-white">{s.t("emptyTitle")}</h2>
                <p className="text-slate-400">{s.t("emptySubtitle")}</p>
                <Button onClick={() => s.setIsPickerOpen(true)} className="bg-primary text-background-dark font-bold px-8 py-6 text-lg rounded-full">
                    <Plus className="mr-2" /> {s.t("addExercise")}
                </Button>
                <ExercisePicker
                    open={s.isPickerOpen}
                    onOpenChange={s.setIsPickerOpen}
                    onSelect={s.handleAddExercise}
                />
            </div>
        )
    }

    const currentItem = s.currentItem
    if (!currentItem) return <div>Error state</div>

    const nextItem = s.nextItem

    return (
        <div className="min-h-screen bg-background pb-32 lg:pb-0">
            <div className="max-w-[1600px] mx-auto lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8">

                {/* LEFT COLUMN: Sidebar Navigation (Desktop Only) */}
                <div className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="sticky top-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-tight mb-1">Sessione</h2>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">
                                {s.runnerExercises.reduce((acc, ex) => acc + ex.logs.filter(l => l.set_type === 'work').length, 0)} Sets completati
                            </p>
                        </div>

                        <div className="space-y-2 pr-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {s.runnerExercises.map((exState, idx) => {
                                const isCurrent = idx === s.currentIndex
                                const isDone = exState.logs.length >= exState.targetSets
                                const setsDone = exState.logs.filter(l => l.set_type === 'work').length

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            s.setCurrentIndex(idx)
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
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/50 transition-all" style={{ width: `${(setsDone / exState.targetSets) * 100}%` }} />
                                    </div>
                                )
                            })}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <Button
                                variant="outline"
                                className="w-full border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20"
                                onClick={() => s.router.push('/')}
                            >
                                Esci dalla sessione
                            </Button>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Main Work Area */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Header Area */}
                    <div className={cn(
                        "sticky top-0 z-20 glass-header px-4 py-4 space-y-4 lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:glass-header-none",
                    )}>
                        <div className="lg:hidden">
                            <SessionHeader
                                exercise={currentItem.exercise}
                                templateData={currentItem.templateData}
                                currentExerciseIndex={s.currentIndex}
                                totalExercises={s.runnerExercises.length}
                                nextExercise={nextItem?.exercise}
                                nextTemplateData={nextItem?.templateData}
                                isDeload={s.isDeload}
                                onToggleDeload={s.toggleDeload}
                                onBack={() => {
                                    s.setAlertConfig({
                                        open: true,
                                        title: s.t("exitTitle"),
                                        description: s.t("exitDescription"),
                                        onConfirm: () => s.router.push('/')
                                    })
                                }}
                                onAddExercise={() => s.openPicker('add')}
                                onSwapExercise={() => s.openPicker('swap')}
                                onRemoveExercise={() => {
                                    s.setAlertConfig({
                                        open: true,
                                        title: s.t("removeExTitle"),
                                        description: s.t("removeExDescription", { name: currentItem.exercise.name }),
                                        onConfirm: s.removeExercise
                                    })
                                }}
                            />

                            {/* Progress Dots Mobile */}
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none mt-4">
                                {s.runnerExercises.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => s.setCurrentIndex(idx)}
                                        className={cn(
                                            "h-1 rounded-full transition-all cursor-pointer",
                                            idx === s.currentIndex ? "w-8 bg-primary shadow-[0_0_8px_rgba(0,255,163,0.6)]" : "w-2 bg-slate-800"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => s.setIsPickerOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Aggiungi
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={s.toggleDeload}
                                        className={cn(
                                            "text-xs font-bold border transition-all",
                                            s.isDeload
                                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        {s.isDeload ? s.t("deloadOn") : s.t("deloadOff")}
                                    </Button>
                                </div>
                                <SessionHeader
                                    exercise={currentItem.exercise}
                                    templateData={currentItem.templateData}
                                    currentExerciseIndex={s.currentIndex}
                                    totalExercises={s.runnerExercises.length}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Set Loggers */}
                    <div className="p-4 lg:p-0 space-y-2">
                        {/* 1. Planned Warmup Sets */}
                        {currentItem.plannedWarmups?.filter(pw =>
                            !currentItem.logs.some(l => l.set_type === 'warmup' && String(l.set_number) === String(pw.set_number))
                        ).map((pw, i) => {
                            const isActive = i === 0
                            return (
                                <SetLogger
                                    key={`planned-warmup-${pw.set_number}`}
                                    setNumber={pw.set_number}
                                    setType="warmup"
                                    targetRir={0}
                                    isActive={isActive}
                                    isFuture={!isActive}
                                    onSave={(w, r, i) => s.handleLogSet(s.currentIndex, pw.set_number, w, r, i, 'warmup')}
                                    settings={s.progressionSettings}
                                    intensityMultiplier={s.intensityMultiplier}
                                    initialValues={{ weight: pw.weight, reps: pw.reps, rir: 0, set_type: 'warmup' } as any}
                                    isDeload={s.isDeload}
                                />
                            )
                        })}

                        {/* 2. All Logged Sets */}
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
                                    onSave={(w, r, i) => s.handleLogSet(s.currentIndex, log.set_number, w, r, i, log.set_type as any)}
                                    settings={s.progressionSettings}
                                    intensityMultiplier={s.intensityMultiplier}
                                    initialValues={log}
                                    previousLog={effectivePrevLog}
                                    templateSet={setTarget}
                                    previousSetWeight={currentItem.logs.find(l => l.set_number === log.set_number - 1)?.weight}
                                    isDeload={s.isDeload}
                                    progressionTarget={currentItem.progressionTarget}
                                />
                            )
                        })}

                        {/* 3. Empty Work Sets */}
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
                                    onSave={(w, r, i) => s.handleLogSet(s.currentIndex, setNum, w, r, i, 'work')}
                                    settings={s.progressionSettings}
                                    intensityMultiplier={s.intensityMultiplier}
                                    previousLog={effectivePrevLog}
                                    templateSet={setTarget}
                                    previousSetWeight={currentItem.logs.find(l => l.set_number === setNum - 1)?.weight}
                                    isDeload={s.isDeload}
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
                            onClick={s.handleAddWarmup}
                            disabled={currentItem.plannedWarmups && currentItem.plannedWarmups.length > 0}
                        >
                            <Plus className="h-4 w-4" />
                            {s.t("warmup")}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 border-white/10 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            onClick={s.addExtraSet}
                        >
                            <Plus className="h-4 w-4" />
                            {s.t("extraSet")}
                        </Button>
                    </div>

                    {/* Footer Mobile / Actions Desktop */}
                    <div className="fixed bottom-0 inset-x-0 p-4 pb-8 glass-nav lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0 lg:pb-0">
                        <Button
                            onClick={() => {
                                const workSetsDone = currentItem.logs.filter(l => l.set_type === 'work').length

                                if (workSetsDone < currentItem.targetSets) {
                                    s.setAlertConfig({
                                        open: true,
                                        title: s.t("incompleteTitle"),
                                        description: s.t("incompleteDescription", { done: workSetsDone, total: currentItem.targetSets }),
                                        onConfirm: () => {
                                            if (s.currentIndex < s.runnerExercises.length - 1) {
                                                s.setCurrentIndex(curr => curr + 1)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            } else {
                                                s.finishWorkout()
                                            }
                                        }
                                    })
                                    return
                                }

                                if (s.currentIndex < s.runnerExercises.length - 1) {
                                    s.setCurrentIndex(curr => curr + 1)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                } else {
                                    s.setAlertConfig({
                                        open: true,
                                        title: s.t("finishTitle"),
                                        description: s.t("finishDescription"),
                                        onConfirm: s.finishWorkout
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
                                {s.currentIndex < s.runnerExercises.length - 1
                                    ? `${s.t("next")}: ${nextItem?.exercise.name.toUpperCase()}`
                                    : s.t("finish")
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
                            {s.t("history")}
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
                isOpen={s.showTimer}
                onClose={() => s.setShowTimer(false)}
                onComplete={() => s.setShowTimer(false)}
                initialSeconds={90}
            />

            <ExercisePicker
                open={s.isPickerOpen}
                onOpenChange={s.setIsPickerOpen}
                onSelect={s.handleAddExercise}
            />

            <PRConfirmationDialog
                open={s.showPrDialog}
                onOpenChange={s.setShowPrDialog}
                updates={s.prUpdates}
                onConfirm={s.handleConfirmPRs}
                onCancel={() => {
                    s.setShowPrDialog(false)
                    s.router.push(`/workout/recap/${s.sessionId}`)
                }}
            />

            <ConfirmDrawer
                open={s.alertConfig.open}
                onOpenChange={(open) => s.setAlertConfig(prev => ({ ...prev, open }))}
                title={s.alertConfig.title}
                description={s.alertConfig.description}
                confirmLabel={s.t("proceed")}
                cancelLabel={s.t("cancel")}
                onConfirm={s.alertConfig.onConfirm}
            />
        </div>
    )
}
