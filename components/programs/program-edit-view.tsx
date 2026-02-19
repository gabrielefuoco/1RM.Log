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

                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    )
}
