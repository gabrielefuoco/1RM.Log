"use client"

import { useEffect, useState } from "react"
import { getExercises, createExercise } from "@/services/exercises"
import { Exercise } from "@/types/database"
import { Button } from "@/components/ui/button"

export default function TestDbPage() {
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)

    const fetchExercises = async () => {
        setLoading(true)
        const data = await getExercises()
        setExercises(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchExercises()
    }, [])

    const handleCreateTest = async () => {
        try {
            await createExercise({
                name: "Test Push Up",
                body_part: "chest",
                type: "bodyweight",
                image_url: null
            })
            fetchExercises()
        } catch (e) {
            alert("Error creating exercise. Are you logged in?")
        }
    }

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Database Connection Test</h1>

            <div className="flex gap-4">
                <Button onClick={fetchExercises}>Refresh List</Button>
                <Button variant="secondary" onClick={handleCreateTest}>Create Test Exercise</Button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-slate-900 p-4 rounded-xl border border-white/10">
                    <pre className="text-xs text-green-400 overflow-auto max-h-[500px]">
                        {JSON.stringify(exercises, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
