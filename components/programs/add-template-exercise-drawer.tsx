"use client"

import { useState, useEffect } from "react"
import { getExercises, addTemplateExercise } from "@/services/exercises"
import { Exercise, TemplateSet, ProgressionMode } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Search, Dumbbell, Trash2, ArrowDownRight, Percent, AlertTriangle } from "lucide-react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"
import { ProgressionConfigurator } from "@/components/programs/progression-configurator"
import { useMediaQuery } from "@/hooks/use-media-query"

interface AddTemplateExerciseDrawerProps {
    templateId: string
    currentExercisesCount: number
    onSuccess: () => void
    children?: React.ReactNode
}

export function AddTemplateExerciseDrawer({
    templateId,
    currentExercisesCount,
    onSuccess,
    children
}: AddTemplateExerciseDrawerProps) {

    // Extended type for UI state (local only, stripped before saving)
    interface ExtendedTemplateSet extends TemplateSet {
        _ui_mode?: 'fixed' | 'range'
    }

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const isDesktop = useMediaQuery("(min-width: 768px)")

    // Exercise selection
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

    // Exercise config
    const [targetSets, setTargetSets] = useState(3)
    const [targetRir, setTargetRir] = useState(2)
    // Initialize with Fixed Sets (8 reps) by default
    const [setsData, setSetsData] = useState<ExtendedTemplateSet[]>([
        { reps_min: 8, reps_max: 8, rir: 2, type: 'straight', _ui_mode: 'fixed' },
        { reps_min: 8, reps_max: 8, rir: 2, type: 'straight', _ui_mode: 'fixed' },
        { reps_min: 8, reps_max: 8, rir: 2, type: 'straight', _ui_mode: 'fixed' },
    ])


    // Progression State
    const [activeTab, setActiveTab] = useState<'sets' | 'progression'>('sets')
    const [progressionMode, setProgressionMode] = useState<ProgressionMode>('static')
    const [progressionConfig, setProgressionConfig] = useState<any>({})

    const [parent] = useAutoAnimate()


    const updateSingleSet = (index: number, updates: Partial<ExtendedTemplateSet>) => {
        setSetsData(prev => {
            const next = [...prev]
            const currentSet = next[index]
            const updatedSet = { ...currentSet, ...updates }

            // Handle UI Mode Switch Logic
            if (updates._ui_mode === 'range') {
                // Switching to Range: Ensure we actually show a range?
                // Logic: if min==max, maybe bump max by 1? standard behavior: keep values, let user edit.
            } else if (updates._ui_mode === 'fixed') {
                // Switching to Fixed: Collapse Range (Use Min as value)
                updatedSet.reps_max = updatedSet.reps_min
            }

            // Sync Min/Max if in Fixed Mode
            // Logic: If user types in 'min' input (which acts as 'reps' input in fixed mode), we sync max.
            const isFixed = updatedSet._ui_mode === 'fixed' || (!updatedSet._ui_mode && updatedSet.reps_min === updatedSet.reps_max)

            // Critical: If we receive a reps_min update BUT we are in fixed mode, strictly sync reps_max
            if (isFixed && updates.reps_min !== undefined) {
                updatedSet.reps_max = updatedSet.reps_min
            }


            // Handle toggling is_backoff
            if (updates.is_backoff !== undefined) {
                updatedSet.weight_mode = updates.is_backoff ? 'percent' : 'absolute'
                // Clear percentage/backoff_percent/weight_absolute when toggling type
                updatedSet.percentage = undefined;
                updatedSet.backoff_percent = undefined;
                updatedSet.weight_absolute = undefined;
            }

            // Smart Logic: Update coupled variables
            if (updatedSet.is_backoff) {
                if (updates.backoff_percent !== undefined) {
                    updatedSet.weight_mode = 'percent'
                    updatedSet.percentage = undefined;
                    updatedSet.weight_absolute = undefined;
                } else if ((updates.reps_max !== undefined || updates.rir !== undefined) && !updatedSet.backoff_percent) {
                    // updatedSet.weight_mode = 'absolute'
                }
            } else {
                if (updates.percentage !== undefined && updates.percentage > 0) {
                    const repsAvg = (updatedSet.reps_min + updatedSet.reps_max) / 2
                    const estimatedRir = estimateRIR(updates.percentage, repsAvg, 100)
                    updatedSet.rir = Math.max(0, estimatedRir)
                    updatedSet.weight_mode = 'percent'
                    updatedSet.backoff_percent = undefined;
                    updatedSet.weight_absolute = undefined;
                } else if (updates.weight_absolute !== undefined) {
                    updatedSet.weight_mode = 'absolute'
                    updatedSet.percentage = undefined;
                    updatedSet.backoff_percent = undefined;
                }
            }

            // If RIR is manually changed, clear any percentage/backoff_percent/absolute if they were based on formula
            if (updates.rir !== undefined && !updates.percentage && !updates.weight_absolute) {
                // Keep current mode but mark as needing input if it was automatic
            }

            next[index] = updatedSet
            return next
        })
    }

    const addSet = () => {
        const lastSet = setsData[setsData.length - 1] || { reps_min: 8, reps_max: 8, rir: 2, type: 'straight', _ui_mode: 'fixed' as const }
        setSetsData(prev => [...prev, { ...lastSet }])
        setTargetSets(prev => prev + 1)
    }

    const removeSet = (index: number) => {
        if (setsData.length <= 1) return
        setSetsData(prev => prev.filter((_, i) => i !== index))
        setTargetSets(prev => prev - 1)
    }

    // Load exercises on mount
    useEffect(() => {
        if (open) {
            getExercises().then(setExercises)
        }
    }, [open])

    const filteredExercises = exercises.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSubmit = async () => {
        if (!selectedExercise) return

        setLoading(true)
        try {
            await addTemplateExercise({
                workout_template_id: templateId,
                exercise_id: selectedExercise.id,
                target_sets: targetSets,
                target_reps_min: -1, // Use -1 or calculated avg in DB if strict is needed, but individual sets override this
                target_reps_max: -1,
                target_rir: targetRir,

                sets_data: setsData,
                progression_mode: progressionMode,
                progression_config: progressionConfig,
                order: currentExercisesCount
            })
            setOpen(false)
            setSelectedExercise(null)
            setSearchQuery("")
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante l'aggiunta dell'esercizio")
        } finally {
            setLoading(false)
        }
    }


    const Header = isDesktop ? DialogHeader : DrawerHeader
    const Title = isDesktop ? DialogTitle : DrawerTitle
    const Description = isDesktop ? DialogDescription : DrawerDescription
    const Footer = isDesktop ? DialogFooter : DrawerFooter

    const footerButtons = (
        <Footer className="p-6 pt-0 gap-3 sm:gap-0">
            {selectedExercise && (
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-zinc-950 font-black uppercase tracking-widest hover:bg-primary/90 h-14 rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? "Saving..." : "Add Exercise"}
                </Button>
            )}
            {!isDesktop && (
                <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                        Cancel
                    </Button>
                </DrawerClose>
            )}
        </Footer>
    )

    const contentBody = (
        <>
            <Header className="p-6 pb-2">
                <Title className="text-2xl uppercase italic font-black tracking-tighter text-white">
                    {selectedExercise ? "Configure Exercise" : "Select Exercise"}
                </Title>
                <Description className="text-slate-400">
                    {selectedExercise
                        ? `Set targets for ${selectedExercise.name}`
                        : "Search and select from the database"}
                </Description>
            </Header>

            <div className="p-6 pt-2 space-y-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {!selectedExercise ? (
                    <>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search exercise..."
                                className="pl-10 bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl focus:border-primary/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Exercise List */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredExercises.map((exercise) => (
                                <button
                                    key={exercise.id}
                                    className={cn(
                                        "w-full p-3 rounded-xl text-left transition-all flex items-center gap-4 group",
                                        "bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,255,163,0.1)]"
                                    )}
                                    onClick={() => setSelectedExercise(exercise)}
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <Dumbbell className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-base">{exercise.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{exercise.body_parts?.join(', ')} • {exercise.type}</p>
                                    </div>
                                </button>
                            ))}
                            {filteredExercises.length === 0 && (
                                <div className="text-center py-8 opacity-50">
                                    <Dumbbell className="h-12 w-12 mx-auto mb-2 text-slate-700" />
                                    <p className="text-slate-500">No exercises found</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Selected exercise header */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Dumbbell className="h-24 w-24 -rotate-12" />
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                                <Dumbbell className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 z-10">
                                <p className="text-lg font-black text-white leading-tight uppercase tracking-tight">{selectedExercise.name}</p>
                                <button
                                    className="text-[10px] text-primary hover:text-primary/80 uppercase font-black tracking-widest mt-1 flex items-center gap-1"
                                    onClick={() => setSelectedExercise(null)}
                                >
                                    Change Exercise
                                </button>
                            </div>
                        </div>

                        {/* Tabs Switcher */}
                        <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('sets')}
                                className={cn(
                                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                    activeTab === 'sets' ? "bg-primary text-zinc-950 shadow-sm" : "hover:bg-white/5 hover:text-white text-slate-500"
                                )}
                            >
                                Sets & Reps
                            </button>
                            <button
                                onClick={() => setActiveTab('progression')}
                                className={cn(
                                    "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                    activeTab === 'progression' ? "bg-primary text-zinc-950 shadow-sm" : "hover:bg-white/5 hover:text-white text-slate-500"
                                )}
                            >
                                Progression
                            </button>
                        </div>

                        {activeTab === 'sets' ? (
                            <div className="space-y-6">
                                {/* Global Config Grid Removed */}

                                {/* Per-Set Detail */}
                                <div className="pt-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Set Details</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] text-primary hover:bg-primary/10 font-bold uppercase tracking-wider rounded-lg"
                                            onClick={addSet}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Set
                                        </Button>
                                    </div>

                                    <div className="space-y-2.5 pr-2" ref={parent}>
                                        {setsData.map((set, i) => {
                                            const avgReps = (set.reps_min + set.reps_max) / 2
                                            const suggestedPercent = calculatePercentFromRepsAndRir(avgReps, set.rir)
                                            const isImpossible = set.percentage ? (estimateRIR(set.percentage, avgReps, 100) < 0) : false
                                            const isBackoff = set.is_backoff

                                            // Determine UI Mode
                                            const isRange = set._ui_mode === 'range' || (set.reps_min !== set.reps_max)

                                            return (
                                                <div key={i} className="bg-zinc-900/40 rounded-xl p-4 border border-white/5 space-y-4 relative group hover:bg-zinc-900/60 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-white uppercase italic tracking-wider">Set {i + 1}</span>
                                                            {isImpossible && (
                                                                <span className="flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    IMPOSSIBLE
                                                                </span>
                                                            )}
                                                            {i > 0 && (
                                                                <button
                                                                    onClick={() => updateSingleSet(i, { is_backoff: !set.is_backoff })}
                                                                    className={cn(
                                                                        "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors",
                                                                        isBackoff
                                                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                                            : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white"
                                                                    )}
                                                                >
                                                                    <ArrowDownRight className="h-3 w-3" />
                                                                    BACK-OFF
                                                                </button>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeSet(i)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-3">
                                                        {isRange ? (
                                                            <>
                                                                <div className="col-span-1 space-y-1.5 relative group/reps">
                                                                    <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Min</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={set.reps_min}
                                                                        onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                                        className="h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg focus:border-primary/50 text-white"
                                                                    />
                                                                </div>
                                                                <div className="col-span-1 space-y-1.5 relative">
                                                                    <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Max</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={set.reps_max}
                                                                        onChange={(e) => updateSingleSet(i, { reps_max: Number(e.target.value) })}
                                                                        className="h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg focus:border-primary/50 text-white"
                                                                    />
                                                                    <button
                                                                        onClick={() => updateSingleSet(i, { _ui_mode: 'fixed' })}
                                                                        className="absolute -left-[14px] top-[26px] z-10 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center text-[8px] text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/10"
                                                                        title="Fixed Reps"
                                                                    >
                                                                        =
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="col-span-2 space-y-1.5 relative">
                                                                <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Reps</Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        value={set.reps_min}
                                                                        onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                                        className="h-9 text-lg text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg focus:border-primary/50 text-white"
                                                                    />
                                                                    <button
                                                                        onClick={() => updateSingleSet(i, { _ui_mode: 'range' })}
                                                                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
                                                                        title="Split into Range"
                                                                    >
                                                                        <span className="text-[10px] font-mono tracking-tighter">{"<->"}</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="col-span-1 relative space-y-1.5">
                                                            <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">RIR</Label>
                                                            <Input
                                                                type="number"
                                                                value={set.rir}
                                                                onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })}
                                                                className={cn(
                                                                    "h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg text-white"
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 space-y-1.5">
                                                            <Label className={cn("text-[10px] uppercase font-bold block text-center tracking-wider", isBackoff ? "text-purple-400" : "text-amber-500")}>
                                                                {isBackoff ? "Drop %" : "Load % / KG"}
                                                            </Label>
                                                            <div className="relative">
                                                                <Input
                                                                    type="text"
                                                                    placeholder={isBackoff ? "10" : "75%"}
                                                                    value={isBackoff ? (set.backoff_percent || '') : (set.percentage ? `${set.percentage}%` : set.weight_absolute || '')}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (isBackoff) {
                                                                            updateSingleSet(i, { backoff_percent: val ? Number(val.replace('%', '')) : undefined });
                                                                        } else {
                                                                            if (val.includes('%')) {
                                                                                updateSingleSet(i, { percentage: Number(val.replace('%', '')), weight_absolute: undefined });
                                                                            } else if (val === '') {
                                                                                updateSingleSet(i, { percentage: undefined, weight_absolute: undefined });
                                                                            } else {
                                                                                updateSingleSet(i, { weight_absolute: Number(val), percentage: undefined });
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "h-9 text-sm text-center font-bold px-1 rounded-lg",
                                                                        isBackoff
                                                                            ? "bg-purple-500/5 text-purple-400 border-purple-500/20 focus:border-purple-500 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]"
                                                                            : "bg-amber-500/5 text-amber-500 border-amber-500/20 focus:border-amber-500/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]"
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Smart Hint Line */}
                                                    <div className="flex justify-between items-center px-1 pt-1">
                                                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
                                                            Intensity Est: <span className="text-zinc-300 font-mono">~{suggestedPercent.toFixed(0)}%</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[300px]">
                                <ProgressionConfigurator
                                    mode={progressionMode}
                                    config={progressionConfig}
                                    onChange={(m, c) => {
                                        setProgressionMode(m)
                                        setProgressionConfig(c)
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {children || (
                        <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Exercise
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-zinc-950/90 border border-white/5 backdrop-blur-xl shadow-2xl p-0 overflow-hidden text-white flex flex-col max-h-[90vh]">
                    {contentBody}
                    {footerButtons}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children || (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Exercise
                    </Button>
                )}
            </DrawerTrigger>
            <DrawerContent className="bg-zinc-950/95 border-t border-white/10 max-h-[95vh] text-white">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    {contentBody}
                    {footerButtons}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
