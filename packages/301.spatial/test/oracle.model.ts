import {
    AxialCoord,
    PackedAxial,
    createAxialCoord,
    packAxial,
} from '../28.axial.unit/val/axial.model.js'
import { axialToDoubled } from '../28.axial.unit/buz/axial.buzz.js'

export interface RationalPoint2D {
    readonly xNum: bigint
    readonly yNum: bigint
    readonly den: bigint
}

/**
 * Point-in-Convex-Hexagon Test in Doubled Coordinate Space:
 * Centroid = (cx, cy) = (4q + 2r, 6r)
 * Vertices = (cx, cy + 4), (cx + 2, cy + 2), (cx + 2, cy - 2),
 *            (cx, cy - 4), (cx - 2, cy - 2), (cx - 2, cy + 2)
 *
 * For rational point P = (xNum / den, yNum / den), tests whether P is inside
 * the closed hexagon using cross-product orientation with the 6 directed edges.
 */
export function isRationalPointInHex(
    p: RationalPoint2D,
    hex: AxialCoord,
): boolean {
    const d = axialToDoubled(hex)
    const cx = BigInt(d.x)
    const cy = BigInt(d.y)

    // Directed edges (V0->V1, V1->V2, ..., V5->V0)
    const vertices: readonly [bigint, bigint][] = [
        [cx, cy + 4n],
        [cx + 2n, cy + 2n],
        [cx + 2n, cy - 2n],
        [cx, cy - 4n],
        [cx - 2n, cy - 2n],
        [cx - 2n, cy + 2n],
    ]

    for (let i = 0; i < 6; i++) {
        const [x1, y1] = vertices[i]
        const [x2, y2] = vertices[(i + 1) % 6]

        // Edge vector E = (x2 - x1, y2 - y1)
        // Point vector relative to V1: P - V1 = (xNum - x1 * den, yNum - y1 * den) / den
        // Cross product: (x2 - x1) * (yNum - y1 * den) - (y2 - y1) * (xNum - x1 * den)
        const cross =
            (x2 - x1) * (p.yNum - y1 * p.den) -
            (y2 - y1) * (p.xNum - x1 * p.den)

        // Negative cross product indicates point is outside this oriented convex edge
        if (cross > 0n) {
            return false
        }
    }

    return true
}

/**
 * Independent Brute-Force Sampling Oracle:
 * Evaluates segment AB by sampling at S fine rational intervals (t = k / S).
 * Classifies cell intersections independently of the production Cyrus-Beck algorithm.
 */
export function evaluateBruteForceOracleLoS(
    origin: AxialCoord,
    target: AxialCoord,
    candidateCells: readonly AxialCoord[],
    isCellOpaque: (packed: PackedAxial) => boolean,
    sampleSteps: number = 256,
): boolean {
    const originPacked = packAxial(origin.q, origin.r)
    const targetPacked = packAxial(target.q, target.r)

    if (originPacked === targetPacked) {
        return true
    }

    const dA = axialToDoubled(origin)
    const dB = axialToDoubled(target)

    const xA = BigInt(dA.x)
    const yA = BigInt(dA.y)
    const xB = BigInt(dB.x)
    const yB = BigInt(dB.y)

    const den = BigInt(sampleSteps)

    // Sample interior of segment strictly: k in [1, sampleSteps - 1]
    // (Origin and Target endpoints are exempt from self-occlusion)
    for (let k = 1; k < sampleSteps; k++) {
        const t = BigInt(k)
        const xNum = xA * (den - t) + xB * t
        const yNum = yA * (den - t) + yB * t

        const samplePoint: RationalPoint2D = { xNum, yNum, den }

        for (let c = 0; c < candidateCells.length; c++) {
            const cell = candidateCells[c]
            const packed = packAxial(cell.q, cell.r)

            // Endpoints exempt
            if (packed === originPacked || packed === targetPacked) {
                continue
            }

            if (
                isCellOpaque(packed) &&
                isRationalPointInHex(samplePoint, cell)
            ) {
                return false
            }
        }
    }

    return true
}
