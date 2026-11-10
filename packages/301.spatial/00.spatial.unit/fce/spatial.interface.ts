import {
    ScrubbedAcousticQuery,
    ScrubbedDisplacementQuery,
    ScrubbedRaycastQuery,
    ScrubbedReachabilityQuery,
    ScrubbedRoutingQuery,
    ScrubbedSpatialQuery,
    SpatialQueryType,
} from '../../14.port.unit/fce/port.interface.js'
import { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js'
import { AcousticWavefrontResult } from '../../13.sound.unit/fce/sound.interface.js'
import { PathQueryResult } from '../../43.path.unit/buz/path.buzz.js'
import { ReachableCellsResult } from '../../24.frontier.unit/buz/frontier.buzz.js'
import { DisplacementResult } from '../../50.displacement.unit/buz/displacement.buzz.js'
import {
    SpatialAuditQuadruple,
    SpatialLedgerEntry,
} from '../../19.ledger.unit/fce/ledger.interface.js'
import { DynamicOverlay } from '../../38.types.unit/fce/manifest.schema.js'
import SpatialBit from './spatial.bit.js'

export default interface Spatial {
    // idx: string;
    // spatialBitList: SpatialBit[];
    // spatialBits: any;
}
export type { SpatialBit }

export interface SpatialExecutionContext {
    readonly topologyHash?: string
    readonly overlayHash?: string
    readonly overlay?: DynamicOverlay
    readonly currentTick?: number
    readonly streamId?: string
    readonly recordLedger?: boolean
}

export interface SynchronousExecutionReceipt<T = unknown> {
    readonly ok: boolean
    readonly queryType: SpatialQueryType
    readonly result: T
    readonly durationMicros: number
    readonly auditQuadruple: SpatialAuditQuadruple
    readonly ledgerEntry?: SpatialLedgerEntry
    readonly error?: string
}

/**
 * Pure synchronous spatial calculation kernel running inside the host V8 isolate.
 * No Promises, no async/await, no IPC serialization.
 */
export interface PureSpatialKernel {
    readonly kernelVersion: string

    executeRaycast(
        query: ScrubbedRaycastQuery,
        context?: SpatialExecutionContext,
    ): PerceptCandidate

    executeAcousticWavefront(
        query: ScrubbedAcousticQuery,
        context?: SpatialExecutionContext,
    ): AcousticWavefrontResult

    executeBoundedPath(
        query: ScrubbedRoutingQuery,
        context?: SpatialExecutionContext,
    ): PathQueryResult

    executeReachability(
        query: ScrubbedReachabilityQuery,
        context?: SpatialExecutionContext,
    ): ReachableCellsResult

    executeDisplacement(
        query: ScrubbedDisplacementQuery,
        context?: SpatialExecutionContext,
    ): DisplacementResult

    executeSynchronousQuery(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt
}

/**
 * Public SpatialPort adapter contract consumed directly by worker-sower-engine.
 */
export interface SpatialPort {
    readonly kernelVersion: string

    invokeSynchronous<T = unknown>(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt<T>
}
