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
                <div className="grid grid-cols-12 gap-2 py-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
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
                            ? (item.weight_mode === 'percent' ? `${item.percentage}%` : `${item.weight_absolute || '---'}kg`)
                            : `${item.weight}kg`

                        const rir = mode === 'template' ? item.rir : item.rir
                        const isFailure = rir === 0

                        return (
                            <div key={i} className="grid grid-cols-12 gap-2 py-4 px-4 text-[13px] items-center hover:bg-muted/20 transition-colors group/row">
                                <div className="col-span-1 text-center font-heading text-muted-foreground font-black text-sm">
                                    {setNumber}
                                </div>
                                <div className="col-span-3 text-center font-black text-base tracking-tight text-primary shadow-primary/20 drop-shadow-sm">
                                    {reps}
                                </div>
                                <div className="col-span-3 text-center font-bold text-foreground tabular-nums tracking-tighter">
                                    {load}
                                </div>
                                <div className="col-span-2 text-center text-foreground/80 font-heading font-black text-sm">
                                    {rir ?? '-'}
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="text-[9px] text-muted-foreground uppercase font-black italic tracking-[0.15em] opacity-80">
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
