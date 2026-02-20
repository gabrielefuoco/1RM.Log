"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"

interface HeaderState {
    title?: string
    subtitle?: string
    actions?: React.ReactNode
}

interface HeaderContextType extends HeaderState {
    setHeader: (config: HeaderState) => void
    clearHeader: () => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<HeaderState>({})
    const pathname = usePathname()

    // Reset header on navigation
    // This ensures that if a page doesn't set a header, it doesn't show the previous page's header
    useEffect(() => {
        setState({})
    }, [pathname])

    const setHeader = useCallback((config: HeaderState) => {
        setState(config)
    }, [])

    const clearHeader = useCallback(() => {
        setState({})
    }, [])

    return (
        <HeaderContext.Provider value={{ ...state, setHeader, clearHeader }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (context === undefined) {
        throw new Error("useHeader must be used within a HeaderProvider")
    }
    return context
}
