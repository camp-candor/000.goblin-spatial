import { describe, it, expect, beforeEach } from 'vitest'
import {
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../28.axial.unit/val/axial.model.js'
import {
    createCapacityEvaluator,
    CellCapacityEvaluator,
} from '../51.capacity.unit/buz/capacity.buzz.js'
import {
    createOccupancyTracker,
    CellOccupancyTracker,
} from '../44.occupancy.unit/buz/occupancy.buzz.js'
import { resolveDisplacement } from '../50.displacement.unit/buz/displacement.buzz.js'
import { createDisplacementAction } from '../98.menu.unit/buz/06.displacement-menu.buzz.js'
import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js'

describe('Phase 7 Spatial Capacity Displacement Eviction Engine', () => {
    let capacityEvaluator: CellCapacityEvaluator
    let occupancyTracker: CellOccupancyTracker

    beforeEach(() => {
        capacityEvaluator = createCapacityEvaluator({ cellCapacityDefault: 2 })
        occupancyTracker = createOccupancyTracker()
    })

    it('evaluates cell density saturation and flags overcrowding violations', () => {
        const cell = packAxial(0, 0)
        expect(capacityEvaluator.getCapacity(cell)).toBe(2)

        const checkNominal = capacityEvaluator.checkSaturation(cell, 2)
        expect(checkNominal.isOvercrowded).toBe(false)
        expect(checkNominal.excessOccupants).toBe(0)

        const checkOvercrowded = capacityEvaluator.checkSaturation(cell, 3)
        expect(checkOvercrowded.isOvercrowded).toBe(true)
        expect(checkOvercrowded.excessOccupants).toBe(1)
    })

    it('tracks atomic cell occupancy increments and decrements cleanly', () => {
        const cell = packAxial(1, -1)
        expect(occupancyTracker.getOccupancy(cell)).toBe(0)

        expect(occupancyTracker.increment(cell)).toBe(1)
        expect(occupancyTracker.increment(cell)).toBe(2)
        expect(occupancyTracker.decrement(cell)).toBe(1)
        expect(occupancyTracker.decrement(cell)).toBe(0)
        expect(() => occupancyTracker.decrement(cell)).toThrow(RangeError)
    })

    it('exempts the displaced actor so legal occupancy requires no movement', () => {
        const origin = createAxialCoord(0, 0)
        const originPacked = packAxial(0, 0)

        // Cell capacity 2, currently has 2 occupants. If one departs (2 - 1 = 1), it is legal!
        occupancyTracker.setOccupancy(originPacked, 2)

        const result = resolveDisplacement(
            { congestedCell: origin },
            capacityEvaluator,
            occupancyTracker,
        )

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.targetPacked).toBe(originPacked)
            expect(result.traversalCostUnits).toBe(0)
            expect(result.traversalPath.length).toBe(1)
        }
    })

    it('routes displaced entity to adjacent cell with available capacity', () => {
        const origin = createAxialCoord(0, 0)
        const originPacked = packAxial(0, 0)

        // 3 occupants in cell with capacity 2 -> Eviction required
        occupancyTracker.setOccupancy(originPacked, 3)

        const result = resolveDisplacement(
            { congestedCell: origin },
            capacityEvaluator,
            occupancyTracker,
        )

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.targetPacked).not.toBe(originPacked)
            expect(result.traversalCostUnits).toBe(100) // 1 step to neighbor
            expect(result.traversalPath.length).toBe(2)
        }
    })

    it('routes around saturated neighbors and walls without teleportation', () => {
        const origin = createAxialCoord(0, 0)
        const originPacked = packAxial(0, 0)
        occupancyTracker.setOccupancy(originPacked, 3)

        // Block 5 neighbors with walls or full capacity, plus side walls along corridor
        const blocked = new Set<PackedAxial>([
            packAxial(1, 0),
            packAxial(1, -1),
            packAxial(0, -1),
            packAxial(-1, 0),
            packAxial(-1, 1),
            packAxial(1, 1),
            packAxial(-1, 2),
        ])

        // Only neighbor (0, 1) is open, but saturate it to capacity 2
        const nOpen = packAxial(0, 1)
        occupancyTracker.setOccupancy(nOpen, 2)

        // Cell (0, 2) is open and empty
        const result = resolveDisplacement(
            {
                congestedCell: origin,
                blockedCells: blocked,
                budgetCostUnits: 500,
            },
            capacityEvaluator,
            occupancyTracker,
        )

        expect(result.ok).toBe(true)
        if (result.ok) {
            // Must step through (0, 1) to reach (0, 2)
            expect(result.targetPacked).toBe(packAxial(0, 2))
            expect(result.traversalCostUnits).toBe(200)
            expect(result.traversalPath.length).toBe(3)
        }
    })

    it('halts with BUDGET_EXCEEDED when search expands beyond 512 nodes', () => {
        const origin = createAxialCoord(0, 0)
        const originPacked = packAxial(0, 0)
        occupancyTracker.setOccupancy(originPacked, 3)

        // Satiate everything within radius so search expands indefinitely until envelope ceiling
        const capacityAlwaysFull = createCapacityEvaluator({
            cellCapacityDefault: 0,
        })

        const result = resolveDisplacement(
            {
                congestedCell: origin,
                budgetCostUnits: 100000,
                workEnvelopeLimit: 512,
            },
            capacityAlwaysFull,
            occupancyTracker,
        )

        expect(result.ok).toBe(false)
        if (result.ok === false) {
            expect(result.reason).toBe('BUDGET_EXCEEDED')
            expect(result.expandedSteps).toBe(513)
        }
    })

    it('dispatches DIS01 Blessed menu action within 2ms execution budget', async () => {
        const action = createDisplacementAction()
        const bus = createSpatialBus()
        const logs: string[] = []

        bus.subscribe('TELEMETRY_LOG', (evt) => {
            logs.push(String(evt.payload.message || ''))
        })

        const start = performance.now()
        await action.execute(bus)
        const elapsed = performance.now() - start

        expect(elapsed).toBeLessThanOrEqual(2.0)
        expect(logs.some((l) => l.includes('[DIS01] Overcrowding Alert'))).toBe(
            true,
        )
        expect(logs.some((l) => l.includes('Eviction Resolved'))).toBe(true)
    })
})
