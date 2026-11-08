import {
    AxialCoord,
    createAxialCoord,
    PackedAxial,
    packAxial,
} from '../../28.axial.unit/val/axial.model.js'
import { axialToDoubled } from '../../28.axial.unit/buz/axial.buzz.js'
import { VertexKey } from '../fce/observer.interface.js'
import Observer from '../fce/observer.interface.js'
import ObserverBit from '../fce/observer.interface.js'

export class ObserverModel implements Observer {
    //idx:string;
    //observerBitList: ObserverBit[] = [];
    //observerBits: any = {};
}

/**
 * 3-Hex Vertex Majority Truth Table:
 * Evaluates whether a ray grazing a shared vertex between Hexes (U, V, W) is severed.
 * Index = (U_opaque << 2) | (V_opaque << 1) | W_opaque
 * Blocked iff sum(U, V, W) >= 2 (Majority Rule).
 */
export const VERTEX_MAJORITY_TABLE: readonly boolean[] = [
    false, // 000: 0 opaque -> Clear
    false, // 001: 1 opaque -> Clear (grazes corner of 1 wall)
    false, // 010: 1 opaque -> Clear
    true, // 011: 2 opaque -> Blocked (pinched between 2 walls)
    false, // 100: 1 opaque -> Clear
    true, // 101: 2 opaque -> Blocked
    true, // 110: 2 opaque -> Blocked
    true, // 111: 3 opaque -> Blocked (completely embedded)
] as const

export function evaluateVertexMajorityMask(mask: number): boolean {
    if (mask < 0 || mask > 7) {
        throw new RangeError(`VERTEX_MASK_OUT_OF_BOUNDS: ${mask}`)
    }
    return VERTEX_MAJORITY_TABLE[mask]
}

/**
 * In doubled coordinate space (cx = 4q + 2r, cy = 6r):
 * Vertices are located at (cx, cy +/- 4) and (cx +/- 2, cy +/- 2).
 * Every shared vertex meets exactly three adjacent hexagons.
 */
export function getThreeHexesAtVertex(
    vx: bigint,
    vy: bigint,
): readonly [AxialCoord, AxialCoord, AxialCoord] {
    // Case A: Vertex with cy = 6r + 4 or 6r - 2
    // We identify the three surrounding axial coordinate cells deterministically
    const xNum = Number(vx)
    const yNum = Number(vy)

    // A vertex (vx, vy) in doubled pointy-top hex tiling belongs to:
    // Hex 1: closest cell with y mod 6 === 0
    const candidateOffsets: readonly {
        readonly dq: number
        readonly dr: number
    }[] = [
        { dq: 0, dr: 0 },
        { dq: 0, dr: 1 },
        { dq: -1, dr: 1 },
        { dq: 1, dr: 0 },
        { dq: 0, dr: -1 },
        { dq: 1, dr: -1 },
        { dq: -1, dr: 0 },
    ]

    const matchedCells: AxialCoord[] = []
    const baseR = Math.floor(yNum / 6)
    const baseQ = Math.floor((xNum - 2 * baseR) / 4)

    for (let dq = -2; dq <= 2; dq++) {
        for (let dr = -2; dr <= 2; dr++) {
            const q = baseQ + dq
            const r = baseR + dr
            const d = axialToDoubled(createAxialCoord(q, r))
            const cx = BigInt(d.x)
            const cy = BigInt(d.y)

            // Check if (vx, vy) is one of the 6 vertices of this cell
            const isVertex =
                (vx === cx && (vy === cy + 4n || vy === cy - 4n)) ||
                ((vx === cx + 2n || vx === cx - 2n) &&
                    (vy === cy + 2n || vy === cy - 2n))

            if (isVertex) {
                matchedCells.push(createAxialCoord(q, r))
            }
        }
    }

    // Deterministically sort by packed cell ID ascending
    matchedCells.sort((a, b) => packAxial(a.q, a.r) - packAxial(b.q, b.r))

    if (matchedCells.length !== 3) {
        throw new Error(
            `VERTEX_TOPOLOGY_DEFECT: Expected exactly 3 hexes at vertex (${vx}, ${vy}), found ${matchedCells.length}`,
        )
    }

    return [matchedCells[0], matchedCells[1], matchedCells[2]]
}
