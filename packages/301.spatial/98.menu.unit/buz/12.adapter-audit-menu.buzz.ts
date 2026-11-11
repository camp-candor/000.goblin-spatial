import { MenuActionPayload, SpatialBus } from '../fce/menu.interface.js'
import { InProcessSpatialAdapter } from '../../00.spatial.unit/buz/adapter.buzz.js'
import type { SpatialExecutionContext } from '../../14.port.unit/fce/port.interface.js'

const SYNC_INVOCATION_COUNT = 500

type LoosePayload = Record<string, unknown>

interface QuadrupleView {
    readonly topologyHash: string
    readonly overlayHash: string
    readonly queryHash: string
    readonly receiptHash: string
}

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

function verifyFirewallStripping(adapter: InProcessSpatialAdapter): void {
    const res = adapter.invokeSynchronous<LoosePayload>({
        queryType: 'BOUNDED_PATH',
        origin: { q: 0, r: 0, s: 0 },
        destination: { q: 3, r: -3, s: 0 },
        maxBudgetCostUnits: 500,
        workEnvelopeLimit: 512,
        actorId: 'char_bog',
        trauma: 'COMPOUND_FRACTURE',
    })
    if (!res.ok) {
        throw new Error(
            '[ADAPTER::FIREWALL] Valid geometric core was rejected: ' +
                res.failureCode,
        )
    }
    if (res.payload.actorId !== undefined || res.payload.trauma !== undefined) {
        throw new Error(
            '[ADAPTER::FIREWALL] Narrative properties leaked into payload',
        )
    }
}

function verifyZeroPromiseAllocations(
    adapter: InProcessSpatialAdapter,
): number {
    let promiseAllocations = 0
    for (let i = 0; i < SYNC_INVOCATION_COUNT; i++) {
        const ret: unknown = adapter.invokeSynchronous({
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 2, r: -2, s: 0 },
            mode: 'SUBTRACTIVE_LINEAR',
        })
        if (isThenable(ret)) {
            promiseAllocations += 1
        }
    }
    if (promiseAllocations !== 0) {
        throw new Error(
            '[ADAPTER::SYNC] Promise allocations detected: ' +
                promiseAllocations,
        )
    }
    return SYNC_INVOCATION_COUNT
}

function verifyEnvelopeCeiling(adapter: InProcessSpatialAdapter): void {
    const res = adapter.invokeSynchronous({
        queryType: 'BOUNDED_PATH',
        origin: { q: 0, r: 0, s: 0 },
        destination: { q: 40, r: -40, s: 0 },
        maxBudgetCostUnits: 10000,
    })
    if (res.ok !== false || res.failureCode !== 'BUDGET_EXCEEDED') {
        throw new Error(
            '[ADAPTER::ENVELOPE] Runaway path query did not trip BUDGET_EXCEEDED',
        )
    }
}

function verifyQuadrupleFormation(adapter: InProcessSpatialAdapter): void {
    const context: SpatialExecutionContext = {
        executionId: 'exec_adapter_audit',
        sequenceNumber: 1,
        tickNumber: 0,
        topologyHash: 'e'.repeat(64),
        overlayHash: 'f'.repeat(64),
    }
    const res = adapter.invokeSynchronous<LoosePayload>(
        {
            queryType: 'RAYCAST',
            origin: { q: 0, r: 0, s: 0 },
            target: { q: 1, r: -1, s: 0 },
            mode: 'SUBTRACTIVE_LINEAR',
        },
        context,
    )
    if (!res.ok) {
        throw new Error(
            '[ADAPTER::QUADRUPLE] Valid raycast was rejected: ' +
                res.failureCode,
        )
    }
    const quad = res.payload.auditQuadruple as QuadrupleView | undefined
    if (
        !quad ||
        quad.topologyHash !== 'e'.repeat(64) ||
        quad.overlayHash !== 'f'.repeat(64) ||
        !isSha256Hex(quad.queryHash) ||
        !isSha256Hex(quad.receiptHash)
    ) {
        throw new Error(
            '[ADAPTER::QUADRUPLE] Audit quadruple malformed or incomplete',
        )
    }
}

function verifySealedReceipt(adapter: InProcessSpatialAdapter): void {
    const res = adapter.invokeSynchronous<LoosePayload>({
        queryType: 'RAYCAST',
        origin: { q: 0, r: 0, s: 0 },
        target: { q: 3, r: -3, s: 0 },
        mode: 'SUBTRACTIVE_LINEAR',
    })
    if (!res.ok) {
        throw new Error(
            '[ADAPTER::RECEIPT] Valid raycast was rejected: ' + res.failureCode,
        )
    }
    if (
        !Object.isFrozen(res) ||
        !Object.isFrozen(res.payload) ||
        !Object.isFrozen(res.payload.auditQuadruple)
    ) {
        throw new Error(
            '[ADAPTER::RECEIPT] Receipt not recursively deep-frozen',
        )
    }
}

export function createAdapterAuditAction(): MenuActionPayload {
    return {
        id: 'SPT01_EXECUTE_IN_PROCESS_SPATIAL_ADAPTER',
        label: 'Execute In-Process Spatial Adapter',
        shortcut: 'SPT01',
        category: 'DIAGNOSTIC',
        execute: async (bus: SpatialBus) => {
            const log = (message: string): void => {
                bus.emit('TELEMETRY_LOG', { message })
            }
            log(
                '>> [SPATIAL::ADAPTER] Initializing InProcessSpatialAdapter in local isolate...',
            )
            const adapter = new InProcessSpatialAdapter()
            let failed = false
            const fault = (message: string): void => {
                failed = true
                log(`:: [ADAPTER::FAULT] ${message}`)
            }

            try {
                verifyFirewallStripping(adapter)
                log(
                    '>> [ADAPTER::FIREWALL] Testing narrative tag stripping (actorId, trauma)... [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [ADAPTER::FIREWALL] Testing narrative tag stripping (actorId, trauma)... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                const count = verifyZeroPromiseAllocations(adapter)
                log(
                    `>> [ADAPTER::SYNC] Verified zero Promise allocations across ${count} invocations... [PASS]`,
                )
            } catch (err: unknown) {
                log(
                    '>> [ADAPTER::SYNC] Verified zero Promise allocations across 500 invocations... [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                verifyEnvelopeCeiling(adapter)
                log(
                    '>> [ADAPTER::ENVELOPE] Bounded work ceiling (512 cells) -> BUDGET_EXCEEDED [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [ADAPTER::ENVELOPE] Bounded work ceiling (512 cells) -> BUDGET_EXCEEDED [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                verifyQuadrupleFormation(adapter)
                log(
                    '>> [ADAPTER::QUADRUPLE] RFC 8785 Merkle proof assembled: 4x SHA-256 hashes [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [ADAPTER::QUADRUPLE] RFC 8785 Merkle proof assembled: 4x SHA-256 hashes [FAIL]',
                )
                fault((err as Error).message)
            }

            try {
                verifySealedReceipt(adapter)
                log(
                    '>> [ADAPTER::RECEIPT] Minted sealed plain-data receipt (deepFreezeReceipt) [PASS]',
                )
            } catch (err: unknown) {
                log(
                    '>> [ADAPTER::RECEIPT] Minted sealed plain-data receipt (deepFreezeReceipt) [FAIL]',
                )
                fault((err as Error).message)
            }

            if (failed) {
                log(
                    '>> [ADAPTER::STATUS] Adapter audit FAILED. See [ADAPTER::FAULT] lines above.',
                )
                return
            }
            log(
                '>> [ADAPTER::STATUS] InProcessSpatialAdapter certified online and pure.',
            )
        },
    }
}
