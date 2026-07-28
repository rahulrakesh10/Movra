import { z } from "zod";

// 1. Auth Validation (Login / Signup)
// Ensure passwords meet minimum security requirements and emails are valid.
export const AuthSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(100, { message: "Password is too long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

export type AuthInput = z.infer<typeof AuthSchema>;

// 2. Profile/Goal Update Validation
// Sanitize inputs before sending them to Supabase to prevent bad data.
export const GoalsSchema = z.object({
  calories: z.number().int().min(1200, "Calories must be at least 1200").max(10000, "Unrealistic calorie target"),
  protein: z.number().int().min(0).max(500),
  carbs: z.number().int().min(0).max(1000),
  fat: z.number().int().min(0).max(500),
});

export type GoalsInput = z.infer<typeof GoalsSchema>;

/**
 * Utility function to validate any data against a schema safely.
 * Returns parsed data if successful, throws error if invalid.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", result.error.format());
    throw new Error("Invalid input provided");
  }
  return result.data;
}
