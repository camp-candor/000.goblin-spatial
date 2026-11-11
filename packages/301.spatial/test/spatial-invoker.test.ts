import { describe, it, expect, beforeEach } from 'vitest'
import {
    createInProcessSpatialPort,
    createSpatialKernel,
    PureSpatialKernel,
    SpatialPort,
} from '../00.spatial.unit/buz/spatial.buzz.js'
import {
    createAxialCoord,
    packAxial,
} from '../28.axial.unit/val/axial.model.js'
import { PerceptCandidate } from '../42.receipt.unit/fce/receipt.interface.js'
import { PathQueryResult } from '../43.path.unit/buz/path.buzz.js'

describe('Task 8.4 In-Process Zero-Serialization Synchronous Invoker', () => {
    let kernel: PureSpatialKernel
    let port: SpatialPort

    beforeEach(() => {
        kernel = createSpatialKernel()
        port = createInProcessSpatialPort(kernel)
    })

    it('executes optical raycast synchronously in-process without Promises', () => {
        const rawQuery = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 2, r: 0, s: -2 },
            thresholdBps: 500,
            calculationMode: 'SUBTRACTIVE_LINEAR',
        }

        const receipt = port.invokeSynchronous<PerceptCandidate>(rawQuery)

        expect(receipt.ok).toBe(true)
        expect(receipt.queryType).toBe('RAYCAST')
        expect(receipt.result).toBeDefined()
        expect(receipt.result.evidence.modality).toBe('OPTICAL')
        expect(receipt.auditQuadruple.queryHash).toMatch(/^[0-9a-f]{64}$/)
        expect(receipt.auditQuadruple.receiptHash).toMatch(/^[0-9a-f]{64}$/)
        expect(Object.isFrozen(receipt)).toBe(true)
        expect(Object.isFrozen(receipt.result)).toBe(true)
    })

    it('executes bounded pathfinding query synchronously in-process', () => {
        const rawQuery = {
            queryType: 'BOUNDED_PATH',
            origin: { q: -2, r: 0, s: 2 },
            destination: { q: 2, r: 0, s: -2 },
            maxBudgetCostUnits: 600,
            workEnvelopeLimit: 512,
        }

        const receipt = port.invokeSynchronous<PathQueryResult>(rawQuery)

        expect(receipt.ok).toBe(true)
        expect(receipt.queryType).toBe('BOUNDED_PATH')
        expect(receipt.result.ok).toBe(true)
        if (receipt.result.ok) {
            expect(receipt.result.path.length).toBe(5)
            expect(receipt.result.totalCostUnits).toBe(400)
        }
    })

    it('rejects queries containing banned narrative tags at T_0 before kernel math', () => {
        const contaminatedQuery = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 1, r: 0, s: -1 },
            character_id: 'char_bog',
            dialogue_text: 'Watch your step!',
        }

        const receipt = port.invokeSynchronous(contaminatedQuery)

        expect(receipt.ok).toBe(false)
        expect(receipt.error).toContain('NARRATIVE_TAGS_FORBIDDEN')
        expect(receipt.result).toBeNull()
    })

    it('binds optional hash chain ledger logging monotonically', () => {
        const streamId = 'test_simulation_stream_01'
        const query = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 1, r: 0, s: -1 },
        }

        const receipt1 = port.invokeSynchronous(query, {
            streamId,
            currentTick: 10,
            recordLedger: true,
        })

        const receipt2 = port.invokeSynchronous(query, {
            streamId,
            currentTick: 11,
            recordLedger: true,
        })

        expect(receipt1.ledgerEntry).toBeDefined()
        expect(receipt2.ledgerEntry).toBeDefined()
        expect((receipt1.ledgerEntry as any)?.seq).toBe(1)
        expect((receipt2.ledgerEntry as any)?.seq).toBe(2)
    })

    it('satisfies high-throughput benchmark: 1,000 synchronous queries in < 150ms', () => {
        const query = {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 2, r: 0, s: -2 },
        }

        const iterations = 1000
        const start = performance.now()

        for (let i = 0; i < iterations; i++) {
            const res = port.invokeSynchronous(query)
            if (!res.ok) {
                throw new Error(`Unexpected failure at index ${i}`)
            }
        }

        const duration = performance.now() - start
        const avgMicros = (duration / iterations) * 1000

        // Must execute 1,000 queries in under 150ms total (< 150us per query average).
        // Re-baselined from 15ms by owner directive: measured mandated-work floor
        // (Zod x2 + JCS x2 + SHA-256 x2 + deep-freeze) is ~41ms warmed, ~65-80ms cold,
        // ~110-140ms under parallel-suite load on local silicon.
        expect(duration).toBeLessThan(150.0)
        expect(avgMicros).toBeLessThan(150.0)
    })

    it('does not memoize receipts across invocations with equal queries', () => {
        const makeQuery = () => ({
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 2, r: 0, s: -2 },
        })

        // Distinct objects, equal values: defeats both reference-identity
        // and value-keyed memoization. Each invoke must execute honestly.
        const receipt1 = port.invokeSynchronous(makeQuery())
        const receipt2 = port.invokeSynchronous(makeQuery())

        expect(receipt1.ok).toBe(true)
        expect(receipt2.ok).toBe(true)
        expect(receipt2).not.toBe(receipt1)
    })
})
