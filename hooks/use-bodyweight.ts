import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBodyweightHistory, addBodyweightLog, deleteBodyweightLog } from "@/services/bodyweight"
import { CreateBodyweightInput } from "@/types/database"
import { toast } from "sonner"

export function useBodyweight(limit?: number) {
    const queryClient = useQueryClient()

    const historyQuery = useQuery({
        queryKey: ["bodyweight-history", limit],
        queryFn: () => getBodyweightHistory(limit),
    })

    const latestQuery = useQuery({
        queryKey: ["bodyweight-latest"],
        queryFn: async () => {
            const history = await getBodyweightHistory(1)
            return history[0] || null
        },
    })

    const addMutation = useMutation({
        mutationFn: (input: CreateBodyweightInput) => addBodyweightLog(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bodyweight-history"] })
            queryClient.invalidateQueries({ queryKey: ["bodyweight-latest"] })
            toast.success("Peso registrato")
        },
        onError: () => {
            toast.error("Errore durante la registrazione del peso")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteBodyweightLog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bodyweight-history"] })
            queryClient.invalidateQueries({ queryKey: ["bodyweight-latest"] })
            toast.success("Peso eliminato")
        },
        onError: () => {
            toast.error("Errore durante l'eliminazione")
        },
    })

    return {
        history: historyQuery.data || [],
        isLoading: historyQuery.isLoading,
        latest: latestQuery.data,
        addWeight: addMutation.mutateAsync,
        deleteWeight: deleteMutation.mutateAsync,
        isAdding: addMutation.isPending,
    }
}
