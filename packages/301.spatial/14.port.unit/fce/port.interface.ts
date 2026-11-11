import type { Model } from '../../99.core/interface/model.interface.js'
import type {
    AxialCoord,
    PackedAxial,
} from '../../38.types.unit/fce/manifest.schema.js'
import type { BasisPoints } from '../../40.witness.unit/fce/witness.interface.js'
import type { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js'

export type SpatialQueryType =
    | 'RAYCAST'
    | 'BOUNDED_PATH'
    | 'REACHABILITY'
    | 'DISPLACEMENT'
    | 'ACOUSTIC_WAVEFRONT'
    | 'DISPLACEMENT_EVICTION'

export type RaycastMode = 'SUBTRACTIVE_LINEAR' | 'MULTIPLICATIVE_BEER_LAMBERT'

export interface ScrubbedRaycastQuery {
    readonly queryType: 'RAYCAST'
    readonly origin: AxialCoord
    readonly target: AxialCoord
    readonly mode?: RaycastMode
    readonly calculationMode?: RaycastMode
    readonly thresholdBps?: BasisPoints
}

export interface ScrubbedRoutingQuery {
    readonly queryType: 'BOUNDED_PATH'
    readonly origin: AxialCoord
    readonly destination: AxialCoord
    readonly maxBudgetCostUnits: number
    readonly workEnvelopeLimit?: number
    readonly blockedCells?: readonly PackedAxial[]
    readonly episodeSeed?: number
}

export interface ScrubbedReachabilityQuery {
    readonly queryType: 'REACHABILITY'
    readonly origin: AxialCoord
    readonly maxStepRadius?: number
    readonly budgetCostUnits?: number
    readonly blockedCells?: readonly PackedAxial[]
    readonly workEnvelopeLimit?: number
}

export interface ScrubbedDisplacementQuery {
    readonly queryType: 'DISPLACEMENT' | 'DISPLACEMENT_EVICTION'
    readonly targetCell?: AxialCoord
    readonly congestedCell?: AxialCoord
    readonly maxCellCapacity?: number
    readonly maxBudgetCostUnits?: number
    readonly budgetCostUnits?: number
    readonly blockedCells?: readonly PackedAxial[]
    readonly workEnvelopeLimit?: number
    readonly seedDigest?: number
}

export interface ScrubbedAcousticQuery {
    readonly queryType: 'ACOUSTIC_WAVEFRONT'
    readonly sourceCoord: AxialCoord
    readonly sourceIntensityCdb: CentiDecibels
    readonly ambientNoiseFloorCdb: CentiDecibels
    readonly hearingThresholdCdb?: CentiDecibels
    readonly snrMinCdb?: CentiDecibels
    readonly workEnvelopeLimit?: number
}

export type ScrubbedSpatialQuery =
    | ScrubbedRaycastQuery
    | ScrubbedRoutingQuery
    | ScrubbedReachabilityQuery
    | ScrubbedDisplacementQuery
    | ScrubbedAcousticQuery

export interface SpatialExecutionContext {
    readonly executionId: string
    readonly sequenceNumber: number
    readonly tickNumber: number
    readonly topologyHash: string
    readonly overlayHash: string
}

export interface SynchronousExecutionReceipt<T = unknown> {
    readonly ok: boolean
    readonly queryType: SpatialQueryType
    readonly kernelVersion: string
    readonly payload: T
    readonly cellsExpanded: number
    readonly failureCode?:
        'BUDGET_EXCEEDED' | 'UNREACHABLE' | 'OCCLUDED' | 'SCHEMA_BREACH'
    readonly executionMicros: number
}

export interface SpatialPort {
    readonly kernelVersion: string
    invokeSynchronous<T = unknown>(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt<T>
}

export interface QueryStripValidationResult<
    T extends ScrubbedSpatialQuery = ScrubbedSpatialQuery,
> {
    readonly valid: boolean
    readonly scrubbedQuery?: ScrubbedSpatialQuery
    readonly query?: T
    readonly strippedKeys: readonly string[]
    readonly breachReason?: string
    readonly errors?: readonly string[]
    readonly strippedKeyCount?: number
}

export default interface Port extends Model {
    idx: string
    kernelVersion: string
    totalQueriesProcessed: number
    totalBudgetsTripped: number
    lastExecutionMicros: number
}
