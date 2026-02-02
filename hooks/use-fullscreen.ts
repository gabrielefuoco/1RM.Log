"use client"

import { useState, useEffect, useCallback } from "react"

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false)

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen()
                }
            }
        } catch (error) {
            console.error("Error attempting to toggle full-screen mode:", error)
        }
    }, [])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    return { isFullscreen, toggleFullscreen }
}
