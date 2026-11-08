import {
    AxialCoord,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import { assertAxialInvariant } from '../../28.axial.unit/buz/axial.buzz.js'

/**
 * Six Axial Directions ordered clockwise starting East (0 to 5):
 * 0: North-East (q: 0, r: -1)
 * 1: East       (q: 1, r: -1)
 * 2: South-East (q: 1, r: 0)
 * 3: South-West (q: 0, r: 1)
 * 4: West       (q: -1, r: 1)
 * 5: North-West (q: -1, r: 0)
 */
export const AXIAL_DIRECTIONS: readonly {
    readonly q: number
    readonly r: number
}[] = [
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
] as const

export function getNeighbor(
    coord: AxialCoord,
    directionIndex: number,
): AxialCoord {
    assertAxialInvariant(coord)
    const idx = ((directionIndex % 6) + 6) % 6
    const dir = AXIAL_DIRECTIONS[idx]
    return createAxialCoord(coord.q + dir.q, coord.r + dir.r)
}

export function getAllNeighbors(coord: AxialCoord): readonly AxialCoord[] {
    assertAxialInvariant(coord)
    const out: AxialCoord[] = []
    for (let i = 0; i < 6; i++) {
        const dir = AXIAL_DIRECTIONS[i]
        out.push(createAxialCoord(coord.q + dir.q, coord.r + dir.r))
    }
    return out
}

export function fillNeighborsBuffer(
    coord: AxialCoord,
    outQ: Int32Array,
    outR: Int32Array,
    offset: number = 0,
): void {
    assertAxialInvariant(coord)
    for (let i = 0; i < 6; i++) {
        const dir = AXIAL_DIRECTIONS[i]
        outQ[offset + i] = coord.q + dir.q
        outR[offset + i] = coord.r + dir.r
    }
}

import { NeighborModel } from '../neighbor.model.js'
import NeighborBit from '../fce/neighbor.bit.js'
import State from '../../99.core/state.js'

export const initNeighbor = (
    cpy: NeighborModel,
    bal: NeighborBit,
    ste: State,
) => {
    return cpy
}

export const updateNeighbor = (
    cpy: NeighborModel,
    bal: NeighborBit,
    ste: State,
) => {
    return cpy
}
