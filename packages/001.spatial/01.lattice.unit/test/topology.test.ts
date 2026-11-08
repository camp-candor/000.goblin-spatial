import { describe, it, expect, vi } from 'vitest'
import {
    axialDistance,
    axialNeighbors,
    axialNeighborInDirection,
    axialRing,
    axialRange,
    HEX_DIRECTIONS,
    packAxialCell,
    unpackAxialCell,
    createAxialCoord,
    latticeReducer,
    LatticeModel,
    LatticeActions,
} from '../index.js'

describe('01.lattice.unit non-euclidean axial distance & topological disks', () => {
    describe('1. axialDistance Metric Space Axioms', () => {
        it('satisfies Identity of Indiscernibles: d(a, a) === 0', () => {
            const cell = packAxialCell(12, -4)
            expect(axialDistance(cell, cell)).toBe(0)

            const coord = createAxialCoord(-5, 9)
            expect(axialDistance(coord, coord)).toBe(0)
        })

        it('satisfies Non-Negativity: d(a, b) >= 0', () => {
            const a = packAxialCell(-100, 50)
            const b = packAxialCell(200, -150)
            expect(axialDistance(a, b)).toBeGreaterThan(0)
        })

        it('satisfies Symmetry: d(a, b) === d(b, a)', () => {
            const pairs = [
                { a: [0, 0], b: [5, -2] },
                { a: [-12, 4], b: [18, -9] },
                { a: [30, 20], b: [-40, -10] },
                { a: [-32768, -32768], b: [32767, 32767] },
            ]

            for (const { a, b } of pairs) {
                const cA = packAxialCell(a[0], a[1])
                const cB = packAxialCell(b[0], b[1])
                expect(axialDistance(cA, cB)).toBe(axialDistance(cB, cA))
            }
        })

        it('satisfies Triangle Inequality: d(a, c) <= d(a, b) + d(b, c)', () => {
            const a = packAxialCell(0, 0)
            const b = packAxialCell(15, -7)
            const c = packAxialCell(-20, 10)

            const dAC = axialDistance(a, c)
            const dAB = axialDistance(a, b)
            const dBC = axialDistance(b, c)

            expect(dAC).toBeLessThanOrEqual(dAB + dBC)
        })

        it('verifies exact integer distance values against known Red Blob samples', () => {
            const cOrigin = packAxialCell(0, 0)
            expect(axialDistance(cOrigin, packAxialCell(1, 0))).toBe(1)
            expect(axialDistance(cOrigin, packAxialCell(1, -1))).toBe(1)
            expect(axialDistance(cOrigin, packAxialCell(0, -1))).toBe(1)
            expect(axialDistance(cOrigin, packAxialCell(-1, 0))).toBe(1)
            expect(axialDistance(cOrigin, packAxialCell(-1, 1))).toBe(1)
            expect(axialDistance(cOrigin, packAxialCell(0, 1))).toBe(1)

            expect(axialDistance(cOrigin, packAxialCell(2, -2))).toBe(2)
            expect(axialDistance(cOrigin, packAxialCell(3, 0))).toBe(3)
            expect(axialDistance(cOrigin, packAxialCell(0, 5))).toBe(5)
        })
    })

    describe('2. HEX_DIRECTIONS & Compass Offsets', () => {
        it('verifies 6 unique clockwise directions conforming to q + r + s === 0', () => {
            expect(HEX_DIRECTIONS.length).toBe(6)
            for (const d of HEX_DIRECTIONS) {
                expect(d.q + d.r + d.s).toBe(0)
                expect(axialDistance({ q: 0, r: 0, s: 0 }, d)).toBe(1)
            }
        })

        it('retrieves accurate neighbor in specified direction index 0..5', () => {
            const origin = packAxialCell(0, 0)
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 0)),
            ).toEqual({ q: 1, r: 0, s: -1 })
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 1)),
            ).toEqual({ q: 1, r: -1, s: 0 })
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 2)),
            ).toEqual({ q: 0, r: -1, s: 1 })
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 3)),
            ).toEqual({ q: -1, r: 0, s: 1 })
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 4)),
            ).toEqual({ q: -1, r: 1, s: 0 })
            expect(
                unpackAxialCell(axialNeighborInDirection(origin, 5)),
            ).toEqual({ q: 0, r: 1, s: -1 })
        })

        it('throws RangeError on invalid direction indices', () => {
            const origin = packAxialCell(0, 0)
            expect(() => axialNeighborInDirection(origin, -1)).toThrow(
                RangeError,
            )
            expect(() => axialNeighborInDirection(origin, 6)).toThrow(
                RangeError,
            )
            expect(() => axialNeighborInDirection(origin, 2.5)).toThrow(
                RangeError,
            )
        })
    })

    describe('3. axialNeighbors 1-Ring Adjacency', () => {
        it('returns exactly 6 contiguous neighbors sorted by ascending packed TacticalCellId', () => {
            const origin = packAxialCell(0, 0)
            const neighbors = axialNeighbors(origin)

            expect(neighbors.length).toBe(6)

            // Assert strict ascending numerical sort order
            for (let i = 0; i < neighbors.length - 1; i++) {
                expect(neighbors[i]).toBeLessThan(neighbors[i + 1])
            }

            // Assert every neighbor has distance exactly 1 from origin
            for (const n of neighbors) {
                expect(axialDistance(origin, n)).toBe(1)
            }
        })
    })

    describe('4. axialRing Hollow Perimeter Formula (6k)', () => {
        it('returns [center] for radius 0', () => {
            const center = packAxialCell(5, -3)
            const ring0 = axialRing(center, 0)
            expect(ring0.length).toBe(1)
            expect(ring0[0]).toBe(center)
        })

        it('returns exactly 6k cells for radii 1, 2, 3, and 5', () => {
            const center = packAxialCell(0, 0)

            const r1 = axialRing(center, 1)
            expect(r1.length).toBe(6 * 1) // 6
            for (const c of r1) expect(axialDistance(center, c)).toBe(1)

            const r2 = axialRing(center, 2)
            expect(r2.length).toBe(6 * 2) // 12
            for (const c of r2) expect(axialDistance(center, c)).toBe(2)

            const r3 = axialRing(center, 3)
            expect(r3.length).toBe(6 * 3) // 18
            for (const c of r3) expect(axialDistance(center, c)).toBe(3)

            const r5 = axialRing(center, 5)
            expect(r5.length).toBe(6 * 5) // 30
            for (const c of r5) expect(axialDistance(center, c)).toBe(5)
        })

        it('guarantees output cells are deterministically sorted by ascending packed ID', () => {
            const center = packAxialCell(-10, 14)
            const ring = axialRing(center, 3)
            for (let i = 0; i < ring.length - 1; i++) {
                expect(ring[i]).toBeLessThan(ring[i + 1])
            }
        })

        it('rejects invalid or negative radius values', () => {
            const center = packAxialCell(0, 0)
            expect(() => axialRing(center, -1)).toThrow(RangeError)
            expect(() => axialRing(center, 1.5)).toThrow(TypeError)
        })
    })

    describe('5. axialRange Filled Disk Formula (1 + 3k(k+1))', () => {
        it('returns [center] for radius 0', () => {
            const center = packAxialCell(0, 0)
            const disk0 = axialRange(center, 0)
            expect(disk0.length).toBe(1)
            expect(disk0[0]).toBe(center)
        })

        it('returns exactly 91 cells for radius 5 disk', () => {
            const center = packAxialCell(0, 0)
            const disk5 = axialRange(center, 5)

            // N = 1 + 3(5)(6) = 91 cells
            expect(disk5.length).toBe(91)

            // Assert all cells are within distance <= 5
            for (const c of disk5) {
                expect(axialDistance(center, c)).toBeLessThanOrEqual(5)
            }

            // Assert strictly unique and sorted
            const uniqueSet = new Set(disk5)
            expect(uniqueSet.size).toBe(91)
            for (let i = 0; i < disk5.length - 1; i++) {
                expect(disk5[i]).toBeLessThan(disk5[i + 1])
            }
        })

        it('verifies disk cell count formula 1 + 3k(k+1) across radii 1 to 4', () => {
            const center = packAxialCell(2, -1)
            expect(axialRange(center, 1).length).toBe(1 + 3 * 1 * 2) // 7
            expect(axialRange(center, 2).length).toBe(1 + 3 * 2 * 3) // 19
            expect(axialRange(center, 3).length).toBe(1 + 3 * 3 * 4) // 37
            expect(axialRange(center, 4).length).toBe(1 + 3 * 4 * 5) // 61
        })
    })

    describe('6. Redux Action & Reducer Integration', () => {
        it('handles DISTANCE_LATTICE action through reducer', () => {
            const model = new LatticeModel()
            const slv = vi.fn()
            const from = packAxialCell(0, 0)
            const to = packAxialCell(4, -2)

            const action = new LatticeActions.DistanceLattice({
                idx: 'dist-test',
                dat: { from, to, distance: 0 },
                slv,
            })

            const nextModel = latticeReducer(model, action)
            expect(nextModel).toBeDefined()
            expect(slv).toHaveBeenCalledWith(
                expect.objectContaining({
                    ltcBit: expect.objectContaining({
                        val: 4,
                        dat: expect.objectContaining({ distance: 4 }),
                    }),
                }),
            )
        })

        it('handles DISK_LATTICE action through reducer for radius 5', () => {
            const model = new LatticeModel()
            const slv = vi.fn()
            const center = packAxialCell(0, 0)

            const action = new LatticeActions.DiskLattice({
                idx: 'disk-test',
                val: 5,
                dat: { center, radius: 5, cellCount: 0, cells: [] },
                slv,
            })

            const nextModel = latticeReducer(model, action)
            expect(nextModel).toBeDefined()
            expect(slv).toHaveBeenCalledWith(
                expect.objectContaining({
                    ltcBit: expect.objectContaining({
                        val: 91,
                        dat: expect.objectContaining({ cellCount: 91 }),
                    }),
                }),
            )
        })
    })
})
