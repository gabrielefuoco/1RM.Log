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
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-0 pointer-events-none flex justify-center">
            <nav className="pointer-events-auto w-full max-w-md bg-card border border-border/20 rounded-2xl pb-2 pt-2 px-6 flex items-center justify-between mb-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    if (item.isFab) {
                        return (
                            <div key={item.name} className="relative -top-6 group flex items-center justify-center">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex h-16 w-16 items-center justify-center rounded-xl transition-transform active:scale-95 text-background",
                                        "bg-primary border-4 border-background",
                                        "shadow-[0_0_20px_rgba(0,255,163,0.4)] hover:shadow-[0_0_30px_rgba(0,255,163,0.6)] hover:rotate-3 transition-all duration-300"
                                    )}
                                >
                                    <item.icon className="h-8 w-8 text-black" strokeWidth={2.5} />
                                </Link>
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 group",
                                isActive ? "opacity-100" : "opacity-50 hover:opacity-100"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-6 w-6 transition-colors",
                                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]" : "text-foreground"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] uppercase font-heading font-bold tracking-wider transition-colors",
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
