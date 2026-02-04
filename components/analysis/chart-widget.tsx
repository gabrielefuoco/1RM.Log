"use client"

import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChartWidgetProps {
    title: string
    subtitle?: string
    icon?: React.ReactNode
    infoTooltip?: string
    children: React.ReactNode
    className?: string
    headerAction?: React.ReactNode
}

export function ChartWidget({
    title,
    subtitle,
    icon,
    infoTooltip,
    children,
    className,
    headerAction
}: ChartWidgetProps) {
    return (
        <div className={cn("bg-card border border-border rounded-lg p-6 flex flex-col h-full hover:border-primary/30 transition-colors duration-300", className)}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                    {icon && <div className="text-primary mt-0.5">{icon}</div>}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading text-lg uppercase tracking-tight leading-none text-foreground/90">
                                {title}
                            </h3>
                            {infoTooltip && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="size-3.5 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-popover border-border text-xs max-w-[200px]">
                                            <p>{infoTooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground font-mono mt-1 uppercase tracking-wider opacity-70">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {headerAction && <div>{headerAction}</div>}
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                {children}
            </div>
        </div>
    )
}
