import { describe, it, expect } from 'vitest'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import { evaluateSpatialIncidentWitnesses } from '../23.incident.unit/buz/incident.buzz.js'
import { EventsModel } from '../11.events.unit/events.model.js'
import { recordSpatialEvent } from '../11.events.unit/buz/events.buzz.js'
import { reducer as incidentReducer } from '../23.incident.unit/incident.reduce.js'
import { EVALUATE_INCIDENT_WITNESSES } from '../23.incident.unit/incident.action.js'
import { RECORD_SPATIAL_EVENT } from '../11.events.unit/events.action.js'
import { reducer as eventsReducer } from '../11.events.unit/events.reduce.js'

describe('Spatial Incident Witness Suite', () => {
    it('detects clear line witnesses visible plus audible', () => {
        const report = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [
                { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
                { actorId: 'BOB', coord: createAxialCoord(1, 0) },
            ],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        expect(report.visibleWitnessIds).toContain('ALICE')
        expect(report.visibleWitnessIds).toContain('BOB')
        expect(report.audibleWitnessIds).toContain('ALICE')
        expect(report.diurnalDaypart).toBe('AFTERNOON')
        expect(report.clockTimeHm).toBe('14:00')
        const alice = report.witnesses.find((w) => w.actorId === 'ALICE')
        expect(alice?.sawEvent).toBe(true)
        expect(alice?.occlusionReason).toBe('CLEAR_LINE_OF_SIGHT')
        expect(alice?.transmissionBps).toBe(10000)
    })

    it('marks occluded witness blocked while near witness stays clear', () => {
        const report = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'FAR', coord: createAxialCoord(0, 3) }],
            opaqueCells: [createAxialCoord(0, 1), createAxialCoord(0, 2)],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const far = report.witnesses.find((w) => w.actorId === 'FAR')
        expect(far?.sawEvent).toBe(false)
        expect(far?.occlusionReason).toBe('OCCLUDED_WALL')
        expect(report.visibleWitnessIds).not.toContain('FAR')
    })

    it('shifts visibility from day bright to night dim', () => {
        const day = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'WATCHER', coord: createAxialCoord(0, 2) }],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const night = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'WATCHER', coord: createAxialCoord(0, 2) }],
            startDate: '2026-10-31',
            startTime: '21:00',
        } as never)
        expect(day.witnesses[0]?.sawEvent).toBe(true)
        expect(night.witnesses[0]?.sawEvent).toBe(false)
        expect(night.witnesses[0]?.occlusionReason).toBe(
            'DIURNAL_VISIBILITY_DROP',
        )
        expect(night.diurnalProfile.ambientLuminanceBps).toBe(1500)
        expect(day.diurnalProfile.ambientLuminanceBps).toBe(10000)
    })

    it('cuts acoustic audibility past distance cutoff', () => {
        const report = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [
                { actorId: 'NEAR', coord: createAxialCoord(0, 1) },
                { actorId: 'REMOTE', coord: createAxialCoord(50, 0) },
            ],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const near = report.witnesses.find((w) => w.actorId === 'NEAR')
        const remote = report.witnesses.find((w) => w.actorId === 'REMOTE')
        expect(near?.heardEvent).toBe(true)
        expect(remote?.heardEvent).toBe(false)
        expect(remote?.distanceHex).toBe(50)
    })

    it('sorts witness output lexicographically', () => {
        const report = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [
                { actorId: 'ZED', coord: createAxialCoord(1, 0) },
                { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
                { actorId: 'MIRA', coord: createAxialCoord(1, -1) },
            ],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const ids = report.witnesses.map((w) => w.actorId)
        expect(ids).toEqual(['ALICE', 'MIRA', 'ZED'])
        expect(report.visibleWitnessIds).toEqual(
            [...report.visibleWitnessIds].sort(),
        )
    })

    it('records spatial event deterministically via reducer paths', () => {
        const first = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'ALICE', coord: createAxialCoord(0, 1) }],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        const second = evaluateSpatialIncidentWitnesses({
            locationId: 'BRASS_WORKSHOP',
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'ALICE', coord: createAxialCoord(0, 1) }],
            startDate: '2026-10-31',
            startTime: '14:00',
        } as never)
        expect(JSON.stringify(first)).toBe(JSON.stringify(second))

        const modelA = new EventsModel()
        let emittedA: unknown = null
        recordSpatialEvent(
            modelA,
            {
                idx: 'record-test',
                dat: { incidentReport: first },
                slv: (res: unknown) => {
                    emittedA = res
                },
            } as never,
            undefined,
        )
        const modelB = new EventsModel()
        let emittedB: unknown = null
        recordSpatialEvent(
            modelB,
            {
                idx: 'record-test',
                dat: { incidentReport: second },
                slv: (res: unknown) => {
                    emittedB = res
                },
            } as never,
            undefined,
        )
        expect(JSON.stringify(emittedA)).toBe(JSON.stringify(emittedB))
        expect(modelA.totalSpatialEvents).toBe(1)

        const reduced = incidentReducer(
            undefined as never,
            {
                type: EVALUATE_INCIDENT_WITNESSES,
                bale: {
                    idx: 'eval-via-reducer',
                    dat: {
                        witnessInput: {
                            locationId: 'BRASS_WORKSHOP',
                            originCoord: createAxialCoord(0, 0),
                            actors: [
                                {
                                    actorId: 'ALICE',
                                    coord: createAxialCoord(0, 1),
                                },
                            ],
                            startDate: '2026-10-31',
                            startTime: '14:00',
                        },
                    },
                },
            } as never,
            undefined,
        )
        expect(reduced.incidentReceiptCount).toBe(1)

        const evtReduced = eventsReducer(
            new EventsModel(),
            {
                type: RECORD_SPATIAL_EVENT,
                bale: {
                    idx: 'record-via-reducer',
                    dat: { incidentReport: first },
                },
            } as never,
            undefined,
        )
        expect(evtReduced.totalSpatialEvents).toBe(1)
    })
})
