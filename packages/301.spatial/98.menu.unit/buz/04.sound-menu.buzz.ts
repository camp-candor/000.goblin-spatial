import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import {
    createAxialCoord,
    packAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { AXIAL_DIRECTIONS } from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import { toCentiDecibels } from '../../13.sound.unit/val/sound.model.js'
import { createPartitionRegistry } from '../../49.edge.unit/buz/edge.buzz.js'
import {
    computeAcousticWavefront,
    evaluateAuditoryPercept,
} from '../../13.sound.unit/buz/sound.buzz.js'

export function createSoundPropagationAction(): MenuActionPayload {
    return {
        id: 'SND01_PROPAGATE_WAVEFRONT',
        label: 'Propagate Acoustic Wavefront',
        shortcut: 'SND01',
        category: 'SIMULATION',
        execute: async (bus: SpatialBus) => {
            const sourceCoord = createAxialCoord(0, 0)
            const listenerCoord = createAxialCoord(2, 0)

            const registry = createPartitionRegistry()
            // Seal the source chamber: riveted iron bulkheads on all six incident
            // edges (5,000 cdB each), so every wavefront path crosses the bulkhead.
            const pSource = packAxial(sourceCoord.q, sourceCoord.r)
            for (const dir of AXIAL_DIRECTIONS) {
                registry.setPartitionDamping(
                    pSource,
                    packAxial(sourceCoord.q + dir.q, sourceCoord.r + dir.r),
                    toCentiDecibels(5000),
                )
            }

            const query = {
                sourceCoord,
                sourceIntensityCdb: toCentiDecibels(8500), // 85.00 dB mechanical groan
                ambientNoiseFloorCdb: toCentiDecibels(2500), // 25.00 dB room hum
            }

            const result = computeAcousticWavefront(query, registry)
            const percept = evaluateAuditoryPercept(
                result,
                query,
                listenerCoord,
            )

            bus.emit('TELEMETRY_LOG', {
                message:
                    ':: [SND01] Acoustic Wavefront: Source (0,0) at 8500 cdB',
            })
            bus.emit('TELEMETRY_LOG', {
                message: `:: Evaluated Cells: ${result.evaluatedNodes.size} | Pruned Frontier Count: ${result.prunedFrontierCount}`,
            })
            bus.emit('TELEMETRY_LOG', {
                message: `:: Listener (2,0): Arrival ${percept.arrivingIntensityCdb} cdB | SNR: ${percept.signalToNoiseRatioCdb} cdB`,
            })
            bus.emit('TELEMETRY_LOG', {
                message: `:: Audibility: ${percept.isAudible ? 'AUDIBLE' : 'MASKED'} | Quality: ${percept.auditoryQualityPermille}/1000 | Bearing: Axis ${percept.absoluteArrivalBearing}`,
            })
        },
    }
}
