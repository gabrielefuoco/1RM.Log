"use client"

import { Timer, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useNextWorkout } from "@/hooks/use-next-workout"
import Link from "next/link"

export function WorkoutCard() {
    const { data: nextWorkout, isLoading } = useNextWorkout()

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden border-border/50">
                <CardContent className="p-6">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <div className="flex gap-3 my-4">
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-md" />
                </CardContent>
            </Card>
        )
    }

    if (!nextWorkout) {
        return (
            <Card className="relative overflow-hidden group">
                <CardContent className="p-6 relative z-10 text-center">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-2 uppercase">Nessun programma attivo</h2>
                    <p className="text-muted-foreground text-sm font-sans mb-4">Crea un programma per iniziare ad allenarti</p>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/programs">Crea Programma</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="relative overflow-hidden group">
            {/* Subtle Gradient Overlay for Industrial feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-3xl font-heading font-bold text-foreground mb-1 uppercase leading-none">{nextWorkout.name}</h2>
                        <p className="text-muted-foreground text-sm font-sans uppercase tracking-wider">{nextWorkout.programName}</p>
                    </div>
                </div>

                <div className="flex gap-3 my-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Timer className="w-4 h-4 text-primary" />
                        <span className="font-mono">~60 min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Dumbbell className="w-4 h-4 text-primary" />
                        <span className="font-mono">#{nextWorkout.order + 1}</span>
                    </div>
                </div>

                <Button className="w-full h-12 text-md" asChild>
                    <Link href={`/workout/${nextWorkout.id}`}>INIZIA ALLENAMENTO</Link>
                </Button>
            </CardContent>
        </Card>
    )
}
