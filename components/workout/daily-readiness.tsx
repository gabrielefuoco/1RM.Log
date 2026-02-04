"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dna, Zap, Battery, AlertTriangle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface DailyReadinessProps {
    onComplete: (readiness: { score: number, adjustment: 'none' | 'volume' | 'intensity' }) => void
}

export function DailyReadiness({ onComplete }: DailyReadinessProps) {
    const t = useTranslations("Workout")
    const [score, setScore] = useState(3)
    const [adjustment, setAdjustment] = useState<'none' | 'volume' | 'intensity'>('none')

    const getStatusText = () => {
        if (score <= 1) return { label: t("exhausted"), color: "text-red-500", icon: AlertTriangle }
        if (score <= 2) return { label: t("tired"), color: "text-orange-500", icon: Battery }
        if (score <= 3) return { label: t("good"), color: "text-primary", icon: Zap }
        if (score <= 4) return { label: t("energized"), color: "text-green-500", icon: Dna }
        return { label: t("unstoppable"), color: "text-white shadow-primary", icon: Zap }
    }

    const status = getStatusText()
    const StatusIcon = status.icon

    return (
        <div className="space-y-8 p-6 bg-card border border-border rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">{t("readyTitle")}</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("readySubtitle")}</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
                <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    score <= 2 ? "border-orange-500/50 bg-orange-500/10" : "border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(0,255,163,0.1)]"
                )}>
                    <StatusIcon className={cn("h-10 w-10", status.color)} />
                </div>
                <div className="text-center">
                    <span className={cn("text-xl font-black uppercase tracking-widest", status.color)}>
                        {status.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{t("score")}: {score}/5</p>
                </div>
                <Slider
                    value={[score]}
                    onValueChange={(v) => {
                        setScore(v[0])
                        if (v[0] > 2) setAdjustment('none')
                    }}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full mt-4"
                />
            </div>

            {score <= 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest text-center">{t("advice")}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setAdjustment('volume')}
                            className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                adjustment === 'volume' ? "bg-orange-500/20 border-orange-500 text-white" : "bg-muted/30 border-border text-muted-foreground"
                            )}
                        >
                            <span className="text-xs font-black uppercase mb-1">{t("volumeCut")}</span>
                            <span className="text-[8px] font-bold text-center">{t("volumeCutDesc")}</span>
                        </button>
                        <button
                            onClick={() => setAdjustment('intensity')}
                            className={cn(
                                "flex flex-col items-center p-4 rounded-2xl border transition-all",
                                adjustment === 'intensity' ? "bg-orange-500/20 border-orange-500 text-white" : "bg-muted/30 border-border text-muted-foreground"
                            )}
                        >
                            <span className="text-xs font-black uppercase mb-1">{t("intensityCut")}</span>
                            <span className="text-[8px] font-bold text-center">{t("intensityCutDesc")}</span>
                        </button>
                    </div>
                </div>
            )}

            <Button
                onClick={() => onComplete({ score, adjustment })}
                className="w-full h-14 bg-primary text-background font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(0,255,163,0.3)]"
            >
                {t("startTraining")} <Check className="ml-2 h-5 w-5" />
            </Button>
        </div>
    )
}
