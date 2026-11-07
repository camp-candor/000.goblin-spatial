/**
 * ============================================================================
 * :: EXACT INTEGER GEOMETRIC PROJECTORS (01.lattice.unit)
 * ============================================================================
 * Implements pure affine geometry for hexagonal cells without floating-point
 * rounding errors or trigonometric irrationality.
 */

import type {
    TacticalCellId,
    LatticePoint,
    HexVertices,
    HexEdgeMidpoints,
} from '../fce/lattice.interface.js';
import { createLatticePoint } from '../fce/lattice.guard.js';
import { unpackAxialCell } from './packing.buzz.js';

/**
 * Projects cubic axial coordinates (or a packed TacticalCellId) into
 * Doubled Affine Coordinate space (cx = 4q + 2r, cy = 6r).
 */
export function hexCentroid(packedOrQ: TacticalCellId | number, r?: number): LatticePoint {
    let q: number;
    let rCoord: number;

    if (r === undefined) {
        const coord = unpackAxialCell(packedOrQ);
        q = coord.q;
        rCoord = coord.r;
    } else {
        q = packedOrQ;
        rCoord = r;
    }

    const cx = 4n * BigInt(q) + 2n * BigInt(rCoord);
    const cy = 6n * BigInt(rCoord);

    return createLatticePoint(cx, cy);
}

/**
 * Computes exact integer hexagon vertices clockwise from top (V0 to V5).
 */
export function hexVertices(q: number, r: number): HexVertices {
    const { x: cx, y: cy } = hexCentroid(q, r);

    return Object.freeze([
        createLatticePoint(cx, cy + 4n),      // V0: Top
        createLatticePoint(cx + 2n, cy + 2n), // V1: Top-Right
        createLatticePoint(cx + 2n, cy - 2n), // V2: Bottom-Right
        createLatticePoint(cx, cy - 4n),      // V3: Bottom
        createLatticePoint(cx - 2n, cy - 2n), // V4: Bottom-Left
        createLatticePoint(cx - 2n, cy + 2n), // V5: Top-Left
    ]);
}

/**
 * Computes exact integer edge midpoints corresponding to the segments between vertices.
 */
export function hexEdgeMidpoints(q: number, r: number): HexEdgeMidpoints {
    const { x: cx, y: cy } = hexCentroid(q, r);

    return Object.freeze([
        createLatticePoint(cx + 1n, cy + 3n), // E0: North-East
        createLatticePoint(cx + 2n, cy),      // E1: East
        createLatticePoint(cx + 1n, cy - 3n), // E2: South-East
        createLatticePoint(cx - 1n, cy - 3n), // E3: South-West
        createLatticePoint(cx - 2n, cy),      // E4: West
        createLatticePoint(cx - 1n, cy + 3n), // E5: North-West
    ]);
}

/**
 * Calculates the exact shared boundary segment between two adjacent cells,
 * guaranteeing commutative endpoints regardless of cell ordering.
 */
export function sharedEdgeEndpoints(
    cellA: TacticalCellId | number,
    cellB: TacticalCellId | number
): readonly [LatticePoint, LatticePoint] {
    const coordA = unpackAxialCell(cellA);
    const coordB = unpackAxialCell(cellB);

    // Compute axial distance: max(|dq|, |dr|, |ds|)
    const dq = Math.abs(coordA.q - coordB.q);
    const dr = Math.abs(coordA.r - coordB.r);
    const ds = Math.abs(coordA.s - coordB.s);
    const dist = Math.max(dq, dr, ds);

    if (dist !== 1) {
        throw new Error('NON_ADJACENT_CELLS: Cells must be exactly distance 1 apart to share an edge.');
    }

    const vertsA = hexVertices(coordA.q, coordA.r);
    const vertsB = hexVertices(coordB.q, coordB.r);

    // Find the matching vertices
    let vIdx1 = -1;
    let vIdx2 = -1;

    for (let i = 0; i < 6; i++) {
        const vA = vertsA[i];
        for (let j = 0; j < 6; j++) {
            const vB = vertsB[j];
            if (vA.x === vB.x && vA.y === vB.y) {
                if (vIdx1 === -1) {
                    vIdx1 = i;
                } else {
                    vIdx2 = i;
                    break;
                }
            }
        }
    }

    if (vIdx1 === -1 || vIdx2 === -1) {
        throw new Error('FAILED_TO_FIND_SHARED_EDGE: Internal geometry mismatch.');
    }

    const pt1 = vertsA[vIdx1];
    const pt2 = vertsA[vIdx2];

    // Canonical sorting guarantees optical symmetry: sharedEdge(A, B) === sharedEdge(B, A)
    const isPt1Smaller = pt1.x < pt2.x || (pt1.x === pt2.x && pt1.y < pt2.y);
    return Object.freeze(isPt1Smaller ? [pt1, pt2] : [pt2, pt1]);
}
