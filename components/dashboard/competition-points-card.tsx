"use client"

import { useCompetitionPoints } from "@/hooks/use-competition-points"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Info, Target } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function CompetitionPointsCard() {
    const { data: points, isLoading } = useCompetitionPoints()

    if (isLoading) {
        return (
            <Card className="bg-zinc-950 border-white/5 overflow-hidden animate-pulse">
                <div className="h-40" />
            </Card>
        )
    }

    if (!points || points.total === 0) return null

    return (
        <Card className="bg-zinc-950 border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-500">
            <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-primary animate-pulse" />
                        Powerlifting Score
                    </span>
                    <span className="text-primary/40 font-mono">{(points.sex || 'male').toUpperCase()} @ {points.bodyweight}KG</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <PointItem
                        label="DOTS"
                        value={points.dots.toFixed(2)}
                        description="Il punteggio più utilizzato nelle gare moderne (BPU, GPA)."
                        highlight
                    />
                    <PointItem
                        label="IPF GL"
                        value={points.ipf.toFixed(2)}
                        description="Punteggio ufficiale IPF per gare Classic."
                    />
                    <PointItem
                        label="Wilks"
                        value={points.wilks.toFixed(2)}
                        description="Lo standard storico del powerlifting."
                    />
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SBD Total</div>
                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                            {points.total.toFixed(1)}
                            <span className="text-[10px] text-slate-600 uppercase">kg</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                        <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                            <span>S: {points.squat}</span>
                            <span>B: {points.bench}</span>
                            <span>D: {points.deadlift}</span>
                        </div>
                        <div className="text-[9px] font-black text-primary uppercase tracking-tighter">
                            Elite potential detected
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function PointItem({ label, value, description, highlight = false }: { label: string, value: string, description: string, highlight?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-help flex items-center gap-1 group/tip">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            highlight ? "text-primary" : "text-slate-500"
                        )}>{label}</span>
                        <Info className="h-2.5 w-2.5 text-slate-700 group-hover/tip:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] max-w-[200px] font-medium text-slate-300">
                        {description}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <span className={cn(
                "text-2xl font-black tabular-nums tracking-tighter",
                highlight ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.3)]Scale-110" : "text-white"
            )}>{value}</span>
        </div>
    )
}
