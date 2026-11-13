import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export default interface Segment {}

export type SegmentContactKind =
    'CELL_INTERIOR' | 'SHARED_EDGE' | 'VERTEX_GRAZE'

export interface BigIntFraction {
    readonly num: bigint
    readonly den: bigint
}

export interface TraversedHexFeature {
    readonly cell: AxialCoord
    readonly packedCell: PackedAxial
    readonly kind: SegmentContactKind
    readonly tEnter: BigIntFraction
    readonly tExit: BigIntFraction
}

export interface SegmentTraceResult {
    readonly origin: AxialCoord
    readonly target: AxialCoord
    readonly steps: number
    readonly features: readonly TraversedHexFeature[]
    readonly traversedCells: readonly PackedAxial[]
}
