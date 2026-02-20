"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { startSession } from "@/services/workout"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function StartWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id: templateId } = use(params)

    useEffect(() => {
        const init = async () => {
            try {
                // Determine if we are starting a template or resuming?
                // This route is specifically for STARTING a workout from a template ID.
                const sId = await startSession(templateId)
                router.replace(`/workout/session/${sId}`)
            } catch (e) {
                console.error(e)
                toast.error("Errore avvio allenamento")
                router.back()
            }
        }
        init()
    }, [templateId, router])

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Avvio allenamento...</p>
        </div>
    )
}
