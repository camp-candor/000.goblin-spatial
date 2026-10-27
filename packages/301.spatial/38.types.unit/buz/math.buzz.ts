/**
 * Exact integer division implementing Round-Half-Even (Banker's Rounding).
 * Eliminates systematic directional drift by rounding exact 0.5 ties toward the nearest even quotient.
 */
export function divRoundHalfEven(
    numerator: number,
    denominator: number,
): number {
    if (denominator === 0) {
        throw new RangeError(
            '[DIV_ZERO] Division by zero in integer arithmetic',
        )
    }
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
        throw new TypeError(
            `[FLOAT_PROHIBITED] Operands must be integers. Received: ${numerator} / ${denominator}`,
        )
    }

    let n = numerator
    let d = denominator
    if (d < 0) {
        n = -n
        d = -d
    }

    const quotient = Math.floor(n / d)
    const remainder = ((n % d) + d) % d

    if (remainder * 2 < d) {
        return quotient
    }
    if (remainder * 2 > d) {
        return quotient + 1
    }
    // Tie-breaker: round to nearest even integer
    return quotient % 2 === 0 ? quotient : quotient + 1
}

/**
 * BigInt variant of divRoundHalfEven for high-magnitude products exceeding 2^53 - 1.
 */
export function divRoundHalfEvenBigInt(
    numerator: bigint,
    denominator: bigint,
): bigint {
    if (denominator === 0n) {
        throw new RangeError('[DIV_ZERO] Division by zero in BigInt arithmetic')
    }

    let n = numerator
    let d = denominator
    if (d < 0n) {
        n = -n
        d = -d
    }

    const q = n / d
    const r = n % d

    if (r === 0n) return q

    const doubleR = r * 2n
    if (doubleR < d) return q
    if (doubleR > d) return q + 1n
    return q % 2n === 0n ? q : q + 1n
}

/**
 * Scale(A, B) = RoundEven((A * B) / 10,000)
 * Evaluates scalar multiplication of two non-negative Basis Point integers using pure integer remainder checks.
 */
export function scaleBasisPoints(a: number, b: number): number {
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
        throw new TypeError(
            `[FLOAT_PROHIBITED] Operands must be integers. Received: a=${a}, b=${b}`,
        )
    }
    if (a < 0 || b < 0) {
        throw new RangeError(
            `[NEGATIVE_PROHIBITED] Basis points cannot be negative. Received: a=${a}, b=${b}`,
        )
    }

    const p = a * b
    const q = Math.floor(p / 10_000)
    const r = p % 10_000

    if (r < 5_000) {
        return q
    }
    if (r > 5_000) {
        return q + 1
    }
    // Exact 5,000 remainder tie-break: round to even quotient
    return q % 2 === 0 ? q : q + 1
}

/**
 * BigInt variant for basis point scaling across multi-hop compounding graphs.
 */
export function scaleBasisPointsBigInt(a: bigint, b: bigint): bigint {
    if (a < 0n || b < 0n) {
        throw new RangeError(
            `[NEGATIVE_PROHIBITED] Basis points cannot be negative. Received: a=${a}, b=${b}`,
        )
    }

    const product = a * b
    const quotient = product / 10_000n
    const remainder = product % 10_000n

    if (remainder < 5_000n) return quotient
    if (remainder > 5_000n) return quotient + 1n
    return quotient % 2n === 0n ? quotient : quotient + 1n
}

/**
 * Evaluates chained scalar multiplications enforcing strict left-associativity:
 * Scale(Scale(Scale(val, m1), m2), m3)
 */
export function scaleBasisPointsChained(
    val: number,
    ...multipliers: number[]
): number {
    return multipliers.reduce(
        (acc, currentMultiplier) => scaleBasisPoints(acc, currentMultiplier),
        val,
    )
}
