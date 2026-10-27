/**
 * ============================================================================
 * :: MONOTONIC BIT-PACKING & CANONICAL EDGE KEYS (01.lattice.unit)
 * ============================================================================
 * Implements high-throughput, negative-safe axial coordinate packing into
 * unsigned 32-bit integers, and commutative undirected boundary edge keys into
 * 64-bit BigInt primitives with zero string allocations.
 */

import type {
    TacticalCellId,
    TacticalEdgeId,
    AxialCoord,
} from '../fce/lattice.interface.js'
import {
    asTacticalCellId,
    asTacticalEdgeId,
    createAxialCoord,
    AXIAL_COORD_MIN,
    AXIAL_COORD_MAX,
} from '../fce/lattice.guard.js'

/**
 * Coordinate offset mapping negative axial coordinates [-32768, 32767]
 * into the strictly positive unsigned 16-bit domain [0, 65535].
 */
export const COORD_OFFSET = 32768

/**
 * Maximum allowable value for a packed unsigned 32-bit cell ID (0xFFFFFFFF).
 */
export const MAX_PACKED_CELL_ID = 4294967295

/**
 * Packs 2D axial integer coordinates (q, r) into a monotonic, unsigned 32-bit TacticalCellId.
 *
 * Invariant Guarantees:
 * 1. Exact integer validation (rejects NaN, Infinity, and floats with TypeError).
 * 2. Range validation (rejects coordinates outside [-32768, 32767] with RangeError).
 * 3. Bit 31 sign-inversion immunity via (>>> 0), ensuring packAxialCell(0, 0) > packAxialCell(-1, 32767).
 * 4. Strict lexicographical monotonicity: (q1 < q2) || (q1 === q2 && r1 < r2) <=> pack(q1, r1) < pack(q2, r2).
 */
export function packAxialCell(q: number, r: number): TacticalCellId {
    if (!Number.isInteger(q)) {
        throw new TypeError(
            `Axial q coordinate must be an integer, received: ${q}`,
        )
    }
    if (!Number.isInteger(r)) {
        throw new TypeError(
            `Axial r coordinate must be an integer, received: ${r}`,
        )
    }
    if (q < AXIAL_COORD_MIN || q > AXIAL_COORD_MAX) {
        throw new RangeError(
            `Axial q coordinate out of allowable lattice bounds [${AXIAL_COORD_MIN}, ${AXIAL_COORD_MAX}]: ${q}`,
        )
    }
    if (r < AXIAL_COORD_MIN || r > AXIAL_COORD_MAX) {
        throw new RangeError(
            `Axial r coordinate out of allowable lattice bounds [${AXIAL_COORD_MIN}, ${AXIAL_COORD_MAX}]: ${r}`,
        )
    }

    const uQ = (q + COORD_OFFSET) & 0xffff
    const uR = (r + COORD_OFFSET) & 0xffff

    // Zero-fill right shift forces unsigned 32-bit integer representation
    const packed = ((uQ << 16) | uR) >>> 0
    return asTacticalCellId(packed)
}

/**
 * Unpacks an unsigned 32-bit TacticalCellId back into canonical cubic AxialCoord (q, r, s).
 * Automatically derives s = -q - r, satisfying the planar cubic invariant q + r + s === 0.
 */
export function unpackAxialCell(packed: TacticalCellId | number): AxialCoord {
    if (
        !Number.isInteger(packed) ||
        packed < 0 ||
        packed > MAX_PACKED_CELL_ID
    ) {
        throw new TypeError(`Invalid packed cell ID: ${packed}`)
    }

    const u32 = packed >>> 0
    const uQ = (u32 >>> 16) & 0xffff
    const uR = u32 & 0xffff

    const q = uQ - COORD_OFFSET
    const r = uR - COORD_OFFSET

    return createAxialCoord(q, r)
}

/**
 * Packs two adjacent cell IDs into a canonical, commutative 64-bit BigInt TacticalEdgeId.
 *
 * Invariant Guarantees:
 * 1. Commutativity: packEdgeKey(A, B) === packEdgeKey(B, A).
 * 2. Canonical ordering: smaller packed ID occupying high 32 bits, larger in low 32 bits.
 * 3. Zero string allocation: eliminates "q1,r1<->q2,r2" hot-loop string garbage.
 */
export function packEdgeKey(
    cellA: TacticalCellId | number,
    cellB: TacticalCellId | number,
): TacticalEdgeId {
    if (!Number.isInteger(cellA) || cellA < 0 || cellA > MAX_PACKED_CELL_ID) {
        throw new TypeError(`Invalid cellA ID for edge packing: ${cellA}`)
    }
    if (!Number.isInteger(cellB) || cellB < 0 || cellB > MAX_PACKED_CELL_ID) {
        throw new TypeError(`Invalid cellB ID for edge packing: ${cellB}`)
    }

    const a = BigInt(cellA >>> 0)
    const b = BigInt(cellB >>> 0)

    // Canonical undirected order: smaller ID in high 32 bits, larger in low 32 bits
    const packed = a < b ? (a << 32n) | b : (b << 32n) | a
    return asTacticalEdgeId(packed)
}

/**
 * Unpacks a 64-bit TacticalEdgeId into its canonical sorted pair of [minCellId, maxCellId].
 */
export function unpackEdgeKey(
    edgeKey: TacticalEdgeId | bigint,
): [TacticalCellId, TacticalCellId] {
    if (
        typeof edgeKey !== 'bigint' ||
        edgeKey < 0n ||
        edgeKey > 0xffffffffffffffffn
    ) {
        throw new TypeError(`Invalid edgeKey BigInt for unpacking: ${edgeKey}`)
    }

    const high = Number((edgeKey >> 32n) & 0xffffffffn)
    const low = Number(edgeKey & 0xffffffffn)

    return [asTacticalCellId(high), asTacticalCellId(low)]
}
