import ObserverBit from './observer.bit'
import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export default interface Observer {
    // idx:string;
    // observerBitList: ObserverBit[];
    // observerBits:any;
}

export interface VertexKey {
    readonly vx: bigint
    readonly vy: bigint
}

export interface SharedVertexEvent {
    readonly vertex: VertexKey
    readonly cells: readonly [AxialCoord, AxialCoord, AxialCoord]
    readonly packedCells: readonly [PackedAxial, PackedAxial, PackedAxial]
    readonly opaqueMask: number // 3-bit mask: (U << 2) | (V << 1) | W
    readonly isBlocked: boolean
}

export interface VertexPolicyEvaluation {
    readonly hasClearLineOfSight: boolean
    readonly vertexEvents: readonly SharedVertexEvent[]
    readonly severedAtVertex?: VertexKey
}
