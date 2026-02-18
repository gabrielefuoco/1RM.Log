"use client"

import { useState, useEffect } from "react"
import { updateTemplateExercise } from "@/services/exercises"
import { TemplateSet, ProgressionMode } from "@/types/database"
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
import { Trash2, Plus, Dumbbell, AlertTriangle, ArrowDownRight, Percent } from "lucide-react"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"
import { cn } from "@/lib/utils"
import { ProgressionConfigurator } from "@/components/programs/progression-configurator"
import { useMediaQuery } from "@/hooks/use-media-query"

interface EditTemplateExerciseDrawerProps {
    templateExercise: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTemplateExerciseDrawer({
    templateExercise,
    open,
    onOpenChange,
    onSuccess
}: EditTemplateExerciseDrawerProps) {

    // Extended type for UI state (local only, stripped before saving)
    interface ExtendedTemplateSet extends TemplateSet {
        _ui_mode?: 'fixed' | 'range'
        _ui_weight_mode?: 'percent' | 'absolute'
    }

    const [loading, setLoading] = useState(false)
    const [parent] = useAutoAnimate()
    const isDesktop = useMediaQuery("(min-width: 768px)")

    // Config State
    const [targetSets, setTargetSets] = useState(3)
    const [targetRir, setTargetRir] = useState(2)
    const [setsData, setSetsData] = useState<ExtendedTemplateSet[]>([])


    // Progression State
    const [activeTab, setActiveTab] = useState<'sets' | 'progression'>('sets')
    const [progressionMode, setProgressionMode] = useState<ProgressionMode>('static')
    const [progressionConfig, setProgressionConfig] = useState<any>({})

    useEffect(() => {
        if (templateExercise && open) {
            setTargetSets(templateExercise.target_sets)
            setTargetRir(templateExercise.target_rir ?? 2)

            // Load progression
            setProgressionMode(templateExercise.progression_mode || 'static')
            setProgressionConfig(templateExercise.progression_config || {})

            if (templateExercise.sets_data && Array.isArray(templateExercise.sets_data) && templateExercise.sets_data.length > 0) {
                // Map existing sets to include _ui_mode
                const loadedSets: ExtendedTemplateSet[] = templateExercise.sets_data.map((s: TemplateSet) => ({
                    ...s,
                    _ui_mode: (s.reps_min === s.reps_max) ? 'fixed' : 'range',
                    _ui_weight_mode: s.weight_absolute ? 'absolute' : 'percent'
                }))
                setSetsData(loadedSets)
            } else {
                const tMin = templateExercise.target_reps_min || 8
                const tMax = templateExercise.target_reps_max || 12
                const generated = Array.from({ length: templateExercise.target_sets }, () => ({
                    reps_min: tMin,
                    reps_max: tMax,
                    rir: templateExercise.target_rir ?? 2,
                    type: 'straight' as const,
                    _ui_mode: (tMin === tMax ? 'fixed' : 'range') as 'fixed' | 'range',
                    _ui_weight_mode: 'percent' as 'percent' | 'absolute'
                }))
                setSetsData(generated)
            }
        }
    }, [templateExercise, open])



    const updateSingleSet = (index: number, updates: Partial<ExtendedTemplateSet>) => {
        setSetsData(prev => {
            const next = [...prev]
            const currentSet = next[index]
            const updatedSet = { ...currentSet, ...updates }

            // Handle UI Mode Switch Logic (Range vs Fixed)
            if (updates._ui_mode === 'range') {
                // Standard behavior
            } else if (updates._ui_mode === 'fixed') {
                updatedSet.reps_max = updatedSet.reps_min
            }

            // Sync Min/Max if in Fixed Mode
            const isFixed = updatedSet._ui_mode === 'fixed' || (!updatedSet._ui_mode && updatedSet.reps_min === updatedSet.reps_max)
            if (isFixed && updates.reps_min !== undefined) {
                updatedSet.reps_max = updatedSet.reps_min
            }

            // Handle Backoff Toggle
            if (updates.is_backoff !== undefined) {
                // When toggling backoff, we force percent mode for logic, but UI might stay same
                // Actually backoff implies percent.
                if (updates.is_backoff) {
                    updatedSet._ui_weight_mode = 'percent'
                }
            }

            // Handle Weight Mode Switch - Just update the UI flag, do NOT clear data
            if (updates._ui_weight_mode) {
                updatedSet._ui_weight_mode = updates._ui_weight_mode
            }

            // Decoupled Logic:
            // - Changing RIR does NOT change Percentage
            // - Changing Percentage does NOT change RIR
            // - We just store values.

            // Ensure weight_mode prop mirrors the UI choice for saving
            updatedSet.weight_mode = updatedSet._ui_weight_mode || 'percent'

            next[index] = updatedSet
            return next
        })
    }

    const addSet = () => {
        const lastSet = setsData[setsData.length - 1] || {
            reps_min: 8, reps_max: 8, rir: 2, type: 'straight',
            _ui_mode: 'fixed' as const, _ui_weight_mode: 'percent' as const
        }
        setSetsData(prev => [...prev, { ...lastSet }])
        setTargetSets(prev => prev + 1)
    }

    const removeSet = (index: number) => {
        if (setsData.length <= 1) return
        setSetsData(prev => prev.filter((_, i) => i !== index))
        setTargetSets(prev => prev - 1)
    }


    const handleSubmit = async () => {
        if (!templateExercise) return
        setLoading(true)
        try {
            await updateTemplateExercise(templateExercise.id, {
                target_sets: targetSets,
                target_reps_min: -1,
                target_reps_max: -1,
                target_rir: targetRir,

                sets_data: setsData.map(s => {
                    const { _ui_mode, _ui_weight_mode, ...rest } = s
                    // Ensure weight_mode is correct based on data
                    if (rest.weight_absolute) rest.weight_mode = 'absolute'
                    else if (rest.percentage) rest.weight_mode = 'percent'

                    return rest
                }),
                progression_mode: progressionMode,
                progression_config: progressionConfig
            })
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Errore durante la modifica")
        } finally {
            setLoading(false)
        }
    }

    if (!templateExercise) return null

    const Wrapper = isDesktop ? Dialog : Drawer
    const Footer = isDesktop ? DialogFooter : DrawerFooter
    const Header = isDesktop ? DialogHeader : DrawerHeader
    const Title = isDesktop ? DialogTitle : DrawerTitle
    const Description = isDesktop ? DialogDescription : DrawerDescription

    const footer = (
        <Footer className="p-6 pt-0 gap-3 sm:gap-0">
            <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary text-zinc-950 font-black uppercase tracking-widest hover:bg-primary/90 h-12 rounded-xl text-sm shadow-[0_0_20px_rgba(0,255,163,0.3)]"
            >
                {loading ? "Saving..." : "Save Configuration"}
            </Button>
            {!isDesktop && (
                <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-slate-500 text-xs uppercase font-bold">
                        Cancel
                    </Button>
                </DrawerClose>
            )}
        </Footer>
    )

    const contentValues = (
        <>
            <Header className="p-6 pb-2">
                <Title className="text-white text-2xl uppercase italic font-black tracking-tighter">Configure Sets</Title>
                <Description className="text-muted-foreground">
                    Edit progression for {templateExercise.exercise?.name}
                </Description>
            </Header>

            <div className="p-6 pt-2 space-y-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-black text-white leading-tight uppercase tracking-tight">{templateExercise.exercise?.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{templateExercise.exercise?.body_parts?.join(', ')} • {templateExercise.exercise?.type}</p>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('sets')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                            activeTab === 'sets'
                                ? "bg-primary text-zinc-950 shadow-sm"
                                : "hover:bg-white/5 hover:text-white text-slate-500"
                        )}
                    >
                        Sets & Reps
                    </button>
                    <button
                        onClick={() => setActiveTab('progression')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                            activeTab === 'progression'
                                ? "bg-primary text-zinc-950 shadow-sm"
                                : "hover:bg-white/5 hover:text-white text-slate-500"
                        )}
                    >
                        Progression
                    </button>
                </div>

                {/* Tab Content */}
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
                                                            <div className="flex items-center justify-center h-8 mb-1">
                                                                <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Min</Label>
                                                            </div>
                                                            <Input
                                                                type="number"
                                                                value={set.reps_min}
                                                                onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                                className="h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg focus:border-primary/50 text-white"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 space-y-1.5 relative">
                                                            <div className="flex items-center justify-center h-8 mb-1">
                                                                <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Max</Label>
                                                            </div>
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
                                                        <div className="flex items-center justify-center h-8 mb-1">
                                                            <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">Reps</Label>
                                                        </div>
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
                                                    <div className="flex items-center justify-center h-8 mb-1">
                                                        <Label className="text-[10px] uppercase text-zinc-400 block font-bold text-center tracking-wider">RIR</Label>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        value={set.rir}
                                                        onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })}
                                                        className={cn(
                                                            "h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 rounded-lg text-white",
                                                            set.percentage && "text-amber-400 border-amber-500/30"
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-1 space-y-1.5 relative text-center">
                                                    <div className="flex items-center justify-center h-8 mb-1">
                                                        {!isBackoff ? (
                                                            /* Segmented Control for Unit Switch */
                                                            <div className="flex items-center bg-zinc-950/50 rounded-lg p-1 border border-white/10 w-full max-w-[100px] h-8 relative mx-auto">
                                                                <button
                                                                    onClick={() => updateSingleSet(i, { _ui_weight_mode: 'absolute' })}
                                                                    className={cn(
                                                                        "flex-1 h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded transition-all duration-200",
                                                                        set._ui_weight_mode === 'absolute'
                                                                            ? "bg-zinc-700 text-white shadow-sm border border-white/10"
                                                                            : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                                                                    )}
                                                                >
                                                                    KG
                                                                </button>
                                                                <div className="w-[1px] h-3 bg-white/5 mx-1" />
                                                                <button
                                                                    onClick={() => updateSingleSet(i, { _ui_weight_mode: 'percent' })}
                                                                    className={cn(
                                                                        "flex-1 h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded transition-all duration-200",
                                                                        set._ui_weight_mode !== 'absolute'
                                                                            ? "bg-amber-500 text-zinc-950 shadow-sm border border-amber-400/50"
                                                                            : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                                                                    )}
                                                                >
                                                                    %
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full">
                                                                <Label className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                                                                    Drop (%)
                                                                </Label>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="relative group/input">
                                                        {set._ui_weight_mode === 'absolute' && !isBackoff ? (
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={set.weight_absolute || ''}
                                                                    onChange={(e) => updateSingleSet(i, {
                                                                        weight_absolute: e.target.value ? Number(e.target.value) : undefined
                                                                    })}
                                                                    className="h-9 text-sm text-center font-bold px-1 rounded-lg bg-zinc-950 text-white border-white/10 focus:border-white/30 pr-8 pl-8"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-600 pointer-events-none">kg</span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    placeholder={isBackoff ? "10" : "0"}
                                                                    value={isBackoff ? (set.backoff_percent || '') : (set.percentage || '')}
                                                                    onChange={(e) => updateSingleSet(i, isBackoff
                                                                        ? { backoff_percent: e.target.value ? Number(e.target.value) : undefined }
                                                                        : { percentage: e.target.value ? Number(e.target.value) : undefined }
                                                                    )}
                                                                    className={cn(
                                                                        "h-9 text-sm text-center font-bold px-1 rounded-lg pr-8 pl-8",
                                                                        isBackoff
                                                                            ? "bg-purple-500/5 text-purple-400 border-purple-500/20 focus:border-purple-500 placeholder:text-purple-500/20"
                                                                            : "bg-amber-500/5 text-amber-500 border-amber-500/20 focus:border-amber-500/50"
                                                                    )}
                                                                />
                                                                <span className={cn(
                                                                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none",
                                                                    isBackoff ? "text-purple-500/50" : "text-amber-500/50"
                                                                )}>%</span>
                                                            </div>
                                                        )}
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
            </div>
        </>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl bg-zinc-950/90 border border-white/5 backdrop-blur-xl shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    {contentValues}
                    {footer}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-zinc-950/95 border-t border-white/10 max-h-[90vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    {contentValues}
                    {footer}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
