import { describe, it, expect } from 'vitest'
import {
    createAxialCoord,
    isAxialCoord,
    assertPlanarCubicInvariant,
    asTacticalCellId,
    asTacticalEdgeId,
    createLatticePoint,
    AXIAL_COORD_MIN,
    AXIAL_COORD_MAX,
} from '../index.js'
import type { TacticalCellId, TacticalEdgeId } from '../index.js'

describe('01.lattice.unit branded integer primitives & domain interfaces', () => {
    describe('Axial Coordinate Construction & Cubic Invariant', () => {
        it('derives s = -q - r and confirms q + r + s === 0', () => {
            const coord = createAxialCoord(12, -4)
            expect(coord.q).toBe(12)
            expect(coord.r).toBe(-4)
            expect(coord.s).toBe(-8)
            expect(coord.q + coord.r + coord.s).toBe(0)
            expect(Object.isFrozen(coord)).toBe(true)
        })

        it('validates axial coordinates across boundary corners', () => {
            const minCorner = createAxialCoord(AXIAL_COORD_MIN, 0)
            expect(minCorner.q).toBe(-32768)
            expect(minCorner.s).toBe(32768)

            const maxCorner = createAxialCoord(AXIAL_COORD_MAX, -32767)
            expect(maxCorner.q).toBe(32767)
            expect(maxCorner.r).toBe(-32767)
            expect(maxCorner.s).toBe(0)
        })

        it('rejects non-integer floating-point coordinates', () => {
            expect(() => createAxialCoord(1.5, -1.5)).toThrow(TypeError)
            expect(() => createAxialCoord(10, NaN)).toThrow(TypeError)
            expect(() => createAxialCoord(Infinity, 0)).toThrow(TypeError)
        })

        it('rejects coordinates exceeding valid bounds', () => {
            expect(() => createAxialCoord(32768, 0)).toThrow(RangeError)
            expect(() => createAxialCoord(0, -32769)).toThrow(RangeError)
        })

        it('assertPlanarCubicInvariant throws when q + r + s !== 0', () => {
            const corrupted = { q: 1, r: 1, s: 0 } as any
            expect(() => assertPlanarCubicInvariant(corrupted)).toThrow(
                /CUBIC_INVARIANT_BREACH/,
            )
        })

        it('isAxialCoord type guard correctly identifies valid vs invalid shapes', () => {
            expect(isAxialCoord({ q: 5, r: -2, s: -3 })).toBe(true)
            expect(isAxialCoord({ q: 5, r: -2, s: 0 })).toBe(false)
            expect(isAxialCoord({ q: '5', r: -2, s: -3 })).toBe(false)
            expect(isAxialCoord(null)).toBe(false)
            expect(isAxialCoord({ q: 1.2, r: -1.2, s: 0 })).toBe(false)
        })
    })

    describe('Nominal Branding Assertions', () => {
        it('brands unsigned 32-bit cell integers cleanly', () => {
            const packed = 2147516416 // Valid packed 32-bit uint
            const cellId: TacticalCellId = asTacticalCellId(packed)
            expect(typeof cellId).toBe('number')
            expect(cellId).toBe(packed)
        })

        it('rejects negative or overflow values for TacticalCellId', () => {
            expect(() => asTacticalCellId(-1)).toThrow(TypeError)
            expect(() => asTacticalCellId(0x100000000)).toThrow(TypeError)
            expect(() => asTacticalCellId(12.34)).toThrow(TypeError)
        })

        it('brands unsigned 64-bit BigInt edge keys cleanly', () => {
            const rawKey = 9223372036854775807n
            const edgeId: TacticalEdgeId = asTacticalEdgeId(rawKey)
            expect(typeof edgeId).toBe('bigint')
            expect(edgeId).toBe(rawKey)
        })

        it('rejects negative values for TacticalEdgeId', () => {
            expect(() => asTacticalEdgeId(-1n)).toThrow(TypeError)
        })
    })

    describe('Doubled Coordinate LatticePoint Construction', () => {
        it('creates immutable BigInt doubled affine points', () => {
            const pt = createLatticePoint(40, -12)
            expect(pt.x).toBe(40n)
            expect(pt.y).toBe(-12n)
            expect(Object.isFrozen(pt)).toBe(true)
        })

        it('truncates any accidental float inputs to BigInt cleanly', () => {
            const pt = createLatticePoint(40.9, -12.1)
            expect(pt.x).toBe(40n)
            expect(pt.y).toBe(-12n)
        })
    })
})
