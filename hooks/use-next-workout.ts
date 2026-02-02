import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface NextWorkout {
    id: string
    name: string
    programName: string
    order: number
}

export function useNextWorkout() {
    const supabase = createClient()

    return useQuery({
        queryKey: ["next-workout"],
        queryFn: async (): Promise<NextWorkout | null> => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return null

            // Get active program
            const { data: program, error: programError } = await supabase
                .from("programs")
                .select("id, name")
                .eq("user_id", user.id)
                .eq("is_active", true)
                .single()

            if (programError || !program) return null

            // Get last completed session to determine next workout
            const { data: lastSession } = await supabase
                .from("workout_sessions")
                .select("workout_template_id")
                .eq("user_id", user.id)
                .order("date", { ascending: false })
                .limit(1)
                .single()

            // Get all templates for this program
            const { data: templates, error: templatesError } = await supabase
                .from("workout_templates")
                .select("id, name, order")
                .eq("program_id", program.id)
                .order("order", { ascending: true })

            if (templatesError || !templates || templates.length === 0) return null

            // Find next workout template
            let nextTemplate = templates[0] // Default to first

            if (lastSession?.workout_template_id) {
                const lastIndex = templates.findIndex(t => t.id === lastSession.workout_template_id)
                if (lastIndex !== -1) {
                    // Get next template, or wrap around to first
                    nextTemplate = templates[(lastIndex + 1) % templates.length]
                }
            }

            return {
                id: nextTemplate.id,
                name: nextTemplate.name,
                programName: program.name,
                order: nextTemplate.order,
            }
        },
    })
}
