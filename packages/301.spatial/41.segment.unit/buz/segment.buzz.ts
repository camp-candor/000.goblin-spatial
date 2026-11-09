import {
    AxialCoord,
    PackedAxial,
    packAxial,
    createAxialCoord,
} from '../../28.axial.unit/val/axial.model.js'
import {
    assertAxialInvariant,
    axialToDoubled,
    axialDistance,
    hexVertices,
} from '../../28.axial.unit/buz/axial.buzz.js'
import {
    BigIntFraction,
    SegmentContactKind,
    TraversedHexFeature,
    SegmentTraceResult,
} from '../fce/segment.interface.js'
import { createFraction, compareFractions } from '../val/segment.model.js'
import { SegmentModel } from '../segment.model.js'
import SegmentBit from '../fce/segment.bit.js'
import State from '../../99.core/state.js'

export const initSegment = (cpy: SegmentModel, bal: SegmentBit, ste: State) => {
    debugger
    return cpy
}

export const updateSegment = (
    cpy: SegmentModel,
    bal: SegmentBit,
    ste: State,
) => {
    return cpy
}

/**
 * 2D Integer Cross Product of vectors (B - A) x (C - A) using BigInt.
 * Returns > 0 if C is left of AB, < 0 if right of AB, == 0 if strictly collinear.
 */
export function crossProductBigInt(
    ax: bigint,
    ay: bigint,
    bx: bigint,
    by: bigint,
    cx: bigint,
    cy: bigint,
): bigint {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
}

interface HexClipInterval {
    readonly intersects: boolean
    readonly tEnter: BigIntFraction
    readonly tExit: BigIntFraction
    readonly kind: SegmentContactKind
}

const ZERO_FRAC = createFraction(0n, 1n)

const HEX_EDGES = [
    { nx: -2n, ny: -2n, ox: 0n, oy: 4n },
    { nx: -4n, ny: 0n, ox: 2n, oy: 2n },
    { nx: -2n, ny: 2n, ox: 2n, oy: -2n },
    { nx: 2n, ny: 2n, ox: 0n, oy: -4n },
    { nx: 4n, ny: 0n, ox: -2n, oy: -2n },
    { nx: 2n, ny: -2n, ox: -2n, oy: 2n },
] as const

/**
 * Clips the finite directed segment pA -> pB against a regular pointy-top hexagon
 * in doubled coordinates using exact integer Cyrus-Beck clipping.
 */
export function clipSegmentAgainstHex(
    pAx: bigint,
    pAy: bigint,
    pBx: bigint,
    pBy: bigint,
    cell: AxialCoord,
): HexClipInterval {
    const d = axialToDoubled(cell)
    const cx = BigInt(d.x)
    const cy = BigInt(d.y)

    const dx = pBx - pAx
    const dy = pBy - pAy

    let tEnterNum = 0n
    let tEnterDen = 1n
    let tExitNum = 1n
    let tExitDen = 1n

    for (let i = 0; i < 6; i++) {
        const e = HEX_EDGES[i]
        const nx = e.nx
        const ny = e.ny
        const v1x = cx + e.ox
        const v1y = cy + e.oy

        const denominator = nx * dx + ny * dy
        const numerator = nx * (v1x - pAx) + ny * (v1y - pAy)

        if (denominator === 0n) {
            // Segment is parallel to edge
            if (numerator > 0n) {
                return {
                    intersects: false,
                    tEnter: ZERO_FRAC,
                    tExit: ZERO_FRAC,
                    kind: 'CELL_INTERIOR',
                }
            }
        } else if (denominator > 0n) {
            // Entering edge
            if (numerator * tEnterDen > tEnterNum * denominator) {
                tEnterNum = numerator
                tEnterDen = denominator
            }
        } else {
            // Exiting edge
            const posNum = -numerator
            const posDen = -denominator
            if (posNum * tExitDen < tExitNum * posDen) {
                tExitNum = posNum
                tExitDen = posDen
            }
        }

        if (tEnterNum * tExitDen > tExitNum * tEnterDen) {
            return {
                intersects: false,
                tEnter: ZERO_FRAC,
                tExit: ZERO_FRAC,
                kind: 'CELL_INTERIOR',
            }
        }
    }

    const cmp = tEnterNum * tExitDen - tExitNum * tEnterDen
    if (cmp > 0n) {
        return {
            intersects: false,
            tEnter: ZERO_FRAC,
            tExit: ZERO_FRAC,
            kind: 'CELL_INTERIOR',
        }
    }

    const kind: SegmentContactKind =
        cmp === 0n ? 'VERTEX_GRAZE' : 'CELL_INTERIOR'

    return {
        intersects: true,
        tEnter: createFraction(tEnterNum, tEnterDen),
        tExit: createFraction(tExitNum, tExitDen),
        kind,
    }
}

/**
 * Traces all cells traversed by the finite directed segment between origin and target.
 * Emits strictly finite-segment features ordered along the ray from t = 0 to t = 1.
 */
export function traceFiniteSupercover(
    origin: AxialCoord,
    target: AxialCoord,
): SegmentTraceResult {
    assertAxialInvariant(origin)
    assertAxialInvariant(target)

    const originPacked = packAxial(origin.q, origin.r)
    const targetPacked = packAxial(target.q, target.r)

    if (originPacked === targetPacked) {
        const zeroFrac = createFraction(0n, 1n)
        const oneFrac = createFraction(1n, 1n)
        return {
            origin,
            target,
            steps: 0,
            features: [
                {
                    cell: origin,
                    packedCell: originPacked,
                    kind: 'CELL_INTERIOR',
                    tEnter: zeroFrac,
                    tExit: oneFrac,
                },
            ],
            traversedCells: [originPacked],
        }
    }

    const pA = axialToDoubled(origin)
    const pB = axialToDoubled(target)

    const pAx = BigInt(pA.x)
    const pAy = BigInt(pA.y)
    const pBx = BigInt(pB.x)
    const pBy = BigInt(pB.y)

    const maxDist = axialDistance(origin, target)

    // Axial bounding parallelogram bounded strictly by the finite segment endpoints
    const minQ = Math.min(origin.q, target.q) - 1
    const maxQ = Math.max(origin.q, target.q) + 1
    const minR = Math.min(origin.r, target.r) - 1
    const maxR = Math.max(origin.r, target.r) + 1

    // Doubled-space segment bounding box as plain numbers (magnitudes stay far
    // below 2^53, so every comparison below is exact). A closed hex can only
    // intersect the segment when bounding boxes overlap; strictly separated
    // cells skip clipping with results identical to the exact Cyrus-Beck clip.
    const segMinX = Number(pAx < pBx ? pAx : pBx)
    const segMaxX = Number(pAx > pBx ? pAx : pBx)
    const segMinY = Number(pAy < pBy ? pAy : pBy)
    const segMaxY = Number(pAy > pBy ? pAy : pBy)

    const candidateFeatures: TraversedHexFeature[] = []

    for (let q = minQ; q <= maxQ; q++) {
        for (let r = minR; r <= maxR; r++) {
            const ccx = 4 * q + 2 * r
            const ccy = 6 * r
            if (
                segMaxX < ccx - 2 ||
                segMinX > ccx + 2 ||
                segMaxY < ccy - 4 ||
                segMinY > ccy + 4
            )
                continue
            const coord = createAxialCoord(q, r)
            if (axialDistance(origin, coord) > maxDist + 1) continue
            if (axialDistance(target, coord) > maxDist + 1) continue

            const clip = clipSegmentAgainstHex(pAx, pAy, pBx, pBy, coord)
            if (clip.intersects) {
                candidateFeatures.push({
                    cell: coord,
                    packedCell: packAxial(coord.q, coord.r),
                    kind: clip.kind,
                    tEnter: clip.tEnter,
                    tExit: clip.tExit,
                })
            }
        }
    }

    // Deterministic sorting strictly along ray parameter tEnter ascending, then tExit ascending, then packedCell
    candidateFeatures.sort((a, b) => {
        const cmpEnter = compareFractions(a.tEnter, b.tEnter)
        if (cmpEnter !== 0) return cmpEnter
        const cmpExit = compareFractions(a.tExit, b.tExit)
        if (cmpExit !== 0) return cmpExit
        return a.packedCell - b.packedCell
    })

    const traversedCells: PackedAxial[] = []
    for (let i = 0; i < candidateFeatures.length; i++) {
        const pk = candidateFeatures[i].packedCell
        if (
            traversedCells.length === 0 ||
            traversedCells[traversedCells.length - 1] !== pk
        ) {
            traversedCells.push(pk)
        }
    }

    return {
        origin,
        target,
        steps: maxDist,
        features: candidateFeatures,
        traversedCells,
    }
}

/**
 * Evaluates whether an unobstructed line of sight exists between origin and target,
 * taking into account endpoint exemptions and dynamic cell occlusions.
 */
export function hasLineOfSightFinite(
    origin: AxialCoord,
    target: AxialCoord,
    isCellOpaque: (packed: PackedAxial) => boolean,
): boolean {
    assertAxialInvariant(origin)
    assertAxialInvariant(target)

    const originPacked = packAxial(origin.q, origin.r)
    const targetPacked = packAxial(target.q, target.r)

    if (originPacked === targetPacked) return true

    const trace = traceFiniteSupercover(origin, target)

    for (let i = 0; i < trace.features.length; i++) {
        const feat = trace.features[i]
        // Endpoint Exemption: origin and target are transparent to their own ray
        if (
            feat.packedCell === originPacked ||
            feat.packedCell === targetPacked
        ) {
            continue
        }

        if (isCellOpaque(feat.packedCell)) {
            return false
        }
    }

    return true
}
