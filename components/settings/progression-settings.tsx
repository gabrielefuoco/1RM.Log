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
    max_plate_weight: z.number().min(5).max(50),
    enable_auto_progression: z.boolean(),
    intensity_type: z.enum(['RIR', 'RPE']),
    rounding_increment: z.number(),
    one_rm_update_policy: z.enum(['manual', 'confirm', 'auto']),
    sex: z.enum(['male', 'female']),
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
            max_plate_weight: 20,
            intensity_type: 'RIR',
            sex: 'male',
            rounding_increment: 2.5,
            one_rm_update_policy: 'confirm',
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
                    max_plate_weight: data.max_plate_weight || 20,
                    intensity_type: data.intensity_type || 'RIR',
                    sex: data.sex || 'male',
                    rounding_increment: Number(data.rounding_increment) || 2.5,
                    one_rm_update_policy: data.one_rm_update_policy || 'confirm',
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

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="enable_auto_progression"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 border-border/30 bg-secondary/5 h-full">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-bold">Auto-Progression</FormLabel>
                                            <FormDescription className="text-xs">
                                                Suggerimenti automatici.
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

                            <FormField
                                control={form.control}
                                name="one_rm_update_policy"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-between rounded-lg border p-4 border-border/30 bg-secondary/5 h-full">
                                        <div className="space-y-0.5 mb-3">
                                            <FormLabel className="text-base font-bold">Aggiornamento 1RM</FormLabel>
                                            <FormDescription className="text-xs">
                                                Come gestire i nuovi record.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <div className="flex bg-secondary/10 p-1 rounded-md">
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'auto' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 text-[10px] font-bold px-1"
                                                    onClick={() => field.onChange('auto')}
                                                >
                                                    AUTO
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'confirm' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 text-[10px] font-bold px-1"
                                                    onClick={() => field.onChange('confirm')}
                                                >
                                                    CHIEDI
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'manual' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 text-[10px] font-bold px-1"
                                                    onClick={() => field.onChange('manual')}
                                                >
                                                    MANUALE
                                                </Button>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="intensity_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo di Intensità</FormLabel>
                                        <FormControl>
                                            <div className="flex bg-secondary/10 p-1 rounded-md">
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'RIR' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 font-bold"
                                                    onClick={() => field.onChange('RIR')}
                                                >
                                                    RIR (Riserva)
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'RPE' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 font-bold"
                                                    onClick={() => field.onChange('RPE')}
                                                >
                                                    RPE (Sforzo 1-10)
                                                </Button>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sex"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sesso Biologico</FormLabel>
                                        <FormControl>
                                            <div className="flex bg-secondary/10 p-1 rounded-md">
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'male' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 font-bold uppercase"
                                                    onClick={() => field.onChange('male')}
                                                >
                                                    Uomo
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={field.value === 'female' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className="flex-1 font-bold uppercase"
                                                    onClick={() => field.onChange('female')}
                                                >
                                                    Donna
                                                </Button>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="rounding_increment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Arrotondamento (kg)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {[0.5, 1, 1.25, 2.5, 5].map((val) => (
                                                    <Button
                                                        key={val}
                                                        type="button"
                                                        variant={field.value === val ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => field.onChange(val)}
                                                        className="font-mono font-bold"
                                                    >
                                                        {val}
                                                    </Button>
                                                ))}
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Incremento minimo per i calcoli.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="max_plate_weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Disco Max (kg)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <Slider
                                                    min={5}
                                                    max={25}
                                                    step={5}
                                                    value={[field.value]}
                                                    onValueChange={(val) => field.onChange(val[0])}
                                                    className="flex-1"
                                                />
                                                <span className="font-mono text-xl font-bold text-primary w-12 text-center">
                                                    {field.value}
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Il disco più pesante disponibile.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="target_rir"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RIR Target Default</FormLabel>
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
                                            Buffer predefinito se non specificato.
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
                                            Incremento carico quando è facile.
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
