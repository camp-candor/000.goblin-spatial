export const initSound = (cpy: SoundModel, bal: SoundBit, ste: State) => {
    debugger
    return cpy
}

export const updateSound = (cpy: SoundModel, bal: SoundBit, ste: State) => {
    return cpy
}

import { SoundModel } from '../sound.model.js'
import SoundBit from '../fce/sound.bit.js'
import State from '../../99.core/state.js'

import {
    AxialCoord,
    PackedAxial,
    packAxial,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import { axialDistance } from '../../28.axial.unit/buz/axial.buzz.js'
import {
    AXIAL_DIRECTIONS,
    getNeighbor,
} from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import {
    AcousticNodeReceipt,
    AcousticWavefrontQuery,
    AcousticWavefrontResult,
    AuditoryPerceptReceipt,
    CentiDecibels,
} from '../fce/sound.interface.js'
import {
    AIR_LOSS_PER_HEX_CDB,
    DEFAULT_HEARING_THRESHOLD_CDB,
    DEFAULT_SNR_MIN_CDB,
    REFERENCE_SOURCE_CDB,
    clampCentiDecibels,
} from '../val/sound.model.js'
import { PartitionDampingRegistry } from '../../49.edge.unit/buz/edge.buzz.js'
import {
    shouldPruneAcousticFrontier,
    verifyAudibilityDualCondition,
} from '../../48.floor.unit/buz/floor.buzz.js'
import { computeAuditoryQualityPermille } from '../../47.fraction.unit/buz/fraction.buzz.js'

export function computeAcousticWavefront(
    query: AcousticWavefrontQuery,
    registry: PartitionDampingRegistry,
    overlayDeltas?: ReadonlyMap<string, number>,
): AcousticWavefrontResult {
    const workLimit = query.workEnvelopeLimit ?? 512
    const sourcePacked = packAxial(query.sourceCoord.q, query.sourceCoord.r)

    const bestIntensity = new Map<PackedAxial, CentiDecibels>()
    const evaluatedNodes = new Map<PackedAxial, AcousticNodeReceipt>()

    // Queue entry: [intensity, packed, coord, hops, arrivalBearing, predecessorPacked]
    type FrontierNode = {
        intensity: CentiDecibels
        packed: PackedAxial
        coord: AxialCoord
        hops: number
        arrivalBearing: number
        predecessorPacked?: PackedAxial
    }

    const queue: FrontierNode[] = [
        {
            intensity: query.sourceIntensityCdb,
            packed: sourcePacked,
            coord: query.sourceCoord,
            hops: 0,
            arrivalBearing: 0,
            predecessorPacked: undefined,
        },
    ]

    bestIntensity.set(sourcePacked, query.sourceIntensityCdb)
    let prunedCount = 0
    let steps = 0
    let breachedLimit = false

    while (queue.length > 0) {
        steps++
        if (steps > workLimit) {
            breachedLimit = true
            break
        }

        // Sort to extract maximum arriving intensity first; break ties by lowest arrival bearing
        // Also, if arriving intensities are equal, prefer the one with fewer hops (shorter path)
        queue.sort((a, b) => {
            if (b.intensity !== a.intensity) return b.intensity - a.intensity
            if (a.hops !== b.hops) return a.hops - b.hops
            return a.arrivalBearing - b.arrivalBearing
        })

        const current = queue.shift()!
        const pathLoss = clampCentiDecibels(
            query.sourceIntensityCdb - current.intensity,
        )

        // If we've already found a strictly better path to this node, skip it
        const bestKnown = bestIntensity.get(current.packed)
        if (bestKnown !== undefined && current.intensity < bestKnown) {
            continue
        }

        if (!evaluatedNodes.has(current.packed)) {
            evaluatedNodes.set(current.packed, {
                coord: current.coord,
                packed: current.packed,
                arrivingIntensityCdb: current.intensity,
                pathLossCdb: pathLoss,
                arrivalBearing: current.arrivalBearing,
                predecessorPacked: current.predecessorPacked,
                hops: current.hops,
            })
        }

        // Expand 6 hexagonal neighbors
        for (let d = 0; d < 6; d++) {
            const neighborCoord = getNeighbor(current.coord, d)
            const neighborPacked = packAxial(neighborCoord.q, neighborCoord.r)

            const partitionLoss = registry.getPartitionDamping(
                current.packed,
                neighborPacked,
                overlayDeltas,
            )
            const nextIntensity = clampCentiDecibels(
                current.intensity - AIR_LOSS_PER_HEX_CDB - partitionLoss,
            )

            // Radial noise floor pruning
            if (
                shouldPruneAcousticFrontier(
                    nextIntensity,
                    query.ambientNoiseFloorCdb,
                )
            ) {
                prunedCount++
                continue
            }

            const existingBest = bestIntensity.get(neighborPacked)
            if (existingBest === undefined || nextIntensity > existingBest) {
                bestIntensity.set(neighborPacked, nextIntensity)

                // Direction from listener toward predecessor: opposite of outgoing direction d
                const incomingBearing = (d + 3) % 6

                queue.push({
                    intensity: nextIntensity,
                    packed: neighborPacked,
                    coord: neighborCoord,
                    hops: current.hops + 1,
                    arrivalBearing: incomingBearing,
                    predecessorPacked: current.packed,
                })
            }
        }
    }

    return {
        sourcePacked,
        evaluatedNodes,
        prunedFrontierCount: prunedCount,
        executionSteps: steps,
        breachedEnvelopeLimit: breachedLimit,
    }
}

export function evaluateAuditoryPercept(
    wavefront: AcousticWavefrontResult,
    query: AcousticWavefrontQuery,
    listenerCoord: AxialCoord,
): AuditoryPerceptReceipt {
    const listenerPacked = packAxial(listenerCoord.q, listenerCoord.r)
    const node = wavefront.evaluatedNodes.get(listenerPacked)

    const hearingThreshold =
        query.hearingThresholdCdb ?? DEFAULT_HEARING_THRESHOLD_CDB
    const snrMin = query.snrMinCdb ?? DEFAULT_SNR_MIN_CDB

    if (!node) {
        return {
            listenerCoord,
            listenerPacked,
            sourceCoord: query.sourceCoord,
            sourcePacked: wavefront.sourcePacked,
            arrivingIntensityCdb: 0 as CentiDecibels,
            signalToNoiseRatioCdb: 0 as CentiDecibels,
            auditoryQualityPermille: 0,
            absoluteArrivalBearing: 0,
            isAudible: false,
        }
    }

    const snr = clampCentiDecibels(
        node.arrivingIntensityCdb - query.ambientNoiseFloorCdb,
    )
    const isAudible = verifyAudibilityDualCondition(
        node.arrivingIntensityCdb,
        query.ambientNoiseFloorCdb,
        hearingThreshold,
        snrMin,
    )

    const quality = computeAuditoryQualityPermille(
        node.arrivingIntensityCdb,
        query.ambientNoiseFloorCdb,
        snrMin,
        REFERENCE_SOURCE_CDB,
    )

    return {
        listenerCoord,
        listenerPacked,
        sourceCoord: query.sourceCoord,
        sourcePacked: wavefront.sourcePacked,
        arrivingIntensityCdb: node.arrivingIntensityCdb,
        signalToNoiseRatioCdb: snr,
        auditoryQualityPermille: quality,
        absoluteArrivalBearing: node.arrivalBearing,
        isAudible,
    }
}
