import type { Model } from '../../99.core/interface/model.interface.js'
import type {
    SpatialPort,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
    ScrubbedRaycastQuery,
    ScrubbedRoutingQuery,
    ScrubbedReachabilityQuery,
    ScrubbedDisplacementQuery,
    ScrubbedSpatialQuery,
} from '../../14.port.unit/fce/port.interface.js'
import type { MergedTopologySnapshot } from '../../38.types.unit/fce/overlay.schema.js'
import type {
    PathReceipt,
    PerceptCandidate,
    DisplacementReceipt,
} from '../../42.receipt.unit/fce/receipt.interface.js'

export type {
    SpatialPort,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
}

export interface KernelPathResult {
    readonly ok: boolean
    readonly path: readonly number[]
    readonly totalCostUnits: number
    readonly cellsExpanded: number
    readonly failureCode?: 'UNREACHABLE' | 'BUDGET_EXCEEDED' | 'IMPASSABLE'
}

export interface KernelRaycastResult {
    readonly ok: boolean
    readonly transmissionBps: number
    readonly topologicalDistance: number
    readonly isOccluded: boolean
    readonly occludingCoord: {
        readonly q: number
        readonly r: number
        readonly s: number
    } | null
}

export interface KernelDisplacementResult {
    readonly ok: boolean
    readonly targetCellPacked: number
    readonly resolvedCellPacked: number
    readonly relocationCostUnits: number
    readonly wasEvicted: boolean
    readonly failureCode?:
        'CAPACITY_EXHAUSTED' | 'BUDGET_EXCEEDED' | 'UNREACHABLE'
}

export interface PureSpatialKernel {
    readonly kernelVersion: string
    executeRaycast(
        query: ScrubbedRaycastQuery,
        topology?: MergedTopologySnapshot,
    ): KernelRaycastResult
    executeBoundedPath(
        query: ScrubbedRoutingQuery,
        topology?: MergedTopologySnapshot,
    ): KernelPathResult
    executeReachability(
        query: ScrubbedReachabilityQuery,
        topology?: MergedTopologySnapshot,
    ): readonly number[]
    executeDisplacement(
        query: ScrubbedDisplacementQuery,
        topology?: MergedTopologySnapshot,
    ): KernelDisplacementResult
    executeSynchronousQuery?(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt
}

export default interface Spatial extends Model {
    idx: string
    kernelVersion: string
    totalSynchronousInvocations: number
    totalBudgetsTripped: number
    lastExecutionMicros: number
}
