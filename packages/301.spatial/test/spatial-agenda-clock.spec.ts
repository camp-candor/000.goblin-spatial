import { describe, it, expect } from 'vitest'
import {
    evaluateAppointmentDiurnalWindow,
    evaluateAgendaDiurnalSchedule,
} from '../05.clock.unit/buz/clock.buzz.js'
import type { ScheduledSpatialAppointment } from '../05.clock.unit/fce/clock.interface.js'

function makeAppointment(
    overrides: Partial<ScheduledSpatialAppointment> = {},
): ScheduledSpatialAppointment {
    return {
        beatId: 'beat-001',
        title: 'Midnight Tribunal',
        isoDate: '2026-10-31',
        startTimeHm: '14:00',
        beatCategory: 'tribunal',
        reserveCooldownTicks: 5,
        ...overrides,
    }
}

describe('Spatial Agenda Clock Suite', () => {
    it('assigns correct daypart across all five windows', () => {
        const cases = [
            { startTimeHm: '05:45', daypart: 'DAWN' },
            { startTimeHm: '09:00', daypart: 'MORNING' },
            { startTimeHm: '14:00', daypart: 'AFTERNOON' },
            { startTimeHm: '18:00', daypart: 'DUSK' },
            { startTimeHm: '23:30', daypart: 'NIGHT' },
        ] as const
        for (const c of cases) {
            const window = evaluateAppointmentDiurnalWindow(
                makeAppointment({
                    beatId: `beat-${c.startTimeHm}`,
                    startTimeHm: c.startTimeHm,
                }),
            )
            expect(window.daypart).toBe(c.daypart)
            expect(window.diurnalProfile.daypart).toBe(c.daypart)
            expect(
                Number.isInteger(window.diurnalProfile.ambientLuminanceBps),
            ).toBe(true)
            expect(
                Number.isInteger(window.diurnalProfile.opticalRangeScaleBps),
            ).toBe(true)
            expect(
                Number.isInteger(window.diurnalProfile.diurnalNoiseDeltaCdb),
            ).toBe(true)
            expect(
                window.diurnalProfile.ambientLuminanceBps,
            ).toBeGreaterThanOrEqual(0)
            expect(
                window.diurnalProfile.ambientLuminanceBps,
            ).toBeLessThanOrEqual(10000)
            expect(Object.isFrozen(window)).toBe(true)
        }
    })

    it('sorts agenda chronologically without mutating input', () => {
        const a = makeAppointment({
            beatId: 'beat-b',
            isoDate: '2026-10-31',
            startTimeHm: '23:30',
        })
        const b = makeAppointment({
            beatId: 'beat-a',
            isoDate: '2026-10-31',
            startTimeHm: '14:00',
        })
        const c = makeAppointment({
            beatId: 'beat-c',
            isoDate: '2026-10-30',
            startTimeHm: '23:59',
        })
        const input = [a, b, c]
        const snapshotBefore = JSON.stringify(input)
        const sorted = evaluateAgendaDiurnalSchedule(input)
        expect(sorted.map((s) => s.beatId)).toEqual([
            'beat-c',
            'beat-a',
            'beat-b',
        ])
        expect(JSON.stringify(input)).toBe(snapshotBefore)
        expect(sorted).not.toBe(input)
    })

    it('orders ties by beatId deterministically', () => {
        const x = makeAppointment({ beatId: 'beat-002' })
        const y = makeAppointment({ beatId: 'beat-001' })
        const sorted = evaluateAgendaDiurnalSchedule([x, y])
        expect(sorted.map((s) => s.beatId)).toEqual(['beat-001', 'beat-002'])
    })

    it('rejects invalid Gregorian dates fail closed', () => {
        expect(() =>
            evaluateAppointmentDiurnalWindow(
                makeAppointment({ isoDate: '2025-02-29' }),
            ),
        ).toThrow('INVALID_SPATIAL_DATE')
    })

    it('rejects malformed times fail closed', () => {
        expect(() =>
            evaluateAppointmentDiurnalWindow(
                makeAppointment({ startTimeHm: '25:99' } as never),
            ),
        ).toThrow('INVALID_SPATIAL_TIME')
        expect(() =>
            evaluateAppointmentDiurnalWindow(
                makeAppointment({ startTimeHm: '24:15' } as never),
            ),
        ).toThrow('INVALID_SPATIAL_TIME')
    })

    it('matches exact luminance bps for 23:30 NIGHT and 05:45 DAWN', () => {
        const curfew = evaluateAppointmentDiurnalWindow(
            makeAppointment({ isoDate: '2026-10-31', startTimeHm: '23:30' }),
        )
        expect(curfew.daypart).toBe('NIGHT')
        expect(curfew.diurnalProfile.ambientLuminanceBps).toBe(1500)

        const dawn = evaluateAppointmentDiurnalWindow(
            makeAppointment({ isoDate: '2026-10-31', startTimeHm: '05:45' }),
        )
        expect(dawn.daypart).toBe('DAWN')
        expect(dawn.diurnalProfile.ambientLuminanceBps).toBe(4500)
    })
})
