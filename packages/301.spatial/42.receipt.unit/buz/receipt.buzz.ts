import { ReceiptModel } from '../receipt.model.js'
import ReceiptBit from '../fce/receipt.bit.js'
import State from '../../99.core/state.js'

import { AxialCoord, packAxial } from '../../28.axial.unit/val/axial.model.js'
import { OpticalTransmissionReceipt } from '../../40.witness.unit/fce/witness.interface.js'
import { AuditoryPerceptReceipt } from '../../13.sound.unit/fce/sound.interface.js'
import {
    PerceptCandidate,
    ReceiptBatchSummary,
} from '../fce/receipt.interface.js'
import { PerceptCandidateSchema } from '../val/receipt.model.js'

export const initReceipt = (cpy: ReceiptModel, bal: ReceiptBit, ste: State) => {
    debugger
    return cpy
}

export const updateReceipt = (
    cpy: ReceiptModel,
    bal: ReceiptBit,
    ste: State,
) => {
    return cpy
}

function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    Object.freeze(obj)
    for (const key of Object.keys(obj as object)) {
        const value = (obj as Record<string, unknown>)[key]
        if (
            value !== null &&
            typeof value === 'object' &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value)
        }
    }
    return obj as Readonly<T>
}

/**
 * Calculates hexagonal axial bearing from observer to source (0..5),
 * or returns null if co-located.
 */
export function calculateAxialArrivalBearing(
    observer: AxialCoord,
    source: AxialCoord,
): number | null {
    const dq = source.q - observer.q
    const dr = source.r - observer.r

    if (dq === 0 && dr === 0) {
        return null
    }

    // Canonical axial hexagonal direction sectors
    if (dq > 0 && dr === 0) return 0 // +q (East)
    if (dq > 0 && dr < 0) return 1 // +q, -r (Northeast)
    if (dq === 0 && dr < 0) return 2 // -r (Northwest)
    if (dq < 0 && dr === 0) return 3 // -q (West)
    if (dq < 0 && dr > 0) return 4 // -q, +r (Southwest)
    if (dq === 0 && dr > 0) return 5 // +r (Southeast)

    // General 60-degree sector projection for non-straight steps
    const angle = Math.atan2(Math.sqrt(3) * (dr + dq / 2), (3 / 2) * dq)
    // Pure integer discrete sector approximation:
    let sector = Math.round((angle * 3) / Math.PI)
    sector = ((sector % 6) + 6) % 6
    return sector
}

/**
 * Emits a sealed, deep-frozen optical PerceptCandidate receipt.
 */
export function emitOpticalPerceptCandidate(
    source: AxialCoord,
    observer: AxialCoord,
    transmissionReceipt: OpticalTransmissionReceipt,
    provenance?: { topologyRootHash?: string; overlayRootHash?: string },
): PerceptCandidate {
    const sourcePacked = packAxial(source.q, source.r)
    const observerPacked = packAxial(observer.q, observer.r)

    // Optical transmission is in basis points [0..10000]; scale down to per-mille [0..1000]
    const qualityPermille = Math.trunc(transmissionReceipt.transmissionBps / 10)
    const isOccluded = !transmissionReceipt.isVisible || qualityPermille === 0
    const arrivalBearing = calculateAxialArrivalBearing(observer, source)

    const rawCandidate = {
        channel: 'OPTICAL' as const,
        sourceCoord: { q: source.q, r: source.r },
        sourcePacked,
        observerCoord: { q: observer.q, r: observer.r },
        observerPacked,
        qualityPermille,
        arrivalBearing,
        isOccluded,
        opticalEvidence: {
            transmissionBps: transmissionReceipt.transmissionBps,
            pathLength: transmissionReceipt.pathLength,
            severedAtCell: transmissionReceipt.severedAtCell,
        },
        topologyRootHash: provenance?.topologyRootHash,
        overlayRootHash: provenance?.overlayRootHash,
    }

    const parsed = PerceptCandidateSchema.parse(rawCandidate)
    return deepFreeze(parsed) as unknown as PerceptCandidate
}

/**
 * Emits a sealed, deep-frozen acoustic PerceptCandidate receipt.
 */
export function emitAcousticPerceptCandidate(
    auditoryReceipt: AuditoryPerceptReceipt,
    ambientFloorCdb: number,
    hops: number = 1,
    provenance?: { topologyRootHash?: string; overlayRootHash?: string },
): PerceptCandidate {
    const source = auditoryReceipt.sourceCoord
    const observer = auditoryReceipt.listenerCoord
    const sourcePacked = auditoryReceipt.sourcePacked
    const observerPacked = auditoryReceipt.listenerPacked

    const isCoLocated = sourcePacked === observerPacked
    const arrivalBearing = isCoLocated
        ? null
        : auditoryReceipt.absoluteArrivalBearing
    const isOccluded = !auditoryReceipt.isAudible

    const rawCandidate = {
        channel: 'ACOUSTIC' as const,
        sourceCoord: { q: source.q, r: source.r },
        sourcePacked,
        observerCoord: { q: observer.q, r: observer.r },
        observerPacked,
        qualityPermille: auditoryReceipt.auditoryQualityPermille,
        arrivalBearing,
        isOccluded,
        acousticEvidence: {
            arrivingIntensityCdb: auditoryReceipt.arrivingIntensityCdb,
            ambientNoiseFloorCdb: ambientFloorCdb as any,
            snrMarginCdb: auditoryReceipt.signalToNoiseRatioCdb,
            hops,
        },
        topologyRootHash: provenance?.topologyRootHash,
        overlayRootHash: provenance?.overlayRootHash,
    }

    const parsed = PerceptCandidateSchema.parse(rawCandidate)
    return deepFreeze(parsed) as unknown as PerceptCandidate
}

/**
 * Summarizes a batch of emitted sensory candidates.
 */
export function summarizeReceiptBatch(
    candidates: readonly PerceptCandidate[],
): ReceiptBatchSummary {
    let opticalCount = 0
    let acousticCount = 0
    let occludedCount = 0
    let totalQuality = 0

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i]
        if (c.channel === 'OPTICAL') opticalCount++
        if (c.channel === 'ACOUSTIC') acousticCount++
        if (c.isOccluded) occludedCount++
        totalQuality += c.qualityPermille
    }

    const averageQualityPermille =
        candidates.length > 0 ? Math.trunc(totalQuality / candidates.length) : 0

    return {
        totalCandidates: candidates.length,
        opticalCandidates: opticalCount,
        acousticCandidates: acousticCount,
        occludedCount,
        averageQualityPermille,
    }
}
