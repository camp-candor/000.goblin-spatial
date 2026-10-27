import { describe, it, expect } from 'vitest'
import {
    packAxialCell,
    unpackAxialCell,
    packEdgeKey,
    unpackEdgeKey,
    COORD_OFFSET,
    AXIAL_COORD_MIN,
    AXIAL_COORD_MAX,
    MAX_PACKED_CELL_ID,
} from '../index.js'

describe('01.lattice.unit bit-packing & commutative edge keys', () => {
    describe('packAxialCell & unpackAxialCell Bijection', () => {
        it('round-trips the origin (0, 0) with zero sign-bit corruption', () => {
            const packed = packAxialCell(0, 0)
            expect(packed).toBeGreaterThan(0)
            // (32768 << 16) | 32768 = 2147516416
            expect(packed).toBe(2147516416)

            const unpacked = unpackAxialCell(packed)
            expect(unpacked.q).toBe(0)
            expect(unpacked.r).toBe(0)
            expect(unpacked.s).toBe(0)
            expect(unpacked.q + unpacked.r + unpacked.s).toBe(0)
        })

        it('round-trips the four extreme boundary corners', () => {
            const corners = [
                { q: AXIAL_COORD_MIN, r: AXIAL_COORD_MIN },
                { q: AXIAL_COORD_MIN, r: AXIAL_COORD_MAX },
                { q: AXIAL_COORD_MAX, r: AXIAL_COORD_MIN },
                { q: AXIAL_COORD_MAX, r: AXIAL_COORD_MAX },
            ]

            for (const { q, r } of corners) {
                const packed = packAxialCell(q, r)
                expect(packed).toBeGreaterThanOrEqual(0)
                expect(packed).toBeLessThanOrEqual(MAX_PACKED_CELL_ID)

                const unpacked = unpackAxialCell(packed)
                expect(unpacked.q).toBe(q)
                expect(unpacked.r).toBe(r)
                expect(unpacked.s).toBe(-q - r)
            }
        })

        it('guarantees min boundary (-32768, -32768) packs to exactly 0', () => {
            const packed = packAxialCell(AXIAL_COORD_MIN, AXIAL_COORD_MIN)
            expect(packed).toBe(0)
            const unpacked = unpackAxialCell(packed)
            expect(unpacked.q).toBe(-32768)
            expect(unpacked.r).toBe(-32768)
        })

        it('guarantees max boundary (32767, 32767) packs to exactly 0xFFFFFFFF (4294967295)', () => {
            const packed = packAxialCell(AXIAL_COORD_MAX, AXIAL_COORD_MAX)
            expect(packed).toBe(MAX_PACKED_CELL_ID)
            const unpacked = unpackAxialCell(packed)
            expect(unpacked.q).toBe(32767)
            expect(unpacked.r).toBe(32767)
        })
    })

    describe('Strict Lexicographical Monotonicity', () => {
        it('proves pack(0, 0) > pack(-1, 32767) (absence of signed shift bug)', () => {
            const idNeg = packAxialCell(-1, 32767)
            const idZero = packAxialCell(0, 0)

            // In buggy signed Int32 shift: idZero is negative (-2147450880) and idNeg is positive.
            // In unsigned cast: idNeg is 2147483647 and idZero is 2147516416.
            expect(idZero).toBeGreaterThan(idNeg)
        })

        it('preserves lexicographical ordering across q and r coordinates', () => {
            const pairs = [
                { a: [-10, 5], b: [-10, 6] },
                { a: [-1, -1], b: [0, -32768] },
                { a: [0, 100], b: [1, -100] },
                { a: [100, 20], b: [100, 21] },
            ]

            for (const { a, b } of pairs) {
                const packedA = packAxialCell(a[0], a[1])
                const packedB = packAxialCell(b[0], b[1])
                expect(packedA).toBeLessThan(packedB)
            }
        })
    })

    describe('Input Type & Bounds Guarding', () => {
        it('throws TypeError on non-integer floats and NaN', () => {
            expect(() => packAxialCell(0.5, 0)).toThrow(TypeError)
            expect(() => packAxialCell(0, -1.2)).toThrow(TypeError)
            expect(() => packAxialCell(NaN, 0)).toThrow(TypeError)
            expect(() => packAxialCell(0, Infinity)).toThrow(TypeError)
        })

        it('throws RangeError when coordinates exceed lattice bounds', () => {
            expect(() => packAxialCell(-32769, 0)).toThrow(RangeError)
            expect(() => packAxialCell(32768, 0)).toThrow(RangeError)
            expect(() => packAxialCell(0, -32769)).toThrow(RangeError)
            expect(() => packAxialCell(0, 32768)).toThrow(RangeError)
        })

        it('rejects invalid inputs to unpackAxialCell', () => {
            expect(() => unpackAxialCell(-1 as any)).toThrow(TypeError)
            expect(() =>
                unpackAxialCell((MAX_PACKED_CELL_ID + 1) as any),
            ).toThrow(TypeError)
            expect(() => unpackAxialCell(2.5 as any)).toThrow(TypeError)
        })
    })

    describe('packEdgeKey & unpackEdgeKey Commutativity & Injectivity', () => {
        it('proves commutativity: packEdgeKey(A, B) === packEdgeKey(B, A)', () => {
            const cellA = packAxialCell(12, -4)
            const cellB = packAxialCell(13, -5)

            const key1 = packEdgeKey(cellA, cellB)
            const key2 = packEdgeKey(cellB, cellA)

            expect(key1).toBe(key2)
            expect(typeof key1).toBe('bigint')
        })

        it('places the smaller packed ID in high 32 bits and larger in low 32 bits', () => {
            const cellSmall = packAxialCell(-10, -10)
            const cellLarge = packAxialCell(10, 10)
            expect(cellSmall).toBeLessThan(cellLarge)

            const edgeKey = packEdgeKey(cellLarge, cellSmall)
            const [unpackedMin, unpackedMax] = unpackEdgeKey(edgeKey)

            expect(unpackedMin).toBe(cellSmall)
            expect(unpackedMax).toBe(cellLarge)
        })

        it('throws TypeError when packing edges with invalid cell IDs', () => {
            expect(() => packEdgeKey(-1 as any, 100 as any)).toThrow(TypeError)
            expect(() => packEdgeKey(100 as any, 4294967296 as any)).toThrow(
                TypeError,
            )
            expect(() => unpackEdgeKey(-1n as any)).toThrow(TypeError)
        })
    })
})
