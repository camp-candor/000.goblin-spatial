import type { Model } from '../../99.core/interface/model.interface.js'
import type {
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
    ScrubbedRaycastQuery,
} from '../../14.port.unit/fce/port.interface.js'
import type { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'

export interface BatchQueryEnvelope {
    readonly batchId: string
    readonly queries: Readonly<Record<string, unknown>>
}

export interface HomogeneousRaycastBatch {
    readonly batchId: string
    readonly queries: Readonly<Record<string, ScrubbedRaycastQuery>>
}

export interface BatchExecutionSummary {
    readonly totalQueries: number
    readonly succeededCount: number
    readonly failedCount: number
    readonly totalDurationMicros: number
    readonly averageDurationMicros: number
    readonly batchAuditHash: string
}

export interface BatchExecutionResult<T = unknown> {
    readonly ok: boolean
    readonly batchId: string
    readonly summary: BatchExecutionSummary
    readonly receipts: Readonly<Record<string, SynchronousExecutionReceipt<T>>>
}

export interface SpatialBatchAggregator {
    readonly kernelVersion: string
    executeBatch(
        envelope: BatchQueryEnvelope,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult
    executeRaycastBatch(
        batch: HomogeneousRaycastBatch,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult<PerceptCandidate>
}

export default interface Collect extends Model {
    idx: string
    kernelVersion: string
    totalBatchesProcessed: number
    totalQueriesProcessed: number
    lastBatchDurationMicros: number
}
