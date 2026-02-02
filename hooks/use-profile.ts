import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
}

export function useProfile() {
    const supabase = createClient()

    return useQuery({
        queryKey: ["profile"],
        queryFn: async (): Promise<Profile | null> => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return null

            const { data, error } = await supabase
                .from("profiles")
                .select("id, email, full_name, avatar_url")
                .eq("id", user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = "No rows returned" - expected when profile doesn't exist
                console.error("Error fetching profile:", error)
                return null
            }

            return data
        },
    })
}
