"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Program } from "@/types/database"
import { ProgramCard } from "@/components/programs/program-card"
import { ProgramDrawer } from "@/components/programs/program-drawer"
import { Activity } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ProgramsPage() {
    const t = useTranslations("Programs")
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
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("title")}</h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
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
                    <h2 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t("activeProgram")}</h2>
                </div>

                {loading ? (
                    <div className="h-24 rounded-lg bg-muted/50 animate-pulse" />
                ) : activeProgram ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ProgramCard program={activeProgram} onRefresh={loadPrograms} />
                    </div>
                ) : (
                    <div className="p-6 rounded-lg border border-dashed border-border text-center">
                        <p className="text-muted-foreground text-sm">{t("noActiveProgram")}</p>
                    </div>
                )}
            </section>

            {/* History Section */}
            <section>
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("history")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastPrograms.map(p => (
                        <ProgramCard key={p.id} program={p} onRefresh={loadPrograms} />
                    ))}
                </div>
                {!loading && pastPrograms.length === 0 && (
                    <p className="text-xs text-muted-foreground">{t("noPastPrograms")}</p>
                )}
            </section>

            <ProgramDrawer mode="create" onSuccess={loadPrograms} />
        </div>
    )
}
