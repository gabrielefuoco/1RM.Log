"use client"

import { WorkoutTemplate, TemplateExercise } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, ChevronRight } from "lucide-react"

interface WorkoutTemplateListProps {
    templates: (WorkoutTemplate & { template_exercises: any[] })[]
}

export function WorkoutTemplateList({ templates }: WorkoutTemplateListProps) {
    if (templates.length === 0) {
        return (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-slate-500">Nessuna scheda creata.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {templates.map((template) => (
                <Card key={template.id} className="bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5 font-bold text-slate-300">
                            {template.order + 1}
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-white text-base">{template.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex gap-2">
                                <span>{template.template_exercises.length} Esercizi</span>
                            </p>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-600" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
