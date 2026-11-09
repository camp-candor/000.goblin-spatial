import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'
import { DynamicOverlay } from '../../38.types.unit/fce/manifest.schema.js'
import {
    findShortestBoundedPath,
    PathQueryOptions,
    PathQueryResult,
} from '../../43.path.unit/buz/path.buzz.js'
import {
    computeReachableCells,
    ReachableCellsQuery,
    ReachableCellsResult,
} from '../../24.frontier.unit/buz/frontier.buzz.js'

export class BoundedRoutingKernel {
    public findPath(
        origin: AxialCoord,
        destination: AxialCoord,
        maxBudgetCostUnits: number,
        options?: {
            overlay?: DynamicOverlay
            blockedCells?: ReadonlySet<PackedAxial>
            workEnvelopeLimit?: number
            episodeSeed?: number
        },
    ): PathQueryResult {
        const query: PathQueryOptions = {
            origin,
            destination,
            maxBudgetCostUnits,
            overlay: options?.overlay,
            blockedCells: options?.blockedCells,
            workEnvelopeLimit: options?.workEnvelopeLimit ?? 512,
            episodeSeed: options?.episodeSeed ?? 0,
        }
        return findShortestBoundedPath(query)
    }

    public getReachability(
        origin: AxialCoord,
        budgetCostUnits: number,
        options?: {
            overlay?: DynamicOverlay
            blockedCells?: ReadonlySet<PackedAxial>
            workEnvelopeLimit?: number
        },
    ): ReachableCellsResult {
        const query: ReachableCellsQuery = {
            origin,
            budgetCostUnits,
            overlay: options?.overlay,
            blockedCells: options?.blockedCells,
            workEnvelopeLimit: options?.workEnvelopeLimit ?? 512,
        }
        return computeReachableCells(query)
    }
}

export const createRoutingKernel = (): BoundedRoutingKernel =>
    new BoundedRoutingKernel()

export const initKernel = (cpy: KernelModel, bal: KernelBit, ste: State) => {
    debugger
    return cpy
}

export const updateKernel = (cpy: KernelModel, bal: KernelBit, ste: State) => {
    return cpy
}

import { KernelModel } from '../kernel.model'
import KernelBit from '../fce/kernel.bit'
import State from '../../99.core/state'
