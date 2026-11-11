import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { ReceiptModel } from '../../42.receipt.unit/receipt.model.js'
import type ReceiptBit from '../../42.receipt.unit/fce/receipt.bit.js'
import type {
    DisplacementReceipt,
    PathReceipt,
    PerceptCandidate,
} from '../../42.receipt.unit/fce/receipt.interface.js'
import {
    mintDisplacementReceipt,
    mintPathReceipt,
    mintPerceptReceipt,
} from '../../42.receipt.unit/buz/receipt.buzz.js'
import { packAxial } from '../../28.axial.unit/val/axial.model.js'

const AUDIT_QUADRUPLE = {
    topologyHash: 'a'.repeat(64),
    overlayHash: 'b'.repeat(64),
    queryHash: 'c'.repeat(64),
    receiptHash: 'd'.repeat(64),
}

function mintTwelveStepPath(model: ReceiptModel): PathReceipt {
    let captured: PathReceipt | null = null
    const bale: ReceiptBit = {
        idx: 'receipt-audit-path',
        dat: {
            pathReceipt: {
                ok: true,
                originPacked: packAxial(0, 0),
                destinationPacked: packAxial(11, 0),
                path: Array.from({ length: 12 }, (_, i) => packAxial(i, 0)),
                totalCostUnits: 250,
                stepsExpanded: 12,
                auditQuadruple: AUDIT_QUADRUPLE,
            },
        },
        slv: (res) => {
            captured = res.rcpBit.dat?.pathReceipt ?? null
        },
    }
    mintPathReceipt(model, bale)
    if (!captured || !captured.ok) {
        throw new Error('[RECEIPT::PATH] Path receipt minting failed')
    }
    if (captured.path.length !== 12 || captured.totalCostUnits !== 250) {
        throw new Error(
            '[RECEIPT::PATH] Minted receipt metrics mismatch: steps=' +
                captured.path.length +
                ' cost=' +
                captured.totalCostUnits,
        )
    }
    return captured
}

function verifyDeepFreeze(sealed: PathReceipt): void {
    if (!sealed.ok) {
        throw new Error('[RECEIPT::FREEZE] Expected success receipt')
    }
    if (
        !Object.isFrozen(sealed) ||
        !Object.isFrozen(sealed.path) ||
        !Object.isFrozen(sealed.auditQuadruple)
    ) {
        throw new Error(
            '[RECEIPT::FREEZE] Recursive freezing failed on nested structures',
        )
    }
    const mutable = sealed as unknown as { ok: boolean; path: number[] }
    let pushThrew = false
    try {
        mutable.path.push(999)
    } catch {
        pushThrew = true
    }
    if (!pushThrew || mutable.path.length !== 12) {
        throw new Error(
            '[RECEIPT::FREEZE] Mutation permitted on frozen path array',
        )
    }
    const before = mutable.ok
    try {
        mutable.ok = false
    } catch {
        // Strict-mode TypeError is the expected fail-closed signal.
    }
    if (mutable.ok !== before) {
        throw new Error(
            '[RECEIPT::FREEZE] Mutation permitted on top-level property',
        )
    }
    const descriptor = Object.getOwnPropertyDescriptor(sealed, 'ok')
    if (
        !descriptor ||
        descriptor.writable !== false ||
        descriptor.configurable !== false
    ) {
        throw new Error('[RECEIPT::FREEZE] Top-level property not sealed')
    }
}

function mintOpticalPercept(model: ReceiptModel): void {
    let captured: PerceptCandidate | null = null
    const bale: ReceiptBit = {
        idx: 'receipt-audit-optical',
        dat: {
            perceptCandidate: {
                sourceCoord: { q: 0, r: 0, s: 0 },
                observerCoord: { q: 2, r: -2, s: 0 },
                qualityScorePerMille: 850,
                arrivalBearing: 1,
                isOccluded: false,
                evidence: {
                    modality: 'OPTICAL',
                    transmissionBps: 9200,
                    topologicalDistance: 2,
                    occludingBarrierCoord: null,
                },
                auditQuadruple: AUDIT_QUADRUPLE,
            },
        },
        slv: (res) => {
            captured = res.rcpBit.dat?.perceptCandidate ?? null
        },
    }
    mintPerceptReceipt(model, bale)
    if (
        !captured ||
        captured.evidence.modality !== 'OPTICAL' ||
        captured.evidence.transmissionBps !== 9200
    ) {
        throw new Error('[RECEIPT::PERCEPT] Optical evidence minting failed')
    }
    if (!Object.isFrozen(captured)) {
        throw new Error('[RECEIPT::PERCEPT] Percept receipt not sealed')
    }
}

function mintAcousticPercept(model: ReceiptModel): void {
    let captured: PerceptCandidate | null = null
    const bale: ReceiptBit = {
        idx: 'receipt-audit-acoustic',
        dat: {
            perceptCandidate: {
                sourceCoord: { q: 0, r: 0, s: 0 },
                observerCoord: { q: 0, r: 3, s: -3 },
                qualityScorePerMille: 700,
                arrivalBearing: 3,
                isOccluded: false,
                evidence: {
                    modality: 'ACOUSTIC',
                    intensityCdb: 5000,
                    noiseFloorCdb: 2700,
                    snrMarginCdb: 2300,
                    portalHopCount: 2,
                },
                auditQuadruple: AUDIT_QUADRUPLE,
            },
        },
        slv: (res) => {
            captured = res.rcpBit.dat?.perceptCandidate ?? null
        },
    }
    mintPerceptReceipt(model, bale)
    if (
        !captured ||
        captured.evidence.modality !== 'ACOUSTIC' ||
        captured.evidence.snrMarginCdb !== 2300
    ) {
        throw new Error('[RECEIPT::ACOUSTIC] Acoustic evidence minting failed')
    }
    if (!Object.isFrozen(captured)) {
        throw new Error('[RECEIPT::ACOUSTIC] Percept receipt not sealed')
    }
}

function mintEvictionResult(model: ReceiptModel): void {
    let captured: DisplacementReceipt | null = null
    const bale: ReceiptBit = {
        idx: 'receipt-audit-displace',
        dat: {
            displacementReceipt: {
                ok: true,
                targetCellPacked: packAxial(5, 0),
                resolvedCellPacked: packAxial(6, 0),
                relocationCostUnits: 40,
                wasEvicted: true,
                auditQuadruple: AUDIT_QUADRUPLE,
            },
        },
        slv: (res) => {
            captured = res.rcpBit.dat?.displacementReceipt ?? null
        },
    }
    mintDisplacementReceipt(model, bale)
    if (!captured || !captured.ok) {
        throw new Error('[RECEIPT::DISPLACE] Eviction minting failed')
    }
    if (!Object.isFrozen(captured)) {
        throw new Error('[RECEIPT::DISPLACE] Displacement receipt not sealed')
    }
}

function verifyFloatTrap(model: ReceiptModel): void {
    let errorReceived: string | null = null
    const bale: ReceiptBit = {
        idx: 'receipt-audit-trap',
        dat: {
            pathReceipt: {
                ok: true,
                originPacked: packAxial(0, 0),
                destinationPacked: packAxial(1, 0),
                path: [packAxial(0, 0), packAxial(1, 0)],
                totalCostUnits: 12.5,
                stepsExpanded: 2,
                auditQuadruple: AUDIT_QUADRUPLE,
            },
        },
        slv: (res) => {
            errorReceived = res.rcpBit.dat?.error ?? null
        },
    }
    mintPathReceipt(model, bale)
    if (!errorReceived || !errorReceived.includes('FLOAT_PROHIBITED')) {
        throw new Error(
            '[RECEIPT::TRAP] Fractional cost was permitted: ' + errorReceived,
        )
    }
}

export function createReceiptAuditAction(): MenuActionPayload {
    return {
        id: 'RCP01_AUDIT_PLAIN_DATA_CONTRACTS',
        label: 'Audit Plain Data Contracts',
        shortcut: 'RCP01',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            const log = (message: string): void => {
                bus.emit('TELEMETRY_LOG', { message })
            }
            log(
                '>> [SPATIAL::RECEIPT] Initializing 42.receipt.unit contract audit...',
            )
            const model = new ReceiptModel()
            let failed = false
            const fault = (message: string): void => {
                failed = true
                log(`:: [RECEIPT::FAULT] ${message}`)
            }
            let sealedPath: PathReceipt | null = null

            try {
                sealedPath = mintTwelveStepPath(model)
                log(
                    '>> [RECEIPT::PATH] Minting 12-step path receipt (totalCost: 250 units)... [OK]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::PATH] Minting 12-step path receipt (totalCost: 250 units)... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                if (!sealedPath) {
                    throw new Error(
                        '[RECEIPT::FREEZE] No sealed receipt available',
                    )
                }
                verifyDeepFreeze(sealedPath)
                log(
                    '>> [RECEIPT::FREEZE] Asserting recursive deep-freeze immutability... [OK]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::FREEZE] Asserting recursive deep-freeze immutability... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                mintOpticalPercept(model)
                log(
                    '>> [RECEIPT::PERCEPT] Minting optical evidence (9200 bps transmission)... [OK]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::PERCEPT] Minting optical evidence (9200 bps transmission)... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                mintAcousticPercept(model)
                log(
                    '>> [RECEIPT::ACOUSTIC] Minting acoustic evidence (+2300 cdB SNR margin)... [OK]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::ACOUSTIC] Minting acoustic evidence (+2300 cdB SNR margin)... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                mintEvictionResult(model)
                log(
                    '>> [RECEIPT::DISPLACE] Minting eviction result (target -> legal cell)... [OK]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::DISPLACE] Minting eviction result (target -> legal cell)... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                verifyFloatTrap(model)
                log(
                    '>> [RECEIPT::TRAP] Negative float trap (12.5 cost units) -> FLOAT_PROHIBITED [TRAPPED]',
                )
            } catch (err: unknown) {
                log(
                    '>> [RECEIPT::TRAP] Negative float trap (12.5 cost units) -> FLOAT_PROHIBITED [MISSED]',
                )
                fault((err as Error).message)
            }

            if (failed) {
                log(
                    '>> [RECEIPT::STATUS] Plain data contract audit FAILED. See [RECEIPT::FAULT] lines above.',
                )
                return
            }
            log(
                '>> [RECEIPT::STATUS] All 42.receipt.unit plain-data schemas certified green at T_0 = $0.00.',
            )
        },
    }
}
