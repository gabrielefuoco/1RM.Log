"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ChartNoAxesCombined, BookOpen, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
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
            isFab: true,
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
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-0 pointer-events-none flex justify-center">
            <nav className="glass-nav pointer-events-auto w-full max-w-md rounded-2xl pb-2 pt-2 px-6 flex items-center justify-between shadow-2xl relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    if (item.isFab) {
                        return (
                            <div key={item.name} className="relative -top-7 group flex items-center justify-center">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 active:scale-95 text-black",
                                        "bg-primary",
                                        "shadow-[0_8px_20px_rgba(0,255,163,0.4)] hover:shadow-[0_12px_30px_rgba(0,255,163,0.6)] group-hover:-translate-y-1",
                                        "border-4 border-background"
                                    )}
                                >
                                    <item.icon className="h-8 w-8" strokeWidth={2.5} />
                                </Link>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 group relative z-10",
                                isActive ? "opacity-100" : "opacity-40 hover:opacity-100"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.6)] scale-110" : "text-foreground group-hover:scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[9px] uppercase font-heading font-bold tracking-widest transition-colors",
                                isActive ? "text-primary" : "text-foreground"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
