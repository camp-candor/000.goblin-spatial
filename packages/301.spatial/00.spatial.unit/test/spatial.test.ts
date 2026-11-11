import { describe, it, expect, beforeEach } from 'vitest'
import { SpatialModel } from '../spatial.model.js'
import {
    InProcessSpatialAdapter,
    createInProcessSpatialPort,
} from '../buz/adapter.buzz.js'
import { GENESIS_HASH_64 } from '../../19.ledger.unit/val/ledger.model.js'

describe('00.spatial.unit - In-Process Synchronous Spatial Adapter', () => {
    let adapter: InProcessSpatialAdapter

    beforeEach(() => {
        adapter = new InProcessSpatialAdapter()
    })

    describe('Synchronous Execution & Zero Promise Invariant', () => {
        it('executes raycast query synchronously returning frozen receipt', () => {
            const rawQuery = {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 4, r: -4, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            }

            const result = adapter.invokeSynchronous(rawQuery)

            expect(result).not.toBeInstanceOf(Promise)
            expect(result.ok).toBe(true)
            expect(result.queryType).toBe('RAYCAST')
            expect(result.executionMicros).toBeGreaterThanOrEqual(0)
            expect(Object.isFrozen(result)).toBe(true)
            expect(Object.isFrozen(result.payload)).toBe(true)
        })

        it('attaches 4-part cryptographic audit quadruple to receipt payload', () => {
            const rawQuery = {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 2, r: -2, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            }

            const context = {
                executionId: 'exec_test_01',
                sequenceNumber: 1,
                tickNumber: 0,
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
            }

            const result: any = adapter.invokeSynchronous(rawQuery, context)
            expect(result.ok).toBe(true)
            expect(result.payload.auditQuadruple).toBeDefined()
            expect(result.payload.auditQuadruple.topologyHash).toBe(
                'a'.repeat(64),
            )
            expect(result.payload.auditQuadruple.overlayHash).toBe(
                'b'.repeat(64),
            )
            expect(result.payload.auditQuadruple.queryHash).toMatch(
                /^[a-f0-9]{64}$/,
            )
            expect(result.payload.auditQuadruple.receiptHash).toMatch(
                /^[a-f0-9]{64}$/,
            )
        })
    })

    describe('Epistemic Firewall Narrative Stripping', () => {
        it('strips narrative properties from incoming query before kernel execution', () => {
            const dirtyQuery = {
                queryType: 'BOUNDED_PATH',
                origin: { q: 0, r: 0, s: 0 },
                destination: { q: 3, r: -3, s: 0 },
                maxBudgetCostUnits: 500,
                workEnvelopeLimit: 512,
                actorId: 'char_bog',
                characterName: 'Bog',
                dialogue: 'Watch out',
                trauma: 'BLEEDING_LEG',
            }

            const result: any = adapter.invokeSynchronous(dirtyQuery)
            expect(result.ok).toBe(true)
            expect(result.payload.ok).toBe(true)
            expect(result.payload.path).toBeDefined()
            expect(result.payload.actorId).toBeUndefined()
        })

        it('fails closed with SCHEMA_BREACH when query has non-integer coordinates', () => {
            const floatQuery = {
                queryType: 'RAYCAST',
                origin: { q: 1.5, r: -1.5, s: 0 },
                target: { q: 4, r: -4, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            }

            const result = adapter.invokeSynchronous(floatQuery)
            expect(result.ok).toBe(false)
            expect(result.failureCode).toBe('SCHEMA_BREACH')
        })
    })

    describe('Deterministic Bounded Work Envelope Ceiling', () => {
        it('trips BUDGET_EXCEEDED when expansion reaches workEnvelopeLimit', () => {
            const longPathQuery = {
                queryType: 'BOUNDED_PATH',
                origin: { q: -50, r: 50, s: 0 },
                destination: { q: 50, r: -50, s: 0 },
                maxBudgetCostUnits: 10000,
                workEnvelopeLimit: 256, // Low envelope ceiling
            }

            const result: any = adapter.invokeSynchronous(longPathQuery)
            expect(result.ok).toBe(false)
            expect(result.failureCode).toBe('BUDGET_EXCEEDED')
            expect(result.payload.ok).toBe(false)
            expect(result.payload.failureCode).toBe('BUDGET_EXCEEDED')
        })

        it('returns UNREACHABLE when budget is insufficient for path', () => {
            const expensiveQuery = {
                queryType: 'BOUNDED_PATH',
                origin: { q: 0, r: 0, s: 0 },
                destination: { q: 10, r: -10, s: 0 },
                maxBudgetCostUnits: 100, // Distance cost is 500
                workEnvelopeLimit: 1024,
            }

            const result: any = adapter.invokeSynchronous(expensiveQuery)
            expect(result.ok).toBe(false)
            expect(result.failureCode).toBe('UNREACHABLE')
        })
    })

    describe('Factory Helper Function', () => {
        it('creates an adapter instance through createInProcessSpatialPort', () => {
            const port = createInProcessSpatialPort()
            expect(port.kernelVersion).toBe('v1.0.0-spatial-oracle')
            expect(typeof port.invokeSynchronous).toBe('function')
        })
    })
})
