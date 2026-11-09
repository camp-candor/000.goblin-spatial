import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { createRoutingKernel } from '../../20.kernel.unit/buz/kernel.buzz.js'

export function createPathSimulationAction(): MenuActionPayload {
    return {
        id: 'ROU01_SIMULATE_PATHFIND',
        label: 'Simulate Bounded Pathfind',
        shortcut: 'ROU01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            const kernel = createRoutingKernel()
            const origin = createAxialCoord(-2, 0)
            const destination = createAxialCoord(2, 0)

            // Block cell (0, 0) to force routing around obstacle
            const wallPacked = packAxial(0, 0)
            const blockedCells = new Set<PackedAxial>([wallPacked])

            const start = performance.now()
            const result = kernel.findPath(origin, destination, 600, {
                blockedCells,
                workEnvelopeLimit: 512,
            })
            const elapsed = performance.now() - start

            bus.emit('TELEMETRY_LOG', {
                message:
                    ':: [ROU01] Bounded Pathfind: Origin (-2,0) -> Destination (2,0)',
            })
            bus.emit('TELEMETRY_LOG', {
                message: `:: Status: ${result.ok ? 'FOUND' : 'FAILED'} | Steps: ${result.expandedSteps} | Time: ${elapsed.toFixed(3)} ms`,
            })

            if (result.ok) {
                bus.emit('TELEMETRY_LOG', {
                    message: `:: Cost: ${result.totalCostUnits} units | Hops: ${result.path.length - 1}`,
                })
                const pathStr = result.path
                    .map((c) => `(${c.q},${c.r})`)
                    .join(' -> ')
                bus.emit('TELEMETRY_LOG', { message: `:: Route: ${pathStr}` })
            }
        },
    }
}
