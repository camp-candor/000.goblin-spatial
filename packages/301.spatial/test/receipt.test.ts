import { describe, it, expect } from 'vitest'
import {
    createAxialCoord,
    packAxial,
} from '../28.axial.unit/val/axial.model.js'
import { toBasisPoints } from '../40.witness.unit/val/witness.model.js'
import { toCentiDecibels } from '../13.sound.unit/val/sound.model.js'
import {
    emitOpticalPerceptCandidate,
    emitAcousticPerceptCandidate,
    calculateAxialArrivalBearing,
    summarizeReceiptBatch,
} from '../42.receipt.unit/buz/receipt.buzz.js'
import { OpticalTransmissionReceipt } from '../40.witness.unit/fce/witness.interface.js'
import { AuditoryPerceptReceipt } from '../13.sound.unit/fce/sound.interface.js'

describe('Task 8.2 Sensory Percept Candidate Receipt Emission', () => {
    it('calculates deterministic discrete axial bearings or null for co-located cells', () => {
        const origin = createAxialCoord(0, 0)

        // Straight directions 0..5
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(2, 0)),
        ).toBe(0)
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(1, -1)),
        ).toBe(1)
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(0, -2)),
        ).toBe(2)
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(-3, 0)),
        ).toBe(3)
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(-1, 1)),
        ).toBe(4)
        expect(
            calculateAxialArrivalBearing(origin, createAxialCoord(0, 2)),
        ).toBe(5)

        // Co-located cells must yield null bearing
        expect(calculateAxialArrivalBearing(origin, origin)).toBeNull()
    })

    it('emits sealed optical candidate conforming to PerceptCandidate schema', () => {
        const source = createAxialCoord(0, 0)
        const observer = createAxialCoord(2, 0)

        const transmissionReceipt: OpticalTransmissionReceipt = {
            originPacked: packAxial(0, 0),
            targetPacked: packAxial(2, 0),
            pathLength: 3,
            accumulatedOpacityBps: toBasisPoints(2500),
            transmissionBps: toBasisPoints(7500),
            isVisible: true,
            samples: [],
        }

        const candidate = emitOpticalPerceptCandidate(
            source,
            observer,
            transmissionReceipt,
        )

        expect(candidate.channel).toBe('OPTICAL')
        expect(candidate.qualityPermille).toBe(750) // 7500 bp / 10 = 750 permille
        expect(candidate.isOccluded).toBe(false)
        expect(candidate.opticalEvidence?.transmissionBps).toBe(7500)
        expect(candidate.opticalEvidence?.pathLength).toBe(3)
        expect(candidate.arrivalBearing).toBe(3) // Looking from (2,0) toward (0,0) is -q (West = 3)
        expect(Object.isFrozen(candidate)).toBe(true)
    })

    it('marks candidate as occluded when optical path is completely blocked', () => {
        const source = createAxialCoord(0, 0)
        const observer = createAxialCoord(2, 0)

        const transmissionReceipt: OpticalTransmissionReceipt = {
            originPacked: packAxial(0, 0),
            targetPacked: packAxial(2, 0),
            pathLength: 3,
            accumulatedOpacityBps: toBasisPoints(10000),
            transmissionBps: toBasisPoints(0),
            isVisible: false,
            samples: [],
            severedAtCell: packAxial(1, 0),
        }

        const candidate = emitOpticalPerceptCandidate(
            source,
            observer,
            transmissionReceipt,
        )

        expect(candidate.qualityPermille).toBe(0)
        expect(candidate.isOccluded).toBe(true)
        expect(candidate.opticalEvidence?.severedAtCell).toBe(packAxial(1, 0))
    })

    it('emits sealed acoustic candidate with SNR margin and bearing', () => {
        const source = createAxialCoord(0, 0)
        const observer = createAxialCoord(2, 0)

        const auditoryReceipt: AuditoryPerceptReceipt = {
            listenerCoord: observer,
            listenerPacked: packAxial(2, 0),
            sourceCoord: source,
            sourcePacked: packAxial(0, 0),
            arrivingIntensityCdb: toCentiDecibels(4200),
            signalToNoiseRatioCdb: toCentiDecibels(1200),
            auditoryQualityPermille: 350,
            absoluteArrivalBearing: 3,
            isAudible: true,
        }

        const candidate = emitAcousticPerceptCandidate(auditoryReceipt, 3000, 2)

        expect(candidate.channel).toBe('ACOUSTIC')
        expect(candidate.qualityPermille).toBe(350)
        expect(candidate.isOccluded).toBe(false)
        expect(candidate.arrivalBearing).toBe(3)
        expect(candidate.acousticEvidence?.snrMarginCdb).toBe(1200)
        expect(candidate.acousticEvidence?.ambientNoiseFloorCdb).toBe(3000)
        expect(candidate.acousticEvidence?.hops).toBe(2)
        expect(Object.isFrozen(candidate)).toBe(true)
    })

    it('summarizes batches of sensory percept receipts accurately', () => {
        const source = createAxialCoord(0, 0)
        const observer = createAxialCoord(1, 0)

        const optClear = emitOpticalPerceptCandidate(source, observer, {
            originPacked: packAxial(0, 0),
            targetPacked: packAxial(1, 0),
            pathLength: 2,
            accumulatedOpacityBps: toBasisPoints(0),
            transmissionBps: toBasisPoints(10000),
            isVisible: true,
            samples: [],
        })

        const optBlocked = emitOpticalPerceptCandidate(source, observer, {
            originPacked: packAxial(0, 0),
            targetPacked: packAxial(1, 0),
            pathLength: 2,
            accumulatedOpacityBps: toBasisPoints(10000),
            transmissionBps: toBasisPoints(0),
            isVisible: false,
            samples: [],
        })

        const summary = summarizeReceiptBatch([optClear, optBlocked])
        expect(summary.totalCandidates).toBe(2)
        expect(summary.opticalCandidates).toBe(2)
        expect(summary.acousticCandidates).toBe(0)
        expect(summary.occludedCount).toBe(1)
        expect(summary.averageQualityPermille).toBe(500) // (1000 + 0) / 2
    })

    it('prohibits runtime mutation of emitted receipts', () => {
        const source = createAxialCoord(0, 0)
        const observer = createAxialCoord(1, 0)

        const candidate = emitOpticalPerceptCandidate(source, observer, {
            originPacked: packAxial(0, 0),
            targetPacked: packAxial(1, 0),
            pathLength: 2,
            accumulatedOpacityBps: toBasisPoints(0),
            transmissionBps: toBasisPoints(10000),
            isVisible: true,
            samples: [],
        })

        expect(() => {
            // @ts-expect-error - testing immutability
            candidate.qualityPermille = 999
        }).toThrow(TypeError)
    })
})
