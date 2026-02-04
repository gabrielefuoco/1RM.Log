
import { describe, it, expect } from 'vitest'
import { calculateWeightFromPercentage, estimateRIR, calculatePercentFromRepsAndRir } from './formulas'

describe('Load Percentage Logic', () => {

    describe('calculateWeightFromPercentage', () => {
        it('should calculate correct weight for simple percentage', () => {
            // 80% of 100kg = 80kg
            expect(calculateWeightFromPercentage(100, 80)).toBe(80)
        });

        it('should round to nearest 2.5kg by default', () => {
            // 83% of 100kg = 83kg -> rounds to 82.5kg
            expect(calculateWeightFromPercentage(100, 83)).toBe(82.5)
            // 84% of 100kg = 84kg -> rounds to 85kg
            expect(calculateWeightFromPercentage(100, 84)).toBe(85)
        });

        it('should respect custom rounding', () => {
            // 83% of 100kg = 83kg -> rounds to 83kg (step 1)
            expect(calculateWeightFromPercentage(100, 83, 1)).toBe(83)
        });
    });

    describe('estimateRIR', () => {
        // Formula: RIR = 30 * (1RM / Weight - 1) - Reps
        // Derived from 1RM = Weight * (1 + (Reps + RIR)/30)
        // Here Input is Percentage. W = 1RM * Pct.
        // RIR = 30 * (1/Pct - 1) - Reps

        it('should return valid RIR for reasonable inputs', () => {
            // Reps: 10, Pct: 0.75 (75%)
            // Weight = 75, 1RM = 100
            // RIR = 30 * (100/75 - 1) - 10
            // RIR = 30 * (1.333 - 1) - 10 = 30 * 0.333 - 10 = 10 - 10 = 0

            // Allow for small float precision differences
            const rir = estimateRIR(75, 10, 100)
            expect(rir).toBeCloseTo(0, 1)
        });

        it('should return negative RIR for impossible inputs', () => {
            // Reps: 10, Pct: 0.90 (90%) - 10 reps at 90% is impossible
            // Weight = 90, 1RM = 100
            // RIR = 30 * (100/90 - 1) - 10
            // RIR = 30 * (1.111 - 1) - 10 = 30 * 0.111 - 10 = 3.33 - 10 = -6.66
            const rir = estimateRIR(90, 10, 100)
            expect(rir).toBeLessThan(0)
        });
    });

    describe('calculatePercentFromRepsAndRir', () => {
        // Formula: Pct = Weight / 1RM
        // Weight = 1RM / (1 + (Reps + RIR)/30)
        // Pct = 1 / (1 + (Reps + RIR)/30)

        it('should calculate correct percentage for Reps 10 @ RIR 0 (Est 1RM 100)', () => {
            // 1RM = W * (1 + 10/30) = W * 1.333
            // W = 0.75 * 1RM
            // Pct should be ~75%
            const pct = calculatePercentFromRepsAndRir(10, 0)
            expect(pct).toBeCloseTo(75, 1)
        });

        it('should calculate correct percentage for Reps 1 @ RIR 0', () => {
            // 1RM = W * (1 + 1/30) = W * 1.033
            // W = 0.967 * 1RM
            const pct = calculatePercentFromRepsAndRir(1, 0)
            expect(pct).toBeCloseTo(96.77, 1)
        });
    });

})
