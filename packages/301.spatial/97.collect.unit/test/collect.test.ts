import { describe, it, expect, beforeEach } from 'vitest'
import { CollectModel } from '../collect.model.js'
import {
    createBatchCollector,
    initCollect,
    executeBatch,
} from '../buz/collect.buzz.js'
import type CollectBit from '../fce/collect.bit.js'

describe('97.collect.unit - Batch Query Aggregation', () => {
    let model: CollectModel

    beforeEach(() => {
        model = new CollectModel()
        initCollect(model)
    })

    describe('Synchronous Batch Execution & Zero Promise Invariant', () => {
        it('executes heterogeneous query batch synchronously returning frozen result', () => {
            const collector = createBatchCollector()
            const envelope = {
                batchId: 'batch_alpha_01',
                queries: {
                    q_ray_1: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 2, r: -2, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                    q_path_1: {
                        queryType: 'BOUNDED_PATH',
                        origin: { q: 0, r: 0, s: 0 },
                        destination: { q: 3, r: -3, s: 0 },
                        maxBudgetCostUnits: 500,
                        workEnvelopeLimit: 512,
                    },
                    q_displace_1: {
                        queryType: 'DISPLACEMENT',
                        targetCell: { q: 1, r: 1, s: -2 },
                        maxCellCapacity: 1,
                        maxBudgetCostUnits: 100,
                    },
                },
            }

            const result = collector.executeBatch(envelope)

            expect(result).not.toBeInstanceOf(Promise)
            expect(result.ok).toBe(true)
            expect(result.batchId).toBe('batch_alpha_01')
            expect(result.summary.totalQueries).toBe(3)
            expect(result.summary.succeededCount).toBe(3)
            expect(result.summary.failedCount).toBe(0)
            expect(result.summary.batchAuditHash).toMatch(/^[a-f0-9]{64}$/)
            expect(Object.isFrozen(result)).toBe(true)
            expect(Object.isFrozen(result.summary)).toBe(true)
            expect(Object.isFrozen(result.receipts)).toBe(true)
        })

        it('isolates errors so a single schema failure does not corrupt sibling results', () => {
            const collector = createBatchCollector()
            const envelope = {
                batchId: 'batch_partial_fail',
                queries: {
                    q_good: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 1, r: -1, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                    q_float_bad: {
                        queryType: 'RAYCAST',
                        origin: { q: 1.5, r: -1.5, s: 0 },
                        target: { q: 0, r: 0, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                },
            }

            const result = collector.executeBatch(envelope)

            expect(result).not.toBeInstanceOf(Promise)
            expect(result.ok).toBe(false)
            expect(result.summary.totalQueries).toBe(2)
            expect(result.summary.succeededCount).toBe(1)
            expect(result.summary.failedCount).toBe(1)
            expect(result.receipts.q_good.ok).toBe(true)
            expect(result.receipts.q_float_bad.ok).toBe(false)
            expect(result.receipts.q_float_bad.failureCode).toBe(
                'SCHEMA_BREACH',
            )
        })
    })

    describe('RFC 8785 Batch Audit Hash Determinism', () => {
        it('produces identical batch audit hash regardless of query key insertion order', () => {
            const collector = createBatchCollector()

            const envelope1 = {
                batchId: 'batch_order_test',
                queries: {
                    alpha: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 1, r: -1, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                    omega: {
                        queryType: 'RAYCAST',
                        origin: { q: 1, r: -1, s: 0 },
                        target: { q: 2, r: -2, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                },
            }

            const envelope2 = {
                batchId: 'batch_order_test',
                queries: {
                    omega: {
                        queryType: 'RAYCAST',
                        origin: { q: 1, r: -1, s: 0 },
                        target: { q: 2, r: -2, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                    alpha: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 1, r: -1, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                },
            }

            const res1 = collector.executeBatch(envelope1)
            const res2 = collector.executeBatch(envelope2)

            expect(res1.summary.batchAuditHash).toBe(
                res2.summary.batchAuditHash,
            )
        })
    })

    describe('Reducer & Buzzer Pipeline State Tracking', () => {
        it('executes batch via reducer and updates model telemetry counters', () => {
            let resolvedResult: any = null

            const bale: CollectBit = {
                idx: 'batch_exec_01',
                dat: {
                    envelope: {
                        batchId: 'b_test',
                        queries: {
                            q1: {
                                queryType: 'RAYCAST',
                                origin: { q: 0, r: 0, s: 0 },
                                target: { q: 1, r: -1, s: 0 },
                                mode: 'SUBTRACTIVE_LINEAR',
                            },
                        },
                    },
                },
                slv: (res) => {
                    resolvedResult = res.cltBit.dat?.result
                },
            }

            executeBatch(model, bale)

            expect(resolvedResult).toBeDefined()
            expect(resolvedResult.ok).toBe(true)
            expect(model.totalBatchesProcessed).toBe(1)
            expect(model.totalQueriesProcessed).toBe(1)
            expect(model.lastBatchDurationMicros).toBeGreaterThanOrEqual(0)
        })
    })
})
