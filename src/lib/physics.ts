/**
 * Physical & Health calculation helpers.
 * All functions expect metric inputs (cm, kg) internally and return rounded values.
 */

/**
 * Calculate Body Mass Index (BMI).
 * BMI = weight (kg) / height (m)^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Calculate estimated Body Fat Percentage using the U.S. Navy Circumference Method.
 * All parameters must be in centimeters.
 * For females, hip circumference is required.
 */
export function calculateBodyFat(
  sex: "male" | "female",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipsCm?: number,
): number | null {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;

  if (sex === "male") {
    if (waistCm <= neckCm) return null;
    // Men (Metric Navy Formula):
    // BF% = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
    const densityVal = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm);
    if (densityVal <= 0) return null;
    const bf = 495 / densityVal - 450;
    return Math.max(2, Math.min(60, Math.round(bf * 10) / 10));
  } else {
    const hips = hipsCm || 0;
    if (hips <= 0 || (waistCm + hips <= neckCm)) return null;
    // Women (Metric Navy Formula):
    // BF% = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
    const densityVal = 1.29579 - 0.35004 * Math.log10(waistCm + hips - neckCm) + 0.22100 * Math.log10(heightCm);
    if (densityVal <= 0) return null;
    const bf = 495 / densityVal - 450;
    return Math.max(2, Math.min(60, Math.round(bf * 10) / 10));
  }
}

/**
 * Calculate Waist-to-Hip Circumference Ratio (WHR).
 */
export function calculateWHR(waistCm: number, hipsCm: number): number | null {
  if (waistCm <= 0 || hipsCm <= 0) return null;
  return Math.round((waistCm / hipsCm) * 100) / 100;
}

/**
 * Convert centimeters to inches.
 */
export function cmToIn(cm: number): number {
  return Math.round((cm / 2.54) * 100) / 100;
}

/**
 * Convert inches to centimeters.
 */
export function inToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
}
