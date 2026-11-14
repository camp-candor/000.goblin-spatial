import { describe, it, expect } from 'vitest'
import { ClockModel } from '../05.clock.unit/clock.model.js'
import {
    DIURNAL_PROFILE_TABLE,
    computeDiurnalProfile,
    deriveSpatialDaypart,
    parseSpatialClockSnapshot,
    syncSpatialClock,
    deriveDiurnalProfile,
    initClock,
} from '../05.clock.unit/buz/clock.buzz.js'
import { reducer } from '../05.clock.unit/clock.reduce.js'
import {
    INIT_CLOCK,
    SYNC_SPATIAL_CLOCK,
    DERIVE_DIURNAL_PROFILE,
} from '../05.clock.unit/clock.action.js'
import SPATIAL from '../hunt.js'

describe('Spatial Diurnal Clock Kernel', () => {
    it('maps hour limits to expected dayparts', () => {
        expect(deriveSpatialDaypart(5)).toBe('DAWN')
        expect(deriveSpatialDaypart(6)).toBe('DAWN')
        expect(deriveSpatialDaypart(7)).toBe('MORNING')
        expect(deriveSpatialDaypart(11)).toBe('MORNING')
        expect(deriveSpatialDaypart(12)).toBe('AFTERNOON')
        expect(deriveSpatialDaypart(16)).toBe('AFTERNOON')
        expect(deriveSpatialDaypart(17)).toBe('DUSK')
        expect(deriveSpatialDaypart(19)).toBe('DUSK')
        expect(deriveSpatialDaypart(20)).toBe('NIGHT')
        expect(deriveSpatialDaypart(23)).toBe('NIGHT')
        expect(deriveSpatialDaypart(0)).toBe('NIGHT')
        expect(deriveSpatialDaypart(4)).toBe('NIGHT')
        expect(deriveSpatialDaypart(21)).toBe('NIGHT')
    })

    it('rejects invalid calendar dates fail-closed', () => {
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2025-02-29',
                startTime: '12:00',
            }),
        ).toThrow('INVALID_SPATIAL_DATE')
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-13-01',
                startTime: '12:00',
            }),
        ).toThrow('INVALID_SPATIAL_DATE')
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-04-31',
                startTime: '12:00',
            }),
        ).toThrow('INVALID_SPATIAL_DATE')
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: 'not-a-date',
                startTime: '12:00',
            }),
        ).toThrow('INVALID_SPATIAL_DATE')
    })

    it('accepts leap feb 29 for leap cycle', () => {
        const snap = parseSpatialClockSnapshot({
            startDate: '2024-02-29',
            startTime: '06:00',
        })
        expect(snap.startDate).toBe('2024-02-29')
        expect(snap.daypart).toBe('DAWN')
        expect(snap.hour).toBe(6)
    })

    it('rejects invalid clock times fail-closed', () => {
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-10-31',
                startTime: '24:01',
            }),
        ).toThrow('INVALID_SPATIAL_TIME')
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-10-31',
                startTime: '23:60',
            }),
        ).toThrow('INVALID_SPATIAL_TIME')
        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-10-31',
                startTime: '99:99:99',
            }),
        ).toThrow('INVALID_SPATIAL_TIME')
    })

    it('emits integer profiles inside strict limits', () => {
        const dayparts = [
            'DAWN',
            'MORNING',
            'AFTERNOON',
            'DUSK',
            'NIGHT',
        ] as const
        for (const daypart of dayparts) {
            const profile = computeDiurnalProfile(daypart)
            expect(Number.isInteger(profile.ambientLuminanceBps)).toBe(true)
            expect(Number.isInteger(profile.opticalRangeScaleBps)).toBe(true)
            expect(Number.isInteger(profile.diurnalNoiseDeltaCdb)).toBe(true)
            expect(profile.ambientLuminanceBps).toBeGreaterThanOrEqual(0)
            expect(profile.ambientLuminanceBps).toBeLessThanOrEqual(10000)
            expect(profile.opticalRangeScaleBps).toBeGreaterThanOrEqual(0)
            expect(profile.opticalRangeScaleBps).toBeLessThanOrEqual(10000)
        }
        expect(DIURNAL_PROFILE_TABLE.AFTERNOON.ambientLuminanceBps).toBe(10000)
        expect(DIURNAL_PROFILE_TABLE.NIGHT.ambientLuminanceBps).toBe(1500)
        expect(
            DIURNAL_PROFILE_TABLE.AFTERNOON.ambientLuminanceBps,
        ).toBeGreaterThan(DIURNAL_PROFILE_TABLE.DUSK.ambientLuminanceBps)
        expect(
            DIURNAL_PROFILE_TABLE.AFTERNOON.ambientLuminanceBps,
        ).toBeGreaterThan(DIURNAL_PROFILE_TABLE.DAWN.ambientLuminanceBps)
        expect(
            DIURNAL_PROFILE_TABLE.AFTERNOON.ambientLuminanceBps,
        ).toBeGreaterThan(DIURNAL_PROFILE_TABLE.NIGHT.ambientLuminanceBps)
        expect(DIURNAL_PROFILE_TABLE.NIGHT.diurnalNoiseDeltaCdb).toBe(-300)
    })

    it('syncs snapshot onto model via state bus', () => {
        const model = new ClockModel()
        let emitted: any = null
        syncSpatialClock(
            model,
            {
                idx: 'sync-test',
                dat: { startDate: '2026-10-31', startTime: '21:00' },
                slv: (res: any) => {
                    emitted = res
                },
            },
            undefined,
        )
        expect(model.activeSnapshot).not.toBeNull()
        expect(model.activeSnapshot?.daypart).toBe('NIGHT')
        expect(model.activeSnapshot?.diurnalProfile.ambientLuminanceBps).toBe(
            1500,
        )
        expect(model.activeDiurnalProfile?.diurnalNoiseDeltaCdb).toBe(-300)
        expect(emitted?.clkBit?.idx).toBe('sync-spatial-clock-ok')
        expect(emitted?.clkBit?.val).toBe(1)

        const reduced = reducer(
            new ClockModel(),
            {
                type: SYNC_SPATIAL_CLOCK,
                bale: {
                    idx: 'sync-via-reducer',
                    dat: { startDate: '2026-10-31', startTime: '14:00' },
                },
            } as any,
            undefined,
        )
        expect(reduced.activeSnapshot?.daypart).toBe('AFTERNOON')
        expect(reduced.activeSnapshot?.diurnalProfile.ambientLuminanceBps).toBe(
            10000,
        )

        const derived = reducer(
            reduced,
            {
                type: DERIVE_DIURNAL_PROFILE,
                bale: { idx: 'derive-via-reducer', dat: {} },
            } as any,
            undefined,
        )
        expect(derived.activeDiurnalProfile?.daypart).toBe('AFTERNOON')

        let initEmitted: any = null
        const fresh = new ClockModel()
        initClock(
            fresh,
            {
                idx: 'init-test',
                dat: { startDate: '2026-10-31', startTime: '09:00' },
                slv: (res: any) => {
                    initEmitted = res
                },
            },
            undefined,
        )
        expect(fresh.activeSnapshot?.daypart).toBe('MORNING')
        expect(initEmitted?.clkBit?.idx).toBe('init-clock-ok')
    })

    it('covers midday peak versus twilight lows', () => {
        const noon = parseSpatialClockSnapshot({
            startDate: '2026-10-31',
            startTime: '14:00',
        })
        const dusk = parseSpatialClockSnapshot({
            startDate: '2026-10-31',
            startTime: '18:00',
        })
        const night = parseSpatialClockSnapshot({
            startDate: '2026-10-31',
            startTime: '21:00',
        })
        expect(noon.daypart).toBe('AFTERNOON')
        expect(dusk.daypart).toBe('DUSK')
        expect(night.daypart).toBe('NIGHT')
        expect(noon.diurnalProfile.ambientLuminanceBps).toBe(10000)
        expect(dusk.diurnalProfile.ambientLuminanceBps).toBe(4000)
        expect(night.diurnalProfile.ambientLuminanceBps).toBe(1500)
        expect(noon.clockTimeHm).toBe('14:00')
        expect(night.isoDate).toBe('2026-10-31T21:00:00')
    })

    it('derives profile from explicit hour payload', () => {
        const model = new ClockModel()
        let emitted: any = null
        deriveDiurnalProfile(
            model,
            {
                idx: 'derive-hour',
                dat: { hour: 9 },
                slv: (res: any) => {
                    emitted = res
                },
            },
            undefined,
        )
        expect(model.activeDiurnalProfile?.daypart).toBe('MORNING')
        expect(emitted?.clkBit?.idx).toBe('derive-diurnal-profile-ok')
    })

    it('enforces exact daypart transition boundaries and integer quantization', () => {
        const cases = [
            { time: '04:59', daypart: 'NIGHT', luminance: 1500 },
            { time: '05:00', daypart: 'DAWN', luminance: 4500 },
            { time: '07:00', daypart: 'MORNING', luminance: 8500 },
            { time: '12:00', daypart: 'AFTERNOON', luminance: 10000 },
            { time: '17:00', daypart: 'DUSK', luminance: 4000 },
            { time: '20:00', daypart: 'NIGHT', luminance: 1500 },
        ] as const

        for (const c of cases) {
            const snap = parseSpatialClockSnapshot({
                startDate: '2026-10-31',
                startTime: c.time,
            })
            expect(snap.daypart).toBe(c.daypart)
            expect(snap.diurnalProfile.ambientLuminanceBps).toBe(c.luminance)
            expect(
                Number.isInteger(snap.diurnalProfile.ambientLuminanceBps),
            ).toBe(true)
            expect(
                Number.isInteger(snap.diurnalProfile.opticalRangeScaleBps),
            ).toBe(true)
            expect(
                Number.isInteger(snap.diurnalProfile.diurnalNoiseDeltaCdb),
            ).toBe(true)
        }

        expect(() =>
            parseSpatialClockSnapshot({
                startDate: '2026-10-31',
                startTime: '24:00',
            }),
        ).toThrow('INVALID_SPATIAL_TIME')
    })

    it('dispatches clock lifecycle non-blockingly via SPATIAL.hunt', async () => {
        const initRes = await SPATIAL.hunt(INIT_CLOCK, {})
        expect(initRes?.clkBit?.idx).toBe('init-clock-ok')

        const syncRes = await SPATIAL.hunt(SYNC_SPATIAL_CLOCK, {
            dat: { startDate: '2026-10-31', startTime: '06:15' },
        })
        expect(syncRes?.clkBit?.idx).toBe('sync-spatial-clock-ok')
        expect(syncRes?.clkBit?.dat?.snapshot?.daypart).toBe('DAWN')

        const deriveRes = await SPATIAL.hunt(DERIVE_DIURNAL_PROFILE, {})
        expect(deriveRes?.clkBit?.idx).toBe('derive-diurnal-profile-ok')
        expect(deriveRes?.clkBit?.dat?.profile?.daypart).toBe('DAWN')
    })
})
