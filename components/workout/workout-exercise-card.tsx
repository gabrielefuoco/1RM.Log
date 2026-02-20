"use client"

import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { UniversalListCard } from "@/components/ui/universal-list-card"
import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

export interface WorkoutExerciseCardProps {
    title: string
    index: number
    subtitle?: ReactNode
    headerExtra?: ReactNode
    actions?: ReactNode
    onClick?: () => void

    // Data for the table
    mode: 'template' | 'history'
    items: any[] // TemplateSet[] or ExtendedLog[]
}

export function WorkoutExerciseCard({
    title,
    index,
    subtitle,
    headerExtra,
    actions,
    onClick,
    mode,
    items,
    dragHandle
}: WorkoutExerciseCardProps & { dragHandle?: ReactNode }) {
    return (
        <UniversalListCard
            title={title}
            index={index}
            onClick={onClick}
            isCompact={true}
            headerExtra={headerExtra}
            subtitle={subtitle}
            actions={actions}
            dragHandle={dragHandle}
        >
            <div className="overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 py-2 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 border-b border-border/50 bg-muted/10">
                    <div className="col-span-1 text-center font-black">#</div>
                    <div className="col-span-3 text-center font-black">Reps</div>
                    <div className="col-span-3 text-center font-black">Load</div>
                    <div className="col-span-2 text-center font-black">Rir</div>
                    <div className="col-span-3 text-right pr-2 font-black italic">Type</div>
                </div>

                <div className="divide-y divide-border/40">
                    {items.map((item, i) => {
                        const setNumber = mode === 'template' ? i + 1 : (item.set_number || i + 1)
                        const reps = mode === 'template'
                            ? (item.reps_min === item.reps_max ? item.reps_min : `${item.reps_min}-${item.reps_max}`)
                            : item.reps

                        const load = mode === 'template'
                            ? (item.weight_mode === 'percent'
                                ? `${item.is_backoff ? item.backoff_percent : item.percentage}%`
                                : `${item.weight_absolute || '---'}kg`)
                            : `${item.weight}kg`

                        const rir = mode === 'template' ? item.rir : item.rir
                        const isFailure = rir === 0

                        return (
                            <div key={i} className="grid grid-cols-12 gap-2 py-2.5 px-4 items-center hover:bg-muted/30 transition-colors relative">
                                <div className="col-span-1 text-center font-heading text-muted-foreground/60 font-black text-[13px]">
                                    {setNumber}
                                </div>
                                <div className="col-span-3 text-center font-black text-[15px] tracking-tight text-primary shadow-primary/20 drop-shadow-sm">
                                    {reps}
                                </div>
                                <div className="col-span-3 text-center font-bold text-[15px] text-foreground tabular-nums tracking-tighter">
                                    {load}
                                </div>
                                <div className="col-span-2 text-center text-foreground/90 font-heading font-black text-[14px]">
                                    {rir ?? '-'}
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="text-[10px] text-muted-foreground/70 uppercase font-black italic tracking-widest">
                                        {isFailure ? "Failure" : "Straight"}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </UniversalListCard>
    )
}
