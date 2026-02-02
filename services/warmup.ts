export interface WarmupSet {
    set_number: number
    weight: number
    reps: number
    label: string
    set_type: 'warmup'
}

export class WarmupCalculator {
    /**
     * Calculates warmup sets based on target weight.
     * Standard protocol:
     * 1. 50% x 10 (Feeder)
     * 2. 70% x 6 (Transition)
     * 3. 90% x 2 (Primer)
     */
    static calculate(targetWeight: number): WarmupSet[] {
        if (targetWeight <= 0) return []

        // Round to nearest 1.25 or 2.5 depends on gym, let's use 2.5 as safe default
        const round = (w: number) => Math.round(w / 2.5) * 2.5

        return [
            {
                set_number: 1,
                weight: Math.max(0, round(targetWeight * 0.5)),
                reps: 10,
                label: "50% - Mobilità",
                set_type: 'warmup'
            },
            {
                set_number: 2,
                weight: Math.max(0, round(targetWeight * 0.7)),
                reps: 6,
                label: "70% - Transizione",
                set_type: 'warmup'
            },
            {
                set_number: 3,
                weight: Math.max(0, round(targetWeight * 0.9)),
                reps: 2,
                label: "90% - Primer",
                set_type: 'warmup'
            }
        ]
    }
}
