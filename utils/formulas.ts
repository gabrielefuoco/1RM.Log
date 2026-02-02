/**
 * Calculates the One Rep Max (1RM) using the Epley formula.
 * Formula: Weight * (1 + Reps / 30)
 * 
 * @param weight The weight lifted in kg
 * @param reps The number of repetitions performed
 * @returns The estimated 1RM rounded to 1 decimal place
 */
export function calculate1RM(weight: number, reps: number): number {
    if (reps === 0) return 0;
    if (reps === 1) return weight;

    const oneRm = weight * (1 + reps / 30);
    return Math.round(oneRm * 10) / 10;
}

/**
 * Calculates the RPE (Rate of Perceived Exertion) from RIR (Reps In Reserve).
 * Formula: 10 - RIR
 * @param rir Reps In Reserve
 * @returns RPE value (e.g. RIR 2 -> RPE 8)
 */
export function rirToRpe(rir: number): number {
    return 10 - rir;
}
