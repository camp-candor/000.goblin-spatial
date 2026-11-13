import { describe, it, expect } from 'vitest'
import {
    crossProduct,
    isPointInBoundingBox,
    isPointOnSegment,
    compareRationals,
    classifySegmentEdgeIntersection,
} from '../index.js'
import type { LatticePoint } from '../../01.lattice.unit/index.js'

describe('02.supercover.unit exact 2D integer cross-product & segment intersection predicates', () => {
    describe('1. crossProduct Orientation Properties', () => {
        it('evaluates collinear points to exactly 0n', () => {
            const a: LatticePoint = { x: 0n, y: 0n }
            const b: LatticePoint = { x: 4n, y: 4n }
            const c: LatticePoint = { x: 8n, y: 8n }
            expect(crossProduct(a, b, c)).toBe(0n)
        })

        it('distinguishes counter-clockwise (left turn) and clockwise (right turn)', () => {
            const a: LatticePoint = { x: 0n, y: 0n }
            const b: LatticePoint = { x: 4n, y: 0n }
            const leftPt: LatticePoint = { x: 2n, y: 2n }
            const rightPt: LatticePoint = { x: 2n, y: -2n }

            // Directed vector A -> B along +X. Point with +Y is to the left (> 0n)
            expect(crossProduct(a, b, leftPt)).toBeGreaterThan(0n)
            // Point with -Y is to the right (< 0n)
            expect(crossProduct(a, b, rightPt)).toBeLessThan(0n)
        })

        it('satisfies anticommutativity: cross(A, B, C) === -cross(A, C, B)', () => {
            const a: LatticePoint = { x: 12n, y: -4n }
            const b: LatticePoint = { x: 18n, y: 10n }
            const c: LatticePoint = { x: 2n, y: 30n }

            const cp1 = crossProduct(a, b, c)
            const cp2 = crossProduct(a, c, b)

            expect(cp1).toBe(-cp2)
        })
    })

    describe('2. Bounding Box & Point-on-Segment Verification', () => {
        const p1: LatticePoint = { x: -10n, y: -10n }
        const p2: LatticePoint = { x: 10n, y: 10n }

        it('correctly tests point containment in bounding box', () => {
            expect(isPointInBoundingBox({ x: 0n, y: 0n }, p1, p2)).toBe(true)
            expect(isPointInBoundingBox({ x: -10n, y: 10n }, p1, p2)).toBe(true)
            expect(isPointInBoundingBox({ x: 11n, y: 0n }, p1, p2)).toBe(false)
            expect(isPointInBoundingBox({ x: 0n, y: -12n }, p1, p2)).toBe(false)
        })

        it('verifies points on segment requiring both collinearity and bounding box inclusion', () => {
            expect(isPointOnSegment({ x: 0n, y: 0n }, p1, p2)).toBe(true)
            expect(isPointOnSegment({ x: -10n, y: -10n }, p1, p2)).toBe(true) // Endpoint
            expect(isPointOnSegment({ x: 20n, y: 20n }, p1, p2)).toBe(false) // Collinear but outside segment
            expect(isPointOnSegment({ x: 0n, y: 5n }, p1, p2)).toBe(false) // Non-collinear
        })
    })

    describe('3. compareRationals Exact Fractions Comparison', () => {
        it('compares fractions with zero floating-point division', () => {
            expect(compareRationals(1n, 3n, 1n, 2n)).toBe(-1) // 1/3 < 1/2
            expect(compareRationals(2n, 4n, 1n, 2n)).toBe(0) // 2/4 === 1/2
            expect(compareRationals(3n, 4n, 2n, 3n)).toBe(1) // 3/4 > 2/3
        })

        it('handles negative fractions and signs cleanly', () => {
            expect(compareRationals(-1n, 2n, 1n, 2n)).toBe(-1)
            expect(compareRationals(1n, -2n, -1n, 2n)).toBe(0)
        })

        it('throws RangeError on division by zero', () => {
            expect(() => compareRationals(1n, 0n, 1n, 2n)).toThrow(RangeError)
        })
    })

    describe('4. classifySegmentEdgeIntersection Detailed Classifications', () => {
        it('identifies STRICT_CROSSING with exact parametric t', () => {
            // Ray horizontal: (-5, 0) -> (5, 0)
            const p1: LatticePoint = { x: -5n, y: 0n }
            const p2: LatticePoint = { x: 5n, y: 0n }
            // Edge vertical: (0, -4) -> (0, 4)
            const e1: LatticePoint = { x: 0n, y: -4n }
            const e2: LatticePoint = { x: 0n, y: 4n }

            const res = classifySegmentEdgeIntersection(p1, p2, e1, e2)
            expect(res.intersects).toBe(true)
            expect(res.kind).toBe('STRICT_CROSSING')

            // Midpoint of ray: t = 1/2
            expect(res.tNum).toBe(40n)
            expect(res.tDen).toBe(80n)
            expect(compareRationals(res.tNum, res.tDen, 1n, 2n)).toBe(0)
        })

        it('identifies COLLINEAR_OVERLAP', () => {
            const p1: LatticePoint = { x: 0n, y: 0n }
            const p2: LatticePoint = { x: 10n, y: 0n }
            const e1: LatticePoint = { x: 5n, y: 0n }
            const e2: LatticePoint = { x: 15n, y: 0n }

            const res = classifySegmentEdgeIntersection(p1, p2, e1, e2)
            expect(res.intersects).toBe(true)
            expect(res.kind).toBe('COLLINEAR_OVERLAP')
            // Overlap begins at x = 5 (t = 5/10 = 1/2)
            expect(compareRationals(res.tNum, res.tDen, 1n, 2n)).toBe(0)
        })

        it('identifies COLLINEAR_DISJOINT', () => {
            const p1: LatticePoint = { x: 0n, y: 0n }
            const p2: LatticePoint = { x: 5n, y: 0n }
            const e1: LatticePoint = { x: 8n, y: 0n }
            const e2: LatticePoint = { x: 12n, y: 0n }

            const res = classifySegmentEdgeIntersection(p1, p2, e1, e2)
            expect(res.intersects).toBe(false)
            expect(res.kind).toBe('COLLINEAR_DISJOINT')
        })

        it('identifies VERTEX_GRAZE_E1 and VERTEX_GRAZE_E2', () => {
            const p1: LatticePoint = { x: 0n, y: 0n }
            const p2: LatticePoint = { x: 10n, y: 0n }

            // Edge touches ray at E1 = (5, 0)
            const e1A: LatticePoint = { x: 5n, y: 0n }
            const e2A: LatticePoint = { x: 5n, y: 5n }
            const resA = classifySegmentEdgeIntersection(p1, p2, e1A, e2A)
            expect(resA.intersects).toBe(true)
            expect(resA.kind).toBe('VERTEX_GRAZE_E1')
            expect(compareRationals(resA.tNum, resA.tDen, 1n, 2n)).toBe(0)

            // Edge touches ray at E2 = (5, 0)
            const e1B: LatticePoint = { x: 5n, y: -5n }
            const e2B: LatticePoint = { x: 5n, y: 0n }
            const resB = classifySegmentEdgeIntersection(p1, p2, e1B, e2B)
            expect(resB.intersects).toBe(true)
            expect(resB.kind).toBe('VERTEX_GRAZE_E2')
            expect(compareRationals(resB.tNum, resB.tDen, 1n, 2n)).toBe(0)
        })

        it('identifies TOUCH_RAY_ENDPOINT_P1 and TOUCH_RAY_ENDPOINT_P2', () => {
            // Edge crosses through P1 = (0, 0)
            const p1: LatticePoint = { x: 0n, y: 0n }
            const p2: LatticePoint = { x: 10n, y: 0n }
            const e1: LatticePoint = { x: 0n, y: -4n }
            const e2: LatticePoint = { x: 0n, y: 4n }

            const resP1 = classifySegmentEdgeIntersection(p1, p2, e1, e2)
            expect(resP1.intersects).toBe(true)
            expect(resP1.kind).toBe('TOUCH_RAY_ENDPOINT_P1')
            expect(resP1.tNum).toBe(0n)

            // Edge crosses through P2 = (10, 0)
            const e3: LatticePoint = { x: 10n, y: -4n }
            const e4: LatticePoint = { x: 10n, y: 4n }

            const resP2 = classifySegmentEdgeIntersection(p1, p2, e3, e4)
            expect(resP2.intersects).toBe(true)
            expect(resP2.kind).toBe('TOUCH_RAY_ENDPOINT_P2')
            expect(resP2.tNum).toBe(1n)
        })

        it('identifies DISJOINT for non-intersecting non-parallel segments', () => {
            const p1: LatticePoint = { x: 0n, y: 0n }
            const p2: LatticePoint = { x: 4n, y: 0n }
            const e1: LatticePoint = { x: 2n, y: 2n }
            const e2: LatticePoint = { x: 2n, y: 6n }

            const res = classifySegmentEdgeIntersection(p1, p2, e1, e2)
            expect(res.intersects).toBe(false)
            expect(res.kind).toBe('DISJOINT')
        })
    })
})
