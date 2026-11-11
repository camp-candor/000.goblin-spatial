import { SpatialModel } from '../spatial.model.js'
import type SpatialBit from '../fce/spatial.bit.js'
import type State from '../../99.core/state.js'
import type {
    PureSpatialKernel,
    KernelRaycastResult,
    KernelPathResult,
    KernelDisplacementResult,
} from '../fce/spatial.interface.js'
import type {
    ScrubbedRaycastQuery,
    ScrubbedRoutingQuery,
    ScrubbedReachabilityQuery,
    ScrubbedDisplacementQuery,
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
    SpatialPort,
} from '../../14.port.unit/fce/port.interface.js'
import type { MergedTopologySnapshot } from '../../38.types.unit/fce/overlay.schema.js'
import { packAxialCell } from '../../38.types.unit/fce/manifest.schema.js'

import { createInProcessSpatialPort } from './adapter.buzz.js'
export { createInProcessSpatialPort }
export type { PureSpatialKernel, SpatialPort }

/**
 * Pure stateless in-memory spatial kernel invoker.
 * Evaluates discrete integer geometry without allocating promises or async operations.
 */
export class SpatialKernelInvoker implements PureSpatialKernel {
    readonly kernelVersion = 'v1.0.0-spatial-oracle'

    executeRaycast(
        query: ScrubbedRaycastQuery,
        _topology?: MergedTopologySnapshot,
    ): KernelRaycastResult {
        const dq = Math.abs(query.target.q - query.origin.q)
        const dr = Math.abs(query.target.r - query.origin.r)
        const topologicalDistance = Math.max(
            dq,
            dr,
            Math.abs(query.target.s - query.origin.s),
        )

        // Linear integer attenuation: 10,000 bps minus 500 bps per hex distance
        const rawTransmission = 10000 - topologicalDistance * 500
        const transmissionBps = Math.max(0, Math.min(10000, rawTransmission))
        const isOccluded = transmissionBps < 5000

        return Object.freeze({
            ok: true,
            transmissionBps,
            topologicalDistance,
            isOccluded,
            occludingCoord: isOccluded ? query.target : null,
        })
    }

    executeBoundedPath(
        query: ScrubbedRoutingQuery,
        _topology?: MergedTopologySnapshot,
    ): KernelPathResult {
        const dq = Math.abs(query.destination.q - query.origin.q)
        const dr = Math.abs(query.destination.r - query.origin.r)
        const ds = Math.abs(query.destination.s - query.origin.s)
        const hexDist = Math.max(dq, dr, ds)

        const cellsExpanded = hexDist * 16
        const limit = query.workEnvelopeLimit ?? 512
        if (cellsExpanded >= limit) {
            return Object.freeze({
                ok: false,
                path: Object.freeze([]),
                totalCostUnits: 0,
                cellsExpanded,
                failureCode: 'BUDGET_EXCEEDED',
            })
        }

        const startPacked = packAxialCell(query.origin.q, query.origin.r)
        const destPacked = packAxialCell(
            query.destination.q,
            query.destination.r,
        )
        const totalCostUnits = hexDist * 50

        if (totalCostUnits > query.maxBudgetCostUnits) {
            return Object.freeze({
                ok: false,
                path: Object.freeze([]),
                totalCostUnits,
                cellsExpanded,
                failureCode: 'UNREACHABLE',
            })
        }

        return Object.freeze({
            ok: true,
            path: Object.freeze([startPacked, destPacked]),
            totalCostUnits,
            cellsExpanded,
        })
    }

    executeReachability(
        query: ScrubbedReachabilityQuery,
        _topology?: MergedTopologySnapshot,
    ): readonly number[] {
        const originPacked = packAxialCell(query.origin.q, query.origin.r)
        return Object.freeze([originPacked])
    }

    executeDisplacement(
        query: ScrubbedDisplacementQuery,
        _topology?: MergedTopologySnapshot,
    ): KernelDisplacementResult {
        const targetCoord = query.targetCell ??
            query.congestedCell ?? { q: 0, r: 0, s: 0 }
        const targetPacked = packAxialCell(targetCoord.q, targetCoord.r)
        // Relocate to adjacent discrete cell (q + 1, r - 1)
        const resolvedPacked = packAxialCell(
            targetCoord.q + 1,
            targetCoord.r - 1,
        )

        return Object.freeze({
            ok: true,
            targetCellPacked: targetPacked,
            resolvedCellPacked: resolvedPacked,
            relocationCostUnits: 50,
            wasEvicted: true,
        })
    }

    executeSynchronousQuery(
        rawQuery: unknown,
        context?: SpatialExecutionContext,
    ): SynchronousExecutionReceipt {
        const port = createInProcessSpatialPort(this)
        return port.invokeSynchronous(rawQuery, context)
    }
}

export function createSpatialKernel(): PureSpatialKernel {
    return new SpatialKernelInvoker()
}

export const initSpatial = (
    cpy: SpatialModel,
    bal?: SpatialBit,
    _ste?: State,
): SpatialModel => {
    cpy.totalSynchronousInvocations = 0
    cpy.totalBudgetsTripped = 0
    cpy.lastExecutionMicros = 0

    if (bal?.slv) {
        bal.slv({
            sptBit: {
                idx: 'init-spatial-success',
                val: 1,
                src: cpy.kernelVersion,
            },
        })
    }
    return cpy
}
