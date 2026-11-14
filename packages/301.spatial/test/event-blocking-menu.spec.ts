import { describe, it, expect, afterEach } from 'vitest'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import {
    SPATIAL_MENU_CHOICES,
    MenuModelConfigSchema,
} from '../98.menu.unit/val/menu.model.js'
import { runEventBlockingProbe } from '../98.menu.unit/buz/00.menu.buzz.js'
import * as Act from '../98.menu.unit/menu.action.js'
import { reducer } from '../98.menu.unit/menu.reduce.js'

describe('Spatial Event Blocking Menu Suite', () => {
    afterEach(() => {
        delete (globalThis as any).LIBRARY
    })

    it('registers blocking probe choice in cockpit list', () => {
        expect(SPATIAL_MENU_CHOICES).toContain(
            '[07] RUN SPATIAL EVENT WITNESS BLOCKING PROBE',
        )
        expect(Act.RUN_EVENT_BLOCKING_PROBE).toBe(
            '[Menu action] Run Event Blocking Probe',
        )
    })

    it('accepts event blocking mode via strict schema', () => {
        const parsed = MenuModelConfigSchema.parse({
            activeMenuMode: 'EVENT_BLOCKING',
            statusMessage: 'EVENT_BLOCKING_PROBE_COMPLETE',
        })
        expect(parsed.activeMenuMode).toBe('EVENT_BLOCKING')
        expect(() =>
            MenuModelConfigSchema.parse({
                activeMenuMode: 'EVENT_BLOCKING',
                unknownExtra: true,
            }),
        ).toThrow()
    })

    it('streams slugline telemetry via cns00 in pure ascii', async () => {
        const captured: string[] = []
        ;(globalThis as any).LIBRARY = {
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
        await runEventBlockingProbe(
            model,
            {
                idx: 'probe-test',
                dat: {
                    startDate: '2026-10-31',
                    startTime: '14:00',
                    locationId: 'BRASS_WORKSHOP',
                    locationName: 'Brass Workshop',
                },
                slv: (res: unknown) => {
                    resolved = res
                },
            } as never,
            undefined,
        )
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:SLUGLINE]')),
        ).toBe(true)
        expect(captured.some((l) => l.startsWith('>> [SPATIAL:ACTION]'))).toBe(
            true,
        )
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:WITNESSES]')),
        ).toBe(true)
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:TRANSITION]')),
        ).toBe(true)
        for (const line of captured) {
            expect(line).toMatch(/^[\x20-\x7E]*$/)
        }
        const dat = (
            resolved as {
                mnuBit: {
                    idx: string
                    val: number
                    dat: { report: { visibleWitnessIds: string[] } }
                }
            }
        ).mnuBit.dat
        expect(dat.report.visibleWitnessIds.length).toBeGreaterThan(0)
        expect(model.activeMenuMode).toBe('EVENT_BLOCKING')
    })

    it('resolves probe headless without lib lockup', async () => {
        const model = new MenuModel()
        let resolved: unknown = null
        const started = Date.now()
        await runEventBlockingProbe(
            model,
            {
                idx: 'probe-headless',
                dat: { startDate: '2026-10-31', startTime: '21:00' },
                slv: (res: unknown) => {
                    resolved = res
                },
            } as never,
            undefined,
        )
        const elapsed = Date.now() - started
        expect(elapsed).toBeLessThan(2000)
        expect(
            (resolved as { mnuBit: { idx: string; val: number } }).mnuBit.idx,
        ).toBe('event-blocking-probe')
        expect(
            (resolved as { mnuBit: { idx: string; val: number } }).mnuBit.val,
        ).toBe(1)
    })

    it('routes probe action through menu reducer', async () => {
        const model = new MenuModel()
        const out = (await reducer(
            model,
            new Act.RunEventBlockingProbe({
                idx: 'probe-via-reducer',
                dat: { startDate: '2026-10-31', startTime: '14:00' },
            }),
            undefined,
        )) as unknown as MenuModel
        expect(out.activeMenuMode).toBe('EVENT_BLOCKING')
        expect(out.statusMessage).toBe('EVENT_BLOCKING_PROBE_COMPLETE')
    })
})
