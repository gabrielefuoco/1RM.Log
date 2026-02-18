import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculate1RM(weight: number, reps: number) {
    if (reps === 1) return weight
    return Math.round(weight * (1 + reps / 30))
}
