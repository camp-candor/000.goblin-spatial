import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { PortModel } from '../../14.port.unit/port.model.js'
import type PortBit from '../../14.port.unit/fce/port.bit.js'
import type { SynchronousExecutionReceipt } from '../../14.port.unit/fce/port.interface.js'
import {
    checkWorkBudgetGuard,
    executeQuery,
    sanitizeSpatialQueryPayload,
} from '../../14.port.unit/buz/port.buzz.js'

const SYNC_PROBE_QUERY_COUNT = 1000

function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        value instanceof Promise ||
        (typeof value === 'object' &&
            value !== null &&
            typeof (value as { then?: unknown }).then === 'function')
    )
}

function formatStrippedKeys(keys: readonly string[]): string {
    return "['" + keys.join("', '") + "']"
}

function verifyFirewallScrub(): string {
    const contaminated = {
        queryType: 'RAYCAST',
        origin: { q: 0, r: 0, s: 0 },
        target: { q: 2, r: -2, s: 0 },
        mode: 'SUBTRACTIVE_LINEAR',
        actorId: 'char_bog',
        trauma: 'HEAD_WOUND',
    }
    const result = sanitizeSpatialQueryPayload(contaminated)
    if (!result.valid || !result.scrubbedQuery) {
        throw new Error(
            '[PORT::SCRUB] Valid geometric core was rejected: ' +
                result.breachReason,
        )
    }
    const stripped = [...result.strippedKeys]
    if (
        stripped.length !== 2 ||
        stripped[0] !== 'actorId' ||
        stripped[1] !== 'trauma'
    ) {
        throw new Error(
            '[PORT::SCRUB] Unexpected stripped key set: ' +
                formatStrippedKeys(stripped),
        )
    }
    return formatStrippedKeys(stripped)
}

function verifyEnvelopeTripwire(): number {
    const direct = checkWorkBudgetGuard(600, 512)
    if (!direct.tripped || direct.failureCode !== 'BUDGET_EXCEEDED') {
        throw new Error(
            '[PORT::TRIPWIRE] Direct guard did not trip BUDGET_EXCEEDED',
        )
    }
    const model = new PortModel()
    let captured: SynchronousExecutionReceipt | null = null
    const bale: PortBit = {
        idx: 'port-probe-envelope',
        dat: {
            query: {
                queryType: 'BOUNDED_PATH',
                origin: { q: 0, r: 0, s: 0 },
                destination: { q: 30, r: -30, s: 0 },
                maxBudgetCostUnits: 10000,
            },
        },
        slv: (res) => {
            captured = res.prtBit.dat?.receipt ?? null
        },
    }
    const ret: unknown = executeQuery(model, bale)
    if (isThenable(ret)) {
        throw new Error('[PORT::TRIPWIRE] executeQuery returned a Promise')
    }
    if (!captured || captured.failureCode !== 'BUDGET_EXCEEDED') {
        throw new Error(
            '[PORT::TRIPWIRE] Path request did not trip BUDGET_EXCEEDED',
        )
    }
    return captured.executionMicros
}

function verifyZeroPromiseAllocations(): number {
    const model = new PortModel()
    let promiseAllocations = 0
    for (let i = 0; i < SYNC_PROBE_QUERY_COUNT; i++) {
        const bale: PortBit = {
            idx: 'port-probe-sync-' + i,
            dat: {
                query: {
                    queryType: 'RAYCAST',
                    origin: { q: 0, r: 0, s: 0 },
                    target: { q: 3, r: -3, s: 0 },
                    mode: 'SUBTRACTIVE_LINEAR',
                },
            },
        }
        const ret: unknown = executeQuery(model, bale)
        if (isThenable(ret)) {
            promiseAllocations += 1
        }
    }
    if (promiseAllocations !== 0) {
        throw new Error(
            '[PORT::SYNCHRONOUS] Promise allocations detected: ' +
                promiseAllocations,
        )
    }
    return SYNC_PROBE_QUERY_COUNT
}

export function createPortProbeAction(): MenuActionPayload {
    return {
        id: 'PRT02_RUN_SYNCHRONOUS_PORT_PROBE',
        label: 'Run Synchronous Port Probe',
        shortcut: 'PRT02',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            const log = (message: string): void => {
                bus.emit('TELEMETRY_LOG', { message })
            }
            log(
                '>> [SPATIAL::PORT] Probing 14.port.unit synchronous execution gate...',
            )
            let failed = false
            const fault = (message: string): void => {
                failed = true
                log(`:: [PORT::FAULT] ${message}`)
            }

            log(
                '>> [PORT::FIREWALL] Submitting contaminated query with actorId & trauma...',
            )
            try {
                const stripped = verifyFirewallScrub()
                log(`>> [PORT::SCRUB] Banned keys stripped: ${stripped} [PASS]`)
            } catch (err: unknown) {
                log('>> [PORT::SCRUB] Banned keys stripped: [] [FAIL]')
                fault((err as Error).message)
            }

            log('>> [PORT::ENVELOPE] Testing path request beyond 512 cells...')
            try {
                const micros = verifyEnvelopeTripwire()
                log(
                    `>> [PORT::TRIPWIRE] Bounded ceiling tripped: BUDGET_EXCEEDED (${micros} micros) [PASS]`,
                )
            } catch (err: unknown) {
                log('>> [PORT::TRIPWIRE] Bounded ceiling tripped: NONE [FAIL]')
                fault((err as Error).message)
            }

            try {
                const count = verifyZeroPromiseAllocations()
                log(
                    `>> [PORT::SYNCHRONOUS] Verified 0 Promise allocations across ${count.toLocaleString('en-US')} queries.`,
                )
            } catch (err: unknown) {
                log(
                    '>> [PORT::SYNCHRONOUS] Promise allocations detected [FAIL]',
                )
                fault((err as Error).message)
            }

            if (failed) {
                log(
                    '>> [PORT::STATUS] SpatialPort probe FAILED. See [PORT::FAULT] lines above.',
                )
                return
            }
            log('>> [PORT::STATUS] SpatialPort certified online and pure.')
        },
    }
}
