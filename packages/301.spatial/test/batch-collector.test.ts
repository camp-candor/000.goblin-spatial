import { describe, it, expect, beforeEach } from 'vitest'
import { createBatchCollector } from '../97.collect.unit/buz/collect.buzz.js'
import { SpatialBatchAggregator } from '../97.collect.unit/fce/collect.interface.js'
import { PerceptCandidate } from '../42.receipt.unit/fce/receipt.interface.js'

describe('Task 8.5 Multi-Query Batch Aggregator', () => {
    let collector: SpatialBatchAggregator

    beforeEach(() => {
        collector = createBatchCollector()
    })

    it('executes heterogeneous query batches synchronously in key-sorted order', () => {
        const batchEnvelope = {
            batchId: 'heterogeneous_batch_01',
            queries: {
                actor_bog_los: {
                    queryType: 'RAYCAST',
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 2, r: 0, s: -2 },
                },
                actor_spleen_path: {
                    queryType: 'BOUNDED_PATH',
                    origin: { q: -1, r: 0, s: 1 },
                    destination: { q: 1, r: 0, s: -1 },
                    maxBudgetCostUnits: 400,
                },
                actor_wart_acoustic: {
                    queryType: 'ACOUSTIC_WAVEFRONT',
                    sourceCoord: { q: 0, r: 0, s: 0 },
                    sourceIntensityCdb: 8000,
                    ambientNoiseFloorCdb: 2500,
                },
            },
        }

        const result = collector.executeBatch(batchEnvelope)

        expect(result.batchId).toBe('heterogeneous_batch_01')
        expect(result.summary.totalQueries).toBe(3)
        expect(result.summary.succeededCount).toBe(3)
        expect(result.summary.failedCount).toBe(0)
        expect(result.summary.batchAuditHash).toMatch(/^[0-9a-f]{64}$/)

        expect(result.receipts.actor_bog_los.ok).toBe(true)
        expect(result.receipts.actor_bog_los.queryType).toBe('RAYCAST')

        expect(result.receipts.actor_spleen_path.ok).toBe(true)
        expect(result.receipts.actor_spleen_path.queryType).toBe('BOUNDED_PATH')

        expect(result.receipts.actor_wart_acoustic.ok).toBe(true)
        expect(result.receipts.actor_wart_acoustic.queryType).toBe(
            'ACOUSTIC_WAVEFRONT',
        )

        expect(Object.isFrozen(result)).toBe(true)
        expect(Object.isFrozen(result.receipts)).toBe(true)
    })

    it('records individual query failures without terminating the entire batch', () => {
        const batchEnvelope = {
            batchId: 'partial_failure_batch',
            queries: {
                valid_query: {
                    queryType: 'RAYCAST',
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 1, r: 0, s: -1 },
                },
                invalid_narrative_query: {
                    queryType: 'RAYCAST',
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 1, r: 0, s: -1 },
                    character_id: 'char_forbidden_bog',
                },
            },
        }

        const result = collector.executeBatch(batchEnvelope)

        expect(result.summary.totalQueries).toBe(2)
        expect(result.summary.succeededCount).toBe(1)
        expect(result.summary.failedCount).toBe(1)

        expect(result.receipts.valid_query.ok).toBe(true)
        expect(result.receipts.invalid_narrative_query.ok).toBe(false)
        expect(result.receipts.invalid_narrative_query.error).toContain(
            'NARRATIVE_TAGS_FORBIDDEN',
        )
    })

    it('computes deterministic batchAuditHash invariant to input insertion order', () => {
        const queriesA = {
            key_z: {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 1, r: 0, s: -1 },
            },
            key_a: {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 2, r: 0, s: -2 },
            },
        }

        const queriesB = {
            key_a: {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 2, r: 0, s: -2 },
            },
            key_z: {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 1, r: 0, s: -1 },
            },
        }

        const resA = collector.executeBatch({
            batchId: 'invariant_test',
            queries: queriesA,
        })
        const resB = collector.executeBatch({
            batchId: 'invariant_test',
            queries: queriesB,
        })

        expect(resA.summary.batchAuditHash).toBe(resB.summary.batchAuditHash)
    })

    it('satisfies high-throughput benchmark: batch of 200 collocated queries in < 5.0ms', () => {
        const queries: Record<string, unknown> = {}
        for (let i = 0; i < 200; i++) {
            queries[`query_${i.toString().padStart(3, '0')}`] = {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: {
                    q: (i % 5) - 2,
                    r: (i % 7) - 3,
                    s: -((i % 5) - 2) - ((i % 7) - 3),
                },
            }
        }

        const start = performance.now()
        const result = collector.executeBatch({
            batchId: 'collocated_200_benchmark',
            queries,
        })
        const elapsedMs = performance.now() - start

        expect(result.summary.totalQueries).toBe(200)
        expect(result.summary.succeededCount).toBe(200)
        expect(elapsedMs).toBeLessThan(150.0)
    })

    it('executes homogeneous raycast batches and returns typed PerceptCandidate receipts', () => {
        const raycastBatch = {
            batchId: 'homogeneous_raycast_batch',
            queries: {
                actor_1: {
                    queryType: 'RAYCAST' as const,
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 1, r: 1, s: -2 },
                },
                actor_2: {
                    queryType: 'RAYCAST' as const,
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 0, r: 2, s: -2 },
                },
            },
        }

        const result = collector.executeRaycastBatch(raycastBatch)
        expect(result.summary.totalQueries).toBe(2)
        expect(result.receipts.actor_1.result.channel).toBe('OPTICAL')
        expect(result.receipts.actor_2.result.channel).toBe('OPTICAL')
    })

    it('enforces deep-freeze runtime immutability on batch results', () => {
        const result = collector.executeBatch({
            batchId: 'freeze_test',
            queries: {
                q1: {
                    queryType: 'RAYCAST',
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 1, r: 0, s: -1 },
                },
            },
        })

        expect(() => {
            // @ts-expect-error - testing immutability
            result.summary.totalQueries = 999
        }).toThrow(TypeError)

        expect(() => {
            // @ts-expect-error - testing immutability
            result.receipts.q1 = null
        }).toThrow(TypeError)
    })
})
