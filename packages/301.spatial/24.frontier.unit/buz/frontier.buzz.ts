import {
    AxialCoord,
    PackedAxial,
    packAxial,
    unpackAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { AXIAL_DIRECTIONS } from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import { DynamicOverlay } from '../../38.types.unit/fce/manifest.schema.js'

export interface ReachableCellsQuery {
    readonly origin: AxialCoord
    readonly budgetCostUnits: number
    readonly overlay?: DynamicOverlay
    readonly blockedCells?: ReadonlySet<PackedAxial>
    readonly workEnvelopeLimit?: number
}

export interface ReachableCellsResult {
    readonly reachable: ReadonlyMap<PackedAxial, number> // packed -> costUnits
    readonly expandedSteps: number
    readonly breachedEnvelope: boolean
}

export function computeReachableCells(
    query: ReachableCellsQuery,
): ReachableCellsResult {
    const envelopeLimit = query.workEnvelopeLimit ?? 512
    const originPacked = packAxial(query.origin.q, query.origin.r)
    const blocked = query.blockedCells ?? new Set<PackedAxial>()

    const costs = new Map<PackedAxial, number>()
    costs.set(originPacked, 0)

    const queue: { packed: PackedAxial; cost: number }[] = [
        { packed: originPacked, cost: 0 },
    ]

    let steps = 0
    let breached = false

    while (queue.length > 0) {
        steps++
        if (steps > envelopeLimit) {
            breached = true
            break
        }

        queue.sort((a, b) => a.cost - b.cost || a.packed - b.packed)
        const curr = queue.shift()!

        const coord = unpackAxial(curr.packed)

        for (let i = 0; i < 6; i++) {
            const dir = AXIAL_DIRECTIONS[i]
            const neighborQ = coord.q + dir.q
            const neighborR = coord.r + dir.r
            const neighborPacked = packAxial(neighborQ, neighborR)

            if (blocked.has(neighborPacked)) {
                continue
            }

            const stepCost = 100 // 100 CostUnits standard step
            const totalCost = curr.cost + stepCost

            if (totalCost > query.budgetCostUnits) {
                continue
            }

            const prevCost = costs.get(neighborPacked)
            if (prevCost === undefined || totalCost < prevCost) {
                costs.set(neighborPacked, totalCost)
                queue.push({ packed: neighborPacked, cost: totalCost })
            }
        }
    }

    return {
        reachable: costs,
        expandedSteps: steps,
        breachedEnvelope: breached,
    }
}

export const initFrontier = (
    cpy: FrontierModel,
    bal: FrontierBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateFrontier = (
    cpy: FrontierModel,
    bal: FrontierBit,
    ste: State,
) => {
    return cpy
}

import { FrontierModel } from '../frontier.model'
import FrontierBit from '../fce/frontier.bit'
import State from '../../99.core/state'
