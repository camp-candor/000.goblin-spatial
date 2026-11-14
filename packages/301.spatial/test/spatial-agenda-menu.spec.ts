import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import {
    SPATIAL_MENU_CHOICES,
    MenuModelConfigSchema,
} from '../98.menu.unit/val/menu.model.js'
import { runChronoAgendaProbe } from '../98.menu.unit/buz/00.menu.buzz.js'
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
            beatId: 'beat-001',
            title: 'Afternoon Hearing',
            isoDate: '2026-10-31',
            startTimeHm: '14:00',
            beatCategory: 'hearing',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 1,
        },
        {
            beatId: 'beat-002',
            title: 'Midnight Curfew',
            isoDate: '2026-10-31',
            startTimeHm: '23:30',
            beatCategory: 'curfew',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 2,
        },
    ]
}

describe('Spatial Agenda Menu Suite', () => {
    afterEach(() => {
        delete (globalThis as Record<string, unknown>).LIBRARY
    })

    it('registers chrono agenda choice plus strict mode', () => {
        expect(SPATIAL_MENU_CHOICES).toContain(
            '[08] PROBE SCHEDULED STORY APPOINTMENTS',
        )
        expect(Act.PROBE_CHRONO_AGENDA).toBe(
            '[Menu action] Probe Chrono Agenda',
        )
        const parsed = MenuModelConfigSchema.parse({
            activeMenuMode: 'CHRONO_AGENDA',
            statusMessage: 'CHRONO_AGENDA_PROBE_COMPLETE',
        })
        expect(parsed.activeMenuMode).toBe('CHRONO_AGENDA')
        expect(() =>
            MenuModelConfigSchema.parse({
                activeMenuMode: 'CHRONO_AGENDA',
                unknownExtra: true,
            }),
        ).toThrow()
    })

    it('streams agenda rows via cns00 in pure ascii', async () => {
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
        await runChronoAgendaProbe(
            model,
            {
                idx: 'probe-test',
                dat: { appointments: appointments(), topology, actors },
                slv: (res: unknown) => {
                    resolved = res
                },
            } as never,
            undefined,
        )
        expect(captured.some((l) => l.startsWith('>> [SPATIAL:AGENDA]'))).toBe(
            true,
        )
        for (const line of captured) {
            expect(line).toMatch(/^[\x20-\x7E]*$/)
        }
        const dat = (
            resolved as {
                mnuBit: { idx: string; val: number; dat: { proofs: unknown[] } }
            }
        ).mnuBit
        expect(dat.idx).toBe('probe-chrono-agenda')
        expect(dat.val).toBe(1)
        expect(dat.dat.proofs.length).toBe(2)
        expect(model.activeMenuMode).toBe('CHRONO_AGENDA')
    })

    it('logs fail-closed error without crashing on unknown venue', async () => {
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
        await runChronoAgendaProbe(
            model,
            {
                idx: 'probe-bad-venue',
                dat: {
                    appointments: [
                        {
                            beatId: 'beat-bad',
                            title: 'Void Session',
                            isoDate: '2026-10-31',
                            startTimeHm: '14:00',
                            beatCategory: 'hearing',
                            locationId: 'VOID_VAULT',
                            reserveCooldownTicks: 0,
                        },
                    ],
                    topology,
                    actors,
                },
                slv: (res: unknown) => {
                    resolved = res
                },
            } as never,
            undefined,
        )
        expect(
            captured.some((l) => l.startsWith(':: [SPATIAL:AGENDA_ERR]')),
        ).toBe(true)
        expect(
            (resolved as { mnuBit: { idx: string; val: number } }).mnuBit.val,
        ).toBe(1)
    })

    it('routes probe action through menu reducer', async () => {
        const model = new MenuModel()
        const out = (await reducer(
            model,
            new Act.ProbeChronoAgenda({
                idx: 'probe-via-reducer',
                dat: { appointments: appointments(), topology, actors },
            }),
            undefined,
        )) as unknown as MenuModel
        expect(out.activeMenuMode).toBe('CHRONO_AGENDA')
        expect(out.statusMessage).toBe('CHRONO_AGENDA_PROBE_COMPLETE')
    })
})
