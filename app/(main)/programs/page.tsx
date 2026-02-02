"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Program } from "@/types/database"
import { ProgramCard } from "@/components/programs/program-card"
import { CreateProgramDrawer } from "@/components/programs/create-program-drawer"
import { Activity } from "lucide-react"

export default function ProgramsPage() {
    const [activeProgram, setActiveProgram] = useState<Program | null>(null)
    const [pastPrograms, setPastPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)

    const [errorMsg, setErrorMsg] = useState<string>("")

    const loadPrograms = async () => {
        setLoading(true)
        setErrorMsg("")
        const supabase = createClient()

        try {
            // Fetch Active
            const { data: activeData, error: activeError } = await supabase
                .from('programs')
                .select('*')
                .eq('is_active', true)

            if (activeError) throw activeError

            // Fetch History
            const { data: history, error: historyError } = await supabase
                .from('programs')
                .select('*')
                .eq('is_active', false)
                .order('start_date', { ascending: false })

            if (historyError) throw historyError

            if (activeData && activeData.length > 0) {
                setActiveProgram(activeData[0])
            } else {
                setActiveProgram(null)
            }

            if (history) setPastPrograms(history)

            // DEBUG: Show what we found
            // setErrorMsg(`Debug: Found ${activeData?.length} active, ${history?.length} history.`)

        } catch (err: any) {
            console.error("Error loading programs:", err)
            setErrorMsg(`Error: ${err.message || JSON.stringify(err)}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPrograms()
    }, [])

    return (
        <div className="space-y-8 pt-4 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">Programmazione</h1>
                <p className="text-sm text-slate-400">Gestisci i tuoi macrocicli e schede.</p>
                {errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded font-mono">
                        {errorMsg}
                    </div>
                )}
            </div>

            {/* Active Program Section */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Macrociclo Attivo</h2>
                </div>

                {loading ? (
                    <div className="h-24 rounded-lg bg-zinc-900/50 animate-pulse" />
                ) : activeProgram ? (
                    <ProgramCard program={activeProgram} onRefresh={loadPrograms} />
                ) : (
                    <div className="p-6 rounded-lg border border-dashed border-white/10 text-center">
                        <p className="text-slate-500 text-sm">Nessun programma attivo</p>
                    </div>
                )}
            </section>

            {/* History Section */}
            <section>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Storico</h2>
                <div className="space-y-3">
                    {pastPrograms.map(p => (
                        <ProgramCard key={p.id} program={p} onRefresh={loadPrograms} />
                    ))}
                    {!loading && pastPrograms.length === 0 && (
                        <p className="text-xs text-slate-600">Nessun programma passato.</p>
                    )}
                </div>
            </section>

            <CreateProgramDrawer onSuccess={loadPrograms} />
        </div>
    )
}
