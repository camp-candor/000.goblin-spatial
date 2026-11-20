import {
    AxialCoord,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import {
    assertAxialInvariant,
    axialDistance,
} from '../../28.axial.unit/buz/axial.buzz.js'
import {
    AXIAL_DIRECTIONS,
    getNeighbor,
} from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import type {
    TacticalCellId,
    LatticePoint,
    HexVertices,
    HexEdgeMidpoints,
    AxialCoord as LatticeAxialCoord,
} from '../fce/lattice.interface.js'
import {
    assertIntegerCoordinate,
    createLatticePoint,
} from '../fce/lattice.guard.js'
import { unpackAxialCell } from './packing.buzz.js'

/**
 * Normalizes input arguments to a LatticeAxialCoord.
 * Accepts either (q: number, r: number) or a packed TacticalCellId.
 */
function resolveCoord(
    cellOrQ: TacticalCellId | number,
    r?: number,
): LatticeAxialCoord {
    if (r === undefined) {
        return unpackAxialCell(cellOrQ as TacticalCellId)
    }
    assertIntegerCoordinate(cellOrQ, 'q')
    assertIntegerCoordinate(r, 'r')
    const q = cellOrQ
    const s = -q - r
    return Object.freeze({ q, r, s })
}

/**
 * Computes the exact doubled Cartesian centroid point for a pointy-top hexagon.
 */
export function hexCentroid(q: number, r: number): LatticePoint
export function hexCentroid(cell: TacticalCellId): LatticePoint
export function hexCentroid(
    cellOrQ: TacticalCellId | number,
    maybeR?: number,
): LatticePoint {
    const { q, r } = resolveCoord(cellOrQ, maybeR)
    const cx = BigInt(4 * q + 2 * r)
    const cy = BigInt(6 * r)
    return createLatticePoint(cx, cy)
}

/**
 * Computes the 6 clockwise vertices of a pointy-top hexagon in doubled integer affine space.
 */
export function hexVertices(q: number, r: number): HexVertices
export function hexVertices(cell: TacticalCellId): HexVertices
export function hexVertices(
    cellOrQ: TacticalCellId | number,
    maybeR?: number,
): HexVertices {
    const { q, r } = resolveCoord(cellOrQ, maybeR)
    const cx = BigInt(4 * q + 2 * r)
    const cy = BigInt(6 * r)

    return Object.freeze([
        createLatticePoint(cx, cy + 4n), // V0
        createLatticePoint(cx + 2n, cy + 2n), // V1
        createLatticePoint(cx + 2n, cy - 2n), // V2
        createLatticePoint(cx, cy - 4n), // V3
        createLatticePoint(cx - 2n, cy - 2n), // V4
        createLatticePoint(cx - 2n, cy + 2n), // V5
    ]) as HexVertices
}

/**
 * Computes the 6 exact integer edge midpoints of a pointy-top hexagon.
 */
export function hexEdgeMidpoints(q: number, r: number): HexEdgeMidpoints
export function hexEdgeMidpoints(cell: TacticalCellId): HexEdgeMidpoints
export function hexEdgeMidpoints(
    cellOrQ: TacticalCellId | number,
    maybeR?: number,
): HexEdgeMidpoints {
    const { q, r } = resolveCoord(cellOrQ, maybeR)
    const cx = BigInt(4 * q + 2 * r)
    const cy = BigInt(6 * r)

    return Object.freeze([
        createLatticePoint(cx + 1n, cy + 3n), // E0
        createLatticePoint(cx + 2n, cy), // E1
        createLatticePoint(cx + 1n, cy - 3n), // E2
        createLatticePoint(cx - 1n, cy - 3n), // E3
        createLatticePoint(cx - 2n, cy), // E4
        createLatticePoint(cx - 1n, cy + 3n), // E5
    ]) as HexEdgeMidpoints
}

/**
 * Computes the exact boundary segment endpoints shared between two adjacent cells.
 */
export function sharedEdgeEndpoints(
    cellA: TacticalCellId | number,
    cellB: TacticalCellId | number,
): readonly [LatticePoint, LatticePoint] {
    const coordA = unpackAxialCell(cellA)
    const coordB = unpackAxialCell(cellB)

    const dq = coordB.q - coordA.q
    const dr = coordB.r - coordA.r
    const ds = coordB.s - coordA.s

    const axialDist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds))
    if (axialDist !== 1) {
        throw new Error(
            `NON_ADJACENT_CELLS: Cells must have axial distance 1 to share an edge. Distance: ${axialDist}`,
        )
    }

    const vertsA = hexVertices(coordA.q, coordA.r)

    let vIdx1: number
    let vIdx2: number

    if (dq === 1 && dr === 0) {
        vIdx1 = 1
        vIdx2 = 2
    } else if (dq === 1 && dr === -1) {
        vIdx1 = 2
        vIdx2 = 3
    } else if (dq === 0 && dr === -1) {
        vIdx1 = 3
        vIdx2 = 4
    } else if (dq === -1 && dr === 0) {
        vIdx1 = 4
        vIdx2 = 5
    } else if (dq === -1 && dr === 1) {
        vIdx1 = 5
        vIdx2 = 0
    } else if (dq === 0 && dr === 1) {
        vIdx1 = 0
        vIdx2 = 1
    } else {
        throw new Error(
            `UNREACHABLE_DIRECTION: Invalid axial neighbor offset: (${dq}, ${dr})`,
        )
    }

    const pt1 = vertsA[vIdx1]
    const pt2 = vertsA[vIdx2]

    const isPt1Smaller = pt1.x < pt2.x || (pt1.x === pt2.x && pt1.y < pt2.y)
    return Object.freeze(isPt1Smaller ? [pt1, pt2] : [pt2, pt1])
}

export function getRing(
    center: AxialCoord,
    radius: number,
): readonly AxialCoord[] {
    assertAxialInvariant(center)
    if (!Number.isInteger(radius) || radius < 0) {
        throw new RangeError(
            `RING_INVALID_RADIUS: radius must be non-negative integer (${radius})`,
        )
    }
    if (radius === 0) {
        return [center]
    }

    const results: AxialCoord[] = []
    // Start radius steps in direction 4 (West)
    let current = createAxialCoord(
        center.q + AXIAL_DIRECTIONS[4].q * radius,
        center.r + AXIAL_DIRECTIONS[4].r * radius,
    )

    for (let dirIndex = 0; dirIndex < 6; dirIndex++) {
        for (let step = 0; step < radius; step++) {
            results.push(current)
            current = getNeighbor(current, dirIndex)
        }
    }

    return results
}

export function getSpiralDisk(
    center: AxialCoord,
    radius: number,
): readonly AxialCoord[] {
    assertAxialInvariant(center)
    if (!Number.isInteger(radius) || radius < 0) {
        throw new RangeError(
            `DISK_INVALID_RADIUS: radius must be non-negative integer (${radius})`,
        )
    }

    const disk: AxialCoord[] = [center]
    for (let r = 1; r <= radius; r++) {
        const ring = getRing(center, r)
        for (let i = 0; i < ring.length; i++) {
            disk.push(ring[i])
        }
    }

    // Deterministic sort: distance ascending, then q ascending, then r ascending
    return disk.sort((a, b) => {
        const distA = axialDistance(center, a)
        const distB = axialDistance(center, b)
        if (distA !== distB) return distA - distB
        if (a.q !== b.q) return a.q - b.q
        return a.r - b.r
    })
}

export function expectedHexCountForRadius(radius: number): number {
    if (radius < 0) return 0
    return 3 * radius * (radius + 1) + 1
}

import { LatticeModel } from '../lattice.model.js'
import LatticeBit from '../fce/lattice.bit.js'
import State from '../../99.core/state.js'

export const updateLattice = (
    cpy: LatticeModel,
    bal: LatticeBit,
    ste?: State,
) => {
    return cpy
}
