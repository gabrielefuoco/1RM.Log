"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { login, signup } from "../actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        // Check which button was clicked or logic based on a hidden field?
        // Actually, this is just Login page.

        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        } else {
            // Redirect happens in server action usually, but if not:
            // router.push('/')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-dark">
            {/* Logo Area */}
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="relative flex flex-col items-center">
                    <h1 className="text-5xl font-bold tracking-tighter text-primary">1RM</h1>
                    <p className="text-white font-bold tracking-tight mt-2">LOGBOOK</p>
                </div>
            </div>

            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-white">Bentornato</h1>
                    <p className="text-slate-400">Inserisci le tue credenziali per accedere</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            name="email"
                            className="bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary"
                            placeholder="Email"
                            type="email"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            name="password"
                            className="bg-zinc-900/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-primary"
                            placeholder="Password"
                            type="password"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary text-background-dark font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "ACCEDI"}
                    </Button>
                </form>

                <div className="text-center text-sm text-slate-400">
                    Non hai un account?{" "}
                    <Link href="/register" className="text-primary hover:underline font-bold">
                        Registrati
                    </Link>
                </div>
            </div>
        </div>
    )
}
