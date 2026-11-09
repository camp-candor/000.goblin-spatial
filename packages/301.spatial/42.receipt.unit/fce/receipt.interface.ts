import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js'
import { BasisPoints } from '../../40.witness.unit/fce/witness.interface.js'
import { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js'

export default interface Receipt {
    idx?: string
}

export type SensoryModality = 'OPTICAL' | 'ACOUSTIC'

export interface OpticalPerceptEvidence {
    readonly transmissionBps: BasisPoints
    readonly pathLength: number
    readonly severedAtCell?: PackedAxial
}

export interface AcousticPerceptEvidence {
    readonly arrivingIntensityCdb: CentiDecibels
    readonly ambientNoiseFloorCdb: CentiDecibels
    readonly snrMarginCdb: CentiDecibels
    readonly hops: number
}

export interface PerceptCandidate {
    readonly channel: SensoryModality
    readonly sourceCoord: AxialCoord
    readonly sourcePacked: PackedAxial
    readonly observerCoord: AxialCoord
    readonly observerPacked: PackedAxial
    readonly qualityPermille: number // 0..1000
    readonly arrivalBearing: number | null // 0..5 or null if source == observer
    readonly isOccluded: boolean
    readonly opticalEvidence?: OpticalPerceptEvidence
    readonly acousticEvidence?: AcousticPerceptEvidence
    readonly topologyRootHash?: string
    readonly overlayRootHash?: string
}

export interface ReceiptBatchSummary {
    readonly totalCandidates: number
    readonly opticalCandidates: number
    readonly acousticCandidates: number
    readonly occludedCount: number
    readonly averageQualityPermille: number
}
