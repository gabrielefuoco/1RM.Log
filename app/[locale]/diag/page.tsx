
"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DiagPage() {
    const [data, setData] = useState<any>(null)
    const supabase = createClient()

    useEffect(() => {
        async function check() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: progs } = await supabase.from('programs').select('*').eq('user_id', user.id)
            const { data: activeProgs } = await supabase.from('programs').select('*').eq('user_id', user.id).eq('is_active', true)

            // Get templates for the latest program
            const latestProg = progs?.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
            let templates = []
            if (latestProg) {
                const { data: t } = await supabase.from('workout_templates').select('*, template_exercises(*)').eq('program_id', latestProg.id)
                templates = t || []
            }

            setData({
                user: user.email,
                totalPrograms: progs?.length,
                activePrograms: activeProgs?.length,
                activeProgDetails: activeProgs,
                latestProgramTemplates: templates
            })
        }
        check()
    }, [])

    return (
        <pre className="p-8 bg-black text-green-500 font-mono text-xs overflow-auto h-screen">
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}
