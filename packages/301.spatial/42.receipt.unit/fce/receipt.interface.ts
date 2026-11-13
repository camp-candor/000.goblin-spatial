import type { Model } from '../../99.core/interface/model.interface.js'
import type {
    PackedAxial,
    AxialCoord,
} from '../../38.types.unit/fce/manifest.schema.js'
import type { SpatialAuditQuadruple } from '../../19.ledger.unit/fce/ledger.interface.js'

export type PathFailureClassification =
    'UNREACHABLE' | 'BUDGET_EXCEEDED' | 'IMPASSABLE'
export type DisplacementFailureClassification =
    'CAPACITY_EXHAUSTED' | 'BUDGET_EXCEEDED' | 'UNREACHABLE'
export type SensoryModality = 'OPTICAL' | 'ACOUSTIC'
export type AxialBearing = 0 | 1 | 2 | 3 | 4 | 5 | null

export interface PathReceiptSuccess {
    readonly ok: true
    readonly originPacked: PackedAxial
    readonly destinationPacked: PackedAxial
    readonly path: readonly PackedAxial[]
    readonly totalCostUnits: number
    readonly stepsExpanded: number
    readonly auditQuadruple: SpatialAuditQuadruple
}

export interface PathReceiptFailure {
    readonly ok: false
    readonly originPacked: PackedAxial
    readonly destinationPacked: PackedAxial
    readonly failureCode: PathFailureClassification
    readonly stepsExpanded: number
    readonly auditQuadruple: SpatialAuditQuadruple
}

export type PathReceipt = PathReceiptSuccess | PathReceiptFailure

export interface OpticalPerceptEvidence {
    readonly modality: 'OPTICAL'
    readonly transmissionBps: number
    readonly topologicalDistance: number
    readonly occludingBarrierCoord: AxialCoord | null
}

export interface AcousticPerceptEvidence {
    readonly modality: 'ACOUSTIC'
    readonly intensityCdb: number
    readonly noiseFloorCdb: number
    readonly snrMarginCdb: number
    readonly portalHopCount: number
}

export type PerceptEvidence = OpticalPerceptEvidence | AcousticPerceptEvidence

export interface PerceptCandidate {
    readonly sourceCoord: AxialCoord
    readonly observerCoord: AxialCoord
    readonly qualityScorePerMille: number
    readonly arrivalBearing: AxialBearing
    readonly isOccluded: boolean
    readonly evidence: PerceptEvidence
    readonly auditQuadruple: SpatialAuditQuadruple
}

export interface DisplacementReceiptSuccess {
    readonly ok: true
    readonly targetCellPacked: PackedAxial
    readonly resolvedCellPacked: PackedAxial
    readonly relocationCostUnits: number
    readonly wasEvicted: boolean
    readonly auditQuadruple: SpatialAuditQuadruple
}

export interface DisplacementReceiptFailure {
    readonly ok: false
    readonly targetCellPacked: PackedAxial
    readonly failureCode: DisplacementFailureClassification
    readonly auditQuadruple: SpatialAuditQuadruple
}

export type DisplacementReceipt =
    DisplacementReceiptSuccess | DisplacementReceiptFailure

export default interface Receipt extends Model {
    idx: string
    totalPathReceiptsMinted: number
    totalPerceptReceiptsMinted: number
    totalDisplacementReceiptsMinted: number
    lastMintedTimestamp: number
}
