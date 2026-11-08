import {
    AxialCoord,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import {
    assertAxialInvariant,
    axialDistance,
} from '../../28.axial.unit/buz/axial.buzz.js'
import {
    AXIAL_DIRECTIONS,
    getNeighbor,
} from '../../46.neighbor.unit/buz/neighbor.buzz.js'

export function getRing(
    center: AxialCoord,
    radius: number,
): readonly AxialCoord[] {
    assertAxialInvariant(center)
    if (!Number.isInteger(radius) || radius < 0) {
        throw new RangeError(
            `RING_INVALID_RADIUS: radius must be non-negative integer (${radius})`,
        )
    }
    if (radius === 0) {
        return [center]
    }

    const results: AxialCoord[] = []
    // Start radius steps in direction 4 (West)
    let current = createAxialCoord(
        center.q + AXIAL_DIRECTIONS[4].q * radius,
        center.r + AXIAL_DIRECTIONS[4].r * radius,
    )

    for (let dirIndex = 0; dirIndex < 6; dirIndex++) {
        for (let step = 0; step < radius; step++) {
            results.push(current)
            current = getNeighbor(current, dirIndex)
        }
    }

    return results
}

export function getSpiralDisk(
    center: AxialCoord,
    radius: number,
): readonly AxialCoord[] {
    assertAxialInvariant(center)
    if (!Number.isInteger(radius) || radius < 0) {
        throw new RangeError(
            `DISK_INVALID_RADIUS: radius must be non-negative integer (${radius})`,
        )
    }

    const disk: AxialCoord[] = [center]
    for (let r = 1; r <= radius; r++) {
        const ring = getRing(center, r)
        for (let i = 0; i < ring.length; i++) {
            disk.push(ring[i])
        }
    }

    // Deterministic sort: distance ascending, then q ascending, then r ascending
    return disk.sort((a, b) => {
        const distA = axialDistance(center, a)
        const distB = axialDistance(center, b)
        if (distA !== distB) return distA - distB
        if (a.q !== b.q) return a.q - b.q
        return a.r - b.r
    })
}

export function expectedHexCountForRadius(radius: number): number {
    if (radius < 0) return 0
    return 3 * radius * (radius + 1) + 1
}

import { LatticeModel } from '../lattice.model.js'
import LatticeBit from '../fce/lattice.bit.js'
import State from '../../99.core/state.js'

export const initLattice = (cpy: LatticeModel, bal: LatticeBit, ste: State) => {
    return cpy
}

export const updateLattice = (
    cpy: LatticeModel,
    bal: LatticeBit,
    ste: State,
) => {
    return cpy
}
