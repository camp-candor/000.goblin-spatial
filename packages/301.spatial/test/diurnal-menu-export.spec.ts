import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import {
    SPATIAL_MENU_CHOICES,
    MenuModelConfigSchema,
} from '../98.menu.unit/val/menu.model.js'
import {
    runDiurnalSensoryProbe,
    exportSignedSpatialReceiptMenuBuzz,
} from '../98.menu.unit/buz/00.menu.buzz.js'
import * as Act from '../98.menu.unit/menu.action.js'
import { reducer } from '../98.menu.unit/menu.reduce.js'

describe('Spatial Diurnal Menu Export Suite', () => {
    let tempDirs: string[] = []

    afterEach(() => {
        for (const dir of tempDirs.splice(0)) {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true })
            }
        }
        delete (globalThis as any).ACTIVE_SPATIAL_CLOCK_SNAPSHOT
        delete (globalThis as any).ACTIVE_CLOCK_SNAPSHOT
        delete (globalThis as any).LIBRARY
    })

    it('runs diurnal sensory probe headless with five daypart rows', async () => {
        const model = new MenuModel()
        let resolved: any = null
        const out = await runDiurnalSensoryProbe(
            model,
            {
                idx: 'probe-headless',
                dat: { startDate: '2026-10-31', startTime: '21:00' },
                slv: (res: any) => {
                    resolved = res
                },
            },
            undefined,
        )
        expect(out.statusMessage).toBe('DIURNAL_PROBE_COMPLETE')
        expect(out.activeMenuMode).toBe('DIURNAL_AUDIT')
        expect(resolved?.mnuBit?.idx).toBe('diurnal-sensory-probe-success')
        expect(resolved?.mnuBit?.val).toBe(1)
        const rows = resolved?.mnuBit?.dat?.rows as string[]
        expect(rows).toHaveLength(5)
        expect(rows.some((r) => r.includes('DAWN'))).toBe(true)
        expect(rows.some((r) => r.includes('MORNING'))).toBe(true)
        expect(rows.some((r) => r.includes('AFTERNOON'))).toBe(true)
        expect(rows.some((r) => r.includes('DUSK'))).toBe(true)
        expect(rows.some((r) => r.includes('NIGHT'))).toBe(true)
        expect(resolved?.mnuBit?.dat?.daypart).toBe('NIGHT')
        const globalSnap = (globalThis as any).ACTIVE_SPATIAL_CLOCK_SNAPSHOT
        expect(globalSnap?.daypart).toBe('NIGHT')
    })

    it('emits pure ASCII probe telemetry via cns00', async () => {
        const captured: string[] = []
        const prevLib = (globalThis as any).LIBRARY
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, payload: any) => {
                if (
                    action === '[Write action] Write Console' &&
                    payload?.idx === 'cns00'
                ) {
                    captured.push(String(payload.src))
                }
                return {}
            },
        }
        try {
            const model = new MenuModel()
            await runDiurnalSensoryProbe(
                model,
                {
                    idx: 'probe-telemetry',
                    dat: { startDate: '2026-10-31', startTime: '09:00' },
                },
                undefined,
            )
            expect(captured).toHaveLength(5)
            for (const line of captured) {
                expect(line.startsWith('>> [SPATIAL:DIURNAL]')).toBe(true)
                for (let i = 0; i < line.length; i++) {
                    expect(line.charCodeAt(i)).toBeLessThanOrEqual(127)
                }
            }
            expect(
                captured.some(
                    (l) => l.includes('MORNING') && l.includes('LUM: 8500 bps'),
                ),
            ).toBe(true)
            expect(
                captured.some(
                    (l) => l.includes('NIGHT') && l.includes('LUM: 1500 bps'),
                ),
            ).toBe(true)
        } finally {
            if (prevLib === undefined) {
                delete (globalThis as any).LIBRARY
            } else {
                ;(globalThis as any).LIBRARY = prevLib
            }
        }
    })

    it('accepts DIURNAL_AUDIT mode in menu schema and enforces strict keys', () => {
        const parsed = MenuModelConfigSchema.parse({
            activeMenuMode: 'DIURNAL_AUDIT',
            statusMessage: 'DIURNAL_PROBE_COMPLETE',
        })
        expect(parsed.activeMenuMode).toBe('DIURNAL_AUDIT')
        expect(() =>
            MenuModelConfigSchema.parse({
                activeMenuMode: 'DIURNAL_AUDIT',
                unknownExtraneousKey: true,
            }),
        ).toThrow()
        expect(Act.RUN_DIURNAL_SENSORY_PROBE).toBe(
            '[Menu action] Run Diurnal Sensory Probe',
        )
    })

    it('exposes probe choice inside cockpit menu list', () => {
        expect(SPATIAL_MENU_CHOICES).toContain(
            '[06] RUN DIURNAL SENSORY CLOCK PROBE',
        )
        const probeIdx = (SPATIAL_MENU_CHOICES as readonly string[]).indexOf(
            '[06] RUN DIURNAL SENSORY CLOCK PROBE',
        )
        const exportIdx = (SPATIAL_MENU_CHOICES as readonly string[]).indexOf(
            '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE',
        )
        expect(probeIdx).toBeGreaterThanOrEqual(0)
        expect(exportIdx).toBeGreaterThanOrEqual(0)
        expect(probeIdx).toBeLessThan(exportIdx)
    })

    it('stamps exported proofs with active clock chronology', async () => {
        const tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'diurnal-export-'),
        )
        tempDirs.push(tempDir)
        const model = new MenuModel()
        let resolved: any = null
        const result = await exportSignedSpatialReceiptMenuBuzz(
            model,
            {
                idx: 'export-diurnal',
                dat: {
                    targetEngineRoot: tempDir,
                    startDate: '2026-10-31',
                    startTime: '14:00',
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            undefined,
        )
        expect(result.statusMessage).toBe('SPATIAL_RECEIPT_EXPORTED')
        expect(resolved?.mnuBit?.idx).toBe('export-spatial-receipt-success')
        const stagedDir = path.join(
            tempDir,
            'data',
            'spatial',
            'gotham-trinity-crisis',
        )
        const files = fs.readdirSync(stagedDir)
        expect(files.length).toBe(1)
        const proof = JSON.parse(
            fs.readFileSync(path.join(stagedDir, files[0]), 'utf-8'),
        )
        expect(proof.chronology.daypart).toBe('AFTERNOON')
        expect(proof.chronology.start_time_hm).toBe('14:00')
        expect(proof.chronology.ambient_luminance_bps).toBe(10000)
        expect(proof.proof_digest).toMatch(/^[a-f0-9]{64}$/)
    })

    it('routes probe action through menu reducer', async () => {
        const model = new MenuModel()
        const out = (await reducer(
            model,
            new Act.RunDiurnalSensoryProbe({
                idx: 'probe-reducer',
                dat: { startDate: '2026-10-31', startTime: '18:00' },
            }),
            undefined,
        )) as unknown as MenuModel
        expect(out.statusMessage).toBe('DIURNAL_PROBE_COMPLETE')
        expect(out.activeMenuMode).toBe('DIURNAL_AUDIT')
        expect(Act.RUN_DIURNAL_SENSORY_PROBE).toBe(
            '[Menu action] Run Diurnal Sensory Probe',
        )
    })
})
