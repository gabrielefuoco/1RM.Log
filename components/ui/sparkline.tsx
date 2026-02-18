"use client"

import { cn } from "@/lib/utils"

interface SparklineProps {
    data?: number[]
    className?: string
    color?: string
}

export function Sparkline({
    data = [],
    className,
    color = "currentColor"
}: SparklineProps) {
    if (!data || data.length < 2) return null

    const width = 100
    const height = 30
    const padding = 4

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1 // Avoid division by zero

    // Simple path generator for a trend line
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding
        const normalizedVal = (val - min) / range
        // Invert Y because SVG coords go down
        const y = height - (normalizedVal * (height - padding * 2) + padding)
        return `${x},${y}`
    }).join(" ")

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={cn("overflow-visible", className)}
            preserveAspectRatio="none"
        >
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="drop-shadow-[0_0_4px_rgba(0,255,163,0.3)]"
            />
            {/* Glow effect duplicate */}
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="opacity-20 blur-[2px]"
            />
        </svg>
    )
}
