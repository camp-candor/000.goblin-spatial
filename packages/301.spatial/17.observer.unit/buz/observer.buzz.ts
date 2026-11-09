import { ObserverModel } from '../val/observer.model.js'
import ObserverBit from '../fce/observer.bit.js'
import State from '../../99.core/state.js'

import {
    AxialCoord,
    PackedAxial,
    packAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { axialToDoubled } from '../../28.axial.unit/buz/axial.buzz.js'
import {
    VertexKey,
    SharedVertexEvent,
    VertexPolicyEvaluation,
} from '../fce/observer.interface.js'
import {
    evaluateVertexMajorityMask,
    getThreeHexesAtVertex,
} from '../val/observer.model.js'

export const initObserver = (
    cpy: ObserverModel,
    bal: ObserverBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateObserver = (
    cpy: ObserverModel,
    bal: ObserverBit,
    ste: State,
) => {
    return cpy
}

export function crossProduct2D(
    p1x: bigint,
    p1y: bigint,
    p2x: bigint,
    p2y: bigint,
    px: bigint,
    py: bigint,
): bigint {
    return (p2x - p1x) * (py - p1y) - (p2y - p1y) * (px - p1x)
}

export function isPointOnFiniteSegment(
    p1x: bigint,
    p1y: bigint,
    p2x: bigint,
    p2y: bigint,
    px: bigint,
    py: bigint,
): boolean {
    const minX = p1x < p2x ? p1x : p2x
    const maxX = p1x > p2x ? p1x : p2x
    const minY = p1y < p2y ? p1y : p2y
    const maxY = p1y > p2y ? p1y : p2y

    if (px < minX || px > maxX || py < minY || py > maxY) {
        return false
    }

    return crossProduct2D(p1x, p1y, p2x, p2y, px, py) === 0n
}

/**
 * Evaluates the 3-Hex Majority Rule for all vertices intersected by segment AB.
 * Origin and target endpoints are strictly exempt (treated as transparent).
 */
export function evaluateRayVertexCrossings(
    origin: AxialCoord,
    target: AxialCoord,
    isCellOpaque: (packed: PackedAxial) => boolean,
): VertexPolicyEvaluation {
    const originPacked = packAxial(origin.q, origin.r)
    const targetPacked = packAxial(target.q, target.r)

    if (originPacked === targetPacked) {
        return { hasClearLineOfSight: true, vertexEvents: [] }
    }

    const dA = axialToDoubled(origin)
    const dB = axialToDoubled(target)
    const p1x = BigInt(dA.x)
    const p1y = BigInt(dA.y)
    const p2x = BigInt(dB.x)
    const p2y = BigInt(dB.y)

    const minX = p1x < p2x ? p1x : p2x
    const maxX = p1x > p2x ? p1x : p2x
    const minY = p1y < p2y ? p1y : p2y
    const maxY = p1y > p2y ? p1y : p2y

    const minQ = Math.min(origin.q, target.q) - 1
    const maxQ = Math.max(origin.q, target.q) + 1
    const minR = Math.min(origin.r, target.r) - 1
    const maxR = Math.max(origin.r, target.r) + 1

    const testedVertices = new Map<string, VertexKey>()

    for (let q = minQ; q <= maxQ; q++) {
        for (let r = minR; r <= maxR; r++) {
            const d = axialToDoubled({ q, r, s: -q - r })
            const cx = BigInt(d.x)
            const cy = BigInt(d.y)

            // Fast hex bounding box check against segment bounds
            if (
                cx + 2n < minX ||
                cx - 2n > maxX ||
                cy + 4n < minY ||
                cy - 4n > maxY
            ) {
                continue
            }

            const vertices: readonly VertexKey[] = [
                { vx: cx, vy: cy + 4n },
                { vx: cx + 2n, vy: cy + 2n },
                { vx: cx + 2n, vy: cy - 2n },
                { vx: cx, vy: cy - 4n },
                { vx: cx - 2n, vy: cy - 2n },
                { vx: cx - 2n, vy: cy + 2n },
            ]

            for (const v of vertices) {
                if (v.vx < minX || v.vx > maxX || v.vy < minY || v.vy > maxY) {
                    continue
                }
                const key = `${v.vx},${v.vy}`
                if (!testedVertices.has(key)) {
                    if (crossProduct2D(p1x, p1y, p2x, p2y, v.vx, v.vy) === 0n) {
                        testedVertices.set(key, v)
                    }
                }
            }
        }
    }

    const vertexEvents: SharedVertexEvent[] = []

    for (const v of testedVertices.values()) {
        const hexes = getThreeHexesAtVertex(v.vx, v.vy)
        const packedHexes: [PackedAxial, PackedAxial, PackedAxial] = [
            packAxial(hexes[0].q, hexes[0].r),
            packAxial(hexes[1].q, hexes[1].r),
            packAxial(hexes[2].q, hexes[2].r),
        ]

        // Endpoint Exemption: Origin and target count strictly as transparent (0)
        const uOpaque =
            packedHexes[0] !== originPacked &&
            packedHexes[0] !== targetPacked &&
            isCellOpaque(packedHexes[0])
                ? 1
                : 0
        const vOpaque =
            packedHexes[1] !== originPacked &&
            packedHexes[1] !== targetPacked &&
            isCellOpaque(packedHexes[1])
                ? 1
                : 0
        const wOpaque =
            packedHexes[2] !== originPacked &&
            packedHexes[2] !== targetPacked &&
            isCellOpaque(packedHexes[2])
                ? 1
                : 0

        const mask = (uOpaque << 2) | (vOpaque << 1) | wOpaque
        const isBlocked = evaluateVertexMajorityMask(mask)

        const event: SharedVertexEvent = {
            vertex: v,
            cells: hexes,
            packedCells: packedHexes,
            opaqueMask: mask,
            isBlocked,
        }
        vertexEvents.push(event)

        if (isBlocked) {
            return {
                hasClearLineOfSight: false,
                vertexEvents,
                severedAtVertex: v,
            }
        }
    }

    return {
        hasClearLineOfSight: true,
        vertexEvents,
    }
}
