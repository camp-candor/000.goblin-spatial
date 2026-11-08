/**
 * ============================================================================
 * :: DOUBLED AFFINE COORDINATE PROJECTORS (01.lattice.unit)
 * ============================================================================
 * Maps pointy-top axial hex coordinates (q, r) into an exact doubled integer
 * affine space (4q + 2r, 6r). Every centroid, vertex, and edge midpoint is
 * guaranteed to be an exact integer point, completely eliminating square roots
 * and floating-point drift from segment-polygon line-of-sight operations.
 */

import type {
    TacticalCellId,
    LatticePoint,
    HexVertices,
    HexEdgeMidpoints,
    AxialCoord,
} from '../fce/lattice.interface.js'
import {
    assertIntegerCoordinate,
    createLatticePoint,
} from '../fce/lattice.guard.js'
import { unpackAxialCell } from './packing.buzz.js'

/**
 * Normalizes input arguments to an AxialCoord.
 * Accepts either (q: number, r: number) or a packed TacticalCellId.
 */
function resolveCoord(
    cellOrQ: TacticalCellId | number,
    r?: number,
): AxialCoord {
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
 *
 * Mathematical Derivation:
 * Continuous Cartesian centroid for circumradius s = 2:
 *   x = sqrt(3) * (2q + r)
 *   y = 3r
 * Affine horizontal scale (divide x by sqrt(3)):
 *   x_affine = 2q + r
 *   y_affine = 3r
 * Doubled scale (multiply by 2):
 *   cx = 4q + 2r
 *   cy = 6r
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
 *
 * Vertex Offsets from Centroid (cx, cy):
 *   V0: (cx, cy + 4)     Top (angle 90 deg)
 *   V1: (cx + 2, cy + 2) Top-Right (angle 30 deg)
 *   V2: (cx + 2, cy - 2) Bottom-Right (angle -30 deg)
 *   V3: (cx, cy - 4)     Bottom (angle -90 deg)
 *   V4: (cx - 2, cy - 2) Bottom-Left (angle -150 deg)
 *   V5: (cx - 2, cy + 2) Top-Left (angle 150 deg)
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
 *
 * Edge Midpoint Offsets from Centroid (cx, cy):
 *   E0: (cx + 1, cy + 3) North-East (between V0 and V1)
 *   E1: (cx + 2, cy)     East       (between V1 and V2)
 *   E2: (cx + 1, cy - 3) South-East (between V2 and V3)
 *   E3: (cx - 1, cy - 3) South-West (between V3 and V4)
 *   E4: (cx - 2, cy)     West       (between V4 and V5)
 *   E5: (cx - 1, cy + 3) North-West (between V5 and V0)
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
 *
 * Requirements & Invariants:
 * 1. Adjacency: cellA and cellB must have axial distance === 1. Throws Error if non-adjacent.
 * 2. Optical Symmetry: sharedEdgeEndpoints(A, B) produces the exact identical pair as
 *    sharedEdgeEndpoints(B, A). Endpoints are canonically sorted by (x, then y).
 * 3. Exact Coincidence: The shared endpoints match the corresponding polygon vertices
 *    in both cells identically.
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

    // Direction mapping on pointy-top hex grid to shared vertex indices of Cell A
    let vIdx1: number
    let vIdx2: number

    if (dq === 1 && dr === 0) {
        // East (+1, 0): Shared edge is E1, connecting V1 and V2
        vIdx1 = 1
        vIdx2 = 2
    } else if (dq === 1 && dr === -1) {
        // South-East (+1, -1): Shared edge is E2, connecting V2 and V3
        vIdx1 = 2
        vIdx2 = 3
    } else if (dq === 0 && dr === -1) {
        // South-West (0, -1): Shared edge is E3, connecting V3 and V4
        vIdx1 = 3
        vIdx2 = 4
    } else if (dq === -1 && dr === 0) {
        // West (-1, 0): Shared edge is E4, connecting V4 and V5
        vIdx1 = 4
        vIdx2 = 5
    } else if (dq === -1 && dr === 1) {
        // North-West (-1, +1): Shared edge is E5, connecting V5 and V0
        vIdx1 = 5
        vIdx2 = 0
    } else if (dq === 0 && dr === 1) {
        // North-East (0, +1): Shared edge is E0, connecting V0 and V1
        vIdx1 = 0
        vIdx2 = 1
    } else {
        throw new Error(
            `UNREACHABLE_DIRECTION: Invalid axial neighbor offset: (${dq}, ${dr})`,
        )
    }

    const pt1 = vertsA[vIdx1]
    const pt2 = vertsA[vIdx2]

    // Canonical sorting guarantees optical symmetry: sharedEdge(A, B) === sharedEdge(B, A)
    const isPt1Smaller = pt1.x < pt2.x || (pt1.x === pt2.x && pt1.y < pt2.y)
    return Object.freeze(isPt1Smaller ? [pt1, pt2] : [pt2, pt1])
}
