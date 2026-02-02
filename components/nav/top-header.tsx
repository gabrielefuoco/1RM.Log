"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { useProfile } from "@/hooks/use-profile"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings as SettingsIcon, BookOpen } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/app/(auth)/actions"

export function TopHeader() {
    const { data: profile, isLoading } = useProfile()

    const today = format(new Date(), "EEEE d MMMM", { locale: it })

    // Get initials for avatar fallback
    const getInitials = (name: string | null | undefined) => {
        if (!name) return "U"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <header className="flex items-center justify-between px-6 py-6 pt-12 border-b border-border/10 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
            <div>
                <p className="text-xs font-mono font-bold uppercase tracking-widest text-primary/80 mb-1">
                    {today}
                </p>
                {isLoading ? (
                    <Skeleton className="h-9 w-48" />
                ) : (
                    <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground uppercase">
                        Ciao, <span className="text-white">{profile?.full_name?.split(' ')[0] || "Atleta"}</span>
                    </h1>
                )}
            </div>
            {isLoading ? (
                <Skeleton className="h-12 w-12 rounded-md" />
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-11 w-11 border border-border/30 rounded-md cursor-pointer hover:border-primary transition-colors">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                            <AvatarFallback className="bg-card text-primary font-heading font-bold text-lg rounded-md">
                                {getInitials(profile?.full_name)}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-border/20 rounded-lg">
                        <DropdownMenuLabel className="font-heading uppercase tracking-wide">Il mio account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer w-full flex items-center font-sans">
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                <span>Impostazioni</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/exercises" className="cursor-pointer w-full flex items-center font-sans">
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Gestione Esercizi</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-sans"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Esci</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </header>
    )
}
