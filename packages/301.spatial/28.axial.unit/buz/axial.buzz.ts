import {
    AxialCoord,
    DoubledCoord,
    IntVector2D,
    createAxialCoord,
} from '../val/axial.model.js'

export function assertAxialInvariant(coord: AxialCoord): void {
    if (coord.q + coord.r + coord.s !== 0) {
        throw new Error(
            `AXIAL_INVARIANT_VIOLATION: q(${coord.q}) + r(${coord.r}) + s(${coord.s}) !== 0`,
        )
    }
}

/**
 * Doubled Cartesian Coordinate Mapping:
 * Circumradius s = 2 pointy-top hex projected via affine stretch:
 * Centroid(q, r) = (4q + 2r, 6r)
 */
export function axialToDoubled(coord: AxialCoord): DoubledCoord {
    assertAxialInvariant(coord)
    return {
        x: 4 * coord.q + 2 * coord.r,
        y: 6 * coord.r,
    }
}

export function doubledToAxial(doubled: DoubledCoord): AxialCoord {
    if (!Number.isInteger(doubled.x) || !Number.isInteger(doubled.y)) {
        throw new TypeError(
            `DOUBLED_NON_INTEGER_COORDINATE: (${doubled.x}, ${doubled.y})`,
        )
    }
    if (doubled.y % 6 !== 0) {
        throw new Error(
            `DOUBLED_INVALID_Y_ALIGNMENT: y(${doubled.y}) must be divisible by 6`,
        )
    }
    const r = Math.trunc(doubled.y / 6)
    const remX = doubled.x - 2 * r
    if (remX % 4 !== 0) {
        throw new Error(
            `DOUBLED_INVALID_X_ALIGNMENT: x(${doubled.x}) - 2r(${2 * r}) must be divisible by 4`,
        )
    }
    const q = Math.trunc(remX / 4)
    return createAxialCoord(q, r)
}

/**
 * Metric Hexagonal Axial Distance:
 * d_axial(a, b) = max(|qa - qb|, |ra - rb|, |sa - sb|)
 */
export function axialDistance(a: AxialCoord, b: AxialCoord): number {
    assertAxialInvariant(a)
    assertAxialInvariant(b)
    const dq = Math.abs(a.q - b.q)
    const dr = Math.abs(a.r - b.r)
    const ds = Math.abs(a.s - b.s)
    return Math.max(dq, dr, ds)
}

/**
 * Exact Integer Chord Distance Squared:
 * Used for deterministic tie-breaking without square roots.
 */
export function chordDistanceSquared(a: AxialCoord, b: AxialCoord): bigint {
    assertAxialInvariant(a)
    assertAxialInvariant(b)
    const da = axialToDoubled(a)
    const db = axialToDoubled(b)
    const dx = BigInt(da.x - db.x)
    const dy = BigInt(da.y - db.y)
    return dx * dx + dy * dy
}

export function hexVertices(coord: AxialCoord): readonly IntVector2D[] {
    const d = axialToDoubled(coord)
    const cx = BigInt(d.x)
    const cy = BigInt(d.y)
    return [
        { x: cx, y: cy + 4n },
        { x: cx + 2n, y: cy + 2n },
        { x: cx + 2n, y: cy - 2n },
        { x: cx, y: cy - 4n },
        { x: cx - 2n, y: cy - 2n },
        { x: cx - 2n, y: cy + 2n },
    ]
}

import { AxialModel } from '../axial.model.js'
import AxialBit from '../fce/axial.bit.js'
import State from '../../99.core/state.js'

export const initAxial = (cpy: AxialModel, bal: AxialBit, ste: State) => {
    return cpy
}

export const updateAxial = (cpy: AxialModel, bal: AxialBit, ste: State) => {
    return cpy
}
