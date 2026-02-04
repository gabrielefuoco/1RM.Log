"use client"

import { useEffect, useState, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { getProgramTemplates } from "@/services/programs"
import { Program, WorkoutTemplate } from "@/types/database"
import { WorkoutTemplateList } from "@/components/programs/workout-template-list"
import { CreateWorkoutTemplateDrawer } from "@/components/programs/create-workout-template-drawer"
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
                    <CreateWorkoutTemplateDrawer
                        programId={id}
                        currentTemplatesCount={templates.length}
                        onSuccess={async () => {
                            const temps = await getProgramTemplates(id)
                            setTemplates(temps)
                        }}
                    />
                </div>

                <div className="space-y-3">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className="bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 transition-colors cursor-pointer group relative overflow-hidden"
                            onClick={() => router.push(`/programs/${id}/template/${template.id}`)}
                        >
                            {/* Click the card to navigate to detail/edit, BUT we want a PLAY button for the runner */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5 font-bold text-slate-300">
                                    {template.order + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base truncate">{template.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 flex gap-2">
                                        <span>{template.template_exercises.length} Esercizi</span>
                                    </p>
                                </div>

                                <Button
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,109,0.3)] hover:bg-white hover:text-black transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/workout/${template.id}`)
                                    }}
                                >
                                    <Play className="h-5 w-5 fill-current" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {templates.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-slate-500">Nessuna scheda creata.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
