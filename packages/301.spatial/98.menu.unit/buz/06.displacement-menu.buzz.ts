import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    AxialCoord,
    PackedAxial,
    createAxialCoord,
    packAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { createCapacityEvaluator } from '../../51.capacity.unit/buz/capacity.buzz.js'
import { createOccupancyTracker } from '../../44.occupancy.unit/buz/occupancy.buzz.js'
import { resolveDisplacement } from '../../50.displacement.unit/buz/displacement.buzz.js'

export function createDisplacementAction(): MenuActionPayload {
    return {
        id: 'DIS01_TRIGGER_EVICTION',
        label: 'Trigger Overcrowding Eviction',
        shortcut: 'DIS01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            // Scenario: Origin cell (0, 0) has capacity 2, but holds 3 occupants
            const origin = createAxialCoord(0, 0)
            const originPacked = packAxial(0, 0)

            const capacityEvaluator = createCapacityEvaluator({
                cellCapacityDefault: 2,
            })
            const occupancyTracker = createOccupancyTracker()

            occupancyTracker.setOccupancy(originPacked, 3) // 3 occupants -> OVERCROWDED

            // Saturate direct neighbors (1, 0) and (0, 1) to test multi-hop routing
            const n1 = packAxial(1, 0)
            const n2 = packAxial(0, 1)
            occupancyTracker.setOccupancy(n1, 2) // At capacity
            occupancyTracker.setOccupancy(n2, 2) // At capacity

            // Wall at (-1, 0)
            const blockedCells = new Set<PackedAxial>([packAxial(-1, 0)])

            const check = capacityEvaluator.checkSaturation(
                originPacked,
                occupancyTracker.getOccupancy(originPacked),
            )

            bus.emit('TELEMETRY_LOG', {
                message: `:: [DIS01] Overcrowding Alert: Cell (0,0) Occupancy ${check.currentOccupancy}/${check.maxCapacity} [EXCEEDED]`,
            })

            const start = performance.now()
            const result = resolveDisplacement(
                {
                    congestedCell: origin,
                    budgetCostUnits: 500,
                    blockedCells,
                    workEnvelopeLimit: 512,
                },
                capacityEvaluator,
                occupancyTracker,
            )
            const elapsed = performance.now() - start

            if (result.ok) {
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Eviction Resolved: Target (${result.targetCell.q},${result.targetCell.r}) | Cost: ${result.traversalCostUnits} units | Steps: ${result.expandedSteps}`,
                })
                const routeStr = result.traversalPath
                    .map((c) => `(${c.q},${c.r})`)
                    .join(' -> ')
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Displacement Path: ${routeStr}`,
                })
            } else if (result.ok === false) {
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Eviction Failed: ${result.reason} | Steps: ${result.expandedSteps}`,
                })
            }
            bus.emit('TELEMETRY_LOG', {
                message: `:: Execution Budget: ${elapsed.toFixed(3)} ms (Ceiling <= 2.0 ms)`,
            })
        },
    }
}
