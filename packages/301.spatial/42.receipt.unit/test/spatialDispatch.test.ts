import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { dispatchSpatialPayloadsDownstream } from '../buz/spatialDispatch.buzz.js'

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
})
