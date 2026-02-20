"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getWorkoutRecap, finishSession } from "@/services/workout"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Trophy, Clock, Weight, Repeat, ArrowUpRight, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { format } from "date-fns"
import { it, enUS } from "date-fns/locale"
import { useTranslations, useLocale } from "next-intl"

export default function RecapPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const t = useTranslations("Recap")
    const locale = useLocale()
    const router = useRouter()
    const { sessionId } = use(params)

    const [loading, setLoading] = useState(true)
    const [recapData, setRecapData] = useState<any>(null)
    const [rpe, setRpe] = useState(7)
    const [notes, setNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadRecap = async () => {
            try {
                const data = await getWorkoutRecap(sessionId)
                setRecapData(data)

                // Trigger confetti if there are PRs
                if (data.prs.length > 0) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#00ffa3', '#ffffff', '#1a1a1a']
                    })
                }
            } catch (e) {
                console.error(e)
                toast.error(t("loadingError"))
            } finally {
                setLoading(false)
            }
        }
        loadRecap()
    }, [sessionId, t])

    const handleFinish = async () => {
        setIsSaving(true)
        try {
            await finishSession(sessionId, recapData.session.duration_seconds || 0, notes, rpe)
            toast.success(t("saveSuccess"))
            router.push('/')
        } catch (e) {
            console.error(e)
            toast.error(t("saveError"))
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>
    if (!recapData) return <div className="h-screen flex items-center justify-center text-foreground">{t("dataNotFound")}</div>

    const { session, logs, currentVolume, currentReps, volumeDelta, prs } = recapData
    const dateLocale = locale === 'it' ? it : enUS

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header Celebration */}
            <div className="relative overflow-hidden bg-muted/20 border-b border-border/50 px-6 pt-12 pb-8 text-center space-y-2">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 inline-flex items-center justify-center h-16 w-16 bg-primary/20 rounded-full border border-primary/30 mb-4 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                    <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground italic">{t("title")}</h1>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em]">
                    {format(new Date(session.date), "EEEE d MMMM", { locale: dateLocale })}
                </p>
            </div>

            <div className="p-6 space-y-8 max-w-lg mx-auto">
                {/* PR Highlights */}
                {prs.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-primary">{t("newRecords")}</h2>
                        </div>
                        <div className="space-y-3">
                            {prs.map((pr: any, i: number) => (
                                <div key={i} className="bg-muted/40 border border-primary/30 rounded-2xl p-4 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/10 to-transparent" />
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-0.5">{t("est1rmRecord")}</p>
                                            <h3 className="text-lg font-bold text-foreground uppercase">{pr.exerciseName}</h3>
                                            <p className="text-xs text-muted-foreground font-bold">
                                                {pr.weight}kg x {pr.reps} reps
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 justify-end text-primary">
                                                <span className="text-2xl font-black">{pr.new1rm.toFixed(1)}</span>
                                                <span className="text-[10px] font-bold">KG</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                                +{(pr.new1rm - pr.old1rm).toFixed(1)}kg vs last
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Weight className="h-4 w-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("totalVolume")}</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-foreground">{currentVolume.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-muted-foreground mb-1.5">KG</span>
                        </div>
                        {volumeDelta !== 0 && (
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase",
                                volumeDelta > 0 ? "text-primary" : "text-destructive"
                            )}>
                                <ArrowUpRight className={cn("h-3 w-3", volumeDelta < 0 && "rotate-90")} />
                                <span>{volumeDelta > 0 ? '+' : ''}{volumeDelta.toLocaleString()}kg vs last</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Repeat className="h-4 w-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("totalReps")}</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-foreground">{currentReps}</span>
                            <span className="text-[10px] font-bold text-muted-foreground mb-1.5">REPS</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                            <span>Avg Reps: {(currentReps / logs.length).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Duration */}
                <div className="bg-muted/20 border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-xl border border-border/50">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{t("sessionDuration")}</p>
                            <p className="text-base font-bold text-foreground">
                                {Math.floor((session.duration_seconds || 0) / 60)}m {(session.duration_seconds || 0) % 60}s
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="space-y-6 pt-4 border-t border-border/50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{t("difficulty")}</h2>
                            <span className={cn(
                                "text-lg font-black",
                                rpe <= 4 ? "text-green-500" : rpe <= 7 ? "text-primary" : "text-orange-500"
                            )}>{rpe}/10</span>
                        </div>
                        <Slider
                            value={[rpe]}
                            onValueChange={(v) => setRpe(v[0])}
                            max={10}
                            step={1}
                            className="py-4"
                        />
                        <div className="flex justify-between text-[8px] text-muted-foreground font-bold uppercase tracking-widest">
                            <span>{t("veryEasy")}</span>
                            <span>{t("optimal")}</span>
                            <span>{t("atLimit")}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{t("sessionNotes")}</h2>
                        <Textarea
                            placeholder={t("notesPlaceholder")}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-muted/30 border-border rounded-2xl min-h-[100px] text-sm focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Main Action */}
                <Button
                    onClick={handleFinish}
                    disabled={isSaving}
                    className="w-full h-14 bg-primary text-background font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(0,255,163,0.3)] group"
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                        t("saveAndFinish")
                    )}
                </Button>
            </div>
        </div>
    )
}
