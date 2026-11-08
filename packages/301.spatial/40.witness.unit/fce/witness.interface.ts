import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export type BasisPoints = number & { readonly __brand: unique symbol }

export interface CellOpacitySample {
    readonly coord: AxialCoord
    readonly packed: PackedAxial
    readonly opacityBps: BasisPoints
    readonly isEndpoint: boolean
}

export interface OpticalTransmissionQuery {
    readonly origin: AxialCoord
    readonly target: AxialCoord
    readonly traversedCells: readonly AxialCoord[]
    readonly thresholdBps?: BasisPoints
    readonly calculationMode?:
        'SUBTRACTIVE_LINEAR' | 'MULTIPLICATIVE_BEER_LAMBERT'
}

export interface OpticalTransmissionReceipt {
    readonly originPacked: PackedAxial
    readonly targetPacked: PackedAxial
    readonly pathLength: number
    readonly accumulatedOpacityBps: BasisPoints
    readonly transmissionBps: BasisPoints
    readonly isVisible: boolean
    readonly samples: readonly CellOpacitySample[]
    readonly severedAtCell?: PackedAxial
}
