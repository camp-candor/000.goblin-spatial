import { describe, it, expect } from 'vitest'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import { stageScheduledAppointmentSpatialProof } from '../40.witness.unit/buz/witness.buzz.js'
import type { ScheduledSpatialAppointment } from '../05.clock.unit/fce/clock.interface.js'

function makeAppointment(
    overrides: Partial<ScheduledSpatialAppointment> = {},
): ScheduledSpatialAppointment {
    return {
        beatId: 'beat-curfew',
        title: 'Midnight Curfew',
        isoDate: '2026-10-31',
        startTimeHm: '23:30',
        beatCategory: 'curfew',
        locationId: 'BRASS_WORKSHOP',
        reserveCooldownTicks: 3,
        ...overrides,
    }
}

const topology = {
    topologyId: 'BRASS_WORKSHOP',
    nodes: {
        BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' },
        GLASS_ATRIUM: { id: 'GLASS_ATRIUM' },
    },
}

const actors = [
    { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
    { actorId: 'BOB', coord: createAxialCoord(1, 0) },
]

describe('Spatial Agenda Staging Suite', () => {
    it('scales optical visibility by diurnal window', () => {
        const curfew = stageScheduledAppointmentSpatialProof(
            topology,
            actors,
            makeAppointment({ beatId: 'beat-night', startTimeHm: '23:30' }),
        )
        const afternoon = stageScheduledAppointmentSpatialProof(
            topology,
            actors,
            makeAppointment({ beatId: 'beat-day', startTimeHm: '14:00' }),
        )
        expect(curfew.daypart).toBe('NIGHT')
        expect(afternoon.daypart).toBe('AFTERNOON')
        const nightRange =
            curfew.witnessReport.diurnalProfile.opticalRangeScaleBps
        const dayRange =
            afternoon.witnessReport.diurnalProfile.opticalRangeScaleBps
        expect(nightRange).toBeLessThan(dayRange)
        expect(
            curfew.witnessReport.visibleWitnessIds.length,
        ).toBeLessThanOrEqual(afternoon.witnessReport.visibleWitnessIds.length)
        expect(afternoon.witnessReport.visibleWitnessIds).toEqual([
            'ALICE',
            'BOB',
        ])
        expect(curfew.witnessReport.visibleWitnessIds).toEqual([])
        expect(curfew.stageBrief.sluglineToken).toContain('NIGHT')
        expect(curfew.stageBrief.lightingActionLine).toContain('shadows')
        expect(Object.isFrozen(curfew)).toBe(true)
    })

    it('rejects unknown venue fail closed', () => {
        expect(() =>
            stageScheduledAppointmentSpatialProof(
                topology,
                actors,
                makeAppointment({ locationId: 'VOID_VAULT' }),
            ),
        ).toThrow('UNKNOWN_APPOINTMENT_LOCATION')
    })

    it('emits Fountain stage brief stamped with scheduled beat', () => {
        const proof = stageScheduledAppointmentSpatialProof(
            topology,
            actors,
            makeAppointment({ startTimeHm: '14:00' }),
        )
        expect(proof.beatId).toBe('beat-curfew')
        expect(proof.isoDate).toBe('2026-10-31')
        expect(proof.startTimeHm).toBe('14:00')
        expect(proof.locationId).toBe('BRASS_WORKSHOP')
        expect(proof.stageBrief.sluglineToken).toMatch(/^[\x20-\x7E]*$/)
        expect(proof.stageBrief.lightingActionLine).toMatch(/^[\x20-\x7E]*$/)
        expect(proof.witnessReport).toBeDefined()
        expect(proof.stageBrief.exitTransitionHint).toBe('CUT TO:')
    })

    it('falls back to first room without throwing when location omitted', () => {
        const proof = stageScheduledAppointmentSpatialProof(
            topology,
            actors,
            makeAppointment({ locationId: undefined }),
        )
        expect(proof.locationId).toBe('BRASS_WORKSHOP')
        expect(
            proof.witnessReport.visibleWitnessIds.length,
        ).toBeGreaterThanOrEqual(0)
    })
})
