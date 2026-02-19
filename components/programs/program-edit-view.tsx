"use client"

import { WorkoutTemplate } from "@/types/database"
import { WorkoutTemplateColumn } from "@/components/programs/workout-template-column"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WorkoutTemplateDrawer } from "@/components/programs/workout-template-drawer"

interface ProgramEditViewProps {
    programId: string
    templates: (WorkoutTemplate & { template_exercises: any[] })[]
    onRefresh: () => void
}

export function ProgramEditView({ programId, templates, onRefresh }: ProgramEditViewProps) {
    return (
        <div className="h-full w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
                <div className="flex w-max space-x-4 p-1 pb-4">
                    {templates.map((template) => (
                        <WorkoutTemplateColumn
                            key={template.id}
                            template={template}
                            onRefresh={onRefresh}
                        />
                    ))}

                    {/* Add New Template Column/Button */}
                    <div className="w-[320px] shrink-0 h-[calc(100vh-220px)] border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center p-6 gap-4">
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-300">Nuova Scheda</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] whitespace-normal">
                                Aggiungi una nuova giornata di allenamento a questo programma.
                            </p>
                        </div>

                        <WorkoutTemplateDrawer
                            mode="create"
                            programId={programId}
                            currentTemplatesCount={templates.length}
                            onSuccess={onRefresh}
                            trigger={
                                <Button className="mt-2">
                                    Crea Scheda
                                </Button>
                            }
                        />
                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
