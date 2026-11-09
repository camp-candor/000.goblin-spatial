import {
    AxialCoord,
    PackedAxial,
    packAxial,
    unpackAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { chordDistanceSquared } from '../../28.axial.unit/buz/axial.buzz.js'
import { AXIAL_DIRECTIONS } from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import { CellCapacityEvaluator } from '../../51.capacity.unit/buz/capacity.buzz.js'
import { CellOccupancyTracker } from '../../44.occupancy.unit/buz/occupancy.buzz.js'

export interface DisplacementQuery {
    readonly congestedCell: AxialCoord
    readonly budgetCostUnits?: number
    readonly blockedCells?: ReadonlySet<PackedAxial>
    readonly workEnvelopeLimit?: number
    readonly seedDigest?: number
}

export type DisplacementResult =
    | {
          readonly ok: true
          readonly targetCell: AxialCoord
          readonly targetPacked: PackedAxial
          readonly traversalPath: readonly AxialCoord[]
          readonly traversalCostUnits: number
          readonly expandedSteps: number
      }
    | {
          readonly ok: false
          readonly reason: 'NO_LEGAL_CELL' | 'BUDGET_EXCEEDED'
          readonly expandedSteps: number
      }

export function resolveDisplacement(
    query: DisplacementQuery,
    capacityEvaluator: CellCapacityEvaluator,
    occupancyTracker: CellOccupancyTracker,
): DisplacementResult {
    const originPacked = packAxial(query.congestedCell.q, query.congestedCell.r)
    const maxBudget = query.budgetCostUnits ?? 1000
    const envelopeLimit = query.workEnvelopeLimit ?? 512
    const blocked = query.blockedCells ?? new Set<PackedAxial>()
    const seed = query.seedDigest ?? 0

    // Origin cell occupancy check excluding the displaced actor (-1)
    const originOccupancy = Math.max(
        0,
        occupancyTracker.getOccupancy(originPacked) - 1,
    )
    if (originOccupancy < capacityEvaluator.getCapacity(originPacked)) {
        // If excluding the evicted actor brings the cell back within legal capacity, no move is needed
        return {
            ok: true,
            targetCell: query.congestedCell,
            targetPacked: originPacked,
            traversalPath: [query.congestedCell],
            traversalCostUnits: 0,
            expandedSteps: 0,
        }
    }

    type DijkstraNode = {
        readonly packed: PackedAxial
        readonly cost: number
        readonly chordSq: bigint
        readonly tieDigest: number
    }

    const gScore = new Map<PackedAxial, number>()
    const parent = new Map<PackedAxial, PackedAxial>()
    const queue: DijkstraNode[] = []

    gScore.set(originPacked, 0)
    queue.push({
        packed: originPacked,
        cost: 0,
        chordSq: 0n,
        tieDigest: seed ^ originPacked,
    })

    let steps = 0

    while (queue.length > 0) {
        steps++
        if (steps > envelopeLimit) {
            return {
                ok: false,
                reason: 'BUDGET_EXCEEDED',
                expandedSteps: steps,
            }
        }

        // 4-Tier Deterministic Tie-Breaking Comparator
        queue.sort((a, b) => {
            if (a.cost !== b.cost) return a.cost - b.cost
            if (a.chordSq !== b.chordSq) return a.chordSq < b.chordSq ? -1 : 1
            if (a.tieDigest !== b.tieDigest) return a.tieDigest - b.tieDigest
            return a.packed - b.packed
        })

        const current = queue.shift()!

        // Check capacity: Destination must NOT be the congested origin and must have remaining space
        if (current.packed !== originPacked) {
            const cellOcc = occupancyTracker.getOccupancy(current.packed)
            const cellCap = capacityEvaluator.getCapacity(current.packed)

            if (cellOcc < cellCap) {
                // Legal capacity cell found: reconstruct path
                const pathPacked: PackedAxial[] = []
                let curr: PackedAxial | undefined = current.packed
                while (curr !== undefined) {
                    pathPacked.unshift(curr)
                    curr = parent.get(curr)
                }

                const traversalPath = pathPacked.map((p) => unpackAxial(p))
                return {
                    ok: true,
                    targetCell: unpackAxial(current.packed),
                    targetPacked: current.packed,
                    traversalPath,
                    traversalCostUnits: current.cost,
                    expandedSteps: steps,
                }
            }
        }

        const currentCoord = unpackAxial(current.packed)

        for (let i = 0; i < 6; i++) {
            const dir = AXIAL_DIRECTIONS[i]
            const neighborQ = currentCoord.q + dir.q
            const neighborR = currentCoord.r + dir.r
            const neighborPacked = packAxial(neighborQ, neighborR)

            if (blocked.has(neighborPacked)) {
                continue
            }

            const stepCost = 100 // Standard integer 100 CostUnits per hex
            const tentativeG = current.cost + stepCost

            if (tentativeG > maxBudget) {
                continue
            }

            const prevG = gScore.get(neighborPacked)
            if (prevG === undefined || tentativeG < prevG) {
                gScore.set(neighborPacked, tentativeG)
                parent.set(neighborPacked, current.packed)

                const neighborCoord = unpackAxial(neighborPacked)
                const chordSq = chordDistanceSquared(
                    neighborCoord,
                    query.congestedCell,
                )

                queue.push({
                    packed: neighborPacked,
                    cost: tentativeG,
                    chordSq,
                    tieDigest: seed ^ neighborPacked,
                })
            }
        }
    }

    return { ok: false, reason: 'NO_LEGAL_CELL', expandedSteps: steps }
}

export const initDisplacement = (
    cpy: DisplacementModel,
    bal: DisplacementBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateDisplacement = (
    cpy: DisplacementModel,
    bal: DisplacementBit,
    ste: State,
) => {
    return cpy
}

import { DisplacementModel } from '../displacement.model'
import DisplacementBit from '../fce/displacement.bit'
import State from '../../99.core/state'
