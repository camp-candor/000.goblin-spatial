import type State from '../../99.core/state.js'
import type { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { createBatchCollector } from '../../97.collect.unit/buz/collect.buzz.js'
import type { BatchQueryEnvelope } from '../../97.collect.unit/fce/collect.interface.js'

const WRITE_CONSOLE = '[Write action] Write Console'

const BATCH_ID = 'batch_combat_01'
const BAD_QUERY_KEY = 'q_bad'

function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        value instanceof Promise ||
        (typeof value === 'object' &&
            value !== null &&
            typeof (value as { then?: unknown }).then === 'function')
    )
}

function isSha256Hex(value: unknown): value is string {
    return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function buildCombatEnvelope(): BatchQueryEnvelope {
    return {
        batchId: BATCH_ID,
        queries: {
            q_ray_alpha: {
                queryType: 'RAYCAST',
                origin: { q: 0, r: 0, s: 0 },
                target: { q: 2, r: -2, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            },
            q_ray_beta: {
                queryType: 'RAYCAST',
                origin: { q: 1, r: -1, s: 0 },
                target: { q: 3, r: -3, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            },
            q_path_convoy: {
                queryType: 'BOUNDED_PATH',
                origin: { q: 0, r: 0, s: 0 },
                destination: { q: 3, r: -3, s: 0 },
                maxBudgetCostUnits: 500,
                workEnvelopeLimit: 512,
            },
            q_displace_vanguard: {
                queryType: 'DISPLACEMENT',
                targetCell: { q: 1, r: 1, s: -2 },
                maxCellCapacity: 1,
                maxBudgetCostUnits: 100,
            },
            q_ray_overwatch: {
                queryType: 'RAYCAST',
                origin: { q: 2, r: -2, s: 0 },
                target: { q: 4, r: -4, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            },
            [BAD_QUERY_KEY]: {
                queryType: 'RAYCAST',
                origin: { q: 1.5, r: -1.5, s: 0 },
                target: { q: 0, r: 0, s: 0 },
                mode: 'SUBTRACTIVE_LINEAR',
            },
        },
    }
}

interface GauntletReceipt {
    readonly ok: boolean
    readonly summary: {
        readonly totalQueries: number
        readonly succeededCount: number
        readonly failedCount: number
        readonly totalDurationMicros: number
        readonly averageDurationMicros: number
        readonly batchAuditHash: string
    }
    readonly receipts: Record<string, { ok: boolean; failureCode?: string }>
}

/**
 * Shared batch gauntlet core: executes batch_combat_01 (5 valid heterogeneous
 * queries + 1 float-contaminated query) and streams PASS/FAIL telemetry
 * through the provided log sink. Returns true only when every gate passes.
 */
export function executeBatchGauntlet(log: (message: string) => void): boolean {
    log(
        '>> [SPATIAL::COLLECT] Initializing 97.collect.unit batch aggregator...',
    )
    const collector = createBatchCollector()
    const envelope = buildCombatEnvelope()
    const queryCount = Object.keys(envelope.queries).length
    log(
        `>> [COLLECT::ENVELOPE] Ingesting batch [${BATCH_ID}] with ${queryCount} queries...`,
    )

    let failed = false
    const fault = (message: string): void => {
        failed = true
        log(`:: [COLLECT::FAULT] ${message}`)
    }

    const ret: unknown = collector.executeBatch(envelope)
    if (isThenable(ret)) {
        log(
            '>> [COLLECT::SYNC] Executing single-pass synchronous evaluation in V8... [FAIL]',
        )
        fault('executeBatch returned a Promise; sync invariant violated')
        log(
            '>> [COLLECT::STATUS] Batch aggregator FAILED. See [COLLECT::FAULT] lines above.',
        )
        return false
    }
    log(
        '>> [COLLECT::SYNC] Executing single-pass synchronous evaluation in V8... [PASS]',
    )

    const res = ret as GauntletReceipt

    if (
        res.ok !== false ||
        res.summary.totalQueries !== 6 ||
        res.summary.succeededCount !== 5 ||
        res.summary.failedCount !== 1
    ) {
        log(
            `>> [COLLECT::ISOLATE] Query [${BAD_QUERY_KEY}] failed closed (SCHEMA_BREACH); 5 siblings OK [FAIL]`,
        )
        fault(
            `summary count mismatch: total=${res.summary.totalQueries} ok=${res.summary.succeededCount} fail=${res.summary.failedCount}`,
        )
    } else {
        const bad = res.receipts[BAD_QUERY_KEY]
        if (!bad || bad.ok !== false || bad.failureCode !== 'SCHEMA_BREACH') {
            log(
                `>> [COLLECT::ISOLATE] Query [${BAD_QUERY_KEY}] failed closed (SCHEMA_BREACH); 5 siblings OK [FAIL]`,
            )
            fault('q_bad did not fail closed with SCHEMA_BREACH')
        } else {
            let siblingCorrupted: string | null = null
            for (const key of Object.keys(res.receipts)) {
                if (key === BAD_QUERY_KEY) continue
                if (res.receipts[key].ok !== true) {
                    siblingCorrupted = key
                    break
                }
            }
            if (siblingCorrupted) {
                log(
                    `>> [COLLECT::ISOLATE] Query [${BAD_QUERY_KEY}] failed closed (SCHEMA_BREACH); 5 siblings OK [FAIL]`,
                )
                fault(
                    `sibling query [${siblingCorrupted}] corrupted by neighbor failure`,
                )
            } else {
                log(
                    `>> [COLLECT::ISOLATE] Query [${BAD_QUERY_KEY}] failed closed (SCHEMA_BREACH); 5 siblings OK [PASS]`,
                )
            }
        }
    }

    if (
        !Number.isInteger(res.summary.totalDurationMicros) ||
        !Number.isInteger(res.summary.averageDurationMicros) ||
        res.summary.totalDurationMicros < 0 ||
        res.summary.averageDurationMicros < 0
    ) {
        log('>> [COLLECT::METRICS] Processed 6 queries [FAIL]')
        fault('duration metrics are not non-negative integers')
    } else {
        log(
            `>> [COLLECT::METRICS] Processed 6 queries in ${res.summary.totalDurationMicros} micros (avg: ${res.summary.averageDurationMicros} micros/query) [PASS]`,
        )
    }

    if (!isSha256Hex(res.summary.batchAuditHash)) {
        log('>> [COLLECT::HASH] RFC 8785 composite batch audit hash [FAIL]')
        fault('malformed SHA-256 batch audit hash')
    } else {
        log(
            `>> [COLLECT::HASH] RFC 8785 composite batch audit hash: ${res.summary.batchAuditHash.slice(0, 8)}... [PASS]`,
        )
    }

    if (
        !Object.isFrozen(ret) ||
        !Object.isFrozen(res.summary) ||
        !Object.isFrozen(res.receipts)
    ) {
        log(
            '>> [COLLECT::FREEZE] Deep-freeze immutability applied to batch result map [FAIL]',
        )
        fault('batch result map not deep-frozen')
    } else {
        log(
            '>> [COLLECT::FREEZE] Deep-freeze immutability applied to batch result map [PASS]',
        )
    }

    if (failed) {
        log(
            '>> [COLLECT::STATUS] Batch aggregator FAILED. See [COLLECT::FAULT] lines above.',
        )
        return false
    }
    log(
        '>> [COLLECT::STATUS] Batch aggregator certified online and operational at T_0 = $0.00.',
    )
    return true
}

/**
 * Live TUI entry point: streams the batch gauntlet into cns00 via the Blessed
 * library host. Headless-safe: resolves false without crashing when LIBRARY
 * is absent (gauntlet still executes for its boolean verdict).
 */
export async function runBatchQueryAggregator(_ste?: State): Promise<boolean> {
    const lib = (globalThis as any).LIBRARY
    if (lib) {
        const lines: string[] = []
        const passed = executeBatchGauntlet((message: string) => {
            lines.push(message)
        })
        for (const line of lines) {
            await lib.hunt(WRITE_CONSOLE, { idx: 'cns00', src: line })
        }
        return passed
    }
    return executeBatchGauntlet(() => undefined)
}

export function createBatchCollectorAction(): MenuActionPayload {
    return {
        id: 'CLT01_EXECUTE_SPATIAL_BATCH_GAUNTLET',
        label: 'Execute Spatial Batch Gauntlet',
        shortcut: 'CLT01',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            executeBatchGauntlet((message: string) => {
                bus.emit('TELEMETRY_LOG', { message })
            })
        },
    }
}
