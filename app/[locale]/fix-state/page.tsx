
"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function FixPage() {
    const [status, setStatus] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const fix = async () => {
        setLoading(true)
        setStatus("Starting repair...")
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setStatus("Error: Not logged in")
                return
            }

            // 1. Get all programs
            const { data: progs } = await supabase.from('programs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!progs || progs.length === 0) {
                setStatus("No programs found.")
                return
            }

            setStatus(`Found ${progs.length} programs. Deactivating all...`)

            // 2. Deactivate all
            const { error: dError } = await supabase.from('programs')
                .update({ is_active: false })
                .eq('user_id', user.id)

            if (dError) throw dError

            // 3. Find the best PPL program (the one with exercises if possible, or just the latest)
            // Let's just take the most recent one as we saw in diag it has exercises
            const latestPPL = progs.find(p => p.name.includes("PPL"))
            if (latestPPL) {
                setStatus(`Activating latest PPL program: ${latestPPL.id}`)
                const { error: aError } = await supabase.from('programs')
                    .update({ is_active: true })
                    .eq('id', latestPPL.id)
                if (aError) throw aError
                setStatus("SUCCESS! State repaired. Check your Dashboard now.")
            } else {
                setStatus("No PPL program found to activate.")
            }

        } catch (e: any) {
            setStatus("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-12 space-y-4">
            <h1 className="text-2xl font-bold">Database State Repair</h1>
            <p className="text-zinc-500">This will ensure only ONE program is active and fix dashboard visibility.</p>
            <Button onClick={fix} disabled={loading} className="bg-primary text-black font-bold">
                {loading ? "Fixing..." : "Run Repair"}
            </Button>
            {status && <div className="p-4 bg-zinc-900 border border-white/10 rounded mt-4 font-mono text-xs">{status}</div>}
        </div>
    )
}
