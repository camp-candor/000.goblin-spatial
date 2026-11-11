import { describe, it, expect, beforeEach } from 'vitest'
import { PortModel } from '../port.model.js'
import {
    sanitizeSpatialQueryPayload,
    checkWorkBudgetGuard,
    initPort,
    executeQuery,
} from '../buz/port.buzz.js'
import type PortBit from '../fce/port.bit.js'

describe('14.port.unit - Synchronous Spatial Port Interface', () => {
    let model: PortModel

    beforeEach(() => {
        model = new PortModel()
        initPort(model)
    })

    describe('Epistemic Firewall (Zero Direct Ingress)', () => {
        it('strips banned narrative tags from input query', () => {
            const rawPayload = {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 5, r: -5, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
                actorId: 'char_bog',
                characterName: 'Bog',
                trauma: 'CRUSHED_HAND',
                dialogue: 'Get out of my way',
            }

            const result = sanitizeSpatialQueryPayload(rawPayload)
            expect(result.valid).toBe(true)
            expect(result.strippedKeys).toContain('actorId')
            expect(result.strippedKeys).toContain('characterName')
            expect(result.strippedKeys).toContain('trauma')
            expect(result.strippedKeys).toContain('dialogue')
            expect((result.scrubbedQuery as any).actorId).toBeUndefined()
        })

        it('rejects payloads with invalid axial coordinates or floating points', () => {
            const rawPayload = {
                queryType: 'RAYCAST',
                origin: { q: 1.5, r: -1.5, s: 0 },
                target: { q: 5, r: -5, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            }

            const result = sanitizeSpatialQueryPayload(rawPayload)
            expect(result.valid).toBe(false)
            expect(result.breachReason).toContain('[FLOAT_PROHIBITED]')
        })

        it('rejects queries failing cubic invariant q + r + s === 0', () => {
            const rawPayload = {
                queryType: 'BOUNDED_PATH',
                origin: { q: 1, r: 1, s: 0 },
                destination: { q: 0, r: 0, s: 0 },
                maxBudgetCostUnits: 100,
            }

            const result = sanitizeSpatialQueryPayload(rawPayload)
            expect(result.valid).toBe(false)
            expect(result.breachReason).toContain('[CUBIC_INVARIANT_BREACH]')
        })
    })

    describe('Bounded Work Envelope Tripwires', () => {
        it('permits execution within safe work envelope limits', () => {
            const check = checkWorkBudgetGuard(250, 512)
            expect(check.tripped).toBe(false)
            expect(check.failureCode).toBeUndefined()
        })

        it('trips BUDGET_EXCEEDED when cells expanded reach work envelope ceiling', () => {
            const check = checkWorkBudgetGuard(512, 512)
            expect(check.tripped).toBe(true)
            expect(check.failureCode).toBe('BUDGET_EXCEEDED')
        })
    })

    describe('Synchronous Execution & Zero Promise Allocation', () => {
        it('executes synchronously returning deep-frozen receipts', () => {
            let resolvedReceipt: any = null

            const bale: PortBit = {
                idx: 'query-1',
                dat: {
                    query: {
                        queryType: 'RAYCAST',
                        origin: { q: 0, r: 0, s: 0 },
                        target: { q: 2, r: -2, s: 0 },
                        mode: 'SUBTRACTIVE_LINEAR',
                    },
                },
                slv: (res) => {
                    resolvedReceipt = res.prtBit.dat?.receipt
                },
            }

            const ret = executeQuery(model, bale)

            // Verify synchronous execution (not a Promise)
            expect(ret).not.toBeInstanceOf(Promise)
            expect(resolvedReceipt).toBeDefined()
            expect(resolvedReceipt.ok).toBe(true)
            expect(resolvedReceipt.queryType).toBe('RAYCAST')
            expect(Object.isFrozen(resolvedReceipt)).toBe(true)
        })

        it('fails closed and updates budget trip counter on envelope breach', () => {
            let resolvedReceipt: any = null

            const bale: PortBit = {
                idx: 'path-query-trip',
                dat: {
                    query: {
                        queryType: 'BOUNDED_PATH',
                        origin: { q: -50, r: 50, s: 0 },
                        destination: { q: 50, r: -50, s: 0 },
                        maxBudgetCostUnits: 500,
                        workEnvelopeLimit: 256,
                    },
                },
                slv: (res) => {
                    resolvedReceipt = res.prtBit.dat?.receipt
                },
            }

            executeQuery(model, bale)

            expect(resolvedReceipt.ok).toBe(false)
            expect(resolvedReceipt.failureCode).toBe('BUDGET_EXCEEDED')
            expect(model.totalBudgetsTripped).toBe(1)
        })
    })
})
