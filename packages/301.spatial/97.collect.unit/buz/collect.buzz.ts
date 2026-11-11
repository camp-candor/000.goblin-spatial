import { CollectModel } from '../collect.model.js'
import type CollectBit from '../fce/collect.bit.js'
import type State from '../../99.core/state.js'
import type {
    BatchQueryEnvelope,
    BatchExecutionResult,
    BatchExecutionSummary,
    HomogeneousRaycastBatch,
    SpatialBatchAggregator,
} from '../fce/collect.interface.js'
import type {
    SpatialPort,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
} from '../../14.port.unit/fce/port.interface.js'
import type { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'
import { BatchQueryEnvelopeSchema } from '../val/collect.model.js'
import { InProcessSpatialAdapter } from '../../00.spatial.unit/buz/adapter.buzz.js'
import {
    canonicalizeJson,
    computeSha256Hex,
} from '../../19.ledger.unit/buz/ledger.buzz.js'
import { deepFreezeReceipt } from '../../42.receipt.unit/buz/receipt.buzz.js'

export class SpatialBatchCollector implements SpatialBatchAggregator {
    readonly kernelVersion: string
    private readonly port: SpatialPort

    constructor(port?: SpatialPort) {
        this.port = port ?? new InProcessSpatialAdapter()
        this.kernelVersion = this.port.kernelVersion
    }

    executeBatch(
        envelope: BatchQueryEnvelope,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult {
        const startHr =
            typeof performance !== 'undefined' ? performance.now() : Date.now()

        const envelopeParse = BatchQueryEnvelopeSchema.safeParse(envelope)
        if (!envelopeParse.success) {
            const summary: BatchExecutionSummary = {
                totalQueries: 0,
                succeededCount: 0,
                failedCount: 0,
                totalDurationMicros: 0,
                averageDurationMicros: 0,
                batchAuditHash: computeSha256Hex(canonicalizeJson({})),
            }
            return deepFreezeReceipt({
                ok: false,
                batchId: envelope?.batchId ?? 'unknown',
                summary,
                receipts: {},
            })
        }

        const { batchId, queries } = envelopeParse.data
        const queryKeys = Object.keys(queries)
        const totalQueries = queryKeys.length

        const receipts: Record<string, SynchronousExecutionReceipt> = {}
        const auditMap: Record<string, string> = {}
        let succeededCount = 0
        let failedCount = 0

        for (const key of queryKeys) {
            const queryPayload = queries[key]
            const receipt = this.port.invokeSynchronous(queryPayload, context)

            receipts[key] = receipt
            if (receipt.ok) {
                succeededCount += 1
                const receiptHash =
                    (receipt.payload as any)?.auditQuadruple?.receiptHash ??
                    computeSha256Hex(canonicalizeJson(receipt.payload))
                auditMap[key] = receiptHash
            } else {
                failedCount += 1
                auditMap[key] = computeSha256Hex(
                    canonicalizeJson({ failureCode: receipt.failureCode }),
                )
            }
        }

        const elapsedMicros = Math.round(
            ((typeof performance !== 'undefined'
                ? performance.now()
                : Date.now()) -
                startHr) *
                1000,
        )
        const averageDurationMicros =
            totalQueries > 0 ? Math.round(elapsedMicros / totalQueries) : 0
        const batchAuditHash = computeSha256Hex(canonicalizeJson(auditMap))

        const summary: BatchExecutionSummary = Object.freeze({
            totalQueries,
            succeededCount,
            failedCount,
            totalDurationMicros: elapsedMicros,
            averageDurationMicros,
            batchAuditHash,
        })

        return deepFreezeReceipt({
            ok: failedCount === 0,
            batchId,
            summary,
            receipts: Object.freeze(receipts),
        })
    }

    executeRaycastBatch(
        batch: HomogeneousRaycastBatch,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult<PerceptCandidate> {
        return this.executeBatch(
            batch,
            context,
        ) as BatchExecutionResult<PerceptCandidate>
    }
}

export function createBatchCollector(
    port?: SpatialPort,
): SpatialBatchAggregator {
    return new SpatialBatchCollector(port)
}

export const initCollect = (
    cpy: CollectModel,
    bal?: CollectBit,
    _ste?: State,
): CollectModel => {
    cpy.totalBatchesProcessed = 0
    cpy.totalQueriesProcessed = 0
    cpy.lastBatchDurationMicros = 0

    if (bal?.slv) {
        bal.slv({
            cltBit: {
                idx: 'init-collect-success',
                val: 1,
                src: cpy.kernelVersion,
            },
        })
    }
    return cpy
}

export const executeBatch = (
    cpy: CollectModel,
    bal?: CollectBit,
    _ste?: State,
): CollectModel => {
    const envelope = bal?.dat?.envelope
    const context = bal?.dat?.context

    if (!envelope) {
        if (bal?.slv) {
            bal.slv({
                cltBit: {
                    idx: 'execute-batch-fail',
                    val: 0,
                    dat: {
                        error: '[ENVELOPE_MISSING] BatchQueryEnvelope must be provided in bale.dat',
                    },
                },
            })
        }
        return cpy
    }

    const collector = createBatchCollector()
    const result = collector.executeBatch(envelope, context)

    cpy.totalBatchesProcessed += 1
    cpy.totalQueriesProcessed += result.summary.totalQueries
    cpy.lastBatchDurationMicros = result.summary.totalDurationMicros

    if (bal?.slv) {
        bal.slv({
            cltBit: {
                idx: result.ok
                    ? 'execute-batch-success'
                    : 'execute-batch-partial',
                val: result.ok ? 1 : 0,
                dat: { result },
            },
        })
    }
    return cpy
}
