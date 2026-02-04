
import { calculateWeightFromPercentage, estimateRIR, calculatePercentFromRepsAndRir, calculate1RM } from './formulas';

console.log("=== LOAD PERCENTAGE VERIFICATION ===");

// 1. Percentage -> Weight
const oneRm = 100;
const percent = 80;
const expectedWeight = 80;
const actualWeight = calculateWeightFromPercentage(oneRm, percent, 2.5);
console.log(`Weight from % (1RM: ${oneRm}, %: ${percent}): Expected ~${expectedWeight}, Actual: ${actualWeight} ${actualWeight === expectedWeight ? '✅' : '❌'}`);

// 2. Reps + RIR -> Percentage (Theoretical)
// 5 Reps @ 2 RIR = 7 Reps Max
// Epley: 1RM = W * (1 + 7/30) = W * 1.233 -> W/1RM = 1/1.233 = 0.81
const reps = 5;
const rir = 2;
const percentFromReps = calculatePercentFromRepsAndRir(reps, rir);
console.log(`% from Reps/RIR (Reps: ${reps}, RIR: ${rir}): Expected ~81.1, Actual: ${percentFromReps} ${Math.abs(percentFromReps - 81.1) < 0.5 ? '✅' : '❌'}`);

// 3. Weight + Reps -> Estimate RIR
// If we lift 80kg for 5 reps, and 1RM is 100kg.
// 100 = 80 * (1 + (5+RIR)/30)
// 1.25 = 1 + (5+RIR)/30
// 0.25 = (5+RIR)/30
// 7.5 = 5 + RIR
// RIR = 2.5
const estimatedRir = estimateRIR(80, 5, 100);
console.log(`Estimate RIR (Weight: 80, Reps: 5, 1RM: 100): Expected ~2.5, Actual: ${estimatedRir} ${Math.abs(estimatedRir - 2.5) < 0.1 ? '✅' : '❌'}`);

// 4. Impossible Combo
// 10 Reps @ 95% -> Should be impossible (negative RIR)
// 1RM = 100. Weight = 95. Reps = 10.
// 100 = 95 * (1 + (10+RIR)/30)
// 1.052 = 1 + (10+RIR)/30
// 0.052 * 30 = 10 + RIR
// 1.57 = 10 + RIR
// RIR = -8.4
const impossibleRir = estimateRIR(95, 10, 100);
console.log(`Impossible RIR (Weight: 95, Reps: 10, 1RM: 100): Expected < 0, Actual: ${impossibleRir} ${impossibleRir < 0 ? '✅' : '❌'}`);
