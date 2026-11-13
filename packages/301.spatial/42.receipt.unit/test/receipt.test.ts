import { describe, it, expect, beforeEach } from 'vitest'
import { ReceiptModel } from '../receipt.model.js'
import {
    initReceipt,
    mintPathReceipt,
    mintPerceptReceipt,
    mintDisplacementReceipt,
} from '../buz/receipt.buzz.js'
import type ReceiptBit from '../fce/receipt.bit.js'

describe('42.receipt.unit - Sealed Plain Data Receipts', () => {
    let model: ReceiptModel

    const validQuadruple = {
        topologyHash: 'a'.repeat(64),
        overlayHash: 'b'.repeat(64),
        queryHash: 'c'.repeat(64),
        receiptHash: 'd'.repeat(64),
    }

    beforeEach(() => {
        model = new ReceiptModel()
        initReceipt(model)
    })

    describe('Path Receipt Construction & Invariants', () => {
        it('mints a valid success path receipt with frozen immutability', () => {
            let emittedReceipt: any = null

            const bale: ReceiptBit = {
                idx: 'path-success',
                dat: {
                    pathReceipt: {
                        ok: true,
                        originPacked: 2147516416 as any,
                        destinationPacked: 2147581952 as any,
                        path: [2147516416, 2147581952] as any,
                        totalCostUnits: 250,
                        stepsExpanded: 12,
                        auditQuadruple: validQuadruple,
                    },
                },
                slv: (res) => {
                    emittedReceipt = res.rcpBit.dat?.pathReceipt
                },
            }

            mintPathReceipt(model, bale)

            expect(emittedReceipt).toBeDefined()
            expect(emittedReceipt.ok).toBe(true)
            expect(emittedReceipt.totalCostUnits).toBe(250)
            expect(Object.isFrozen(emittedReceipt)).toBe(true)
            expect(Object.isFrozen(emittedReceipt.path)).toBe(true)
            expect(model.totalPathReceiptsMinted).toBe(1)
        })

        it('rejects floating-point costs with FLOAT_PROHIBITED', () => {
            let errorEmitted: any = null

            const bale: ReceiptBit = {
                idx: 'path-float-fail',
                dat: {
                    pathReceipt: {
                        ok: true,
                        originPacked: 0,
                        destinationPacked: 1,
                        path: [0, 1],
                        totalCostUnits: 12.5,
                        stepsExpanded: 2,
                        auditQuadruple: validQuadruple,
                    } as any,
                },
                slv: (res) => {
                    errorEmitted = res.rcpBit.dat?.error
                },
            }

            mintPathReceipt(model, bale)

            expect(errorEmitted).toContain('[FLOAT_PROHIBITED]')
            expect(model.totalPathReceiptsMinted).toBe(0)
        })
    })

    describe('Sensory Evidence Percept Receipt Specification', () => {
        it('mints optical percept evidence within strict basis-point bounds', () => {
            let emittedCandidate: any = null

            const bale: ReceiptBit = {
                idx: 'percept-optical',
                dat: {
                    perceptCandidate: {
                        sourceCoord: { q: 0, r: 0, s: 0 },
                        observerCoord: { q: 2, r: -2, s: 0 },
                        qualityScorePerMille: 850,
                        arrivalBearing: 2,
                        isOccluded: false,
                        evidence: {
                            modality: 'OPTICAL',
                            transmissionBps: 9200,
                            topologicalDistance: 2,
                            occludingBarrierCoord: null,
                        },
                        auditQuadruple: validQuadruple,
                    },
                },
                slv: (res) => {
                    emittedCandidate = res.rcpBit.dat?.perceptCandidate
                },
            }

            mintPerceptReceipt(model, bale)

            expect(emittedCandidate).toBeDefined()
            expect(emittedCandidate.evidence.modality).toBe('OPTICAL')
            expect(emittedCandidate.evidence.transmissionBps).toBe(9200)
            expect(Object.isFrozen(emittedCandidate)).toBe(true)
            expect(model.totalPerceptReceiptsMinted).toBe(1)
        })

        it('rejects optical evidence exceeding 10000 bps', () => {
            let errorEmitted: any = null

            const bale: ReceiptBit = {
                idx: 'percept-overflow',
                dat: {
                    perceptCandidate: {
                        sourceCoord: { q: 0, r: 0, s: 0 },
                        observerCoord: { q: 1, r: -1, s: 0 },
                        qualityScorePerMille: 500,
                        arrivalBearing: 1,
                        isOccluded: false,
                        evidence: {
                            modality: 'OPTICAL',
                            transmissionBps: 10001,
                            topologicalDistance: 1,
                            occludingBarrierCoord: null,
                        },
                        auditQuadruple: validQuadruple,
                    } as any,
                },
                slv: (res) => {
                    errorEmitted = res.rcpBit.dat?.error
                },
            }

            mintPerceptReceipt(model, bale)

            expect(errorEmitted).toContain('[BASIS_POINT_OVERFLOW]')
            expect(model.totalPerceptReceiptsMinted).toBe(0)
        })

        it('mints acoustic percept evidence with SNR margin in cdB', () => {
            let emittedCandidate: any = null

            const bale: ReceiptBit = {
                idx: 'percept-acoustic',
                dat: {
                    perceptCandidate: {
                        sourceCoord: { q: 1, r: 1, s: -2 },
                        observerCoord: { q: 0, r: 0, s: 0 },
                        qualityScorePerMille: 600,
                        arrivalBearing: 4,
                        isOccluded: true,
                        evidence: {
                            modality: 'ACOUSTIC',
                            intensityCdb: 6500,
                            noiseFloorCdb: 4200,
                            snrMarginCdb: 2300,
                            portalHopCount: 1,
                        },
                        auditQuadruple: validQuadruple,
                    },
                },
                slv: (res) => {
                    emittedCandidate = res.rcpBit.dat?.perceptCandidate
                },
            }

            mintPerceptReceipt(model, bale)

            expect(emittedCandidate).toBeDefined()
            expect(emittedCandidate.evidence.modality).toBe('ACOUSTIC')
            expect(emittedCandidate.evidence.snrMarginCdb).toBe(2300)
            expect(Object.isFrozen(emittedCandidate)).toBe(true)
        })
    })

    describe('Displacement Result Formulation', () => {
        it('mints displacement success with legal cell relocation', () => {
            let emittedDisplacement: any = null

            const bale: ReceiptBit = {
                idx: 'displacement-ok',
                dat: {
                    displacementReceipt: {
                        ok: true,
                        targetCellPacked: 2147516416 as any,
                        resolvedCellPacked: 2147516417 as any,
                        relocationCostUnits: 100,
                        wasEvicted: true,
                        auditQuadruple: validQuadruple,
                    },
                },
                slv: (res) => {
                    emittedDisplacement = res.rcpBit.dat?.displacementReceipt
                },
            }

            mintDisplacementReceipt(model, bale)

            expect(emittedDisplacement).toBeDefined()
            expect(emittedDisplacement.ok).toBe(true)
            expect(emittedDisplacement.wasEvicted).toBe(true)
            expect(Object.isFrozen(emittedDisplacement)).toBe(true)
            expect(model.totalDisplacementReceiptsMinted).toBe(1)
        })

        it('rejects displacement receipt with un-schemaed narrative properties', () => {
            let errorEmitted: any = null

            const bale: ReceiptBit = {
                idx: 'displacement-dirty',
                dat: {
                    displacementReceipt: {
                        ok: false,
                        targetCellPacked: 2147516416 as any,
                        failureCode: 'CAPACITY_EXHAUSTED',
                        auditQuadruple: validQuadruple,
                        actorId: 'char_bog',
                    } as any,
                },
                slv: (res) => {
                    errorEmitted = res.rcpBit.dat?.error
                },
            }

            mintDisplacementReceipt(model, bale)

            expect(errorEmitted).toContain(
                '[DISPLACEMENT_RECEIPT_SCHEMA_BREACH]',
            )
            expect(model.totalDisplacementReceiptsMinted).toBe(0)
        })
    })
})
