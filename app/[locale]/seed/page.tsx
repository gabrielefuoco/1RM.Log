
"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function SeedPage() {
    const [status, setStatus] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const seed = async () => {
        setLoading(true)
        setStatus("Starting...")

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setStatus("Error: Not logged in")
                setLoading(false)
                return
            }

            const USER_ID = user.id
            setStatus(`Authenticated as: ${user.email}.`)

            const log = (msg: string) => {
                console.log(msg)
                setStatus(prev => prev + "\n" + msg)
            }

            log("Cleaning existing PPL data...")
            // Delete sessions first to avoid FK issues
            await supabase.from('workout_sessions').delete().eq('user_id', USER_ID)
            await supabase.from('programs').delete().eq('user_id', USER_ID)
            await supabase.from('bodyweight_logs').delete().eq('user_id', USER_ID)

            const startDate = new Date()
            startDate.setDate(startDate.getDate() - 60)

            log("Creating Program...")
            const { data: program, error: pError } = await supabase.from('programs').insert({
                user_id: USER_ID,
                name: 'PPL Industrial Intensity',
                description: 'Mock data for 2 months of PPL training.',
                is_active: true,
                start_date: startDate.toISOString().split('T')[0]
            }).select().single()

            if (pError) throw new Error(`Program Error: ${pError.message}`)
            log(`Program created: ${program.id}`)

            const templatesData = [
                { name: 'Push (Chest/Shoulders/Triceps)', order: 0, program_id: program.id },
                { name: 'Pull (Back/Rear Delts/Biceps)', order: 1, program_id: program.id },
                { name: 'Legs (Quads/Hams/Calves)', order: 2, program_id: program.id }
            ]
            const { data: templates, error: tError } = await supabase.from('workout_templates').insert(templatesData).select()
            if (tError) throw new Error(`Templates Error: ${tError.message}`)
            log(`Templates created: ${templates.length}`)

            const pushEx = [
                { id: 'ea963a81-d1a7-4af0-9773-648e657a04f8', baseWeight: 60 },
                { id: '179d14f8-a398-4589-9fe1-fe6ec7cd12e5', baseWeight: 40 },
                { id: '5017be5f-86cd-466b-8d45-9c5d5f31e194', baseWeight: 15 },
                { id: '02f6b0ee-a13c-47bc-b26f-5dcf22531e3e', baseWeight: 10 },
                { id: 'bce10408-341c-46b1-8fef-9802f175d167', baseWeight: 20 },
                { id: '4bf4586c-7110-47dc-ae07-bf7a1d22f5ff', baseWeight: 12.5 }
            ]

            const pullEx = [
                { id: '8984a3f1-74e2-4739-9f31-e944226462a0', baseWeight: 0 },
                { id: 'ec3c9419-848b-4507-b2f0-91aa74038b66', baseWeight: 50 },
                { id: 'a1d83ad2-725f-4adf-ae59-b5127d39ce43', baseWeight: 45 },
                { id: 'd83131d3-758f-4d51-8b2d-1d4fa25fe4e4', baseWeight: 15 },
                { id: '130cc4e1-f830-413d-96d5-d51ab0e59003', baseWeight: 25 },
                { id: 'ab90b85d-f549-4697-b358-4667276a471a', baseWeight: 12 }
            ]

            const legsEx = [
                { id: '62dcf790-b541-44c3-a080-46aa47ae4337', baseWeight: 80 },
                { id: '7d3f4873-014e-4c71-8cba-67d60c396aac', baseWeight: 70 },
                { id: 'd3dc07db-3344-4d14-9c79-d4616ae27ccd', baseWeight: 150 },
                { id: '3b646a63-14ad-4f75-a7c1-b565f1bc379a', baseWeight: 40 },
                { id: 'bc2d83e1-ffb2-4e0f-bcb0-53a74bd4a891', baseWeight: 40 },
                { id: '40a22958-8c33-48d8-a2c1-eb528d3e2f6f', baseWeight: 50 }
            ]

            const groupEx = [pushEx, pullEx, legsEx]

            log("Linking exercises and POPULATING SETS...")
            for (let i = 0; i < 3; i++) {
                const templateExToInsert = groupEx[i].map((ex, idx) => ({
                    workout_template_id: templates![i].id,
                    exercise_id: ex.id,
                    target_sets: 3,
                    target_reps_min: 8,
                    target_reps_max: 12,
                    target_rir: 2,
                    order: idx,
                    sets_data: [
                        { reps_min: 8, reps_max: 12, rir: 2, weight_mode: 'absolute', weight_absolute: ex.baseWeight },
                        { reps_min: 8, reps_max: 12, rir: 2, weight_mode: 'absolute', weight_absolute: ex.baseWeight },
                        { reps_min: 8, reps_max: 12, rir: 2, weight_mode: 'absolute', weight_absolute: ex.baseWeight }
                    ]
                }))
                const { error: teError } = await supabase.from('template_exercises').insert(templateExToInsert)
                if (teError) throw new Error(`Exercise Link Error: ${teError.message}`)
            }
            log("Exercises and sets linked successfully.")

            log("Generating 8 weeks of historical data...")
            let bodyweight = 80

            for (let week = 0; week < 8; week++) {
                for (let day = 0; day < 3; day++) {
                    const sessionDate = new Date(startDate)
                    sessionDate.setDate(startDate.getDate() + (week * 7) + (day * 2))

                    const template = templates![day]
                    const exercises = groupEx[day]

                    const { data: session, error: sError } = await supabase.from('workout_sessions').insert({
                        user_id: USER_ID,
                        workout_template_id: template.id,
                        date: sessionDate.toISOString(),
                        duration_seconds: 3600 + Math.floor(Math.random() * 1800),
                        session_rpe: 7 + Math.floor(Math.random() * 3),
                        notes: `Week ${week + 1}, Session ${day + 1}`
                    }).select().single()

                    if (sError) throw new Error(`Session Error (W${week}D${day}): ${sError.message}`)

                    if (day === 0) {
                        bodyweight += (Math.random() - 0.4) * 0.2
                        await supabase.from('bodyweight_logs').insert({
                            user_id: USER_ID,
                            weight: parseFloat(bodyweight.toFixed(1)),
                            date: sessionDate.toISOString().split('T')[0]
                        })
                    }

                    const logs = []
                    for (const ex of exercises) {
                        const numSets = 3
                        const progressionFactor = 1 + (week * 0.02)
                        const load = parseFloat((ex.baseWeight * progressionFactor).toFixed(1))

                        for (let s = 1; s <= numSets; s++) {
                            logs.push({
                                session_id: session.id,
                                exercise_id: ex.id,
                                set_number: s,
                                reps: 8 + Math.floor(Math.random() * 5),
                                weight: load,
                                rir: 1 + Math.floor(Math.random() * 3),
                                bodyweight_at_time: parseFloat(bodyweight.toFixed(1))
                            })
                        }
                    }
                    const { error: logErr } = await supabase.from('exercise_logs').insert(logs)
                    if (logErr) throw new Error(`Log Error: ${logErr.message}`)
                }
                setStatus(prev => prev + `\nWeek ${week + 1} generated.`)
            }

            log("--- SUCCESS! ALL SETS POPULATED ---")
        } catch (e: any) {
            console.error(e)
            setStatus(prev => prev + `\nCRITICAL ERROR: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-4 max-w-xl mx-auto">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">PPL Data Seeder V2 (Fixed Sets)</h1>
            <p className="text-zinc-500">This will clean your history and generate 2 months of mock data with visible sets.</p>

            <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl space-y-4">
                <Button
                    onClick={seed}
                    disabled={loading}
                    className="w-full bg-primary text-background-dark font-black uppercase tracking-widest h-12"
                >
                    {loading ? "Generazione in corso..." : "Start Seeding"}
                </Button>

                {status && (
                    <div className="p-4 bg-black/50 rounded-xl border border-white/5 font-mono text-xs text-primary whitespace-pre-wrap">
                        {status}
                    </div>
                )}
            </div>
        </div>
    )
}
