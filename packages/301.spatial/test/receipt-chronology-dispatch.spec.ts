import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { ReceiptModel } from '../42.receipt.unit/receipt.model.js'
import {
    mintPathReceipt,
    mintPerceptReceipt,
} from '../42.receipt.unit/buz/receipt.buzz.js'
import {
    buildSpatialChronologyStamp,
    dispatchSpatialPayloadsDownstream,
} from '../42.receipt.unit/buz/spatialDispatch.buzz.js'
import {
    appendEntry,
    verifyLedgerLineage,
} from '../19.ledger.unit/buz/ledger.buzz.js'
import { LedgerModel } from '../19.ledger.unit/ledger.model.js'

const QUAD = {
    topologyHash: 'a'.repeat(64),
    overlayHash: 'b'.repeat(64),
    queryHash: 'c'.repeat(64),
    receiptHash: 'd'.repeat(64),
}

function makeEngineRoot(prefix: string): string {
    const fleet = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
    const engineRoot = path.join(fleet, '000.series-sower-engine')
    fs.mkdirSync(engineRoot, { recursive: true })
    return engineRoot
}

function readStagedProof(engineRoot: string, slug: string): any {
    const dir = path.join(engineRoot, 'data', 'spatial', slug)
    const files = fs.readdirSync(dir)
    return JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'))
}

describe('Spatial Chronology Receipt Dispatch Suite', () => {
    const tempRoots: string[] = []
    afterEach(() => {
        for (const root of tempRoots.splice(0)) {
            const fleet = path.dirname(root)
            if (fs.existsSync(fleet)) {
                fs.rmSync(fleet, { recursive: true, force: true })
            }
        }
    })

    it('passes legacy receipts through without chronology stamp', async () => {
        const engineRoot = makeEngineRoot('chrono-legacy-')
        tempRoots.push(engineRoot)
        let resolved: any = null
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
                        metrics: { cost_units: 95 },
                    },
                    targetEngineRoot: engineRoot,
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            { hunt: async () => ({}) } as any,
        )
        expect(resolved?.rcpBit?.val).toBe(1)
        const staged = readStagedProof(engineRoot, 'gotham-trinity-crisis')
        expect(staged.series_slug).toBe('gotham-trinity-crisis')
        expect(staged.spatial_audit_quadruple.receipt_hash).toBe('d'.repeat(64))
        expect('chronology' in staged).toBe(false)
        expect(resolved?.rcpBit?.dat?.dispatched).toBe(true)
    })

    it('seals AFTERNOON distinct from NIGHT digests', async () => {
        const dayStamp = buildSpatialChronologyStamp({
            startDate: '2026-10-31',
            startTime: '14:00',
        })
        const nightStamp = buildSpatialChronologyStamp({
            startDate: '2026-10-31',
            startTime: '23:00',
        })
        expect(dayStamp.daypart).toBe('AFTERNOON')
        expect(nightStamp.daypart).toBe('NIGHT')
        expect(dayStamp.ambient_luminance_bps).toBe(10000)
        expect(nightStamp.ambient_luminance_bps).toBe(1500)
        expect(Number.isInteger(dayStamp.ambient_luminance_bps)).toBe(true)
        expect(Number.isInteger(nightStamp.diurnal_noise_delta_cdb)).toBe(true)

        const mkReceipt = () => ({
            topology_hash: 'a'.repeat(64),
            overlay_hash: 'b'.repeat(64),
            query_hash: 'c'.repeat(64),
            receipt_hash: 'd'.repeat(64),
            kernel_version: 'v0.1.4',
            metrics: { cost_units: 95 },
        })

        const dayRoot = makeEngineRoot('chrono-day-')
        const nightRoot = makeEngineRoot('chrono-night-')
        tempRoots.push(dayRoot, nightRoot)

        let dayResolved: any = null
        await dispatchSpatialPayloadsDownstream(
            {},
            {
                src: 'gotham-trinity-crisis',
                dat: {
                    seriesSlug: 'gotham-trinity-crisis',
                    receiptData: mkReceipt(),
                    targetEngineRoot: dayRoot,
                    startDate: '2026-10-31',
                    startTime: '14:00',
                },
                slv: (res: any) => {
                    dayResolved = res
                },
            },
            { hunt: async () => ({}) } as any,
        )
        let nightResolved: any = null
        await dispatchSpatialPayloadsDownstream(
            {},
            {
                src: 'gotham-trinity-crisis',
                dat: {
                    seriesSlug: 'gotham-trinity-crisis',
                    receiptData: mkReceipt(),
                    targetEngineRoot: nightRoot,
                    startDate: '2026-10-31',
                    startTime: '23:00',
                },
                slv: (res: any) => {
                    nightResolved = res
                },
            },
            { hunt: async () => ({}) } as any,
        )
        expect(dayResolved?.rcpBit?.val).toBe(1)
        expect(nightResolved?.rcpBit?.val).toBe(1)
        const dayProof = readStagedProof(dayRoot, 'gotham-trinity-crisis')
        const nightProof = readStagedProof(nightRoot, 'gotham-trinity-crisis')
        expect(dayProof.chronology.daypart).toBe('AFTERNOON')
        expect(nightProof.chronology.daypart).toBe('NIGHT')
        expect(dayProof.chronology.start_time_hm).toBe('14:00')
        expect(nightProof.chronology.start_time_hm).toBe('23:00')
        expect(dayProof.proof_digest).toMatch(/^[a-f0-9]{64}$/)
        expect(nightProof.proof_digest).toMatch(/^[a-f0-9]{64}$/)
        expect(dayProof.proof_digest).not.toBe(nightProof.proof_digest)
        expect(dayProof.spatial_audit_quadruple.receipt_hash).not.toBe(
            nightProof.spatial_audit_quadruple.receipt_hash,
        )
        expect(dayResolved?.rcpBit?.dat?.proofDigest).toBe(
            dayProof.proof_digest,
        )
    })

    it('stamps ledger entries with optional chronology metadata', () => {
        const model = new LedgerModel()
        let first: any = null
        appendEntry(model, {
            idx: 'legacy-entry',
            dat: {
                queryType: 'RAYCAST',
                tickNumber: 0,
                streamId: 'stream-alpha',
                auditQuadruple: QUAD,
            },
            slv: (res: any) => {
                first = res.ldgBit.dat?.entry
            },
        })
        expect(first).toBeDefined()
        expect(first.sequenceNumber).toBe(1)
        expect('chronology' in first).toBe(false)

        const stampedEntry = Object.freeze({
            sequenceNumber: 2,
            tickNumber: 1,
            streamId: 'stream-alpha',
            queryType: 'RAYCAST',
            auditQuadruple: QUAD,
            kernelVersion: 'v1.0.0-spatial-oracle',
            prevEventHash: first.chainedEventHash,
            chainedEventHash: 'e'.repeat(64),
            recordedAtMs: 123456,
            chronology: {
                start_date: '2026-10-31',
                start_time_hm: '14:00',
                daypart: 'AFTERNOON',
            },
        })
        expect(stampedEntry.chronology.start_date).toBe('2026-10-31')
        expect(stampedEntry.chronology.daypart).toBe('AFTERNOON')
        const lineage = verifyLedgerLineage(model.entries)
        expect(lineage.valid).toBe(true)
    })

    it('rejects malformed chronology stamps fail-closed', async () => {
        const model = new ReceiptModel()
        let errorEmitted: any = null
        mintPerceptReceipt(model, {
            idx: 'bad-chrono',
            dat: {
                perceptCandidate: {
                    sourceCoord: { q: 0, r: 0, s: 0 },
                    observerCoord: { q: 1, r: -1, s: 0 },
                    qualityScorePerMille: 500,
                    arrivalBearing: 1,
                    isOccluded: false,
                    evidence: {
                        modality: 'OPTICAL',
                        transmissionBps: 9000,
                        topologicalDistance: 1,
                        occludingBarrierCoord: null,
                    },
                    auditQuadruple: QUAD,
                    chronology: {
                        start_date: '2026-10-31',
                        start_time_hm: '14:00',
                        daypart: 'AFTERNOON',
                        ambient_luminance_bps: 99999,
                        optical_range_scale_bps: 10000,
                        diurnal_noise_delta_cdb: 200,
                        timezone_label: 'UTC+00:00',
                    },
                } as any,
            },
            slv: (res: any) => {
                errorEmitted = res.rcpBit.dat?.error
            },
        })
        expect(errorEmitted).toContain('[CHRONOLOGY_SCHEMA_BREACH]')
        expect(model.totalPerceptReceiptsMinted).toBe(0)

        const engineRoot = makeEngineRoot('chrono-bad-')
        tempRoots.push(engineRoot)
        let resolved: any = null
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
                        metrics: {},
                    },
                    targetEngineRoot: engineRoot,
                    chronology: {
                        start_date: 'bad-date',
                        start_time_hm: '14:00',
                        daypart: 'AFTERNOON',
                        ambient_luminance_bps: 10000,
                        optical_range_scale_bps: 10000,
                        diurnal_noise_delta_cdb: 200,
                        timezone_label: 'UTC+00:00',
                    },
                },
                slv: (res: any) => {
                    resolved = res
                },
            },
            { hunt: async () => ({}) } as any,
        )
        expect(resolved?.rcpBit?.idx).toBe('spatial-dispatch-error')
    })

    it('validates minted percept receipts carrying chronology', () => {
        const model = new ReceiptModel()
        const stamp = buildSpatialChronologyStamp({
            startDate: '2026-10-31',
            startTime: '14:00',
        })
        let emitted: any = null
        mintPerceptReceipt(model, {
            idx: 'good-chrono',
            dat: {
                perceptCandidate: {
                    sourceCoord: { q: 0, r: 0, s: 0 },
                    observerCoord: { q: 1, r: -1, s: 0 },
                    qualityScorePerMille: 850,
                    arrivalBearing: 2,
                    isOccluded: false,
                    evidence: {
                        modality: 'OPTICAL',
                        transmissionBps: 9200,
                        topologicalDistance: 1,
                        occludingBarrierCoord: null,
                    },
                    auditQuadruple: QUAD,
                    chronology: stamp,
                } as any,
            },
            slv: (res: any) => {
                emitted = res.rcpBit.dat?.perceptCandidate
            },
        })
        expect(emitted).toBeDefined()
        expect(emitted.chronology.daypart).toBe('AFTERNOON')
        expect(emitted.chronology.ambient_luminance_bps).toBe(10000)
        expect(Object.isFrozen(emitted)).toBe(true)
        expect(model.totalPerceptReceiptsMinted).toBe(1)

        let pathEmitted: any = null
        mintPathReceipt(model, {
            idx: 'path-chrono',
            dat: {
                pathReceipt: {
                    ok: true,
                    originPacked: 0,
                    destinationPacked: 1,
                    path: [0, 1],
                    totalCostUnits: 10,
                    stepsExpanded: 2,
                    auditQuadruple: QUAD,
                    chronology: stamp,
                } as any,
            },
            slv: (res: any) => {
                pathEmitted = res.rcpBit.dat?.pathReceipt
            },
        })
        expect(pathEmitted?.chronology?.start_date).toBe('2026-10-31')
        expect(model.totalPathReceiptsMinted).toBe(1)
    })
})
