"use client"

import { Exercise, ProgressionMode } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Plus, Trash2, ArrowDownRight, AlertTriangle } from "lucide-react"
import { calculatePercentFromRepsAndRir, estimateRIR } from "@/utils/formulas"
import { ProgressionConfigurator } from "@/components/programs/progression-configurator"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { ExtendedTemplateSet } from "@/hooks/use-template-set-editor"

interface TemplateSetFormProps {
    setsData: ExtendedTemplateSet[]
    targetRir: number
    setTargetRir: (rir: number) => void
    progressionMode: ProgressionMode
    setProgressionMode: (mode: ProgressionMode) => void
    progressionConfig: any
    setProgressionConfig: (config: any) => void
    updateSingleSet: (index: number, updates: Partial<ExtendedTemplateSet>) => void
    addSet: () => void
    removeSet: (index: number) => void
    activeTab: 'sets' | 'progression'
    onTabChange: (tab: 'sets' | 'progression') => void
}

export function TemplateSetForm({
    setsData,
    targetRir,
    setTargetRir,
    progressionMode,
    setProgressionMode,
    progressionConfig,
    setProgressionConfig,
    updateSingleSet,
    addSet,
    removeSet,
    activeTab,
    onTabChange
}: TemplateSetFormProps) {
    const [parent] = useAutoAnimate()

    return (
        <div className="space-y-6">
            {/* Tabs Switcher */}
            <div className="flex p-1 bg-card/80 rounded-lg border border-border">
                <button
                    onClick={() => onTabChange('sets')}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        activeTab === 'sets' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/50 hover:text-foreground text-muted-foreground"
                    )}
                >
                    Sets & Reps
                </button>
                <button
                    onClick={() => onTabChange('progression')}
                    className={cn(
                        "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                        activeTab === 'progression' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/50 hover:text-foreground text-muted-foreground"
                    )}
                >
                    Progression
                </button>
            </div>

            {activeTab === 'sets' ? (
                <div className="space-y-6">
                    <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Set Details</h3>
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
                                const isRange = set._ui_mode === 'range' || (set.reps_min !== set.reps_max)

                                return (
                                    <div key={i} className="bg-card/40 rounded-lg p-4 border border-border space-y-4 relative group hover:bg-card/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-foreground uppercase italic tracking-wider">Set {i + 1}</span>
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
                                                                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
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
                                                className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
                                                            <Label className="text-[10px] uppercase text-muted-foreground block font-bold text-center tracking-wider">Min</Label>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            value={set.reps_min}
                                                            onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                            className="h-9 text-sm text-center font-bold px-1 bg-background/80 border-border rounded-lg focus:border-primary/50"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 space-y-1.5 relative">
                                                        <div className="flex items-center justify-center h-8 mb-1">
                                                            <Label className="text-[10px] uppercase text-muted-foreground block font-bold text-center tracking-wider">Max</Label>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            value={set.reps_max}
                                                            onChange={(e) => updateSingleSet(i, { reps_max: Number(e.target.value) })}
                                                            className="h-9 text-sm text-center font-bold px-1 bg-background/80 border-border rounded-lg focus:border-primary/50"
                                                        />
                                                        <button
                                                            onClick={() => updateSingleSet(i, { _ui_mode: 'fixed' })}
                                                            className="absolute -left-[14px] top-[42px] z-10 w-4 h-4 bg-card rounded-full flex items-center justify-center text-[8px] text-muted-foreground hover:bg-card/80 hover:text-foreground border border-border"
                                                            title="Fixed Reps"
                                                        >
                                                            =
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="col-span-2 space-y-1.5 relative">
                                                    <div className="flex items-center justify-center h-8 mb-1">
                                                        <Label className="text-[10px] uppercase text-muted-foreground block font-bold text-center tracking-wider">Reps</Label>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={set.reps_min}
                                                            onChange={(e) => updateSingleSet(i, { reps_min: Number(e.target.value) })}
                                                            className="h-9 text-lg text-center font-bold px-1 bg-background/80 border-border rounded-lg focus:border-primary/50"
                                                        />
                                                        <button
                                                            onClick={() => updateSingleSet(i, { _ui_mode: 'range' })}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                                                            title="Split into Range"
                                                        >
                                                            <span className="text-[10px] font-mono tracking-tighter">{"<->"}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-span-1 relative space-y-1.5 text-center">
                                                <div className="flex items-center justify-center h-8 mb-1">
                                                    <Label className="text-[10px] uppercase text-muted-foreground block font-bold text-center tracking-wider">RIR</Label>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={set.rir}
                                                    onChange={(e) => updateSingleSet(i, { rir: Number(e.target.value) })}
                                                    className={cn(
                                                        "h-9 text-sm text-center font-bold px-1 bg-background/80 border-border rounded-lg"
                                                    )}
                                                />
                                            </div>
                                            <div className="col-span-1 space-y-1.5 relative text-center">
                                                {!isBackoff ? (
                                                    <div className="flex items-center bg-background/50 rounded-lg p-1 border border-border w-full mb-1 h-8 relative">
                                                        <button
                                                            onClick={() => updateSingleSet(i, { _ui_weight_mode: 'absolute' })}
                                                            className={cn(
                                                                "flex-1 h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded transition-all duration-200",
                                                                set._ui_weight_mode === 'absolute'
                                                                    ? "bg-card shadow-sm border border-border"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                            )}
                                                        >
                                                            KG
                                                        </button>
                                                        <div className="w-[1px] h-3 bg-border mx-1" />
                                                        <button
                                                            onClick={() => updateSingleSet(i, { _ui_weight_mode: 'percent' })}
                                                            className={cn(
                                                                "flex-1 h-full flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded transition-all duration-200",
                                                                set._ui_weight_mode !== 'absolute'
                                                                    ? "bg-amber-500 text-zinc-950 shadow-sm border border-amber-400/50"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                            )}
                                                        >
                                                            %
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-8 mb-1">
                                                        <Label className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                                                            Drop (%)
                                                        </Label>
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    {set._ui_weight_mode === 'absolute' && !isBackoff ? (
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                value={set.weight_absolute || ''}
                                                                onChange={(e) => updateSingleSet(i, {
                                                                    weight_absolute: e.target.value ? Number(e.target.value) : undefined
                                                                })}
                                                                className="h-9 text-sm text-center font-bold bg-background border-border focus:border-primary/30"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/60 pointer-events-none">kg</span>
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
                                                                    "h-9 text-sm text-center font-bold",
                                                                    isBackoff
                                                                        ? "bg-purple-500/5 text-purple-400 border-purple-500/20 focus:border-purple-500"
                                                                        : "bg-amber-500/5 text-amber-500 border-amber-500/20 focus:border-amber-500/50"
                                                                )}
                                                            />
                                                            <span className={cn(
                                                                "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold pointer-events-none",
                                                                isBackoff ? "text-purple-500/50" : "text-amber-500/50"
                                                            )}>%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Smart Hint Line */}
                                        <div className="flex justify-between items-center px-1 pt-1 opacity-60">
                                            <span className="text-[9px] text-muted-foreground font-medium tracking-wide">
                                                Intensity Est: <span className="text-foreground font-mono">~{suggestedPercent.toFixed(0)}%</span>
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
    )
}
