import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'

export type BasisPoints = number

export type OpticalCalculationMode =
    'SUBTRACTIVE_LINEAR' | 'MULTIPLICATIVE_BEER_LAMBERT'

export interface OpticalTransmissionQuery {
    origin: AxialCoord
    target: AxialCoord
    traversedCells: AxialCoord[]
    calculationMode?: OpticalCalculationMode
    visibilityThresholdBps?: BasisPoints
}

export interface CellOpacitySample {
    coord: AxialCoord
    packed: PackedAxial
    opacityBps: BasisPoints
    isEndpoint: boolean
}

export interface OpticalTransmissionReceipt {
    originPacked: PackedAxial
    targetPacked: PackedAxial
    pathLength: number
    accumulatedOpacityBps: BasisPoints
    transmissionBps: BasisPoints
    isVisible: boolean
    samples: CellOpacitySample[]
    severedAtCell?: PackedAxial
}
