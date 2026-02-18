"use client"

import { useState, useEffect } from "react"
import { ProgressionMode, ProgressionType } from "@/types/database"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import { Plus, Trash2, Save, Download, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProgressions, createProgression } from "@/services/progression-library"

interface ProgressionConfiguratorProps {
    mode: ProgressionMode
    config: any
    onChange: (mode: ProgressionMode, config: any) => void
}

export function ProgressionConfigurator({
    mode,
    config,
    onChange
}: ProgressionConfiguratorProps) {
    const [libraryOpen, setLibraryOpen] = useState(false)

    // Defaults
    const handleModeChange = (newMode: ProgressionMode) => {
        let newConfig = { ...config }
        if (newMode === 'auto_double') {
            newConfig = { increment_value: 2.5, condition: 'all_sets_max_reps', ...config }
        } else if (newMode === 'auto_linear') {
            newConfig = { increment_value: 2.5, ...config }
        } else if (newMode === 'custom_sequence') {
            newConfig = {
                name: 'New Sequence',
                steps: [],
                reference_load_type: 'dynamic_estimated',
                increment_value: 2.5,
                on_complete: 'repeat'
            }
        }
        onChange(newMode, newConfig)
    }

    const updateConfig = (key: string, value: any) => {
        onChange(mode, { ...config, [key]: value })
    }

    return (
        <div className="space-y-6">
            {/* Mode Selection */}
            <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Progression Logic</Label>
                <Select value={mode || 'static'} onValueChange={(v) => handleModeChange(v as ProgressionMode)}>
                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                        <SelectValue placeholder="Select logic" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="static">Static (No Progression)</SelectItem>
                        <SelectItem value="auto_double">Double Progression (Hypertrophy)</SelectItem>
                        <SelectItem value="auto_linear">Linear Progression (Strength)</SelectItem>
                        <SelectItem value="custom_sequence">Custom / Cyclic</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Config Area */}
            <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5 space-y-4">
                {mode === 'static' && (
                    <div className="text-center py-4 text-zinc-500 text-sm italic">
                        Targets will remain constant until you manually change them.
                    </div>
                )}

                {mode === 'auto_double' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary/80 text-xs font-mono bg-primary/10 p-2 rounded border border-primary/20">
                            <span>ℹ️</span>
                            Increase weight when you hit max reps.
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Condition</Label>
                            <Select
                                value={config.condition || 'all_sets_max_reps'}
                                onValueChange={(v) => updateConfig('condition', v)}
                            >
                                <SelectTrigger className="h-9 bg-zinc-950/80 border-white/10 text-white font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_sets_max_reps">All sets hit Max Reps</SelectItem>
                                    <SelectItem value="first_set_max_reps">First set hits Max Reps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Increment (kg)</Label>
                            <Input
                                type="number"
                                value={config.increment_value || 2.5}
                                onChange={(e) => updateConfig('increment_value', Number(e.target.value))}
                                className="h-9 bg-zinc-950/80 border-white/10 text-white font-bold text-center"
                            />
                        </div>
                    </div>
                )}

                {mode === 'auto_linear' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary/80 text-xs font-mono bg-primary/10 p-2 rounded border border-primary/20">
                            <span>ℹ️</span>
                            Increase weight if RIR target is met.
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Increment (kg)</Label>
                            <Input
                                type="number"
                                value={config.increment_value || 2.5}
                                onChange={(e) => updateConfig('increment_value', Number(e.target.value))}
                                className="h-9 bg-zinc-950/80 border-white/10 text-white font-bold text-center"
                            />
                        </div>
                    </div>
                )}

                {mode === 'custom_sequence' && (
                    <CustomSequenceEditor config={config} onChange={(newConfig) => onChange(mode, newConfig)} />
                )}
            </div>
        </div>
    )
}

function CustomSequenceEditor({ config, onChange }: { config: any, onChange: (c: any) => void }) {
    // Helper to add step
    const addStep = () => {
        const steps = config.steps || []
        const newStep = {
            name: `Week ${steps.length + 1}`,
            sets: 3,
            reps: 8,
            percent_1rm: 70,
            rir: 2
        }
        onChange({ ...config, steps: [...steps, newStep] })
    }

    const removeStep = (index: number) => {
        const steps = [...(config.steps || [])]
        steps.splice(index, 1)
        onChange({ ...config, steps })
    }

    const updateStep = (index: number, field: string, value: any) => {
        const steps = [...(config.steps || [])]
        steps[index] = { ...steps[index], [field]: value }
        onChange({ ...config, steps })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Sequence Steps</Label>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={addStep}
                    className="h-7 text-[10px] text-primary hover:bg-primary/10 font-bold uppercase tracking-wider rounded-lg"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add Step
                </Button>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                {(config.steps || []).map((step: any, i: number) => (
                    <div key={i} className="bg-zinc-900/40 rounded-xl p-3 border border-white/5 space-y-3 relative group hover:bg-zinc-900/60 transition-colors">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase italic tracking-wider">Step {i + 1}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeStep(i)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-4 space-y-1">
                                <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Name</Label>
                                <Input
                                    className="h-9 text-xs font-bold px-2 bg-zinc-950/80 border-white/10 text-white rounded-lg"
                                    value={step.name || ''}
                                    onChange={(e) => updateStep(i, 'name', e.target.value)}
                                    placeholder="e.g. Volume Week"
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2 space-y-1">
                                <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider text-center block">Sets</Label>
                                <Input
                                    type="number"
                                    className="h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 text-white rounded-lg"
                                    value={step.sets}
                                    onChange={(e) => updateStep(i, 'sets', Number(e.target.value))}
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2 space-y-1">
                                <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider text-center block">Reps</Label>
                                <Input
                                    type="number"
                                    className="h-9 text-sm text-center font-bold px-1 bg-zinc-950/80 border-white/10 text-white rounded-lg"
                                    value={step.reps}
                                    onChange={(e) => updateStep(i, 'reps', Number(e.target.value))}
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-4 space-y-1">
                                <Label className="text-[10px] uppercase text-amber-500 font-bold tracking-wider text-center block">% 1RM</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="h-9 text-sm text-center font-bold px-1 bg-amber-500/5 border-amber-500/20 text-amber-500 rounded-lg focus:border-amber-500/50"
                                        value={step.percent_1rm}
                                        onChange={(e) => updateStep(i, 'percent_1rm', Number(e.target.value))}
                                    />
                                    <span className="absolute right-2 top-2.5 text-[10px] text-amber-500/50 font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {(config.steps || []).length === 0 && (
                    <div className="text-center py-8 text-zinc-600 italic border border-dashed border-white/5 rounded-xl">
                        No steps defined. Add a step to start.
                    </div>
                )}
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5">
                <Label className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">Reference Load Source</Label>
                <Select
                    value={config.reference_load_type || 'dynamic_estimated'}
                    onValueChange={(v) => onChange({ ...config, reference_load_type: v })}
                >
                    <SelectTrigger className="h-9 bg-zinc-950/80 border-white/10 text-white text-xs font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dynamic_estimated">Dynamic (Adaptive 1RM)</SelectItem>
                        <SelectItem value="static_snapshot">Static (Snapshot at Start)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
