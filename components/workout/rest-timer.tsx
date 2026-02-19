"use client"

import { Button } from "@/components/ui/button"
import { Minimize2, Maximize2, X, Plus, Minus, Timer as TimerIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface RestTimerProps {
    initialSeconds?: number
    onComplete?: () => void
    onClose: () => void
    isOpen: boolean
}

export function RestTimer({ initialSeconds = 90, onComplete, onClose, isOpen }: RestTimerProps) {
    const t = useTranslations("Workout")
    const [seconds, setSeconds] = useState(initialSeconds)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isRunning, setIsRunning] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setSeconds(initialSeconds)
            setIsRunning(true)
            setIsMinimized(false)
        }
    }, [isOpen, initialSeconds])

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission()
            }
        }
    }, [])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isOpen && isRunning && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1)
            }, 1000)
        } else if (seconds <= 0 && isRunning) {
            setIsRunning(false)
            if (onComplete) onComplete()

            // Background Notification logic
            if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
                new Notification(t("notificationTitle"), {
                    body: t("notificationBody"),
                    icon: "/icons/icon-192x192.png",
                    tag: 'rest-timer'
                })
            }

            // Haptic Feedback
            if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        }
        return () => clearInterval(interval)
    }, [isOpen, isRunning, seconds, onComplete, t])

    if (!isOpen) return null

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const adjustTime = (delta: number) => {
        setSeconds(prev => Math.max(0, prev + delta))
    }

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground rounded-full p-2 pl-4 pr-3 flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,157,0.4)] cursor-pointer animate-in slide-in-from-bottom-10"
                onClick={() => setIsMinimized(false)}
            >
                <TimerIcon className="h-4 w-4 animate-pulse" />
                <span className="font-bold font-mono">{formatTime(seconds)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary-foreground/10" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                    <X className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop for focus */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-sm bg-card/95 backdrop-blur-xl border border-primary/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_20px_rgba(19,236,109,0.1)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <TimerIcon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-foreground text-xl">{t("restTitle")}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => setIsMinimized(true)}>
                            <Minimize2 className="h-5 w-5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}>
                            <X className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                    <div className={cn(
                        "text-7xl font-black font-mono tracking-tighter transition-all duration-300",
                        seconds <= 10 ? "text-red-500 scale-110 animate-pulse" : "text-foreground"
                    )}>
                        {formatTime(seconds)}
                    </div>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">{t("remainingTime")}</p>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-8">
                    <Button variant="outline" className="h-12 border-border bg-muted/50 hover:bg-muted text-muted-foreground" onClick={() => adjustTime(-30)}>
                        -30s
                    </Button>
                    <Button variant="outline" className="h-12 border-border bg-muted/50 hover:bg-muted text-muted-foreground" onClick={() => adjustTime(-10)}>
                        -10s
                    </Button>
                    <Button variant="outline" className="h-12 border-border bg-muted/50 hover:bg-muted text-muted-foreground" onClick={() => adjustTime(10)}>
                        +10s
                    </Button>
                    <Button variant="outline" className="h-12 border-border bg-muted/50 hover:bg-muted text-muted-foreground" onClick={() => adjustTime(30)}>
                        +30s
                    </Button>
                </div>

                <Button
                    className="w-full mt-6 h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl hover:bg-primary/90 shadow-[0_0_20px_rgba(19,236,109,0.2)]"
                    onClick={onClose}
                >
                    {t("skipRest")}
                </Button>
            </div>
        </div>
    )
}
