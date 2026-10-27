/**
 * ============================================================================
 * :: BRANDED INTEGER PRIMITIVES & DOMAIN INTERFACES (01.lattice.unit)
 * ============================================================================
 * Defines nominal branded types, exact integer lattice coordinate contracts,
 * and doubled-coordinate geometric structures for pointy-top hexes.
 */

declare const __brand: unique symbol

/**
 * Nominal branded type representing an unsigned 32-bit packed axial cell coordinate.
 * Packing schema: ((((q + 32768) & 0xFFFF) << 16) | ((r + 32768) & 0xFFFF)) >>> 0
 */
export type TacticalCellId = number & { readonly [__brand]: 'TacticalCellId' }

/**
 * Nominal branded type representing an unsigned 64-bit commutative packed edge key.
 * Packing schema: (min(cellA, cellB) << 32n) | max(cellA, cellB)
 */
export type TacticalEdgeId = bigint & { readonly [__brand]: 'TacticalEdgeId' }

/**
 * Canonical cubic axial coordinate descriptor.
 * Invariant: q, r, s must be exact integers and satisfy q + r + s === 0.
 */
export interface AxialCoord {
    readonly q: number
    readonly r: number
    readonly s: number
}

/**
 * Exact integer point in doubled coordinate affine space (4q + 2r, 6r).
 * Uses BigInt to ensure 2D cross-products never overflow standard numbers.
 */
export interface LatticePoint {
    readonly x: bigint
    readonly y: bigint
}

/**
 * Hexagonal compass directions on a pointy-top axial lattice (0 to 5).
 * 0: EAST (+1, 0)
 * 1: SOUTH_EAST (+1, -1)
 * 2: SOUTH_WEST (0, -1)
 * 3: WEST (-1, 0)
 * 4: NORTH_WEST (-1, +1)
 * 5: NORTH_EAST (0, +1)
 */
export type HexDirection = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Six exact integer vertices defining a pointy-top hexagon in doubled affine space.
 */
export type HexVertices = readonly [
    LatticePoint, // V0: (cx, cy + 4)     Top
    LatticePoint, // V1: (cx + 2, cy + 2) Top-Right
    LatticePoint, // V2: (cx + 2, cy - 2) Bottom-Right
    LatticePoint, // V3: (cx, cy - 4)     Bottom
    LatticePoint, // V4: (cx - 2, cy - 2) Bottom-Left
    LatticePoint, // V5: (cx - 2, cy + 2) Top-Left
]

/**
 * Six exact integer edge midpoints for pointy-top hex boundaries.
 */
export type HexEdgeMidpoints = readonly [
    LatticePoint, // E0: (cx + 1, cy + 3) North-East
    LatticePoint, // E1: (cx + 2, cy)     East
    LatticePoint, // E2: (cx + 1, cy - 3) South-East
    LatticePoint, // E3: (cx - 1, cy - 3) South-West
    LatticePoint, // E4: (cx - 2, cy)     West
    LatticePoint, // E5: (cx - 1, cy + 3) North-West
]

/**
 * Shared boundary segment endpoints between two adjacent lattice cells.
 */
export interface BoundarySegment {
    readonly edgeKey: TacticalEdgeId
    readonly cellA: TacticalCellId
    readonly cellB: TacticalCellId
    readonly start: LatticePoint
    readonly end: LatticePoint
}

/**
 * Core model interface for the 01.lattice unit.
 */
export default interface Lattice {
    idx: string
    originPacked: TacticalCellId
    scaleMultiplier: number
}
