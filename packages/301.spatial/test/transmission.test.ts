import { describe, it, expect } from 'vitest'
import {
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../28.axial.unit/val/axial.model.js'
import {
    toBasisPoints,
    clampBasisPoints,
    scaleBasisPointsRoundHalfEven,
} from '../40.witness.unit/val/witness.model.js'
import { computeOpticalTransmission } from '../40.witness.unit/buz/witness.buzz.js'
import { OpticalTransmissionQuery } from '../40.witness.unit/fce/witness.interface.js'

describe('Task 4.3 Optical Transmission Basis Point Calculation', () => {
    it('enforces strict basis point bounds [0, 10000]', () => {
        expect(toBasisPoints(0)).toBe(0)
        expect(toBasisPoints(10000)).toBe(10000)
        expect(toBasisPoints(4500)).toBe(4500)

        expect(() => toBasisPoints(-1)).toThrow(RangeError)
        expect(() => toBasisPoints(10001)).toThrow(RangeError)
        // @ts-expect-error - testing float rejection
        expect(() => toBasisPoints(500.5)).toThrow(TypeError)
    })

    it('performs Banker Rounding (Round-Half-Even) on basis-point multiplications', () => {
        // Even tie check: (2 * 5000) / 10000 = 1.0 (remainder 0)
        expect(
            scaleBasisPointsRoundHalfEven(
                toBasisPoints(2),
                toBasisPoints(5000),
            ),
        ).toBe(1)

        // Round toward nearest even when remainder is exact half:
        // a = 3, b = 5000 -> product = 15000. quotient = 1, remainder = 5000.
        // 1 is odd -> rounds to 2
        expect(
            scaleBasisPointsRoundHalfEven(
                toBasisPoints(3),
                toBasisPoints(5000),
            ),
        ).toBe(2)

        // a = 2, b = 2500 -> product = 5000. quotient = 0, remainder = 5000.
        // 0 is even -> rounds to 0
        expect(
            scaleBasisPointsRoundHalfEven(
                toBasisPoints(2),
                toBasisPoints(2500),
            ),
        ).toBe(0)
    })

    it('evaluates clear line of sight with 10000 bp transmission', () => {
        const origin = createAxialCoord(0, 0)
        const target = createAxialCoord(0, 3)
        const path = [
            origin,
            createAxialCoord(0, 1),
            createAxialCoord(0, 2),
            target,
        ]

        const query: OpticalTransmissionQuery = {
            origin,
            target,
            traversedCells: path,
        }

        const receipt = computeOpticalTransmission(query, () =>
            toBasisPoints(0),
        )
        expect(receipt.transmissionBps).toBe(10000)
        expect(receipt.accumulatedOpacityBps).toBe(0)
        expect(receipt.isVisible).toBe(true)
        expect(receipt.severedAtCell).toBeUndefined()
    })

    it('drops transmission to 0 bp when traversing solid wall (10000 bp opacity)', () => {
        const origin = createAxialCoord(0, 0)
        const wallCoord = createAxialCoord(0, 2)
        const target = createAxialCoord(0, 4)
        const path = [
            origin,
            createAxialCoord(0, 1),
            wallCoord,
            createAxialCoord(0, 3),
            target,
        ]

        const wallPacked = packAxial(wallCoord.q, wallCoord.r)
        const opacityMap = new Map<PackedAxial, number>([[wallPacked, 10000]])

        const query: OpticalTransmissionQuery = {
            origin,
            target,
            traversedCells: path,
        }

        const receipt = computeOpticalTransmission(query, (p) =>
            toBasisPoints(opacityMap.get(p) || 0),
        )
        expect(receipt.transmissionBps).toBe(0)
        expect(receipt.accumulatedOpacityBps).toBe(10000)
        expect(receipt.isVisible).toBe(false)
        expect(receipt.severedAtCell).toBe(wallPacked)
    })

    it('accumulates partial opacity from steam and foliage correctly in linear mode', () => {
        const origin = createAxialCoord(0, 0)
        const c1 = createAxialCoord(0, 1) // 1500 bp steam
        const c2 = createAxialCoord(0, 2) // 2500 bp smoke
        const target = createAxialCoord(0, 3)
        const path = [origin, c1, c2, target]

        const opacities = new Map<PackedAxial, number>([
            [packAxial(c1.q, c1.r), 1500],
            [packAxial(c2.q, c2.r), 2500],
        ])

        const query: OpticalTransmissionQuery = {
            origin,
            target,
            traversedCells: path,
            calculationMode: 'SUBTRACTIVE_LINEAR',
        }

        const receipt = computeOpticalTransmission(query, (p) =>
            toBasisPoints(opacities.get(p) || 0),
        )
        // 10000 - (1500 + 2500) = 6000 bp
        expect(receipt.accumulatedOpacityBps).toBe(4000)
        expect(receipt.transmissionBps).toBe(6000)
        expect(receipt.isVisible).toBe(true)
    })

    it('enforces endpoint exemption for origin and target cells', () => {
        const origin = createAxialCoord(0, 0)
        const mid = createAxialCoord(0, 1)
        const target = createAxialCoord(0, 2)
        const path = [origin, mid, target]

        // Origin and target marked as 10000 bp opacity (e.g., actor in doorway or bunker)
        const opacities = new Map<PackedAxial, number>([
            [packAxial(origin.q, origin.r), 10000],
            [packAxial(mid.q, mid.r), 1000],
            [packAxial(target.q, target.r), 10000],
        ])

        const query: OpticalTransmissionQuery = {
            origin,
            target,
            traversedCells: path,
        }

        const receipt = computeOpticalTransmission(query, (p) =>
            toBasisPoints(opacities.get(p) || 0),
        )
        // Only mid cell (1000 bp) counts
        expect(receipt.accumulatedOpacityBps).toBe(1000)
        expect(receipt.transmissionBps).toBe(9000)
        expect(receipt.isVisible).toBe(true)
    })

    it('evaluates Beer-Lambert multiplicative mode without float drift', () => {
        const origin = createAxialCoord(0, 0)
        const c1 = createAxialCoord(0, 1) // 5000 bp (50% opacity)
        const c2 = createAxialCoord(0, 2) // 5000 bp (50% opacity)
        const target = createAxialCoord(0, 3)
        const path = [origin, c1, c2, target]

        const opacities = new Map<PackedAxial, number>([
            [packAxial(c1.q, c1.r), 5000],
            [packAxial(c2.q, c2.r), 5000],
        ])

        const query: OpticalTransmissionQuery = {
            origin,
            target,
            traversedCells: path,
            calculationMode: 'MULTIPLICATIVE_BEER_LAMBERT',
        }

        const receipt = computeOpticalTransmission(query, (p) =>
            toBasisPoints(opacities.get(p) || 0),
        )
        // T = 10000 * 0.5 = 5000; 5000 * 0.5 = 2500 bp
        expect(receipt.transmissionBps).toBe(2500)
        expect(receipt.accumulatedOpacityBps).toBe(7500)
        expect(receipt.isVisible).toBe(true)
    })
})
