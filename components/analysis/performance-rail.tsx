"use client"

import { cn } from "@/lib/utils"
import { Flame, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface PerformanceItem {
    id: string
    exercise: string
    date: string
    value: number
    raw: string
    improvement: string
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function PerformanceRail({ items }: { items: PerformanceItem[] }) {
    if (!items || items.length === 0) {
        return (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground">
                <p>No recent improvements recorded.</p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4 w-max px-1">
                {items.map((item) => {
                    const improvement = Number(item.improvement)
                    const prev1RM = item.value / (1 + (improvement / 100))

                    return (
                        <Dialog key={item.id}>
                            <DialogTrigger asChild>
                                <div
                                    className="flex flex-col justify-center w-[220px] px-4 py-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/40 transition-colors group cursor-pointer active:scale-95"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-bold text-foreground truncate max-w-[120px]" title={item.exercise}>
                                            {item.exercise.toUpperCase()}
                                        </h4>
                                        <span className="text-[10px] font-bold text-primary">+{item.improvement}%</span>
                                    </div>

                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[10px] text-muted-foreground font-mono uppercase">
                                            {format(new Date(item.date), 'd MMM')}
                                        </span>
                                        <p className="text-lg font-heading leading-none text-foreground">
                                            {item.value.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-0.5">kg</span>
                                        </p>
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl font-heading uppercase">
                                        <Flame className="size-5 text-primary fill-primary/20" />
                                        New Achievement
                                    </DialogTitle>
                                    <DialogDescription>
                                        Details of your new personal record.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="flex items-center justify-between border-b border-border pb-4">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{item.exercise}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {format(new Date(item.date), 'dd MMMM yyyy, HH:mm')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                                +{item.improvement}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/30 border border-border/40 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Previous</p>
                                            <p className="text-2xl font-heading text-muted-foreground/70">{prev1RM.toFixed(1)}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-primary/5 border border-border/40 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1 relative z-10">New Record</p>
                                            <p className="text-2xl font-heading text-primary relative z-10">{item.value.toFixed(1)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-center p-3 rounded-md bg-muted/20">
                                        <p className="text-xs text-muted-foreground font-mono mb-1">Raw Set</p>
                                        <p className="text-lg font-bold font-mono">{item.raw}</p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )
                })}
            </div>
        </div>
    )
}
