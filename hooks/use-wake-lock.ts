"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useWakeLock() {
    const wakeLock = useRef<WakeLockSentinel | null>(null)
    const [isActive, setIsActive] = useState(false)

    const request = useCallback(async () => {
        if (!("wakeLock" in navigator)) {
            console.warn("Screen Wake Lock API not supported")
            return
        }

        try {
            wakeLock.current = await navigator.wakeLock.request("screen")
            setIsActive(true)

            wakeLock.current.addEventListener("release", () => {
                setIsActive(false)
            })

            console.log("Wake Lock is active")
        } catch (err: any) {
            console.error(`${err.name}, ${err.message}`)
        }
    }, [])

    const release = useCallback(async () => {
        if (wakeLock.current) {
            await wakeLock.current.release()
            wakeLock.current = null
            setIsActive(false)
        }
    }, [])

    // Handle visibility change (re-request if tab becomes visible again)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (wakeLock.current !== null && document.visibilityState === "visible") {
                await request()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [request])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wakeLock.current) {
                wakeLock.current.release().catch(console.error)
            }
        }
    }, [])

    return { request, release, isActive }
}
