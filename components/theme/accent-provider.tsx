"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type AccentColor = "green" | "blue" | "violet" | "orange" | "red" | "rose" | "yellow"

export const ACCENT_COLORS: Record<AccentColor, string> = {
    green: "#10b981",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    rose: "#f43f5e",
    yellow: "#eab308",
}

interface AccentContextType {
    accent: AccentColor
    setAccent: (accent: AccentColor) => void
}

const AccentContext = createContext<AccentContextType | undefined>(undefined)

export function AccentProvider({ children }: { children: React.ReactNode }) {
    const [accent, setAccent] = useState<AccentColor>("green")

    // Load from local storage
    useEffect(() => {
        const savedAccent = localStorage.getItem("1rm-accent-color") as AccentColor
        if (savedAccent) {
            setAccent(savedAccent)
        }
    }, [])

    // Apply to document
    useEffect(() => {
        const root = document.documentElement
        root.setAttribute("data-accent", accent)
        localStorage.setItem("1rm-accent-color", accent)
    }, [accent])

    return (
        <AccentContext.Provider value={{ accent, setAccent }}>
            {children}
        </AccentContext.Provider>
    )
}

export function useAccent() {
    const context = useContext(AccentContext)
    if (context === undefined) {
        throw new Error("useAccent must be used within an AccentProvider")
    }
    return context
}
