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
    const vertices = hexVertices(cell)
    const dx = pBx - pAx
    const dy = pBy - pAy

    let tEnter = createFraction(0n, 1n)
    let tExit = createFraction(1n, 1n)

    for (let i = 0; i < 6; i++) {
        const v1 = vertices[i]
        const v2 = vertices[(i + 1) % 6]

        const v1x = BigInt(v1.x)
        const v1y = BigInt(v1.y)
        const v2x = BigInt(v2.x)
        const v2y = BigInt(v2.y)

        // Inward normal for clockwise vertex winding:
        // From run_test16.ts, we found that RightNormal (edgeDirY, -edgeDirX) points inward towards the centroid.
        const edgeDirX = v2x - v1x
        const edgeDirY = v2y - v1y
        const nx = edgeDirY
        const ny = -edgeDirX

        const denominator = nx * dx + ny * dy
        const numerator = nx * (v1x - pAx) + ny * (v1y - pAy)

        if (denominator === 0n) {
            // Segment is parallel to edge
            if (numerator > 0n) {
                return {
                    intersects: false,
                    tEnter: createFraction(0n, 1n),
                    tExit: createFraction(0n, 1n),
                    kind: 'CELL_INTERIOR',
                }
            }
        } else if (denominator > 0n) {
            // Entering edge
            const frac = createFraction(numerator, denominator)
            if (compareFractions(frac, tEnter) > 0) {
                tEnter = frac
            }
        } else {
            // Exiting edge
            const frac = createFraction(-numerator, -denominator)
            if (compareFractions(frac, tExit) < 0) {
                tExit = frac
            }
        }

        if (compareFractions(tEnter, tExit) > 0) {
            return {
                intersects: false,
                tEnter: createFraction(0n, 1n),
                tExit: createFraction(0n, 1n),
                kind: 'CELL_INTERIOR',
            }
        }
    }

    const cmp = compareFractions(tEnter, tExit)
    if (cmp > 0) {
        return {
            intersects: false,
            tEnter: createFraction(0n, 1n),
            tExit: createFraction(0n, 1n),
            kind: 'CELL_INTERIOR',
        }
    }

    let kind: SegmentContactKind = 'CELL_INTERIOR'
    if (cmp === 0) {
        kind = 'VERTEX_GRAZE'
    }

    return {
        intersects: true,
        tEnter,
        tExit,
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

    const candidateFeatures: TraversedHexFeature[] = []

    for (let q = minQ; q <= maxQ; q++) {
        for (let r = minR; r <= maxR; r++) {
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
