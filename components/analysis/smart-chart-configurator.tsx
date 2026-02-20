"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
    SmartChartConfig,
    SmartChartMetric,
    SmartChartType,
    DashboardConfig
} from "@/types/analysis"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerDescription
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { useQuery } from "@tanstack/react-query"
import { getExercisesList } from "@/app/actions/analysis"
import { Plus, BarChart3, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SmartChartConfiguratorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (config: SmartChartConfig) => void
    initialConfig?: Partial<SmartChartConfig>
    isFocusedEdit?: boolean
}

const METRICS: { value: SmartChartMetric; label: string }[] = [
    { value: '1rm', label: '1RM Trend' },
    { value: 'volume', label: 'Weekly Volume' },
    { value: 'intensity', label: 'Intensity (RIR)' },
    { value: 'muscle_balance', label: 'Muscle Balance' },
    { value: 'muscle_volume', label: 'Volume per Muscle' },
    { value: 'bodyweight', label: 'Bodyweight' },
    { value: 'rel_strength', label: 'Relative Strength' },
    { value: 'dots', label: 'Score (DOTS/Wilks)' },
    { value: 'hard_sets', label: 'Sets Allenanti' },
    { value: 'normalized', label: 'Progressione Relativa' }
]

const CHART_TYPES: { value: SmartChartType; label: string }[] = [
    { value: 'area', label: 'Area Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'radar', label: 'Radar Chart' },
    { value: 'histogram', label: 'Histogram' },
    { value: 'scatter', label: 'Scatter Plot' }
]

const COL_SPANS = [
    { value: 4, label: '1/3 Width' },
    { value: 6, label: '1/2 Width' },
    { value: 8, label: '2/3 Width' },
    { value: 12, label: 'Full Width' }
]

const PERIODS = [
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' }
]

export function SmartChartConfigurator({
    open,
    onOpenChange,
    onSave,
    initialConfig,
    isFocusedEdit = false
}: SmartChartConfiguratorProps) {
    const t = useTranslations("Analysis")
    const { data: exercises } = useQuery({ queryKey: ['exercises'], queryFn: () => getExercisesList() })

    const [config, setConfig] = useState<Partial<SmartChartConfig>>({
        title: "",
        metric: '1rm',
        type: 'area',
        colSpan: 6,
        params: {
            periodDays: 90,
            exerciseIds: []
        }
    })

    useEffect(() => {
        if (initialConfig) {
            setConfig(prev => ({ ...prev, ...initialConfig }))
        } else {
            setConfig({
                id: crypto.randomUUID(),
                title: "",
                metric: '1rm',
                type: 'area',
                colSpan: 6,
                params: {
                    periodDays: 90,
                    exerciseIds: []
                }
            })
        }
    }, [initialConfig, open])

    const isDesktop = useMediaQuery("(min-width: 768px)")

    const handleSave = () => {
        if (!config.title) return
        onSave(config as SmartChartConfig)
        onOpenChange(false)
    }

    const exerciseOptions = exercises?.map(e => ({ label: e.name, value: e.id })) || []

    const formContent = (
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className={cn("space-y-2 transition-opacity", isFocusedEdit && "opacity-40 select-none pointer-events-none")}>
                <Label className="text-xs font-mono uppercase text-muted-foreground">Chart Title</Label>
                <Input
                    value={config.title}
                    onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Es: Progressione Panca"
                    className="bg-secondary/20 border-border/50 h-11"
                    disabled={isFocusedEdit}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={cn("space-y-2 transition-opacity", isFocusedEdit && "opacity-40 select-none pointer-events-none")}>
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Metric</Label>
                    <Select
                        value={config.metric}
                        disabled={isFocusedEdit}
                        onValueChange={(v: any) => {
                            // Default type based on metric
                            let type: SmartChartType = 'area'
                            if (v === 'muscle_balance') type = 'radar'
                            if (v === 'intensity') type = 'histogram'
                            if (v === 'rel_strength' || v === 'dots') type = 'line'

                            setConfig(prev => ({ ...prev, metric: v, type }))
                        }}
                    >
                        <SelectTrigger className="bg-secondary/20 border-border/50 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {METRICS.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn("space-y-2 transition-opacity", isFocusedEdit && "opacity-40 select-none pointer-events-none")}>
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Chart Type</Label>
                    <Select
                        value={config.type}
                        disabled={isFocusedEdit}
                        onValueChange={(v: any) => setConfig(prev => ({ ...prev, type: v }))}
                    >
                        <SelectTrigger className="bg-secondary/20 border-border/50 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CHART_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {(config.metric === '1rm' || config.metric === 'normalized' || config.metric === 'rel_strength') && (
                <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Exercises</Label>
                    <MultiSelect
                        options={exerciseOptions}
                        selected={config.params?.exerciseIds || []}
                        onChange={v => setConfig(prev => ({
                            ...prev,
                            params: { ...prev.params!, exerciseIds: v }
                        }))}
                        placeholder="Select exercises..."
                    />
                </div>
            )}

            {config.metric === 'sbd' && (
                <div className="space-y-4 pt-2 border-t border-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Squat Variant</Label>
                            <Select
                                value={config.params?.squatId}
                                onValueChange={v => setConfig(prev => ({ ...prev, params: { ...prev.params!, squatId: v } }))}
                            >
                                <SelectTrigger className="h-9 bg-secondary/10">
                                    <SelectValue placeholder="Auto (Squat)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exerciseOptions.filter(o => o.label.toLowerCase().includes('squat')).map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Bench Variant</Label>
                            <Select
                                value={config.params?.benchId}
                                onValueChange={v => setConfig(prev => ({ ...prev, params: { ...prev.params!, benchId: v } }))}
                            >
                                <SelectTrigger className="h-9 bg-secondary/10">
                                    <SelectValue placeholder="Auto (Bench)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exerciseOptions.filter(o => o.label.toLowerCase().includes('bench') || o.label.toLowerCase().includes('panca')).map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono uppercase text-muted-foreground">Deadlift Variant</Label>
                            <Select
                                value={config.params?.deadliftId}
                                onValueChange={v => setConfig(prev => ({ ...prev, params: { ...prev.params!, deadliftId: v } }))}
                            >
                                <SelectTrigger className="h-9 bg-secondary/10">
                                    <SelectValue placeholder="Auto (Deadlift)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exerciseOptions.filter(o => o.label.toLowerCase().includes('deadlift') || o.label.toLowerCase().includes('stacco')).map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className={cn("space-y-2 transition-opacity", isFocusedEdit && "opacity-40 select-none pointer-events-none")}>
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Period</Label>
                    <Select
                        value={String(config.params?.periodDays)}
                        disabled={isFocusedEdit}
                        onValueChange={(v) => setConfig(prev => ({
                            ...prev,
                            params: { ...prev.params!, periodDays: Number(v) }
                        }))}
                    >
                        <SelectTrigger className="bg-secondary/20 border-border/50 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIODS.map(p => (
                                <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn("space-y-2 transition-opacity", isFocusedEdit && "opacity-40 select-none pointer-events-none")}>
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Grid Width</Label>
                    <Select
                        value={String(config.colSpan)}
                        disabled={isFocusedEdit}
                        onValueChange={(v) => setConfig(prev => ({ ...prev, colSpan: Number(v) as any }))}
                    >
                        <SelectTrigger className="bg-secondary/20 border-border/50 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {COL_SPANS.map(c => (
                                <SelectItem key={c.value} value={String(c.value)}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl bg-card border border-border backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="font-heading uppercase text-2xl tracking-tight flex items-center gap-2">
                            {isFocusedEdit ? <Settings2 className="size-6 text-primary" /> : <BarChart3 className="size-6 text-primary" />}
                            {isFocusedEdit ? "Quick Switch" : (initialConfig?.id ? "Edit Chart" : "New Smart Chart")}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {isFocusedEdit ? "Modifica gli esercizi per questo grafico." : "Configura la tua visualizzazione dati personalizzata."}
                        </DialogDescription>
                    </DialogHeader>

                    {formContent}

                    <DialogFooter className="flex flex-row gap-3 border-t border-border/30 bg-secondary/5 p-6 pt-6">
                        <Button variant="outline" className="flex-1 h-12 font-mono uppercase text-xs" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-[2] h-12 font-heading uppercase text-md gap-2" onClick={handleSave}>
                            <Plus className="size-4" />
                            {initialConfig?.id ? "Save Changes" : "Add Chart"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-card border-t border-border max-h-[95vh]">
                <div className="mx-auto w-full max-w-sm overflow-y-auto">
                    <DrawerHeader className="p-6 pb-2">
                        <DrawerTitle className="font-heading uppercase text-2xl tracking-tight flex items-center gap-2">
                            {isFocusedEdit ? <Settings2 className="size-6 text-primary" /> : <BarChart3 className="size-6 text-primary" />}
                            {isFocusedEdit ? "Quick Switch" : (initialConfig?.id ? "Edit Chart" : "New Smart Chart")}
                        </DrawerTitle>
                        <DrawerDescription className="text-muted-foreground">
                            {isFocusedEdit ? "Modifica gli esercizi per questo grafico." : "Configura la tua visualizzazione dati personalizzata."}
                        </DrawerDescription>
                    </DrawerHeader>

                    {formContent}

                    <DrawerFooter className="flex flex-row gap-3 border-t border-border/30 bg-secondary/5 p-6 pt-6">
                        <Button variant="outline" className="flex-1 h-12 font-mono uppercase text-xs" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button className="flex-[2] h-12 font-heading uppercase text-md gap-2" onClick={handleSave}>
                            <Plus className="size-4" />
                            {initialConfig?.id ? "Save Changes" : "Add Chart"}
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
