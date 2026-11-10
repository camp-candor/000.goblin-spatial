import {
    ScrubbedAcousticQuery,
    ScrubbedDisplacementQuery,
    ScrubbedRaycastQuery,
    ScrubbedReachabilityQuery,
    ScrubbedRoutingQuery,
    SpatialQueryType,
} from '../../14.port.unit/fce/port.interface.js'
import {
    PureSpatialKernel,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
} from '../../00.spatial.unit/fce/spatial.interface.js'
import { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'
import CollectBit from './collect.bit.js'
import CaboodleBit from './caboodle.bit.js'

export default interface Collect {
    idx: string
    caboodleBitList: CaboodleBit[]
    caboodleBits: any
}

export interface BatchQueryEnvelope {
    readonly batchId: string
    readonly queries: Readonly<Record<string, unknown>>
}

export interface BatchExecutionSummary {
    readonly totalQueries: number
    readonly succeededCount: number
    readonly failedCount: number
    readonly totalDurationMicros: number
    readonly averageDurationMicros: number
    readonly batchAuditHash: string // 64-char hex SHA-256 of key-sorted receipt hashes
}

export interface BatchExecutionResult<T = unknown> {
    readonly batchId: string
    readonly receipts: Readonly<Record<string, SynchronousExecutionReceipt<T>>>
    readonly summary: BatchExecutionSummary
}

export interface HomogeneousRaycastBatch {
    readonly batchId: string
    readonly queries: Readonly<Record<string, ScrubbedRaycastQuery>>
}

/**
 * Pure synchronous spatial batch aggregator.
 * Executes heterogeneous or homogeneous query batches in a single synchronous pass.
 */
export interface SpatialBatchAggregator {
    readonly kernel: PureSpatialKernel

    executeBatch(
        envelope: BatchQueryEnvelope,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult

    executeRaycastBatch(
        batch: HomogeneousRaycastBatch,
        context?: SpatialExecutionContext,
    ): BatchExecutionResult<PerceptCandidate>
}
