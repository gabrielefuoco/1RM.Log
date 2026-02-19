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
    items
}: WorkoutExerciseCardProps) {
    return (
        <UniversalListCard
            title={title}
            index={index}
            onClick={onClick}
            isCompact={true}
            headerExtra={headerExtra}
            subtitle={subtitle}
            actions={actions}
        >
            <div className="overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 py-2 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5">
                    <div className="col-span-1 text-center font-black">#</div>
                    <div className="col-span-3 text-center font-black">Reps</div>
                    <div className="col-span-3 text-center font-black">Load</div>
                    <div className="col-span-2 text-center font-black">RIR</div>
                    <div className="col-span-3 text-right pr-2 font-black italic">Type</div>
                </div>

                <div className="divide-y divide-white/5">
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
                            <div key={i} className="grid grid-cols-12 gap-2 py-3 px-3 text-[13px] items-center hover:bg-white/[0.02] transition-colors group/row">
                                <div className="col-span-1 text-center font-mono text-zinc-700 font-black text-xs">
                                    {setNumber}
                                </div>
                                <div className="col-span-3 text-center font-black text-primary text-sm tracking-tight drop-shadow-[0_0_10px_rgba(0,255,163,0.3)]">
                                    {reps}
                                </div>
                                <div className="col-span-3 text-center font-bold text-zinc-200 tabular-nums">
                                    {load}
                                </div>
                                <div className="col-span-2 text-center text-zinc-300 font-mono font-bold">
                                    {rir ?? '-'}
                                </div>
                                <div className="col-span-3 text-right">
                                    {isFailure ? (
                                        <span className="text-[10px] text-red-500 uppercase font-black italic tracking-widest shadow-red-500/20 drop-shadow-sm">Failure</span>
                                    ) : (
                                        <span className="text-[10px] text-zinc-600 uppercase font-black italic tracking-widest opacity-60">Straight</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </UniversalListCard>
    )
}
