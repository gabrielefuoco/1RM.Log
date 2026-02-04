"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import { useTranslations } from "next-intl"

interface PlateCalculatorProps {
    weight: number
    barWeight?: number
    maxPlateWeight?: number
}

export function PlateCalculator({ weight, barWeight = 20, maxPlateWeight = 20 }: PlateCalculatorProps) {
    const t = useTranslations("Workout")
    const plates = [25, 20, 15, 10, 5, 2.5, 1.25].filter(p => p <= maxPlateWeight)

    const calculatePlates = (targetWeight: number, bar: number) => {
        let remaining = (targetWeight - bar) / 2
        if (remaining <= 0) return []

        const result: number[] = []
        for (const plate of plates) {
            while (remaining >= plate) {
                result.push(plate)
                remaining -= plate
            }
        }
        return result
    }

    const neededPlates = calculatePlates(weight, barWeight)

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                    <Calculator className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-[350px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-primary uppercase tracking-widest font-black italic">
                        {t("plateCalculator")}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 space-y-8">
                    {/* Weight Display */}
                    <div className="text-center">
                        <span className="text-5xl font-black text-white italic">{weight}</span>
                        <span className="text-xl font-bold text-primary ml-1">{t("weight")}</span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
                            {t("barPlates", { bar: barWeight, plates: weight - barWeight })}
                        </p>
                    </div>

                    {/* Barbell Visualization */}
                    <div className="relative w-full h-24 flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden">
                        {/* Bar sleeve */}
                        <div className="absolute left-4 right-4 h-3 bg-gradient-to-b from-zinc-400 to-zinc-600 rounded-full opacity-40" />

                        {/* Plates */}
                        <div className="flex items-center gap-0.5 z-10">
                            {neededPlates.length > 0 ? (
                                <>
                                    {neededPlates.map((plate, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center justify-center rounded-[4px] border border-black/20"
                                            style={{
                                                height: plate >= 15 ? '70px' : plate >= 10 ? '60px' : '45px',
                                                width: plate >= 20 ? '12px' : '9px',
                                                backgroundColor:
                                                    plate === 25 ? '#ef4444' : // Red
                                                        plate === 20 ? '#3b82f6' : // Blue
                                                            plate === 15 ? '#facc15' : // Yellow
                                                                plate === 10 ? '#22c55e' : // Green
                                                                    plate === 5 ? '#ffffff' : // White
                                                                        plate === 2.5 ? '#000000' : // Black
                                                                            '#71717a' // Gray
                                            }}
                                        >
                                            <span className="text-[7px] font-black text-black/60 rotate-90">{plate}</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <span className="text-xs text-muted-foreground uppercase font-black tracking-tighter italic">{t("justBar")}</span>
                            )}
                        </div>
                    </div>

                    {/* Plates List */}
                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">{t("perSide")}</p>
                            <div className="flex flex-wrap justify-center gap-1">
                                {neededPlates.map((p, i) => (
                                    <span key={i} className="text-xs font-bold text-white px-2 py-0.5 bg-white/5 rounded-md border border-white/10">{p}</span>
                                ))}
                                {neededPlates.length === 0 && <span className="text-xs font-bold text-muted-foreground">-</span>}
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 p-3 rounded-2xl border border-white/5 text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">{t("totalPlates")}</p>
                            <div className="text-lg font-black text-primary">
                                {neededPlates.length * 2}
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-white uppercase text-[10px] font-black tracking-widest mt-2"
                    onClick={() => { }}
                >
                    {t("close")}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
