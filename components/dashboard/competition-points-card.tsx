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
            <Card className="overflow-hidden animate-pulse">
                <div className="h-40" />
            </Card>
        )
    }

    if (!points || points.total === 0) return null

    return (
        <Card className="overflow-hidden group">
            <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
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

                <div className="bg-muted/30 rounded-lg p-4 border border-border/40 flex items-center justify-between group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                    <div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">SBD Total</div>
                        <div className="text-3xl font-black text-foreground flex items-baseline gap-1">
                            {points.total.toFixed(1)}
                            <span className="text-[10px] text-muted-foreground uppercase">kg</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                        <div className="flex gap-2 text-[10px] font-bold text-muted-foreground">
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
                            highlight ? "text-primary" : "text-muted-foreground"
                        )}>{label}</span>
                        <Info className="h-2.5 w-2.5 text-muted-foreground group-hover/tip:text-primary transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border text-[10px] max-w-[200px] font-medium text-muted-foreground">
                        {description}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <span className={cn(
                "text-2xl font-black tabular-nums tracking-tighter",
                highlight ? "text-primary filter drop-shadow-[0_0_8px_var(--primary)] Scale-110" : "text-foreground"
            )}>{value}</span>
        </div>
    )
}
