"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronRight, Play, MoreVertical } from "lucide-react"
import { ReactNode } from "react"

export interface UniversalListCardProps {
    title: string
    subtitle?: ReactNode
    index?: number
    isActive?: boolean

    // Slots
    children?: ReactNode // Main content area (e.g. preview list, tables)
    actions?: ReactNode // Custom actions area (e.g. context menu)

    // Primary Action (e.g. Navigate or Play)
    onPrimaryAction?: () => void
    primaryActionIcon?: ReactNode

    // Navigation / Click
    onClick?: () => void

    // Style overrides
    className?: string
    isCompact?: boolean
    headerExtra?: ReactNode
    icon?: ReactNode
}

export function UniversalListCard({
    title,
    subtitle,
    index,
    isActive = false,
    children,
    actions,
    onPrimaryAction,
    primaryActionIcon = <Play className="h-5 w-5 fill-current" />,
    onClick,
    className,
    isCompact = false,
    headerExtra,
    icon,
    dragHandle
}: UniversalListCardProps & { dragHandle?: ReactNode }) {

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 group cursor-pointer",
                // Base Styles
                "bg-card/40 backdrop-blur-md border border-border/40",
                // Hover Effects
                "hover:bg-card/60 hover:border-primary/20",
                // Active State
                isActive && "border-primary/40 bg-primary/[0.05] shadow-[0_0_30px_-5px_rgba(0,255,163,0.1)]",
                className
            )}
            onClick={onClick}
        >
            {/* Active Glow/Indicator Line */}
            <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-colors duration-300",
                isActive ? "bg-primary" : "bg-border/40 group-hover:bg-primary/50"
            )} />

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <CardContent className={cn(
                isCompact ? "p-3 pl-5 gap-2.5" : "p-4 pl-6 gap-3",
                "flex flex-col"
            )}>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Drag Handle */}
                        {dragHandle && (
                            <div className="shrink-0 text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing -ml-2 mr-1">
                                {dragHandle}
                            </div>
                        )}

                        {/* Index / Icon Box */}
                        {(icon || index !== undefined) && (
                            <div className={cn(
                                "flex flex-col items-center justify-center shrink-0 font-heading font-bold shadow-inner transition-colors rounded-xl border",
                                isCompact ? "h-10 w-10 text-base" : "h-12 w-12 text-lg",
                                isActive
                                    ? "bg-primary/20 border-primary/30 text-primary"
                                    : "bg-muted border-border/40 text-muted-foreground group-hover:text-foreground"
                            )}>
                                {icon ? icon : (index! + 1).toString().padStart(2, '0')}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            {/* Title - Large & Heading Font as requested */}
                            <h3 className={cn(
                                "font-heading uppercase tracking-tight leading-tight mb-0.5 transition-colors truncate",
                                isCompact ? "text-lg md:text-xl" : "text-xl md:text-2xl",
                                isActive ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]" : "text-foreground group-hover:text-primary/90"
                            )}>
                                {title}
                            </h3>

                            {/* Subtitle / Meta */}
                            <div className="text-xs text-muted-foreground font-medium truncate">
                                {subtitle}
                            </div>
                        </div>
                    </div>

                    {/* New Header Extra Slot (e.g. Trendline) */}
                    {headerExtra && (
                        <div className="flex flex-1 justify-center px-4 self-center min-w-[80px]">
                            {headerExtra}
                        </div>
                    )}

                    {/* Actions Area */}
                    <div className="flex items-center gap-1 shrink-0 z-10">
                        {onPrimaryAction && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "transition-all duration-300 rounded-full",
                                    isCompact ? "h-8 w-8" : "h-10 w-10",
                                    "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,255,163,0.4)]",
                                    "hover:bg-primary-foreground hover:text-primary hover:scale-110"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onPrimaryAction()
                                }}
                            >
                                {primaryActionIcon}
                            </Button>
                        )}

                        {actions && (
                            <div onClick={(e) => e.stopPropagation()}>
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Slot (Collapsible or Block) */}
                {children && (
                    <div className="border-t border-border/40">
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
