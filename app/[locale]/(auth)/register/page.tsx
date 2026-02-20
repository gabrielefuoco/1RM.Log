"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { signup } from "../actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log("Registration form submitted")
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const formData = new FormData(e.currentTarget)
            const res = await signup(formData)

            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess(true)
            }
        } catch (err) {
            console.error("Registration error:", err)
            setError("Si è verificato un errore imprevisto. Riprova più tardi.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-center">
                <h1 className="text-3xl font-bold text-primary mb-4">Controlla la tua email</h1>
                <p className="text-muted-foreground mb-8">Ti abbiamo inviato un link per confermare la registrazione.</p>
                <Link href="/login">
                    <Button className="bg-muted/50 hover:bg-muted/70 text-foreground">Torna al Login</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
            <div className="relative mb-8 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="relative flex flex-col items-center">
                    <h1 className="text-5xl font-bold tracking-tighter text-primary">1RM</h1>
                    <p className="text-foreground font-bold tracking-tight mt-2">REGISTRAZIONE</p>
                </div>
            </div>

            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-foreground">Crea Account</h1>
                    <p className="text-muted-foreground">Inizia il tuo viaggio.</p>
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
                            className="bg-card border-border text-foreground h-12 rounded-xl focus-visible:ring-primary"
                            placeholder="Email"
                            type="email"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Input
                            name="password"
                            className="bg-card border-border text-foreground h-12 rounded-xl focus-visible:ring-primary"
                            placeholder="Password (min 6 caratteri)"
                            type="password"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary text-primary-foreground font-bold text-lg rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "REGISTRATI"}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    Hai già un account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-bold">
                        Accedi
                    </Link>
                </div>
            </div>
        </div>
    )
}
