import {
    AxialCoord,
    PackedAxial,
    unpackAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { chordDistanceSquared } from '../../28.axial.unit/buz/axial.buzz.js'

export interface TieBreakNode {
    readonly cell: PackedAxial
    readonly fScore: number
    readonly gScore: number
    readonly hScore: number
    readonly seedDigest: number
    readonly chordSq?: bigint | number
}

/**
 * 4-Tier Deterministic Pathfinding Comparator:
 * 1. Total estimated cost (fScore ascending)
 * 2. Exact integer chord distance squared in doubled coordinates (hScore ascending)
 * 3. Seed digest integer tie-breaker
 * 4. Packed Cell ID (numeric ascending)
 */
export function compareTieBreakNodes(
    a: TieBreakNode,
    b: TieBreakNode,
    targetCoord?: AxialCoord,
): number {
    if (a.fScore !== b.fScore) {
        return a.fScore - b.fScore
    }

    if (a.chordSq !== undefined && b.chordSq !== undefined) {
        if (a.chordSq !== b.chordSq) {
            return a.chordSq < b.chordSq ? -1 : 1
        }
    } else if (targetCoord !== undefined) {
        const coordA = unpackAxial(a.cell)
        const coordB = unpackAxial(b.cell)
        const chordSqA = chordDistanceSquared(coordA, targetCoord)
        const chordSqB = chordDistanceSquared(coordB, targetCoord)
        if (chordSqA !== chordSqB) {
            return chordSqA < chordSqB ? -1 : 1
        }
    } else if (a.hScore !== b.hScore) {
        return a.hScore - b.hScore
    }

    if (a.seedDigest !== b.seedDigest) {
        return a.seedDigest - b.seedDigest
    }

    return a.cell - b.cell
}

export const initDistance = (
    cpy: DistanceModel,
    bal: DistanceBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateDistance = (
    cpy: DistanceModel,
    bal: DistanceBit,
    ste: State,
) => {
    return cpy
}

import { DistanceModel } from '../distance.model'
import DistanceBit from '../fce/distance.bit'
import State from '../../99.core/state'
