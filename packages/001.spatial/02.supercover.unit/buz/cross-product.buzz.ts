/**
 * ============================================================================
 * :: EXACT 2D INTEGER CROSS-PRODUCT & SEGMENT INTERSECTION PREDICATES
 * ============================================================================
 * Implements exact integer geometric predicates using pure BigInt arithmetic.
 * Zero floating-point division, zero trigonometric operations, zero epsilons.
 */

import type { LatticePoint } from '../../01.lattice.unit/index.js'
import type {
    SegmentIntersectionResult,
    SegmentIntersectionKind,
} from '../fce/supercover.interface.js'

/**
 * 2D Integer Cross Product of vectors (B - A) and (C - A):
 *   cross(A, B, C) = (B_x - A_x) * (C_y - A_y) - (B_y - A_y) * (C_x - A_x)
 *
 * Orientation Semantics:
 *   > 0n: C lies strictly to the left of directed line AB (counter-clockwise turn)
 *   < 0n: C lies strictly to the right of directed line AB (clockwise turn)
 *   = 0n: C is strictly collinear with line AB
 */
export function crossProduct(
    a: LatticePoint,
    b: LatticePoint,
    c: LatticePoint,
): bigint {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/**
 * Evaluates whether point C lies within the closed axial bounding box of segment AB.
 */
export function isPointInBoundingBox(
    pt: LatticePoint,
    a: LatticePoint,
    b: LatticePoint,
): boolean {
    const minX = a.x < b.x ? a.x : b.x
    const maxX = a.x > b.x ? a.x : b.x
    const minY = a.y < b.y ? a.y : b.y
    const maxY = a.y > b.y ? a.y : b.y

    return pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY
}

/**
 * Evaluates whether point C lies strictly on the closed line segment AB.
 */
export function isPointOnSegment(
    pt: LatticePoint,
    a: LatticePoint,
    b: LatticePoint,
): boolean {
    return crossProduct(a, b, pt) === 0n && isPointInBoundingBox(pt, a, b)
}

/**
 * Compares two exact rational numbers (num1 / den1) and (num2 / den2) via cross-multiplication.
 * Eliminates all floating-point division or rounding bias.
 *
 * Returns:
 *   -1 if r1 < r2
 *    0 if r1 === r2
 *    1 if r1 > r2
 */
export function compareRationals(
    num1: bigint,
    den1: bigint,
    num2: bigint,
    den2: bigint,
): number {
    if (den1 === 0n || den2 === 0n) {
        throw new RangeError(
            'DIVISION_BY_ZERO: Rational denominator cannot be zero',
        )
    }

    // Canonicalize signs so denominators are strictly positive
    let n1 = num1
    let d1 = den1
    if (d1 < 0n) {
        n1 = -n1
        d1 = -d1
    }

    let n2 = num2
    let d2 = den2
    if (d2 < 0n) {
        n2 = -n2
        d2 = -d2
    }

    const diff = n1 * d2 - n2 * d1
    if (diff < 0n) return -1
    if (diff > 0n) return 1
    return 0
}

/**
 * Derives exact parametric rational t = tNum / tDen along directed segment p1 -> p2
 * for a point known to lie on line p1 -> p2.
 */
function deriveCollinearParam(
    pt: LatticePoint,
    p1: LatticePoint,
    p2: LatticePoint,
): { tNum: bigint; tDen: bigint } {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y

    if (dx !== 0n) {
        const num = pt.x - p1.x
        const den = dx
        return den < 0n ? { tNum: -num, tDen: -den } : { tNum: num, tDen: den }
    }

    if (dy !== 0n) {
        const num = pt.y - p1.y
        const den = dy
        return den < 0n ? { tNum: -num, tDen: -den } : { tNum: num, tDen: den }
    }

    return { tNum: 0n, tDen: 1n }
}

/**
 * Classifies closed segment-edge intersection between ray (p1 -> p2) and edge (e1 -> e2).
 *
 * Uses orientation cross-products:
 *   d1 = cross(p1, p2, e1)
 *   d2 = cross(p1, p2, e2)
 *   d3 = cross(e1, e2, p1)
 *   d4 = cross(e1, e2, p2)
 */
export function classifySegmentEdgeIntersection(
    p1: LatticePoint,
    p2: LatticePoint,
    e1: LatticePoint,
    e2: LatticePoint,
): SegmentIntersectionResult {
    const d1 = crossProduct(p1, p2, e1)
    const d2 = crossProduct(p1, p2, e2)
    const d3 = crossProduct(e1, e2, p1)
    const d4 = crossProduct(e1, e2, p2)

    // 1. General Transverse Interior Crossing
    if (
        ((d1 > 0n && d2 < 0n) || (d1 < 0n && d2 > 0n)) &&
        ((d3 > 0n && d4 < 0n) || (d3 < 0n && d4 > 0n))
    ) {
        // Parametric t numerator and denominator along p1 -> p2
        //   den = (p2.x - p1.x) * (e1.y - e2.y) - (p2.y - p1.y) * (e1.x - e2.x)
        //   num = (e1.x - p1.x) * (e1.y - e2.y) - (e1.y - p1.y) * (e1.x - e2.x)
        const denRaw =
            (p2.x - p1.x) * (e1.y - e2.y) - (p2.y - p1.y) * (e1.x - e2.x)
        const numRaw =
            (e1.x - p1.x) * (e1.y - e2.y) - (e1.y - p1.y) * (e1.x - e2.x)

        const tDen = denRaw < 0n ? -denRaw : denRaw
        const tNum = denRaw < 0n ? -numRaw : numRaw

        return {
            intersects: true,
            kind: 'STRICT_CROSSING',
            tNum,
            tDen,
        }
    }

    // 2. Collinear Cases (All four endpoints lie on the same supporting line)
    if (d1 === 0n && d2 === 0n && d3 === 0n && d4 === 0n) {
        const minPx = p1.x < p2.x ? p1.x : p2.x
        const maxPx = p1.x > p2.x ? p1.x : p2.x
        const minPy = p1.y < p2.y ? p1.y : p2.y
        const maxPy = p1.y > p2.y ? p1.y : p2.y

        const minEx = e1.x < e2.x ? e1.x : e2.x
        const maxEx = e1.x > e2.x ? e1.x : e2.x
        const minEy = e1.y < e2.y ? e1.y : e2.y
        const maxEy = e1.y > e2.y ? e1.y : e2.y

        const overlapX =
            (minPx > minEx ? minPx : minEx) <= (maxPx < maxEx ? maxPx : maxEx)
        const overlapY =
            (minPy > minEy ? minPy : minEy) <= (maxPy < maxEy ? maxPy : maxEy)

        if (overlapX && overlapY) {
            const startOverlapX = minPx > minEx ? minPx : minEx
            const endOverlapX = maxPx < maxEx ? maxPx : maxEx
            const startOverlapY = minPy > minEy ? minPy : minEy
            const endOverlapY = maxPy < maxEy ? maxPy : maxEy

            const isPointTouch =
                startOverlapX === endOverlapX && startOverlapY === endOverlapY

            if (isPointTouch) {
                const touchPoint: LatticePoint = {
                    x: startOverlapX,
                    y: startOverlapY,
                }
                const { tNum, tDen } = deriveCollinearParam(touchPoint, p1, p2)
                return {
                    intersects: true,
                    kind: 'COLLINEAR_TOUCH',
                    tNum,
                    tDen,
                }
            }

            // Derives the earliest arrival parameter along the overlapping segment
            const firstTouchX = p1.x <= p2.x ? startOverlapX : endOverlapX
            const firstTouchY = p1.y <= p2.y ? startOverlapY : endOverlapY
            const firstTouchPt: LatticePoint = {
                x: firstTouchX,
                y: firstTouchY,
            }
            const { tNum, tDen } = deriveCollinearParam(firstTouchPt, p1, p2)

            return {
                intersects: true,
                kind: 'COLLINEAR_OVERLAP',
                tNum,
                tDen,
            }
        }

        return {
            intersects: false,
            kind: 'COLLINEAR_DISJOINT',
            tNum: 0n,
            tDen: 1n,
        }
    }

    // 3. Vertex / Endpoint Touching Cases
    // 3.1 Edge endpoint E1 lies on ray segment p1 -> p2
    if (d1 === 0n && isPointInBoundingBox(e1, p1, p2)) {
        const { tNum, tDen } = deriveCollinearParam(e1, p1, p2)
        return {
            intersects: true,
            kind: 'VERTEX_GRAZE_E1',
            tNum,
            tDen,
        }
    }

    // 3.2 Edge endpoint E2 lies on ray segment p1 -> p2
    if (d2 === 0n && isPointInBoundingBox(e2, p1, p2)) {
        const { tNum, tDen } = deriveCollinearParam(e2, p1, p2)
        return {
            intersects: true,
            kind: 'VERTEX_GRAZE_E2',
            tNum,
            tDen,
        }
    }

    // 3.3 Ray origin P1 lies on edge segment e1 -> e2
    if (d3 === 0n && isPointInBoundingBox(p1, e1, e2)) {
        return {
            intersects: true,
            kind: 'TOUCH_RAY_ENDPOINT_P1',
            tNum: 0n,
            tDen: 1n,
        }
    }

    // 3.4 Ray target P2 lies on edge segment e1 -> e2
    if (d4 === 0n && isPointInBoundingBox(p2, e1, e2)) {
        return {
            intersects: true,
            kind: 'TOUCH_RAY_ENDPOINT_P2',
            tNum: 1n,
            tDen: 1n,
        }
    }

    // 4. Default: Disjoint (Miss)
    return {
        intersects: false,
        kind: 'DISJOINT',
        tNum: 0n,
        tDen: 1n,
    }
}
