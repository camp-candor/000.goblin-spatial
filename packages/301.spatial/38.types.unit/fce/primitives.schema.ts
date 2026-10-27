import { z } from 'zod'

/**
 * Invariant Basis Points: Exact integer between 0 and 10,000 (10,000 bp = 1.0 = 100%).
 * Strictly rejects floating-point numbers, negative values, and scalars exceeding 10,000.
 */
export const BasisPointsSchema = z
    .number()
    .int({ message: '[FLOAT_PROHIBITED] Basis points must be an integer' })
    .min(0, { message: '[OUT_OF_BOUNDS] Basis points cannot be negative' })
    .max(10_000, {
        message: '[OUT_OF_BOUNDS] Basis points cannot exceed 10,000 (1.0)',
    })

export type BasisPoints = z.infer<typeof BasisPointsSchema>

/**
 * Clamps an integer value strictly into [0, 10,000] basis points.
 */
export const clampBasisPoints = (val: number): BasisPoints => {
    if (!Number.isInteger(val)) {
        throw new TypeError(
            `[FLOAT_PROHIBITED] Basis points must be an integer. Received: ${val}`,
        )
    }
    return Math.max(0, Math.min(10_000, val)) as BasisPoints
}

/**
 * Asserts that a value satisfies BasisPoints invariants or throws descriptive errors.
 */
export const assertBasisPoints = (
    val: number,
    label = 'Value',
): BasisPoints => {
    try {
        return BasisPointsSchema.parse(val)
    } catch {
        throw new z.ZodError([
            {
                code: z.ZodIssueCode.custom,
                message: `[INVALID_BASIS_POINTS] ${label} must be an integer between 0 and 10000 bp. Received: ${val}`,
                path: [],
            },
        ])
    }
}
