import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { LedgerModel } from '../../19.ledger.unit/ledger.model.js'
import type LedgerBit from '../../19.ledger.unit/fce/ledger.bit.js'
import type { SpatialLedgerEntry } from '../../19.ledger.unit/fce/ledger.interface.js'
import {
    appendEntry,
    canonicalizeJson,
    verifyLedgerLineage,
} from '../../19.ledger.unit/buz/ledger.buzz.js'
import { GENESIS_HASH_64 } from '../../19.ledger.unit/val/ledger.model.js'

function verifyCanonicalJcs(): void {
    const unorderedA = { z: 1, a: 2, m: { y: 10, b: 20 } }
    const unorderedB = { a: 2, m: { b: 20, y: 10 }, z: 1 }
    const canonA = canonicalizeJson(unorderedA)
    const canonB = canonicalizeJson(unorderedB)
    if (canonA !== canonB || canonA !== '{"a":2,"m":{"b":20,"y":10},"z":1}') {
        throw new Error('[LEDGER::RFC8785] JCS key sorting mismatch: ' + canonA)
    }
    const decomposed = '\u0065\u0301'
    const precomposed = '\u00e9'
    if (
        canonicalizeJson({ text: decomposed }) !==
        canonicalizeJson({ text: precomposed })
    ) {
        throw new Error('[LEDGER::RFC8785] Unicode NFC normalization failed')
    }
    let nanRejected = false
    try {
        canonicalizeJson({ val: NaN })
    } catch {
        nanRejected = true
    }
    if (!nanRejected) {
        throw new Error('[LEDGER::RFC8785] NaN permitted')
    }
    let infinityRejected = false
    try {
        canonicalizeJson({ val: Infinity })
    } catch {
        infinityRejected = true
    }
    if (!infinityRejected) {
        throw new Error('[LEDGER::RFC8785] Infinity permitted')
    }
}

function verifyGenesisAnchor(): void {
    const model = new LedgerModel()
    let emitted: SpatialLedgerEntry | null = null
    const bale: LedgerBit = {
        idx: 'ledger-audit-genesis',
        dat: {
            queryType: 'RAYCAST',
            tickNumber: 0,
            streamId: 'audit-genesis',
            auditQuadruple: {
                topologyHash: '1'.repeat(64),
                overlayHash: '2'.repeat(64),
                queryHash: '3'.repeat(64),
                receiptHash: '4'.repeat(64),
            },
        },
        slv: (res) => {
            emitted = res.ldgBit.dat?.entry ?? null
        },
    }
    appendEntry(model, bale)
    if (
        !emitted ||
        emitted.sequenceNumber !== 1 ||
        emitted.prevEventHash !== GENESIS_HASH_64
    ) {
        throw new Error('[LEDGER::GENESIS] Genesis block linkage incorrect')
    }
    if (!/^[a-f0-9]{64}$/.test(emitted.chainedEventHash)) {
        throw new Error(
            '[LEDGER::GENESIS] Genesis chained event hash malformed',
        )
    }
}

function appendAuditChain(): readonly SpatialLedgerEntry[] {
    const model = new LedgerModel()
    const queryTypes = [
        'RAYCAST',
        'BOUNDED_PATH',
        'REACHABILITY',
        'DISPLACEMENT',
        'RAYCAST',
    ] as const
    for (let i = 0; i < 5; i++) {
        const bale: LedgerBit = {
            idx: 'ledger-audit-chain-' + (i + 1),
            dat: {
                queryType: queryTypes[i],
                tickNumber: i,
                streamId: 'audit-chain',
                auditQuadruple: {
                    topologyHash: ('f' + i).repeat(32),
                    overlayHash: 'e'.repeat(64),
                    queryHash: 'c'.repeat(64),
                    receiptHash: 'd'.repeat(64),
                },
            },
        }
        appendEntry(model, bale)
    }
    const result = verifyLedgerLineage(model.entries)
    if (!result.valid || result.totalEntries !== 5) {
        throw new Error(
            '[LEDGER::CHAIN] Chain lineage broken: ' + result.failureReason,
        )
    }
    return model.entries
}

function verifyTamperTrap(pristine: readonly SpatialLedgerEntry[]): void {
    const tampered = (
        JSON.parse(JSON.stringify(pristine)) as SpatialLedgerEntry[]
    ).map((entry, i) =>
        i === 1 ? { ...entry, tickNumber: entry.tickNumber + 1000 } : entry,
    )
    const result = verifyLedgerLineage(tampered)
    if (result.valid) {
        throw new Error(
            '[LEDGER::TAMPER] Tampered payload was accepted as valid',
        )
    }
    if (
        !result.failureReason ||
        !result.failureReason.includes('CHAIN_HASH_CORRUPTION')
    ) {
        throw new Error(
            '[LEDGER::TAMPER] Expected CHAIN_HASH_CORRUPTION, got: ' +
                result.failureReason,
        )
    }
}

function verifyLineageUnbroken(pristine: readonly SpatialLedgerEntry[]): void {
    const result = verifyLedgerLineage(pristine)
    if (!result.valid || result.totalEntries !== 5) {
        throw new Error(
            '[LEDGER::LINEAGE] Pristine lineage broken: ' +
                result.failureReason,
        )
    }
}

export function createLedgerAuditAction(): MenuActionPayload {
    return {
        id: 'LDG01_AUDIT_CRYPTOGRAPHIC_LEDGER_LINEAGE',
        label: 'Audit Cryptographic Ledger Lineage',
        shortcut: 'LDG01',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            const log = (message: string): void => {
                bus.emit('TELEMETRY_LOG', { message })
            }
            log(
                '>> [SPATIAL::LEDGER] Initializing 19.ledger.unit cryptographic audit...',
            )
            let failed = false
            const fault = (message: string): void => {
                failed = true
                log(`:: [LEDGER::FAULT] ${message}`)
            }
            let chain: readonly SpatialLedgerEntry[] = []

            try {
                verifyCanonicalJcs()
                log(
                    '>> [LEDGER::RFC8785] Testing canonical JCS key sorting and NFC normalization... [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [LEDGER::RFC8785] Testing canonical JCS key sorting and NFC normalization... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                verifyGenesisAnchor()
                log(
                    '>> [LEDGER::GENESIS] Seeding Genesis block #1 linked to 64-zero anchor... [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [LEDGER::GENESIS] Seeding Genesis block #1 linked to 64-zero anchor... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                chain = appendAuditChain()
                log(
                    '>> [LEDGER::CHAIN] Appending 5 sequential spatial queries... [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [LEDGER::CHAIN] Appending 5 sequential spatial queries... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                if (chain.length !== 5) {
                    throw new Error(
                        '[LEDGER::TAMPER] No pristine chain available',
                    )
                }
                verifyTamperTrap(chain)
                log(
                    '>> [LEDGER::TAMPER] Injecting synthetic bit flip into block #2... [TRAPPED]',
                )
            } catch (err: unknown) {
                log(
                    '>> [LEDGER::TAMPER] Injecting synthetic bit flip into block #2... [MISSED]',
                )
                fault((err as Error).message)
            }

            try {
                if (chain.length !== 5) {
                    throw new Error(
                        '[LEDGER::LINEAGE] No pristine chain available',
                    )
                }
                verifyLineageUnbroken(chain)
                log(
                    '>> [LEDGER::LINEAGE] Cryptographic hash-chain lineage unbroken (Exit Code 0).',
                )
            } catch (err: unknown) {
                log(
                    '>> [LEDGER::LINEAGE] Cryptographic hash-chain lineage BROKEN.',
                )
                fault((err as Error).message)
            }

            if (failed) {
                log(
                    '>> [LEDGER::STATUS] Spatial ledger audit FAILED. See [LEDGER::FAULT] lines above.',
                )
                return
            }
            log(
                '>> [LEDGER::STATUS] Spatial ledger certified tamper-evident at T_0 = $0.00.',
            )
        },
    }
}
