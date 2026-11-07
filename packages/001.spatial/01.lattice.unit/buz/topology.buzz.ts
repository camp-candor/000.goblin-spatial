/**
 * ============================================================================
 * :: NON-EUCLIDEAN AXIAL DISTANCE & TOPOLOGICAL DISKS (01.lattice.unit)
 * ============================================================================
 * Implements exact integer hexagonal distance metrics, 6-compass neighbor
 * offsets, hollow perimeter rings, and filled topological disks.
 *
 * All operations operate strictly via pure integer arithmetic and enforce
 * deterministic output sorting by ascending packed TacticalCellId.
 */

import type {
    TacticalCellId,
    AxialCoord,
    HexDirection,
} from '../fce/lattice.interface.js';
import type LatticeBit from '../fce/lattice.bit.js';
import type {
    DistanceLatticeDat,
    DiskLatticeDat,
    ProjectLatticeDat,
} from '../fce/lattice.bit.js';
import type { LatticeModel } from '../lattice.model.js';
import type State from '../../99.core/state.js';
import {
    createAxialCoord,
    asTacticalCellId,
    AXIAL_COORD_MIN,
    AXIAL_COORD_MAX,
} from '../fce/lattice.guard.js';
import {
    packAxialCell,
    unpackAxialCell,
} from './packing.buzz.js';
import {
    hexCentroid,
    hexVertices,
} from './lattice.buzz.js';

/**
 * Six discrete hexagonal compass direction offsets on pointy-top axial lattice.
 * Ordered clockwise:
 *   0: EAST        (+1,  0, -1)
 *   1: SOUTH_EAST  (+1, -1,  0)
 *   2: SOUTH_WEST  ( 0, -1, +1)
 *   3: WEST        (-1,  0, +1)
 *   4: NORTH_WEST  (-1, +1,  0)
 *   5: NORTH_EAST  ( 0, +1, -1)
 */
export const HEX_DIRECTIONS: readonly AxialCoord[] = Object.freeze([
    Object.freeze({ q: 1, r: 0, s: -1 }),
    Object.freeze({ q: 1, r: -1, s: 0 }),
    Object.freeze({ q: 0, r: -1, s: 1 }),
    Object.freeze({ q: -1, r: 0, s: 1 }),
    Object.freeze({ q: -1, r: 1, s: 0 }),
    Object.freeze({ q: 0, r: 1, s: -1 }),
]);

/**
 * Normalizes an argument into an AxialCoord.
 */
function toAxialCoord(cellOrCoord: TacticalCellId | AxialCoord | number): AxialCoord {
    if (typeof cellOrCoord === 'number') {
        return unpackAxialCell(cellOrCoord as TacticalCellId);
    }
    return cellOrCoord;
}

/**
 * Computes exact non-Euclidean integer hexagonal distance between two cells.
 *
 * Formula:
 *   d_axial(a, b) = (|q_a - q_b| + |(q_a + r_a) - (q_b + r_b)| + |r_a - r_b|) / 2
 *                 = max(|q_a - q_b|, |r_a - r_b|, |s_a - s_b|)
 */
export function axialDistance(
    a: TacticalCellId | AxialCoord | number,
    b: TacticalCellId | AxialCoord | number
): number {
    const cA = toAxialCoord(a);
    const cB = toAxialCoord(b);

    const dq = Math.abs(cA.q - cB.q);
    const dr = Math.abs(cA.r - cB.r);
    const ds = Math.abs(cA.s - cB.s);

    return Math.max(dq, dr, ds);
}

/**
 * Returns the adjacent neighbor cell in a specific compass direction (0 to 5).
 */
export function axialNeighborInDirection(
    cell: TacticalCellId | number,
    dir: HexDirection | number
): TacticalCellId {
    if (!Number.isInteger(dir) || dir < 0 || dir > 5) {
        throw new RangeError(`INVALID_DIRECTION: Direction must be an integer between 0 and 5. Received: ${dir}`);
    }
    const coord = unpackAxialCell(cell);
    const offset = HEX_DIRECTIONS[dir];
    const nQ = coord.q + offset.q;
    const nR = coord.r + offset.r;

    return packAxialCell(nQ, nR);
}

/**
 * Computes the 6 contiguous immediate neighbors of a cell.
 * Returned array is sorted deterministically by ascending packed TacticalCellId.
 */
export function axialNeighbors(cell: TacticalCellId | number): readonly TacticalCellId[] {
    const coord = unpackAxialCell(cell);
    const results: TacticalCellId[] = new Array(6);

    for (let i = 0; i < 6; i++) {
        const offset = HEX_DIRECTIONS[i];
        results[i] = packAxialCell(coord.q + offset.q, coord.r + offset.r);
    }

    results.sort((a, b) => a - b);
    return Object.freeze(results);
}

/**
 * Computes a hollow perimeter ring of cells at an exact axial radius k.
 *
 * Invariants:
 * 1. radius === 0 returns readonly [center].
 * 2. radius > 0 returns exactly 6k cells.
 * 3. Every cell in the returned array satisfies axialDistance(center, cell) === radius.
 * 4. Returned array is sorted deterministically by ascending packed TacticalCellId.
 */
export function axialRing(
    center: TacticalCellId | number,
    radius: number
): readonly TacticalCellId[] {
    if (!Number.isInteger(radius)) {
        throw new TypeError(`INVALID_RADIUS: Radius must be an integer. Received: ${radius}`);
    }
    if (radius < 0) {
        throw new RangeError(`INVALID_RADIUS: Radius cannot be negative. Received: ${radius}`);
    }

    const centerCell = asTacticalCellId(Number(center));
    if (radius === 0) {
        return Object.freeze([centerCell]);
    }

    const centerCoord = unpackAxialCell(centerCell);
    const results: TacticalCellId[] = [];

    // Start at center + HEX_DIRECTIONS[4] * radius (North-West corner)
    let currQ = centerCoord.q + HEX_DIRECTIONS[4].q * radius;
    let currR = centerCoord.r + HEX_DIRECTIONS[4].r * radius;

    for (let i = 0; i < 6; i++) {
        const stepDir = HEX_DIRECTIONS[i];
        for (let step = 0; step < radius; step++) {
            if (
                currQ >= AXIAL_COORD_MIN &&
                currQ <= AXIAL_COORD_MAX &&
                currR >= AXIAL_COORD_MIN &&
                currR <= AXIAL_COORD_MAX
            ) {
                results.push(packAxialCell(currQ, currR));
            }
            currQ += stepDir.q;
            currR += stepDir.r;
        }
    }

    results.sort((a, b) => a - b);
    return Object.freeze(results);
}

/**
 * Computes a filled topological disk containing all cells within axial distance radius.
 *
 * Invariants:
 * 1. radius === 0 returns readonly [center] (1 cell).
 * 2. radius > 0 returns exactly 1 + 3k(k+1) cells (e.g., R=5 yields exactly 91 cells).
 * 3. Every cell in the returned array satisfies axialDistance(center, cell) <= radius.
 * 4. Returned array is sorted deterministically by ascending packed TacticalCellId.
 */
export function axialRange(
    center: TacticalCellId | number,
    radius: number
): readonly TacticalCellId[] {
    if (!Number.isInteger(radius)) {
        throw new TypeError(`INVALID_RADIUS: Radius must be an integer. Received: ${radius}`);
    }
    if (radius < 0) {
        throw new RangeError(`INVALID_RADIUS: Radius cannot be negative. Received: ${radius}`);
    }

    const centerCell = asTacticalCellId(Number(center));
    if (radius === 0) {
        return Object.freeze([centerCell]);
    }

    const centerCoord = unpackAxialCell(centerCell);
    const results: TacticalCellId[] = [];

    for (let dq = -radius; dq <= radius; dq++) {
        const minR = Math.max(-radius, -dq - radius);
        const maxR = Math.min(radius, -dq + radius);
        const q = centerCoord.q + dq;

        if (q < AXIAL_COORD_MIN || q > AXIAL_COORD_MAX) continue;

        for (let dr = minR; dr <= maxR; dr++) {
            const r = centerCoord.r + dr;
            if (r < AXIAL_COORD_MIN || r > AXIAL_COORD_MAX) continue;
            results.push(packAxialCell(q, r));
        }
    }

    results.sort((a, b) => a - b);
    return Object.freeze(results);
}

// ============================================================================
// :: REDUX-RXJS BUZZ ACTION HANDLERS
// ============================================================================

export const initLattice = (
    cpy: LatticeModel,
    bal: LatticeBit,
    _ste?: State
): LatticeModel => {
    if (bal?.slv != null) {
        bal.slv({ ltcBit: { idx: 'init-lattice', src: cpy.idx } });
    }
    return cpy;
};

export const projectLattice = (
    cpy: LatticeModel,
    bal: LatticeBit<ProjectLatticeDat>,
    _ste?: State
): LatticeModel => {
    const q = bal?.val ?? 0;
    const r = bal?.dat?.coord?.r ?? 0;
    const coord = createAxialCoord(q, r);
    const centroid = hexCentroid(coord.q, coord.r);
    const vertices = hexVertices(coord.q, coord.r);

    const payload: ProjectLatticeDat = {
        coord,
        centroid,
        vertices,
    };

    if (bal?.slv != null) {
        bal.slv({
            ltcBit: {
                idx: 'project-lattice',
                dat: payload as any,
            },
        });
    }
    return cpy;
};

export const distanceLattice = (
    cpy: LatticeModel,
    bal: LatticeBit<DistanceLatticeDat>,
    _ste?: State
): LatticeModel => {
    const from = (bal?.dat?.from ?? cpy.originPacked) as TacticalCellId;
    const to = (bal?.dat?.to ?? cpy.originPacked) as TacticalCellId;
    const dist = axialDistance(from, to);

    const payload: DistanceLatticeDat = {
        from,
        to,
        distance: dist,
    };

    if (bal?.slv != null) {
        bal.slv({
            ltcBit: {
                idx: 'distance-lattice',
                val: dist,
                dat: payload as any,
            },
        });
    }
    return cpy;
};

export const diskLattice = (
    cpy: LatticeModel,
    bal: LatticeBit<DiskLatticeDat>,
    _ste?: State
): LatticeModel => {
    const center = (bal?.dat?.center ?? cpy.originPacked) as TacticalCellId;
    const radius = bal?.val ?? 0;
    const cells = axialRange(center, radius);

    const payload: DiskLatticeDat = {
        center,
        radius,
        cellCount: cells.length,
        cells,
    };

    if (bal?.slv != null) {
        bal.slv({
            ltcBit: {
                idx: 'disk-lattice',
                val: cells.length,
                lst: cells as any,
                dat: payload as any,
            },
        });
    }
    return cpy;
};
