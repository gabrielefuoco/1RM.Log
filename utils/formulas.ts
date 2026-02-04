/**
 * Calculates the One Rep Max (1RM) using the Epley formula.
 * Formula: Weight * (1 + Reps / 30)
 * 
 * @param weight The weight lifted in kg
 * @param reps The number of repetitions performed
 * @param bodyweight Optional bodyweight for relative calisthenics (e.g. Pullups)
 * @param isBodyweightExercise If true, adds bodyweight to calculation
 * @returns The estimated 1RM rounded to 1 decimal place
 */
export function calculate1RM(
    weight: number,
    reps: number,
    bodyweight: number = 0,
    isBodyweightExercise: boolean = false
): number {
    if (reps === 0) return 0;
    const effectiveWeight = isBodyweightExercise ? (weight + bodyweight) : weight;

    if (reps === 1) return effectiveWeight;

    const oneRm = effectiveWeight * (1 + reps / 30);
    return Math.round(oneRm * 10) / 10;
}

/**
 * Calculates the RPE (Rate of Perceived Exertion) from RIR (Reps In Reserve).
 * Formula: 10 - RIR
 */
export function rirToRpe(rir: number): number {
    return 10 - rir;
}

/**
 * Calculates the RIR (Reps In Reserve) from RPE (Rate of Perceived Exertion).
 * Formula: 10 - RPE
 */
export function rpeToRir(rpe: number): number {
    return 10 - rpe;
}

/**
 * DOTS Points Formula
 * Reference: https://www.powerlifting.sport/fileadmin/ipf/data/rules/technical-rules/english/IPF_Technical_Rules_Book_2023.pdf (and common powerlifting resources)
 */
export function calculateDOTS(total: number, bodyweight: number, sex: 'male' | 'female'): number {
    if (bodyweight <= 0) return 0;
    const bw = bodyweight;

    const coeff = sex === 'male'
        ? {
            a: -0.000001093,
            b: 0.0007391293,
            c: -0.1918759221,
            d: 24.09007561,
            e: -307.75076
        }
        : {
            a: -0.0000010706,
            b: 0.0005158568,
            c: -0.1126651936,
            d: 13.6175032,
            e: -57.96288
        };

    const denominator = (coeff.a * Math.pow(bw, 4)) + (coeff.b * Math.pow(bw, 3)) + (coeff.c * Math.pow(bw, 2)) + (coeff.d * bw) + coeff.e;
    return Math.round((total * 500 / denominator) * 100) / 100;
}

/**
 * Wilks Points Formula (2020 revision or classic)
 * Note: Wilks is less common now but still used in some gyms.
 */
export function calculateWilks(total: number, bodyweight: number, sex: 'male' | 'female'): number {
    if (bodyweight <= 0) return 0;
    const x = bodyweight;

    const c = sex === 'male'
        ? [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-06, -1.291e-08]
        : [594.3174777, -27.23842536, 0.8211222687, -0.0093073391, 4.731582e-05, -9.054e-08];

    const denominator = c[0] + (c[1] * x) + (c[2] * Math.pow(x, 2)) + (c[3] * Math.pow(x, 3)) + (c[4] * Math.pow(x, 4)) + (c[5] * Math.pow(x, 5));
    return Math.round((total * 500 / denominator) * 100) / 100;
}

/**
 * IPF GL Points Formula
 */
export function calculateIPFGL(total: number, bodyweight: number, sex: 'male' | 'female'): number {
    if (bodyweight <= 0) return 0;
    const bw = bodyweight;

    const c = sex === 'male'
        ? { a: 1199.72839, b: 1025.18162, c: 0.00921 }
        : { a: 610.32796, b: 1045.59282, c: 0.03048 };

    // GL Formula: Total * 100 / (A - B * e^(-C * BW))
    const denominator = c.a - c.b * Math.exp(-c.c * bw);
    return Math.round((total * 100 / denominator) * 100) / 100;
}

/**
 * Calculates the target weight based on a percentage of 1RM.
 * @param oneRm The user's estimated 1RM
 * @param percent The target percentage (e.g. 85 for 85%)
 * @param roundTo The rounding incremenent (default 2.5)
 */
export function calculateWeightFromPercentage(oneRm: number, percent: number, roundTo: number = 2.5): number {
    const rawWeight = oneRm * (percent / 100);
    return Math.round(rawWeight / roundTo) * roundTo;
}

/**
 * Estimates the theoretical RIR given a weight, rep count, and known 1RM.
 * Inverted Epley: 1RM = Weight * (1 + (Reps + RIR) / 30)
 * => (1RM / Weight) - 1 = (Reps + RIR) / 30
 * => 30 * ((1RM / Weight) - 1) = Reps + RIR
 * => RIR = 30 * ((1RM / Weight) - 1) - Reps
 */
export function estimateRIR(weight: number, reps: number, oneRm: number): number {
    if (weight <= 0 || oneRm <= 0) return 10; // Fallback

    // Calculate total theoretical reps possible at this weight
    // TotalReps = 30 * ((1RM / Weight) - 1)
    const totalRepsPossible = 30 * ((oneRm / weight) - 1);

    const rir = totalRepsPossible - reps;

    // Clamp RIR between -5 (Failed hard) and 10 (Too light)? 
    // For now, raw value is better for validation logic.
    return Math.round(rir * 10) / 10;
}

/**
 * Calculates the theoretical percentage of 1RM for a given Reps + RIR target.
 * Using Epley: % = 1 / (1 + (Reps + RIR) / 30)
 * 
 * Example: 5 Reps @ 2 RIR (Total potential = 7 Reps)
 * Percent = 1 / (1 + 7/30) = 1 / 1.233 = 0.81 (81%)
 */
export function calculatePercentFromRepsAndRir(reps: number, rir: number): number {
    const totalEffort = reps + rir;
    if (totalEffort === 0) return 100; // 0 reps 0 rir makes no sense but mathematically 1RM

    const decimal = 1 / (1 + totalEffort / 30);
    return Math.round(decimal * 1000) / 10; // Returns 81.1 for 81.1%
}
