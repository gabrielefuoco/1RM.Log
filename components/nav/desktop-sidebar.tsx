"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ChartNoAxesCombined, BookOpen, History, Settings, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function DesktopSidebar() {
    const pathname = usePathname()

    const navItems = [
        {
            name: "Home",
            href: "/",
            icon: LayoutDashboard,
        },
        {
            name: "Analisi",
            href: "/analytics",
            icon: ChartNoAxesCombined,
        },
        {
            name: "Programmi",
            href: "/programs",
            icon: BookOpen,
        },
        {
            name: "Storico",
            href: "/history",
            icon: History,
        },
        {
            name: "Config",
            href: "/settings",
            icon: Settings,
        },
    ]

    return (
        <div className="hidden lg:flex h-screen w-72 flex-col fixed left-0 top-0 border-r border-white/5 bg-background shadow-[1px_0_30px_rgba(0,0,0,0.5)] z-50">
            {/* Logo Area */}
            <div className="p-8 pb-4">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                        <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-2xl tracking-tighter leading-none text-white">
                            1RM<span className="text-primary">.LOG</span>
                        </h1>
                        <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase font-mono">
                            Industrial Strength
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                <p className="px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">
                    Menu
                </p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            {/* Neon Indicator for Active */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,163,0.8)]" />
                            )}

                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-primary drop-shadow-[0_0_5px_rgba(0,255,163,0.5)]" : "text-slate-500 group-hover:text-white"
                                )}
                            />
                            <span className="font-heading font-bold tracking-wide uppercase text-sm">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>


        </div>
    )
}
