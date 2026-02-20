"use client"

import { Link } from "@/i18n/routing"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ChartNoAxesCombined, BookOpen, History, Settings, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function DesktopSidebar() {
    const pathname = usePathname()
    const t = useTranslations("Navigation")

    const navItems = [
        {
            name: t("home"),
            href: "/",
            icon: LayoutDashboard,
        },
        {
            name: t("analysis"),
            href: "/analysis",
            icon: ChartNoAxesCombined,
        },
        {
            name: t("programs"),
            href: "/programs",
            icon: BookOpen,
        },
        {
            name: t("history"),
            href: "/history",
            icon: History,
        },
        {
            name: t("exercises"),
            href: "/exercises",
            icon: Dumbbell,
        },
        {
            name: t("settings"),
            href: "/settings",
            icon: Settings,
        },
    ]

    return (
        <div className="hidden lg:flex h-screen w-72 flex-col fixed left-0 top-0 border-r border-border bg-background shadow-lg z-50">
            {/* Logo Area */}
            <div className="p-8 pb-4">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
                        <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-2xl tracking-tighter leading-none text-foreground">
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
                <p className="px-4 text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    {t("menu")}
                </p>
                {navItems.map((item) => {
                    // Normalize pathname and href for comparison
                    const currentPath = pathname || "/"
                    const itemHref = item.href === "/" ? "/" : item.href

                    // Simple check for active state
                    const isActive = itemHref === "/"
                        ? (currentPath === "/" || currentPath.match(/^\/(en|it)\/?$/))
                        : (currentPath.includes(itemHref))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                            )}
                        >
                            {/* Neon Indicator for Active */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-sm shadow-primary/80" />
                            )}

                            <item.icon
                                className={cn(
                                    "h-5 w-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-primary filter drop-shadow-[0_0_5px_var(--primary)]" : "text-muted-foreground group-hover:text-foreground"
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
