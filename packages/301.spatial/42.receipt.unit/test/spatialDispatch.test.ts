import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
    dispatchSpatialPayloadsDownstream,
    resolveDefaultEngineRoot,
} from '../buz/spatialDispatch.buzz.js'

describe('301.spatial - [Task 1.2.3] Dispatch Spatial Payloads Downstream', () => {
    let tempFleetRoot: string

    afterEach(() => {
        if (tempFleetRoot && fs.existsSync(tempFleetRoot)) {
            fs.rmSync(tempFleetRoot, { recursive: true, force: true })
        }
    })

    it('stages generated spatial proof payload directly within the engine filesystem', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'spatial-dispatch-'),
        )
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')
        const engineRoot = path.join(tempFleetRoot, '000.series-sower-engine')

        fs.mkdirSync(spatialRoot, { recursive: true })
        fs.mkdirSync(engineRoot, { recursive: true })

        const seriesSlug = 'gotham-trinity-crisis'
        const mockReceipt = {
            topology_hash: 'a'.repeat(64),
            overlay_hash: 'b'.repeat(64),
            query_hash: 'c'.repeat(64),
            receipt_hash: 'd'.repeat(64),
            kernel_version: 'v0.1.4',
            metrics: { cost_units: 95 },
        }

        let resolved: any = null
        const bal: any = {
            idx: 'test-spatial-dispatch',
            src: seriesSlug,
            dat: {
                seriesSlug,
                receiptData: mockReceipt,
                targetEngineRoot: engineRoot,
            },
            slv: (res: any) => {
                resolved = res
            },
        }

        await dispatchSpatialPayloadsDownstream({}, bal, {
            hunt: async () => ({}),
        } as any)

        expect(resolved?.rcpBit?.val).toBe(1)
        expect(resolved?.rcpBit?.dat?.dispatched).toBe(true)

        const stagingDir = path.join(engineRoot, 'data', 'spatial', seriesSlug)
        expect(fs.existsSync(stagingDir)).toBe(true)

        const files = fs.readdirSync(stagingDir)
        expect(files.length).toBe(1)

        const stagedProof = JSON.parse(
            fs.readFileSync(path.join(stagingDir, files[0]), 'utf-8'),
        )
        expect(stagedProof.series_slug).toBe(seriesSlug)
        expect(stagedProof.spatial_audit_quadruple.receipt_hash).toBe(
            'd'.repeat(64),
        )
    })

    it('degrades gracefully with ENGINE_ROOT_ABSENT when sibling engine root is missing', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'spatial-dispatch-absent-'),
        )
        const missingEngineRoot = path.join(
            tempFleetRoot,
            'nonexistent-series-sower-engine',
        )

        const consoleLines: string[] = []
        let resolved: any = null
        await dispatchSpatialPayloadsDownstream(
            {},
            {
                src: 'gotham-trinity-crisis',
                dat: { targetEngineRoot: missingEngineRoot },
                slv: (res: any) => {
                    resolved = res
                },
            },
            {
                hunt: async (_act: string, payload: any) => {
                    if (payload?.src) consoleLines.push(String(payload.src))
                    return {}
                },
            } as any,
        )

        expect(resolved?.rcpBit?.idx).toBe('spatial-dispatch-no-engine')
        expect(resolved?.rcpBit?.val).toBe(0)
        expect(resolved?.rcpBit?.dat?.error).toBe('ENGINE_ROOT_ABSENT')
        expect(fs.existsSync(missingEngineRoot)).toBe(false)
        expect(consoleLines.some((l) => l.includes('>> [SPATIAL:WARN]'))).toBe(
            true,
        )
    })

    it('captures filesystem write faults fail-closed with spatial-dispatch-error', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'spatial-dispatch-fault-'),
        )
        const blockingFile = path.join(tempFleetRoot, 'file-not-a-dir')
        fs.writeFileSync(blockingFile, 'lock', 'utf8')

        const consoleLines: string[] = []
        let resolved: any = null
        await dispatchSpatialPayloadsDownstream(
            {},
            {
                src: 'gotham-trinity-crisis',
                dat: { targetEngineRoot: blockingFile },
                slv: (res: any) => {
                    resolved = res
                },
            },
            {
                hunt: async (_act: string, payload: any) => {
                    if (payload?.src) consoleLines.push(String(payload.src))
                    return {}
                },
            } as any,
        )

        expect(resolved?.rcpBit?.idx).toBe('spatial-dispatch-error')
        expect(resolved?.rcpBit?.val).toBe(-1)
        expect(
            consoleLines.some((l) => l.includes(':: [SPATIAL_DISPATCH_FAULT]')),
        ).toBe(true)
    })

    it('runs headlessly without LIBRARY and preserves all 4 hashes and integer metrics', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'spatial-dispatch-headless-'),
        )
        const engineRoot = path.join(tempFleetRoot, '000.series-sower-engine')
        fs.mkdirSync(engineRoot, { recursive: true })

        const prevLib = (globalThis as any).LIBRARY
        delete (globalThis as any).LIBRARY
        try {
            const inputReceipt = {
                topology_hash: '1'.repeat(64),
                overlay_hash: '2'.repeat(64),
                query_hash: '3'.repeat(64),
                receipt_hash: '4'.repeat(64),
                kernel_version: 'v0.1.4',
                metrics: {
                    max_cells_expanded: 256,
                    cost_units: 88,
                    snr_margin_cdb: 2300,
                },
            }

            const consoleLines: string[] = []
            let resolved: any = null
            await dispatchSpatialPayloadsDownstream(
                {},
                {
                    src: 'wiregrass-basin',
                    dat: {
                        seriesSlug: 'wiregrass-basin',
                        receiptData: inputReceipt,
                        targetEngineRoot: engineRoot,
                    },
                    slv: (res: any) => {
                        resolved = res
                    },
                },
                {
                    hunt: async (_act: string, payload: any) => {
                        if (payload?.src) consoleLines.push(String(payload.src))
                        return {}
                    },
                } as any,
            )

            expect(resolved?.rcpBit?.idx).toBe('spatial-dispatch-success')
            expect(resolved?.rcpBit?.val).toBe(1)
            expect(
                consoleLines.some((l) =>
                    l.includes(
                        '>> [SPATIAL:DISPATCH] [OK] Staged spatial proof payload -> data/spatial/wiregrass-basin/spatial_proof_',
                    ),
                ),
            ).toBe(true)

            const stagingDir = path.join(
                engineRoot,
                'data',
                'spatial',
                'wiregrass-basin',
            )
            const files = fs.readdirSync(stagingDir)
            expect(files.length).toBe(1)
            const parsed = JSON.parse(
                fs.readFileSync(path.join(stagingDir, files[0]), 'utf8'),
            )
            expect(parsed.spatial_audit_quadruple).toEqual({
                topology_hash: inputReceipt.topology_hash,
                overlay_hash: inputReceipt.overlay_hash,
                query_hash: inputReceipt.query_hash,
                receipt_hash: inputReceipt.receipt_hash,
            })
            expect(parsed.metrics).toEqual(inputReceipt.metrics)
        } finally {
            if (prevLib !== undefined) {
                ;(globalThis as any).LIBRARY = prevLib
            }
        }
    })

    it('resolves sibling 000.series-sower-engine from nested workspace cwd (apps/995.library)', () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'spatial-dispatch-cwd-'),
        )
        const repoRoot = path.join(tempFleetRoot, '000.goblin-spatial')
        const nestedCwd = path.join(repoRoot, 'apps', '995.library')
        fs.mkdirSync(path.join(repoRoot, 'packages'), { recursive: true })
        fs.mkdirSync(nestedCwd, { recursive: true })

        const resolvedRoot = resolveDefaultEngineRoot(nestedCwd)
        expect(resolvedRoot).toBe(
            path.join(tempFleetRoot, '000.series-sower-engine'),
        )
    })
})
