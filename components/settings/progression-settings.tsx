"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const progressionSchema = z.object({
    progression_rate: z.number().min(0.005).max(0.10), // 0.5% to 10%
    deload_rate: z.number().min(0.05).max(0.20), // 5% to 20%
    target_rir: z.number().min(0).max(5),
    enable_auto_progression: z.boolean(),
})

type ProgressionFormValues = z.infer<typeof progressionSchema>

export function ProgressionSettings() {
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const form = useForm<ProgressionFormValues>({
        resolver: zodResolver(progressionSchema),
        defaultValues: {
            progression_rate: 0.025,
            deload_rate: 0.10,
            target_rir: 2,
            enable_auto_progression: true,
        },
    })

    useEffect(() => {
        async function loadSettings() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('progression_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (data) {
                form.reset({
                    progression_rate: Number(data.progression_rate),
                    deload_rate: Number(data.deload_rate),
                    target_rir: data.target_rir,
                    enable_auto_progression: data.enable_auto_progression,
                })
            }
            setIsLoading(false)
        }
        loadSettings()
    }, [form, supabase])

    async function onSubmit(data: ProgressionFormValues) {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error("User not found")
            return
        }

        const { error } = await supabase
            .from('progression_settings')
            .upsert({
                user_id: user.id,
                ...data,
                updated_at: new Date().toISOString(),
            })

        setIsLoading(false)

        if (error) {
            toast.error("Errore nel salvataggio")
        } else {
            toast.success("Impostazioni aggiornate!")
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle className="font-heading uppercase text-xl">Il Cervello (AI Config)</CardTitle>
                <CardDescription>
                    Configura come l'algoritmo deve suggerirti i carichi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        <FormField
                            control={form.control}
                            name="enable_auto_progression"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 border-border/30 bg-secondary/5">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-bold">Auto-Progression</FormLabel>
                                        <FormDescription>
                                            Lascia che l'app suggerisca il peso per il prossimo workout.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="target_rir"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RIR Target (Buffer)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <Slider
                                                    min={0}
                                                    max={5}
                                                    step={1}
                                                    value={[field.value]}
                                                    onValueChange={(val) => field.onChange(val[0])}
                                                    className="flex-1"
                                                />
                                                <span className="font-mono text-xl font-bold text-primary w-8 text-center">{field.value}</span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Quante ripetizioni in riserva vuoi tenere (0 = Cedimento, 3 = Buffer Ampio).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="progression_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aggressività (%)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <Slider
                                                    min={0.005}
                                                    max={0.10}
                                                    step={0.005}
                                                    value={[field.value]}
                                                    onValueChange={(val) => field.onChange(val[0])}
                                                    className="flex-1"
                                                />
                                                <span className="font-mono text-xl font-bold text-primary w-16 text-center">
                                                    {(field.value * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Di quanto aumentare il carico quando l'esercizio è "facile".
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salva Configurazione"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
