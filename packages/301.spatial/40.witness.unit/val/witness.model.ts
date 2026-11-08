import { BasisPoints } from '../fce/witness.interface.js'

export const MAX_BASIS_POINTS: BasisPoints = 10000
export const MIN_BASIS_POINTS: BasisPoints = 0

export function toBasisPoints(value: number): BasisPoints {
    if (!Number.isInteger(value)) {
        throw new TypeError('Basis points must be an integer')
    }
    if (value < MIN_BASIS_POINTS || value > MAX_BASIS_POINTS) {
        throw new RangeError(
            `Basis points must be between ${MIN_BASIS_POINTS} and ${MAX_BASIS_POINTS}`,
        )
    }
    return value
}

export function clampBasisPoints(value: number): BasisPoints {
    if (value < MIN_BASIS_POINTS) return MIN_BASIS_POINTS
    if (value > MAX_BASIS_POINTS) return MAX_BASIS_POINTS
    return Number.isInteger(value) ? value : Math.trunc(value) // Assuming int is needed
}

export function scaleBasisPointsRoundHalfEven(
    a: BasisPoints,
    b: BasisPoints,
): BasisPoints {
    const an = BigInt(a)
    const bn = BigInt(b)
    const product = an * bn
    const divisor = 10000n

    const quotient = product / divisor
    const remainder = product % divisor

    if (remainder < 5000n) {
        return Number(quotient)
    } else if (remainder > 5000n) {
        return Number(quotient + 1n)
    } else {
        // exact half tie
        if (quotient % 2n === 0n) {
            return Number(quotient)
        } else {
            return Number(quotient + 1n)
        }
    }
}
