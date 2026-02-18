"use client"

import { cn } from "@/lib/utils"

interface AnalysisGridProps {
    children: React.ReactNode
    className?: string
}

export function AnalysisGrid({ children, className }: AnalysisGridProps) {
    return (
        <div className={cn(
            "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 auto-rows-min",
            className
        )}>
            {children}
        </div>
    )
}

export function AnalysisGridItem({
    children,
    className,
    colSpan = 6
}: {
    children: React.ReactNode,
    className?: string,
    colSpan?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12
}) {
    // Map numerical span to tailwind class
    const spanClass = {
        3: "lg:col-span-3",
        4: "lg:col-span-4",
        5: "lg:col-span-5",
        6: "lg:col-span-6",
        7: "lg:col-span-7",
        8: "lg:col-span-8",
        9: "lg:col-span-9",
        12: "lg:col-span-12",
    }[colSpan]

    const isWide = colSpan >= 8

    return (
        <div className={cn(
            "col-span-1",
            isWide ? "md:col-span-2" : "md:col-span-1",
            spanClass,
            className
        )}>
            {children}
        </div>
    )
}
