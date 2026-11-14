import { describe, it, expect } from 'vitest'
import {
    computeSpatialLunarOptics,
    expandSpatialRecurringAppointments,
    resolveSpatialWeekday,
} from '../05.clock.unit/buz/clock.buzz.js'
import type { ScheduledSpatialAppointment } from '../05.clock.unit/fce/clock.interface.js'

function makeAppointment(
    overrides: Partial<ScheduledSpatialAppointment> = {},
): ScheduledSpatialAppointment {
    return {
        beatId: 'beat-001',
        title: 'Full Moon Vigil',
        isoDate: '2026-10-26',
        startTimeHm: '23:30',
        beatCategory: 'vigil',
        locationId: 'BRASS_WORKSHOP',
        reserveCooldownTicks: 1,
        ...overrides,
    } as ScheduledSpatialAppointment
}

function findPhaseDate(
    phase: string,
    timeHm: string,
    fromIso: string,
    days: number,
): string {
    let cursor = fromIso
    const parts = fromIso.split('-').map(Number)
    let base = Date.UTC(parts[0], parts[1] - 1, parts[2])
    for (let i = 0; i < days; i++) {
        const d = new Date(base + i * 86400000)
        const iso =
            String(d.getUTCFullYear()).padStart(4, '0') +
            '-' +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            '-' +
            String(d.getUTCDate()).padStart(2, '0')
        const optics = computeSpatialLunarOptics(iso, timeHm)
        if (optics.lunarPhase === phase) return iso
        cursor = iso
    }
    void cursor
    throw new Error('no phase date found for ' + phase)
}

describe('Spatial Recurrence Lunar Clock Suite', () => {
    it('resolves Sakamoto weekdays', () => {
        expect(resolveSpatialWeekday('2026-10-31')).toBe('SAT')
        expect(resolveSpatialWeekday('2026-11-01')).toBe('SUN')
        expect(resolveSpatialWeekday('2026-11-02')).toBe('MON')
        expect(resolveSpatialWeekday('2026-10-26')).toBe('MON')
    })

    it('rejects invalid Gregorian date fail closed', () => {
        expect(() => resolveSpatialWeekday('2025-02-29')).toThrow(
            'INVALID_SPATIAL_DATE',
        )
        expect(() => computeSpatialLunarOptics('2025-02-29', '23:30')).toThrow(
            'INVALID_SPATIAL_DATE',
        )
    })

    it('modulates nocturnal optics Full Moon versus New Moon', () => {
        const fullIso = findPhaseDate('FULL_MOON', '23:30', '2026-10-01', 60)
        const newIso = findPhaseDate('NEW_MOON', '23:30', '2026-10-01', 60)
        const fullNight = computeSpatialLunarOptics(fullIso, '23:30')
        const newNight = computeSpatialLunarOptics(newIso, '23:30')
        expect(fullNight.lunarPhase).toBe('FULL_MOON')
        expect(fullNight.lunarIlluminationBps).toBe(10000)
        expect(fullNight.nightLuminanceBoostBps).toBe(1500)
        expect(fullNight.nightOpticalRangeBoostBps).toBe(2000)
        expect(newNight.lunarPhase).toBe('NEW_MOON')
        expect(newNight.lunarIlluminationBps).toBe(0)
        expect(newNight.nightLuminanceBoostBps).toBe(0)
        const fullDay = computeSpatialLunarOptics(fullIso, '14:00')
        expect(fullDay.nightLuminanceBoostBps).toBe(0)
        expect(fullDay.nightOpticalRangeBoostBps).toBe(0)
    })

    it('expands DAILY plus WEEKLY_MASK with weekday tags', () => {
        const daily = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-daily',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'DAILY',
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-10-26',
            3,
        )
        expect(daily.map((d) => d.isoDate)).toEqual([
            '2026-10-26',
            '2026-10-27',
            '2026-10-28',
        ])
        expect(daily[0].weekday).toBe('MON')
        expect(daily[0].occurrenceKey).toBe('beat-daily@2026-10-26')
        expect(daily[0].lunarOptics).toBeDefined()
        expect(daily[0].effectiveDiurnalProfile).toBeDefined()

        const weekly = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-weekly',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'WEEKLY_MASK',
                        weeklyMask: ['MON'],
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-10-26',
            8,
        )
        expect(weekly.map((d) => d.isoDate)).toEqual([
            '2026-10-26',
            '2026-11-02',
        ])
    })

    it('expands INTERVAL_DAYS plus LUNAR_PHASE plus SOLAR events', () => {
        const interval = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-interval',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'INTERVAL_DAYS',
                        intervalDays: 2,
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-10-26',
            5,
        )
        expect(interval.map((d) => d.isoDate)).toEqual([
            '2026-10-26',
            '2026-10-28',
            '2026-10-30',
        ])

        const lunar = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-lunar',
                    isoDate: '2026-10-01',
                    startTimeHm: '23:30',
                    recurrenceRule: {
                        recurrenceKind: 'LUNAR_PHASE',
                        lunarPhase: 'FULL_MOON',
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-10-23',
            7,
        )
        expect(lunar.length).toBeGreaterThan(0)
        for (const w of lunar) {
            expect(w.lunarOptics.lunarPhase).toBe('FULL_MOON')
        }

        const solar = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-solar',
                    isoDate: '2026-12-01',
                    recurrenceRule: {
                        recurrenceKind: 'SOLAR_SOLSTICE_EQUINOX',
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-12-15',
            10,
        )
        expect(solar.map((d) => d.isoDate)).toEqual(['2026-12-21'])
    })

    it('honors blackout SKIP versus DEFER_NEXT_VALID_DAY', () => {
        const skipped = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-skip',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'DAILY',
                        blackoutPolicy: 'SKIP',
                    },
                }),
            ],
            '2026-10-26',
            3,
            ['2026-10-27'],
        )
        expect(skipped.map((d) => d.isoDate)).toEqual([
            '2026-10-26',
            '2026-10-28',
        ])

        const deferred = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-defer',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'INTERVAL_DAYS',
                        intervalDays: 2,
                        blackoutPolicy: 'DEFER_NEXT_VALID_DAY',
                    },
                }),
            ],
            '2026-10-26',
            5,
            [{ isoDate: '2026-10-28', policy: 'DEFER_NEXT_VALID_DAY' }],
        )
        expect(deferred.map((d) => d.isoDate)).toEqual([
            '2026-10-26',
            '2026-10-29',
            '2026-10-30',
        ])
    })

    it('respects untilIsoDate plus maxOccurrences', () => {
        const capped = expandSpatialRecurringAppointments(
            [
                makeAppointment({
                    beatId: 'beat-cap',
                    isoDate: '2026-10-26',
                    recurrenceRule: {
                        recurrenceKind: 'DAILY',
                        blackoutPolicy: 'SKIP',
                        untilIsoDate: '2026-10-27',
                        maxOccurrences: 1,
                    },
                }),
            ],
            '2026-10-26',
            5,
        )
        expect(capped.map((d) => d.isoDate)).toEqual(['2026-10-26'])
    })
})
