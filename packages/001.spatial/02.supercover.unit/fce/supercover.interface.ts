/**
 * ============================================================================
 * :: 02.SUPERCOVER.UNIT DOMAIN INTERFACES & GEOMETRIC CONTRACTS
 * ============================================================================
 * Defines topological intersection classifications, exact BigInt rational
 * parameters, and supercover feature contracts for finite-segment line-of-sight.
 */

import type {
    TacticalCellId,
    TacticalEdgeId,
} from '../../01.lattice.unit/index.js'

/**
 * Exact rational parameter t = tNum / tDen along a directed ray segment.
 * Invariant: tDen > 0n and 0n <= tNum <= tDen for intersections within [0, 1].
 */
export interface RationalParam {
    readonly tNum: bigint
    readonly tDen: bigint
}

/**
 * Authoritative classification of 2D closed line-segment intersection events.
 * Distinguishes transverse crossings, endpoint touches, and collinear intervals.
 */
export type SegmentIntersectionKind =
    | 'STRICT_CROSSING' // Ray and edge intersect strictly in their relative interiors
    | 'COLLINEAR_OVERLAP' // Segments share a non-degenerate 1D interval on the same line
    | 'COLLINEAR_DISJOINT' // Segments are collinear but disjoint
    | 'COLLINEAR_TOUCH' // Segments are collinear and share exactly one common endpoint
    | 'VERTEX_GRAZE_E1' // Ray passes through edge endpoint E1
    | 'VERTEX_GRAZE_E2' // Ray passes through edge endpoint E2
    | 'TOUCH_RAY_ENDPOINT_P1' // Edge passes through ray origin P1
    | 'TOUCH_RAY_ENDPOINT_P2' // Edge passes through ray target P2
    | 'DISJOINT' // Segments do not intersect

/**
 * Complete evaluation receipt for a segment-edge intersection test.
 */
export interface SegmentIntersectionResult {
    readonly intersects: boolean
    readonly kind: SegmentIntersectionKind
    readonly tNum: bigint
    readonly tDen: bigint
}

/**
 * Discrete feature crossed by a finite ray during supercover traversal.
 */
export type CrossedFeatureKind = 'CELL_INTERIOR' | 'EDGE' | 'VERTEX'

export interface CrossedFeature {
    readonly kind: CrossedFeatureKind
    readonly cell?: TacticalCellId
    readonly edge?: TacticalEdgeId
    readonly vertexCells?: readonly [
        TacticalCellId,
        TacticalCellId,
        TacticalCellId,
    ]
    readonly tNum: bigint
    readonly tDen: bigint
}

/**
 * Model interface for 02.supercover.unit.
 */
export default interface Supercover {
    idx: string
    maxWorkEnvelopeCells: number
}
