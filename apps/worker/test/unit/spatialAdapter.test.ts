import { describe, it, expect } from 'vitest'
import app from '../../src/index.js'
import {
    EdgeSpatialAdapter,
    computeSha256Hex,
    canonicalizeJson,
} from '../../src/spatial/inProcessAdapter.js'

describe('Phase 8: Cloudflare Edge Worker Staging Adapter', () => {
    const adapter = new EdgeSpatialAdapter()

    describe('Health Endpoints', () => {
        it('GET /health returns healthy status and kernel version', async () => {
            expect(adapter.kernelVersion).toBe('v1.0.0-spatial-oracle')
            const res = await app.fetch(
                new Request('http://localhost/health'),
                {} as any,
            )
            expect(res.status).toBe(200)
            const data: any = await res.json()
            expect(data.status).toBe('HEALTHY')
            expect(data.kernelVersion).toBe('v1.0.0-spatial-oracle')
        })

        it('GET /spatial/health returns 7-bit clean ASCII status banner', async () => {
            const res = await app.fetch(
                new Request('http://localhost/spatial/health'),
                {} as any,
            )
            expect(res.status).toBe(200)
            const text = await res.text()
            expect(text).toContain('>> [SPATIAL::EDGE]')
            expect(/^[\x20-\x7E\r\n\t]+$/.test(text)).toBe(true)
        })
    })

    describe('Stateless Ingress Query Route (POST /spatial/query)', () => {
        it('evaluates valid raycast query and binds cryptographic audit quadruple', async () => {
            const reqPayload = {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 2, r: -2, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            }

            const res = await app.fetch(
                new Request('http://localhost/spatial/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Topology-Hash': 'a'.repeat(64),
                        'X-Overlay-Hash': 'b'.repeat(64),
                    },
                    body: JSON.stringify(reqPayload),
                }),
                {} as any,
            )

            expect(res.status).toBe(200)
            const receipt: any = await res.json()
            expect(receipt.ok).toBe(true)
            expect(receipt.queryType).toBe('RAYCAST')
            expect(receipt.payload.auditQuadruple.topologyHash).toBe(
                'a'.repeat(64),
            )
            expect(receipt.payload.auditQuadruple.overlayHash).toBe(
                'b'.repeat(64),
            )
            expect(receipt.payload.auditQuadruple.queryHash).toMatch(
                /^[a-f0-9]{64}$/,
            )
            expect(receipt.payload.auditQuadruple.receiptHash).toMatch(
                /^[a-f0-9]{64}$/,
            )
        })

        it('strips banned narrative tags and rejects floating-point coordinates', async () => {
            const dirtyFloatQuery = {
                queryType: 'RAYCAST',
                origin: { q: 1.5, r: -1.5, s: 0 },
                target: { q: 2, r: -2, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
                actorId: 'char_bog',
                dialogue: 'Watch out',
            }

            const res = await app.fetch(
                new Request('http://localhost/spatial/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dirtyFloatQuery),
                }),
                {} as any,
            )

            expect(res.status).toBe(400)
            const receipt: any = await res.json()
            expect(receipt.ok).toBe(false)
            expect(receipt.failureCode).toBe('SCHEMA_BREACH')
        })

        it('enforces work budget ceiling returning BUDGET_EXCEEDED', async () => {
            const runawayPathQuery = {
                queryType: 'BOUNDED_PATH',
                origin: { q: -50, r: 50, s: 0 },
                destination: { q: 50, r: -50, s: 0 },
                maxBudgetCostUnits: 10000,
                workEnvelopeLimit: 256,
            }

            const res = await app.fetch(
                new Request('http://localhost/spatial/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(runawayPathQuery),
                }),
                {} as any,
            )

            expect(res.status).toBe(400)
            const receipt: any = await res.json()
            expect(receipt.ok).toBe(false)
            expect(receipt.failureCode).toBe('BUDGET_EXCEEDED')
        })
    })

    describe('Batch Query Aggregation Route (POST /spatial/batch)', () => {
        it('evaluates heterogeneous queries and computes deterministic batch audit hash', async () => {
            const batchPayload = {
                batchId: 'batch_edge_01',
                queries: {
                    q_ray: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 1, r: -1, s: 0 },
                    },
                    q_path: {
                        queryType: 'BOUNDED_PATH',
                        origin: { q: 0, r: 0, s: 0 },
                        destination: { q: 2, r: -2, s: 0 },
                        maxBudgetCostUnits: 500,
                        workEnvelopeLimit: 512,
                    },
                },
            }

            const res = await app.fetch(
                new Request('http://localhost/spatial/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batchPayload),
                }),
                {} as any,
            )

            expect(res.status).toBe(200)
            const result: any = await res.json()
            expect(result.ok).toBe(true)
            expect(result.summary.totalQueries).toBe(2)
            expect(result.summary.succeededCount).toBe(2)
            expect(result.summary.batchAuditHash).toMatch(/^[a-f0-9]{64}$/)
        })

        it('isolates errors across queries returning HTTP 207 Multi-Status equivalent', async () => {
            const partialBatchPayload = {
                batchId: 'batch_edge_partial',
                queries: {
                    q_valid: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 1, r: -1, s: 0 },
                    },
                    q_bad_float: {
                        queryType: 'RAYCAST',
                        origin: { q: 1.25, r: -1.25, s: 0 },
                        target: { q: 0, r: 0, s: 0 },
                    },
                },
            }

            const res = await app.fetch(
                new Request('http://localhost/spatial/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partialBatchPayload),
                }),
                {} as any,
            )

            expect(res.status).toBe(207)
            const result: any = await res.json()
            expect(result.ok).toBe(false)
            expect(result.summary.totalQueries).toBe(2)
            expect(result.summary.succeededCount).toBe(1)
            expect(result.summary.failedCount).toBe(1)
            expect(result.receipts.q_valid.ok).toBe(true)
            expect(result.receipts.q_bad_float.ok).toBe(false)
            expect(result.receipts.q_bad_float.failureCode).toBe(
                'SCHEMA_BREACH',
            )
        })
    })

    describe('RFC 8785 Canonical Serialization', () => {
        it('produces identical SHA-256 digest regardless of property order', async () => {
            const obj1 = { z: 1, a: 'test', m: { y: 10, b: 20 } }
            const obj2 = { a: 'test', m: { b: 20, y: 10 }, z: 1 }

            const canon1 = canonicalizeJson(obj1)
            const canon2 = canonicalizeJson(obj2)
            expect(canon1).toBe(canon2)

            const hash1 = await computeSha256Hex(canon1)
            const hash2 = await computeSha256Hex(canon2)
            expect(hash1).toBe(hash2)
        })
    })
})
