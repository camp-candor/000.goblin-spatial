import { BasisPoints } from '../fce/witness.interface.js'

export const MAX_BASIS_POINTS = 10000
export const MIN_BASIS_POINTS = 0

export function toBasisPoints(value: number): BasisPoints {
    if (!Number.isInteger(value)) {
        throw new TypeError(`BASIS_POINTS_NON_INTEGER: ${value}`)
    }
    if (value < MIN_BASIS_POINTS || value > MAX_BASIS_POINTS) {
        throw new RangeError(
            `BASIS_POINTS_OUT_OF_BOUNDS: ${value} not in [0, 10000]`,
        )
    }
    return value as BasisPoints
}

export function clampBasisPoints(value: number): BasisPoints {
    if (!Number.isInteger(value)) {
        throw new TypeError(`CLAMP_NON_INTEGER: ${value}`)
    }
    if (value < MIN_BASIS_POINTS) return MIN_BASIS_POINTS as BasisPoints
    if (value > MAX_BASIS_POINTS) return MAX_BASIS_POINTS as BasisPoints
    return value as BasisPoints
}

/**
 * Integer Round-Half-Even (Banker's Rounding) for Basis Point Scaling:
 * Scale(A, B) = round_half_even(A * B / 10000)
 */
export function scaleBasisPointsRoundHalfEven(
    a: BasisPoints,
    b: BasisPoints,
): BasisPoints {
    const product = BigInt(a) * BigInt(b)
    const denom = 10000n
    const quotient = product / denom
    const remainder = product % denom
    const half = 5000n

    let rounded = quotient
    if (remainder > half) {
        rounded = quotient + 1n
    } else if (remainder === half) {
        // Round to nearest even quotient
        if (quotient % 2n !== 0n) {
            rounded = quotient + 1n
        }
    }

    return clampBasisPoints(Number(rounded))
}
