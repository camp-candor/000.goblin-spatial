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
} from './index.js'
import type { TacticalCellId, TacticalEdgeId } from './index.js'

describe('01.lattice.unit bit-packing bijection & lexicographical monotonicity', () => {
    describe('1. Bijective Invertibility & Boundary Extrema', () => {
        it('round-trips the lattice origin (0, 0) with zero sign-bit corruption', () => {
            const packed = packAxialCell(0, 0)
            // ( (0 + 32768) << 16 ) | (0 + 32768) = (32768 << 16) | 32768 = 2147516416 (0x80008000)
            expect(packed).toBe(2147516416)
            expect(packed).toBeGreaterThan(0)

            const coord = unpackAxialCell(packed)
            expect(coord.q).toBe(0)
            expect(coord.r).toBe(0)
            expect(coord.s).toBe(0)
            expect(coord.q + coord.r + coord.s).toBe(0)
        })

        it('round-trips all four extreme boundary corners of the coordinate space', () => {
            const corners = [
                { q: AXIAL_COORD_MIN, r: AXIAL_COORD_MIN, expectedPacked: 0 },
                {
                    q: AXIAL_COORD_MIN,
                    r: AXIAL_COORD_MAX,
                    expectedPacked: 65535,
                },
                {
                    q: AXIAL_COORD_MAX,
                    r: AXIAL_COORD_MIN,
                    expectedPacked: 4294901760,
                },
                {
                    q: AXIAL_COORD_MAX,
                    r: AXIAL_COORD_MAX,
                    expectedPacked: MAX_PACKED_CELL_ID,
                },
            ]

            for (const { q, r, expectedPacked } of corners) {
                const packed = packAxialCell(q, r)
                expect(packed).toBe(expectedPacked)
                expect(packed).toBeGreaterThanOrEqual(0)
                expect(packed).toBeLessThanOrEqual(MAX_PACKED_CELL_ID)

                const unpacked = unpackAxialCell(packed)
                expect(unpacked.q).toBe(q)
                expect(unpacked.r).toBe(r)
                expect(unpacked.s).toBe(-q - r)
                expect(unpacked.q + unpacked.r + unpacked.s).toBe(0)
            }
        })

        it('verifies deterministic bijection over stepped coordinate grids', () => {
            // Step through coordinate space from min to max across coarse intervals
            for (let q = AXIAL_COORD_MIN; q <= AXIAL_COORD_MAX; q += 4096) {
                for (let r = AXIAL_COORD_MIN; r <= AXIAL_COORD_MAX; r += 4096) {
                    const packed = packAxialCell(q, r)
                    const unpacked = unpackAxialCell(packed)

                    expect(unpacked.q).toBe(q)
                    expect(unpacked.r).toBe(r)
                    const expectedS = -q - r === 0 ? 0 : -q - r
                    expect(unpacked.s).toBe(expectedS)
                    expect(unpacked.q + unpacked.r + unpacked.s).toBe(0)
                }
            }
        })

        it('verifies deterministic pseudo-random fuzz samples across full domain', () => {
            // Linear Congruential Generator (LCG) for deterministic seed testing (zero Math.random)
            let seed = 1337420
            const lcg = () => {
                seed = (seed * 1664525 + 1013904223) >>> 0
                return seed
            }

            const sampleCount = 2000
            for (let i = 0; i < sampleCount; i++) {
                const q =
                    (lcg() % (AXIAL_COORD_MAX - AXIAL_COORD_MIN + 1)) +
                    AXIAL_COORD_MIN
                const r =
                    (lcg() % (AXIAL_COORD_MAX - AXIAL_COORD_MIN + 1)) +
                    AXIAL_COORD_MIN

                const packed = packAxialCell(q, r)
                const unpacked = unpackAxialCell(packed)

                expect(unpacked.q).toBe(q)
                expect(unpacked.r).toBe(r)
                const expectedS = -q - r === 0 ? 0 : -q - r
                expect(unpacked.s).toBe(expectedS)
            }
        })
    })

    describe('2. Lexicographical Monotonicity & Sign-Bit Shift Immunity', () => {
        it('proves pack(0, 0) > pack(-1, 32767) (confirming absence of signed shift bug)', () => {
            const idNeg = packAxialCell(-1, 32767)
            const idZero = packAxialCell(0, 0)

            // In buggy signed Int32 shift: (32767 << 16) is positive, but (32768 << 16) is -2147483648.
            // With (>>> 0), idZero = 2147516416 and idNeg = 2147483647.
            expect(idZero).toBeGreaterThan(idNeg)
            expect(idZero - idNeg).toBe(32769)
        })

        it('strictly preserves lexicographical ordering across primary and secondary axes', () => {
            const orderedPairs = [
                { a: [-32768, -32768], b: [-32768, -32767] },
                { a: [-32768, 32767], b: [-32767, -32768] },
                { a: [-1, 0], b: [-1, 1] },
                { a: [-1, 32767], b: [0, -32768] },
                { a: [0, 0], b: [0, 1] },
                { a: [0, 32767], b: [1, -32768] },
                { a: [32766, 32767], b: [32767, -32768] },
                { a: [32767, 32766], b: [32767, 32767] },
            ]

            for (const { a, b } of orderedPairs) {
                const packedA = packAxialCell(a[0], a[1])
                const packedB = packAxialCell(b[0], b[1])

                expect(packedA).toBeLessThan(packedB)
            }
        })

        it('verifies strict monotonicity across row increments', () => {
            const testQ = 42
            for (let r = -500; r < 500; r++) {
                const p1 = packAxialCell(testQ, r)
                const p2 = packAxialCell(testQ, r + 1)
                expect(p1).toBeLessThan(p2)
                expect(p2 - p1).toBe(1)
            }
        })

        it('verifies strict monotonicity across column increments', () => {
            for (let q = -500; q < 500; q++) {
                const p1 = packAxialCell(q, 32767)
                const p2 = packAxialCell(q + 1, -32768)
                expect(p1).toBeLessThan(p2)
                expect(p2 - p1).toBe(1)
            }
        })
    })

    describe('3. Commutative Undirected Edge Keys & Canonical Ordering', () => {
        it('proves commutativity: packEdgeKey(A, B) === packEdgeKey(B, A)', () => {
            const cellA = packAxialCell(12, -4)
            const cellB = packAxialCell(13, -5)

            const keyAB = packEdgeKey(cellA, cellB)
            const keyBA = packEdgeKey(cellB, cellA)

            expect(keyAB).toBe(keyBA)
            expect(typeof keyAB).toBe('bigint')
        })

        it('guarantees min ID occupies high 32 bits and max ID occupies low 32 bits', () => {
            const cellMin = packAxialCell(-100, 200)
            const cellMax = packAxialCell(100, -200)
            expect(cellMin).toBeLessThan(cellMax)

            const key = packEdgeKey(cellMax, cellMin)
            const [unpackedMin, unpackedMax] = unpackEdgeKey(key)

            expect(unpackedMin).toBe(cellMin)
            expect(unpackedMax).toBe(cellMax)

            // Directly assert BigInt bit positions
            const expectedBigInt = (BigInt(cellMin) << 32n) | BigInt(cellMax)
            expect(key).toBe(expectedBigInt)
        })

        it('round-trips edge keys across boundary cell IDs', () => {
            const cellA = packAxialCell(AXIAL_COORD_MIN, AXIAL_COORD_MIN) // 0
            const cellB = packAxialCell(AXIAL_COORD_MAX, AXIAL_COORD_MAX) // 4294967295

            const key = packEdgeKey(cellA, cellB)
            const [unpackedMin, unpackedMax] = unpackEdgeKey(key)

            expect(unpackedMin).toBe(cellA)
            expect(unpackedMax).toBe(cellB)
            expect(key).toBe(4294967295n) // (0n << 32n) | 4294967295n
        })
    })

    describe('4. Universal Negative Controls & Fail-Closed Bounds', () => {
        it('throws TypeError on non-integer floating-point inputs', () => {
            expect(() => packAxialCell(1.5, 0)).toThrow(TypeError)
            expect(() => packAxialCell(0, -2.25)).toThrow(TypeError)
            expect(() => packAxialCell(NaN, 0)).toThrow(TypeError)
            expect(() => packAxialCell(0, Infinity)).toThrow(TypeError)
        })

        it('throws RangeError when coordinates exceed allowable bounds', () => {
            expect(() => packAxialCell(-32769, 0)).toThrow(RangeError)
            expect(() => packAxialCell(32768, 0)).toThrow(RangeError)
            expect(() => packAxialCell(0, -32769)).toThrow(RangeError)
            expect(() => packAxialCell(0, 32768)).toThrow(RangeError)
        })

        it('throws TypeError on invalid unpackAxialCell parameters', () => {
            expect(() => unpackAxialCell(-1)).toThrow(TypeError)
            expect(() => unpackAxialCell(MAX_PACKED_CELL_ID + 1)).toThrow(
                TypeError,
            )
            expect(() => unpackAxialCell(42.5)).toThrow(TypeError)
            expect(() => unpackAxialCell(NaN)).toThrow(TypeError)
        })

        it('throws TypeError on invalid packEdgeKey parameters', () => {
            expect(() => packEdgeKey(-1, 100)).toThrow(TypeError)
            expect(() => packEdgeKey(100, MAX_PACKED_CELL_ID + 1)).toThrow(
                TypeError,
            )
            expect(() => packEdgeKey(12.34, 100)).toThrow(TypeError)
        })

        it('throws TypeError on invalid unpackEdgeKey parameters', () => {
            expect(() => unpackEdgeKey(-1n)).toThrow(TypeError)
            expect(() => unpackEdgeKey(18446744073709551616n)).toThrow(
                TypeError,
            ) // > 64-bit uint
            expect(() => unpackEdgeKey(100 as any)).toThrow(TypeError) // Not a BigInt
        })
    })
})
