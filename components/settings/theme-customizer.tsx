"use client"

import { Check } from "lucide-react"
import { useAccent, type AccentColor } from "@/components/theme/accent-provider"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const accentColors: { value: AccentColor; label: string; color: string }[] = [
    { value: "green", label: "Green", color: "#10b981" },
    { value: "blue", label: "Blue", color: "#3b82f6" },
    { value: "violet", label: "Violet", color: "#8b5cf6" },
    { value: "orange", label: "Orange", color: "#f97316" },
    { value: "red", label: "Red", color: "#ef4444" },
    { value: "rose", label: "Rose", color: "#f43f5e" },
    { value: "yellow", label: "Yellow", color: "#eab308" },
]

export function ThemeCustomizer() {
    const { accent, setAccent } = useAccent()
    // const t = useTranslations("Settings") // Keeping it simple for now, can add translations later

    return (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {accentColors.map((color) => (
                <button
                    key={color.value}
                    onClick={() => setAccent(color.value)}
                    className={cn(
                        "group relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-medium transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                        accent === color.value
                            ? "border-primary" // Use primary which should match the selected accent
                            : "border-transparent hover:border-muted-foreground/30"
                    )}
                    style={{
                        // We can't easily use the variable here because it changes. 
                        // So we use the hardcoded color for the swatch itself, 
                        // but the border above uses the active theme primary.
                    }}
                    title={color.label}
                >
                    <span
                        className="flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: color.color }}
                    >
                        {accent === color.value && (
                            <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                    </span>
                    <span className="sr-only">{color.label}</span>
                </button>
            ))}
        </div>
    )
}
