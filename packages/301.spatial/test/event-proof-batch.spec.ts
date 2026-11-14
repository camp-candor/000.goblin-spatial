import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import {
    buildEventProofPacket,
    exportSpatialEventProofBatch,
} from '../42.receipt.unit/buz/spatialDispatch.buzz.js'
import type { SpatialBatchEventInput } from '../42.receipt.unit/fce/receipt.interface.js'

function makeEvent(
    seq: number,
    tick: number,
    startTime = '14:00',
): SpatialBatchEventInput {
    return {
        eventSequence: seq,
        tick,
        startDate: '2026-10-31',
        startTime,
        originCoord: createAxialCoord(0, 0),
        actors: [
            { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
            { actorId: 'BOB', coord: createAxialCoord(1, 0) },
        ],
        locationId: 'BRASS_WORKSHOP',
        locationName: 'Brass Workshop',
    }
}

describe('Spatial Event Proof Batch Suite', () => {
    const roots: string[] = []
    afterEach(() => {
        for (const r of roots.splice(0)) {
            if (fs.existsSync(r)) fs.rmSync(r, { recursive: true, force: true })
        }
    })
    function tmpDir(): string {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-batch-'))
        roots.push(d)
        return path.join(d, 'proofs')
    }

    it('exports proofs in chronological file order', () => {
        const out = tmpDir()
        const summary = exportSpatialEventProofBatch(
            [makeEvent(2, 10), makeEvent(1, 3), makeEvent(1, 5)],
            { outputDir: out },
        )
        expect(summary.packetCount).toBe(3)
        expect(summary.packetFiles).toEqual([
            'spatial_event_0001_t0003.json',
            'spatial_event_0001_t0005.json',
            'spatial_event_0002_t0010.json',
        ])
        expect(fs.existsSync(path.join(out, 'spatial_event_index.json'))).toBe(
            true,
        )
        for (const f of summary.packetFiles) {
            const raw = fs.readFileSync(path.join(out, f), 'utf-8')
            expect(raw.endsWith('\n')).toBe(true)
            expect(raw.includes('\r')).toBe(false)
            const packet = JSON.parse(raw)
            expect(packet.packetSha256).toMatch(/^[a-f0-9]{64}$/)
        }
    })

    it('keeps packet digests stable across repeated exports', () => {
        const first = buildEventProofPacket(makeEvent(1, 3))
        const second = buildEventProofPacket(makeEvent(1, 3))
        expect(first.packetSha256).toBe(second.packetSha256)
        expect(JSON.stringify(first)).toBe(JSON.stringify(second))
        const outA = tmpDir()
        const outB = tmpDir()
        const sumA = exportSpatialEventProofBatch([makeEvent(1, 3)], {
            outputDir: outA,
        })
        const sumB = exportSpatialEventProofBatch([makeEvent(1, 3)], {
            outputDir: outB,
        })
        expect(sumA.indexSha256).toBe(sumB.indexSha256)
        const bytesA = fs.readFileSync(
            path.join(outA, 'spatial_event_0001_t0003.json'),
            'utf-8',
        )
        const bytesB = fs.readFileSync(
            path.join(outB, 'spatial_event_0001_t0003.json'),
            'utf-8',
        )
        expect(bytesA).toBe(bytesB)
    })

    it('rejects traversal escapes fail closed', () => {
        expect(() =>
            exportSpatialEventProofBatch([makeEvent(1, 1)], {
                outputDir: '../evil-proofs',
            }),
        ).toThrow('UNSAFE_SPATIAL_BATCH_DIR')
        expect(() =>
            exportSpatialEventProofBatch([makeEvent(1, 1)], {
                outputDir: 'a/../../b',
            }),
        ).toThrow('UNSAFE_SPATIAL_BATCH_DIR')
    })

    it('preserves legacy dispatch callers without event batches', async () => {
        const { dispatchSpatialPayloadsDownstream } =
            await import('../42.receipt.unit/buz/spatialDispatch.buzz.js')
        const engineRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-eng-'))
        roots.push(engineRoot)
        const target = path.join(engineRoot, 'engine')
        fs.mkdirSync(target, { recursive: true })
        let resolved: unknown = null
        await dispatchSpatialPayloadsDownstream(
            {},
            {
                src: 'gotham-trinity-crisis',
                dat: {
                    seriesSlug: 'gotham-trinity-crisis',
                    receiptData: {
                        topology_hash: 'a'.repeat(64),
                        overlay_hash: 'b'.repeat(64),
                        query_hash: 'c'.repeat(64),
                        receipt_hash: 'd'.repeat(64),
                        kernel_version: 'v0.1.4',
                        metrics: { cost_units: 10 },
                    },
                    targetEngineRoot: target,
                },
                slv: (res: unknown) => {
                    resolved = res
                },
            },
            { hunt: async () => ({}) } as never,
        )
        expect((resolved as { rcpBit: { val: number } }).rcpBit.val).toBe(1)
    })

    it('sorts shuffled 3,1,2 sequences in index, validates packet fields, and rejects ../escape', () => {
        const out = tmpDir()
        const summary = exportSpatialEventProofBatch(
            [makeEvent(3, 30), makeEvent(1, 10), makeEvent(2, 20)],
            { outputDir: out },
        )
        const indexRaw = fs.readFileSync(
            path.join(out, 'spatial_event_index.json'),
            'utf-8',
        )
        const indexJson = JSON.parse(indexRaw) as { packetFiles: string[] }
        expect(indexJson.packetFiles).toEqual([
            'spatial_event_0001_t0010.json',
            'spatial_event_0002_t0020.json',
            'spatial_event_0003_t0030.json',
        ])
        expect(summary.packetFiles).toEqual(indexJson.packetFiles)
        for (const f of indexJson.packetFiles) {
            const packet = JSON.parse(
                fs.readFileSync(path.join(out, f), 'utf-8'),
            ) as Record<string, unknown>
            expect(packet.chronology).toBeDefined()
            expect(packet.incidentReport).toBeDefined()
            expect(packet.stageBrief).toBeDefined()
            expect(packet.packetSha256).toMatch(/^[a-f0-9]{64}$/)
        }
        expect(() =>
            exportSpatialEventProofBatch([makeEvent(1, 1)], {
                outputDir: '../escape',
            }),
        ).toThrow('UNSAFE_SPATIAL_BATCH_DIR')
    })
})
