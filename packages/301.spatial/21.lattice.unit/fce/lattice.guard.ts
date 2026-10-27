/**
 * ============================================================================
 * :: LATTICE INVARIANT GUARDS & BRANDING FACTORIES
 * ============================================================================
 * Enforces planar cubic integer constraints, coordinate boundaries, and type
 * assertion guards with zero floating-point arithmetic.
 */

import type {
    TacticalCellId,
    TacticalEdgeId,
    AxialCoord,
    LatticePoint,
} from './lattice.interface.js'

export const AXIAL_COORD_MIN = -32768
export const AXIAL_COORD_MAX = 32767

/**
 * Asserts that an input number is an exact safe integer within [-32768, 32767].
 */
export function assertIntegerCoordinate(
    value: number,
    paramName: string,
): void {
    if (!Number.isInteger(value)) {
        throw new TypeError(
            `INVALID_COORDINATE: Parameter '${paramName}' must be an exact integer. Received: ${value}`,
        )
    }
    const min = paramName === 's' ? AXIAL_COORD_MIN * 2 : AXIAL_COORD_MIN
    const max = paramName === 's' ? -AXIAL_COORD_MIN * 2 : AXIAL_COORD_MAX
    if (value < min || value > max) {
        throw new RangeError(
            `COORDINATE_OUT_OF_BOUNDS: Parameter '${paramName}' must be between ${min} and ${max}. Received: ${value}`,
        )
    }
}

/**
 * Creates and validates an immutable AxialCoord, deriving s = -q - r.
 */
export function createAxialCoord(q: number, r: number): AxialCoord {
    assertIntegerCoordinate(q, 'q')
    assertIntegerCoordinate(r, 'r')
    const rawS = -q - r
    const s = rawS === 0 ? 0 : rawS
    assertIntegerCoordinate(s, 's')

    return Object.freeze({ q, r, s })
}

/**
 * Validates that an unknown object conforms strictly to the AxialCoord contract.
 */
export function isAxialCoord(val: unknown): val is AxialCoord {
    if (typeof val !== 'object' || val === null) {
        return false
    }
    const candidate = val as Record<string, unknown>
    const { q, r, s } = candidate

    if (
        typeof q !== 'number' ||
        typeof r !== 'number' ||
        typeof s !== 'number'
    ) {
        return false
    }

    if (!Number.isInteger(q) || !Number.isInteger(r) || !Number.isInteger(s)) {
        return false
    }

    return q + r + s === 0
}

/**
 * Asserts the planar cubic invariant q + r + s === 0.
 */
export function assertPlanarCubicInvariant(coord: AxialCoord): void {
    if (
        !Number.isInteger(coord.q) ||
        !Number.isInteger(coord.r) ||
        !Number.isInteger(coord.s)
    ) {
        throw new TypeError(
            'CUBIC_INVARIANT_BREACH: Coordinates must be exact integers.',
        )
    }
    if (coord.q + coord.r + coord.s !== 0) {
        throw new Error(
            `CUBIC_INVARIANT_BREACH: q + r + s must equal 0. Received: q=${coord.q}, r=${coord.r}, s=${coord.s} (sum: ${coord.q + coord.r + coord.s})`,
        )
    }
}

/**
 * Factory casting an unsigned 32-bit integer to a branded TacticalCellId.
 */
export function asTacticalCellId(packed: number): TacticalCellId {
    if (!Number.isInteger(packed) || packed < 0 || packed > 0xffffffff) {
        throw new TypeError(
            `INVALID_PACKED_CELL: TacticalCellId must be an unsigned 32-bit integer. Received: ${packed}`,
        )
    }
    return packed as TacticalCellId
}

/**
 * Factory casting an unsigned 64-bit BigInt to a branded TacticalEdgeId.
 */
export function asTacticalEdgeId(packed: bigint): TacticalEdgeId {
    if (
        typeof packed !== 'bigint' ||
        packed < 0n ||
        packed > 0xffffffffffffffffn
    ) {
        throw new TypeError(
            `INVALID_PACKED_EDGE: TacticalEdgeId must be an unsigned 64-bit BigInt. Received: ${packed}`,
        )
    }
    return packed as TacticalEdgeId
}

/**
 * Factory for exact integer doubled affine LatticePoint.
 */
export function createLatticePoint(
    x: bigint | number,
    y: bigint | number,
): LatticePoint {
    const bx = typeof x === 'bigint' ? x : BigInt(Math.trunc(x))
    const by = typeof y === 'bigint' ? y : BigInt(Math.trunc(y))
    return Object.freeze({ x: bx, y: by })
}
