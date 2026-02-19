"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { getProgramTemplates } from "@/services/programs"
import { Program, WorkoutTemplate } from "@/types/database"
import { WorkoutTemplateList } from "@/components/programs/workout-template-list"
import { WorkoutTemplateCard } from "@/components/programs/workout-template-card"
import { WorkoutTemplateDrawer } from "@/components/programs/workout-template-drawer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    // Unwrap params using React.use()
    const { id } = use(params)

    const [program, setProgram] = useState<Program | null>(null)
    const [templates, setTemplates] = useState<(WorkoutTemplate & { template_exercises: any[] })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            const supabase = createClient()

            // 1. Get Program Details
            const { data: prog } = await supabase
                .from('programs')
                .select('*')
                .eq('id', id)
                .single()

            if (prog) {
                setProgram(prog)
                // 2. Get Templates
                const temps = await getProgramTemplates(id)
                setTemplates(temps)
            }

            setLoading(false)
        }

        loadData()
    }, [id])

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento programma...</div>
    if (!program) return <div className="p-8 text-center text-red-400">Programma non trovato</div>

    return (
        <div className="space-y-6 pt-4 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" className="-ml-3 w-fit text-slate-400 hover:text-white" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Torna ai programmi
                </Button>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-white tracking-tight">{program.name}</h1>
                        {program.is_active && <Badge className="bg-primary text-background-dark">ATTIVO</Badge>}
                    </div>
                    {program.description && <p className="text-sm text-slate-400">{program.description}</p>}
                </div>
            </div>

            {/* Templates List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Schede Allenamento</h2>
                    <WorkoutTemplateDrawer
                        mode="create"
                        programId={id}
                        currentTemplatesCount={templates.length}
                        onSuccess={async () => {
                            const temps = await getProgramTemplates(id)
                            setTemplates(temps)
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template, index) => (
                        <WorkoutTemplateCard
                            key={template.id}
                            template={template}
                            index={index}
                            onClick={(id) => router.push(`/programs/${id}/template/${template.id}`)}
                            onPlay={(id) => router.push(`/workout/${id}`)}
                        />
                    ))
                    }

                    {
                        templates.length === 0 && (
                            <div className="col-span-full text-center py-8 border border-dashed border-white/10 rounded-xl">
                                <p className="text-slate-500">Nessuna scheda creata.</p>
                            </div>
                        )
                    }
                </div>
            </div>

        </div>
    )
}
