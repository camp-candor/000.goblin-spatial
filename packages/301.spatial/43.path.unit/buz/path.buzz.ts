import {
    AxialCoord,
    PackedAxial,
    packAxial,
    unpackAxial,
    COORD_OFFSET,
} from '../../28.axial.unit/val/axial.model.js'
import {
    axialDistance,
    axialToDoubled,
} from '../../28.axial.unit/buz/axial.buzz.js'
import { AXIAL_DIRECTIONS } from '../../46.neighbor.unit/buz/neighbor.buzz.js'
import { DynamicOverlay } from '../../38.types.unit/fce/overlay.schema.js'
import {
    compareTieBreakNodes,
    TieBreakNode,
} from '../../25.distance.unit/buz/distance.buzz.js'

class MinHeap<T> {
    private heap: T[] = []
    constructor(private compare: (a: T, b: T) => number) {}

    get size(): number {
        return this.heap.length
    }

    push(item: T): void {
        this.heap.push(item)
        this.bubbleUp(this.heap.length - 1)
    }

    pop(): T | undefined {
        if (this.heap.length === 0) return undefined
        const top = this.heap[0]
        const bottom = this.heap.pop()!
        if (this.heap.length > 0) {
            this.heap[0] = bottom
            this.sinkDown(0)
        }
        return top
    }

    private bubbleUp(idx: number): void {
        const item = this.heap[idx]
        while (idx > 0) {
            const parentIdx = (idx - 1) >> 1
            const parent = this.heap[parentIdx]
            if (this.compare(item, parent) < 0) {
                this.heap[idx] = parent
                idx = parentIdx
            } else {
                break
            }
        }
        this.heap[idx] = item
    }

    private sinkDown(idx: number): void {
        const length = this.heap.length
        const item = this.heap[idx]
        while (true) {
            const leftIdx = (idx << 1) + 1
            const rightIdx = leftIdx + 1
            let swapIdx = -1

            if (leftIdx < length) {
                if (this.compare(this.heap[leftIdx], item) < 0) {
                    swapIdx = leftIdx
                }
            }

            if (rightIdx < length) {
                if (
                    this.compare(
                        this.heap[rightIdx],
                        swapIdx === -1 ? item : this.heap[leftIdx],
                    ) < 0
                ) {
                    swapIdx = rightIdx
                }
            }

            if (swapIdx === -1) break
            this.heap[idx] = this.heap[swapIdx]
            idx = swapIdx
        }
        this.heap[idx] = item
    }
}

export interface PathQueryOptions {
    readonly origin: AxialCoord
    readonly destination: AxialCoord
    readonly maxBudgetCostUnits: number
    readonly overlay?: DynamicOverlay
    readonly blockedCells?: ReadonlySet<PackedAxial>
    readonly workEnvelopeLimit?: number
    readonly episodeSeed?: number
}

export type PathQueryResult =
    | {
          readonly ok: true
          readonly originPacked: PackedAxial
          readonly destinationPacked: PackedAxial
          readonly path: readonly AxialCoord[]
          readonly pathPacked: readonly PackedAxial[]
          readonly totalCostUnits: number
          readonly expandedSteps: number
      }
    | {
          readonly ok: false
          readonly reason: 'UNREACHABLE' | 'BUDGET_EXCEEDED' | 'IMPASSABLE'
          readonly expandedSteps: number
      }

export function findShortestBoundedPath(
    query: PathQueryOptions,
): PathQueryResult {
    const envelopeLimit = query.workEnvelopeLimit ?? 512
    const originPacked = packAxial(query.origin.q, query.origin.r)
    const destPacked = packAxial(query.destination.q, query.destination.r)
    const blocked = query.blockedCells ?? new Set<PackedAxial>()

    if (blocked.has(originPacked) || blocked.has(destPacked)) {
        return { ok: false, reason: 'IMPASSABLE', expandedSteps: 0 }
    }

    if (originPacked === destPacked) {
        return {
            ok: true,
            originPacked,
            destinationPacked: destPacked,
            path: [query.origin],
            pathPacked: [originPacked],
            totalCostUnits: 0,
            expandedSteps: 0,
        }
    }

    const destQ = query.destination.q
    const destR = query.destination.r
    const destS = query.destination.s
    const destDoubled = axialToDoubled(query.destination)

    const gScore = new Map<PackedAxial, number>()
    const parent = new Map<PackedAxial, PackedAxial>()
    const queue = new MinHeap<TieBreakNode>((a, b) =>
        compareTieBreakNodes(a, b, query.destination),
    )

    gScore.set(originPacked, 0)
    const dq0 = Math.abs(query.origin.q - destQ)
    const dr0 = Math.abs(query.origin.r - destR)
    const ds0 = Math.abs(query.origin.s - destS)
    const initialH = Math.max(dq0, dr0, ds0) * 100

    const origDoubled = axialToDoubled(query.origin)
    const dx0 = origDoubled.x - destDoubled.x
    const dy0 = origDoubled.y - destDoubled.y
    const chordSq0 = dx0 * dx0 + dy0 * dy0

    queue.push({
        cell: originPacked,
        fScore: initialH,
        gScore: 0,
        hScore: initialH,
        seedDigest: (query.episodeSeed ?? 0) ^ originPacked,
        chordSq: chordSq0,
    })

    let steps = 0

    while (queue.size > 0) {
        steps++
        if (steps > envelopeLimit) {
            return {
                ok: false,
                reason: 'BUDGET_EXCEEDED',
                expandedSteps: steps,
            }
        }

        const current = queue.pop()!

        if (current.cell === destPacked) {
            const pathPacked: PackedAxial[] = []
            let curr: PackedAxial | undefined = destPacked
            while (curr !== undefined) {
                pathPacked.unshift(curr)
                curr = parent.get(curr)
            }

            const pathCoords = pathPacked.map((p) => unpackAxial(p))
            return {
                ok: true,
                originPacked,
                destinationPacked: destPacked,
                path: pathCoords,
                pathPacked,
                totalCostUnits: current.gScore,
                expandedSteps: steps,
            }
        }

        const u32 = current.cell >>> 0
        const currentQ = ((u32 >>> 16) & 0xffff) - COORD_OFFSET
        const currentR = (u32 & 0xffff) - COORD_OFFSET

        for (let i = 0; i < 6; i++) {
            const dir = AXIAL_DIRECTIONS[i]
            const neighborQ = currentQ + dir.q
            const neighborR = currentR + dir.r
            const qOffset = (neighborQ + COORD_OFFSET) & 0xffff
            const rOffset = (neighborR + COORD_OFFSET) & 0xffff
            const neighborPacked = (((qOffset << 16) | rOffset) >>>
                0) as PackedAxial

            if (blocked.has(neighborPacked)) {
                continue
            }

            const stepCost = 100
            const tentativeG = current.gScore + stepCost

            if (tentativeG > query.maxBudgetCostUnits) {
                continue
            }

            const prevG = gScore.get(neighborPacked)
            if (prevG === undefined || tentativeG < prevG) {
                gScore.set(neighborPacked, tentativeG)
                parent.set(neighborPacked, current.cell)

                const dq = Math.abs(neighborQ - destQ)
                const dr = Math.abs(neighborR - destR)
                const ds = Math.abs(-neighborQ - neighborR - destS)
                const h = Math.max(dq, dr, ds) * 100

                const nx = 4 * neighborQ + 2 * neighborR
                const ny = 6 * neighborR
                const dx = nx - destDoubled.x
                const dy = ny - destDoubled.y
                const chordSq = dx * dx + dy * dy

                queue.push({
                    cell: neighborPacked,
                    fScore: tentativeG + h,
                    gScore: tentativeG,
                    hScore: h,
                    seedDigest: (query.episodeSeed ?? 0) ^ neighborPacked,
                    chordSq,
                })
            }
        }
    }

    return { ok: false, reason: 'UNREACHABLE', expandedSteps: steps }
}

export const initPath = (cpy: PathModel, bal: PathBit, ste: State) => {
    debugger
    return cpy
}

export const updatePath = (cpy: PathModel, bal: PathBit, ste: State) => {
    return cpy
}

import { PathModel } from '../path.model'
import PathBit from '../fce/path.bit'
import State from '../../99.core/state'
