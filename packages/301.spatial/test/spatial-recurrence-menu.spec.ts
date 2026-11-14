import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import {
    SPATIAL_MENU_CHOICES,
    MenuModelConfigSchema,
} from '../98.menu.unit/val/menu.model.js'
import { runRecurrenceCalendarProbe } from '../98.menu.unit/buz/00.menu.buzz.js'
import * as Act from '../98.menu.unit/menu.action.js'
import { reducer } from '../98.menu.unit/menu.reduce.js'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'

const topology = {
    topologyId: 'BRASS_WORKSHOP',
    nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
}

const actors = [
    { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
    { actorId: 'BOB', coord: createAxialCoord(1, 0) },
]

function appointments() {
    return [
        {
            beatId: 'beat-vigil',
            title: 'Full Moon Vigil',
            isoDate: '2026-10-26',
            startTimeHm: '23:30',
            beatCategory: 'vigil',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 1,
            recurrenceRule: {
                recurrenceKind: 'DAILY',
                blackoutPolicy: 'SKIP',
            },
        },
    ]
}

describe('Spatial Recurrence Menu Suite', () => {
    afterEach(() => {
        delete (globalThis as Record<string, unknown>).LIBRARY
    })

    it('registers [09] choice plus strict mode', () => {
        expect(SPATIAL_MENU_CHOICES).toContain(
            '[09] PROBE RECURRING CALENDAR & LUNAR OPTICS',
        )
        expect(Act.PROBE_RECURRENCE_CALENDAR).toBe(
            '[Menu action] Probe Recurrence Calendar',
        )
        const parsed = MenuModelConfigSchema.parse({
            activeMenuMode: 'RECURRENCE_CALENDAR',
            statusMessage: 'RECURRENCE_CALENDAR_PROBE_COMPLETE',
        })
        expect(parsed.activeMenuMode).toBe('RECURRENCE_CALENDAR')
        expect(() =>
            MenuModelConfigSchema.parse({
                activeMenuMode: 'RECURRENCE_CALENDAR',
                unknownExtra: true,
            }),
        ).toThrow()
    })

    it('streams cns00 lunar weekday rows in pure ascii', async () => {
        const captured: string[] = []
        ;(globalThis as Record<string, unknown>).LIBRARY = {
            hunt: async (
                action: string,
                payload: { idx?: string; src?: string },
            ) => {
                if (
                    action === '[Write action] Write Console' &&
                    payload?.idx === 'cns00'
                ) {
                    captured.push(String(payload.src))
                }
                return {}
            },
        }
        const model = new MenuModel()
        let resolved: unknown = null
        await runRecurrenceCalendarProbe(
            model,
            {
                idx: 'probe-test',
                dat: {
                    appointments: appointments(),
                    topology,
                    actors,
                    startIsoDate: '2026-10-26',
                    horizonDays: 2,
                },
                slv: (res: unknown) => {
                    resolved = res
                },
            } as never,
            undefined,
        )
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:RECURRENCE]')),
        ).toBe(true)
        for (const line of captured) {
            expect(line).toMatch(/^[\x20-\x7E]*$/)
        }
        const dat = (
            resolved as {
                mnuBit: {
                    idx: string
                    val: number
                    dat: { expandedProofs: unknown[] }
                }
            }
        ).mnuBit
        expect(dat.idx).toBe('probe-recurrence-calendar')
        expect(dat.val).toBe(1)
        expect(model.activeMenuMode).toBe('RECURRENCE_CALENDAR')
    })

    it('emits blackout telemetry plus fail-closed error guard', async () => {
        const captured: string[] = []
        ;(globalThis as Record<string, unknown>).LIBRARY = {
            hunt: async (
                action: string,
                payload: { idx?: string; src?: string },
            ) => {
                if (
                    action === '[Write action] Write Console' &&
                    payload?.idx === 'cns00'
                ) {
                    captured.push(String(payload.src))
                }
                return {}
            },
        }
        const model = new MenuModel()
        await runRecurrenceCalendarProbe(
            model,
            {
                idx: 'probe-blackout',
                dat: {
                    appointments: appointments(),
                    topology,
                    actors,
                    startIsoDate: '2026-10-26',
                    horizonDays: 3,
                    seriesBlackouts: ['2026-10-27'],
                },
                slv: () => {},
            } as never,
            undefined,
        )
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:BLACKOUT_SKIP]')),
        ).toBe(true)

        const capturedErr: string[] = []
        ;(globalThis as Record<string, unknown>).LIBRARY = {
            hunt: async (
                action: string,
                payload: { idx?: string; src?: string },
            ) => {
                if (
                    action === '[Write action] Write Console' &&
                    payload?.idx === 'cns00'
                ) {
                    capturedErr.push(String(payload.src))
                }
                return {}
            },
        }
        const badModel = new MenuModel()
        let resolvedBad: unknown = null
        await runRecurrenceCalendarProbe(
            badModel,
            {
                idx: 'probe-bad',
                dat: {
                    appointments: [
                        {
                            beatId: 'beat-bad',
                            title: 'Void',
                            isoDate: '2026-10-26',
                            startTimeHm: '23:30',
                            beatCategory: 'void',
                            locationId: 'VOID_VAULT',
                            reserveCooldownTicks: 0,
                        },
                    ],
                    topology,
                    actors,
                    startIsoDate: '2026-10-26',
                    horizonDays: 1,
                },
                slv: (res: unknown) => {
                    resolvedBad = res
                },
            } as never,
            undefined,
        )
        expect(
            capturedErr.some((l) =>
                l.startsWith(':: [SPATIAL:RECURRENCE_ERR]'),
            ),
        ).toBe(true)
        expect(
            (resolvedBad as { mnuBit: { idx: string; val: number } }).mnuBit
                .val,
        ).toBe(1)
    })

    it('routes probe action through menu reducer', async () => {
        const model = new MenuModel()
        const out = (await reducer(
            model,
            new Act.ProbeRecurrenceCalendar({
                idx: 'probe-via-reducer',
                dat: {
                    appointments: appointments(),
                    topology,
                    actors,
                    startIsoDate: '2026-10-26',
                    horizonDays: 2,
                },
            }),
            undefined,
        )) as unknown as MenuModel
        expect(out.activeMenuMode).toBe('RECURRENCE_CALENDAR')
        expect(out.statusMessage).toBe('RECURRENCE_CALENDAR_PROBE_COMPLETE')
    })

    it('reports LUM+0bps during daytime and LUM+1500bps at night on FULL_MOON', async () => {
        const captured: string[] = []
        ;(globalThis as Record<string, unknown>).LIBRARY = {
            hunt: async (
                action: string,
                payload: { idx?: string; src?: string },
            ) => {
                if (
                    action === '[Write action] Write Console' &&
                    payload?.idx === 'cns00'
                ) {
                    captured.push(String(payload.src))
                }
                return {}
            },
        }
        const model = new MenuModel()
        await runRecurrenceCalendarProbe(
            model,
            {
                idx: 'probe-day-vs-night',
                dat: {
                    appointments: [
                        {
                            beatId: 'beat-day',
                            title: 'Day Market',
                            isoDate: '2026-10-26',
                            startTimeHm: '14:00',
                            beatCategory: 'market',
                            locationId: 'BRASS_WORKSHOP',
                            reserveCooldownTicks: 0,
                            recurrenceRule: {
                                recurrenceKind: 'ONCE',
                                blackoutPolicy: 'SKIP',
                            },
                        },
                        {
                            beatId: 'beat-night',
                            title: 'Night Vigil',
                            isoDate: '2026-10-26',
                            startTimeHm: '23:30',
                            beatCategory: 'vigil',
                            locationId: 'BRASS_WORKSHOP',
                            reserveCooldownTicks: 0,
                            recurrenceRule: {
                                recurrenceKind: 'ONCE',
                                blackoutPolicy: 'SKIP',
                            },
                        },
                    ],
                    topology,
                    actors,
                    startIsoDate: '2026-10-26',
                    horizonDays: 1,
                },
                slv: () => {},
            } as never,
            undefined,
        )
        const dayLine = captured.find((l) => l.includes('14:00'))
        const nightLine = captured.find((l) => l.includes('23:30'))
        expect(dayLine).toContain('FULL_MOON (LUM+0bps)')
        expect(nightLine).toContain('FULL_MOON (LUM+1500bps)')
    })
})
