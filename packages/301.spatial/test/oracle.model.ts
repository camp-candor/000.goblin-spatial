import {
    AxialCoord,
    PackedAxial,
    createAxialCoord,
    packAxial,
} from '../28.axial.unit/val/axial.model.js'
import { axialToDoubled, hexVertices } from '../28.axial.unit/buz/axial.buzz.js'

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

        // Vertices wind clockwise, so interior points yield cross <= 0 on every
        // directed edge; a positive cross product indicates the exterior side.
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

    // Exact degeneracy handling: rational sampling cannot resolve a segment that
    // touches a hex at exactly one vertex (measure zero), while the closed-interval
    // production supercover includes boundary contact. Detect exact vertex
    // incidence with integer arithmetic so grazes agree with the supercover.
    for (let c = 0; c < candidateCells.length; c++) {
        const cell = candidateCells[c]
        const packed = packAxial(cell.q, cell.r)

        // Endpoints exempt
        if (packed === originPacked || packed === targetPacked) {
            continue
        }
        if (!isCellOpaque(packed)) {
            continue
        }

        for (const v of hexVertices(cell)) {
            const cross = (xB - xA) * (v.y - yA) - (yB - yA) * (v.x - xA)
            if (cross !== 0n) {
                continue
            }
            const minX = xA < xB ? xA : xB
            const maxX = xA > xB ? xA : xB
            const minY = yA < yB ? yA : yB
            const maxY = yA > yB ? yA : yB
            if (v.x >= minX && v.x <= maxX && v.y >= minY && v.y <= maxY) {
                return false
            }
        }
    }

    return true
}
