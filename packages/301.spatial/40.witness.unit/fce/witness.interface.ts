import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'
import WitnessBit from './witness.bit.js'
import type {
    SpatialIncidentReport,
    SpatialEventStageBrief,
} from '../../23.incident.unit/fce/incident.interface.js'
import type { DiurnalDaypart } from '../../05.clock.unit/fce/clock.interface.js'

export default interface Witness {
    //witnessBitList: WitnessBit[] = [];
}

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

export interface ScheduledAppointmentSpatialProof {
    readonly beatId: string
    readonly title: string
    readonly isoDate: string
    readonly startTimeHm: string
    readonly daypart: DiurnalDaypart
    readonly locationId: string
    readonly witnessReport: SpatialIncidentReport
    readonly stageBrief: SpatialEventStageBrief
}
