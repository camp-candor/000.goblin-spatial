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

export type SpatialDaypart = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT'

export interface SpatialChronologyStamp {
    readonly start_date: string
    readonly start_time_hm: string
    readonly daypart: SpatialDaypart
    readonly ambient_luminance_bps: number
    readonly optical_range_scale_bps: number
    readonly diurnal_noise_delta_cdb: number
    readonly timezone_label: string
}

export interface PathReceiptSuccess {
    readonly ok: true
    readonly originPacked: PackedAxial
    readonly destinationPacked: PackedAxial
    readonly path: readonly PackedAxial[]
    readonly totalCostUnits: number
    readonly stepsExpanded: number
    readonly auditQuadruple: SpatialAuditQuadruple
    readonly chronology?: SpatialChronologyStamp
}

export interface PathReceiptFailure {
    readonly ok: false
    readonly originPacked: PackedAxial
    readonly destinationPacked: PackedAxial
    readonly failureCode: PathFailureClassification
    readonly stepsExpanded: number
    readonly auditQuadruple: SpatialAuditQuadruple
    readonly chronology?: SpatialChronologyStamp
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
    readonly chronology?: SpatialChronologyStamp
}

export interface DisplacementReceiptSuccess {
    readonly ok: true
    readonly targetCellPacked: PackedAxial
    readonly resolvedCellPacked: PackedAxial
    readonly relocationCostUnits: number
    readonly wasEvicted: boolean
    readonly auditQuadruple: SpatialAuditQuadruple
    readonly chronology?: SpatialChronologyStamp
}

export interface DisplacementReceiptFailure {
    readonly ok: false
    readonly targetCellPacked: PackedAxial
    readonly failureCode: DisplacementFailureClassification
    readonly auditQuadruple: SpatialAuditQuadruple
    readonly chronology?: SpatialChronologyStamp
}

export type DisplacementReceipt =
    DisplacementReceiptSuccess | DisplacementReceiptFailure

export interface SignedSpatialReceipt {
    readonly seriesSlug: string
    readonly receiptHash: string
    readonly kernelVersion: string
    readonly metrics: Record<string, unknown>
    readonly chronology?: SpatialChronologyStamp
}

export interface SpatialDispatchPacket {
    readonly seriesSlug: string
    readonly receiptData: {
        readonly topology_hash: string
        readonly overlay_hash: string
        readonly query_hash: string
        readonly receipt_hash: string
        readonly kernel_version: string
        readonly metrics: Record<string, any>
    }
    readonly targetEngineRoot?: string
    readonly chronology?: SpatialChronologyStamp
}

export interface SpatialBatchEventInput {
    readonly eventSequence: number
    readonly tick: number
    readonly startDate?: string
    readonly startTime?: string
    readonly timezoneLabel?: string
    readonly originCoord: {
        readonly q: number
        readonly r: number
        readonly s: number
    }
    readonly actors: ReadonlyArray<{
        readonly actorId: string
        readonly coord: {
            readonly q: number
            readonly r: number
            readonly s: number
        }
    }>
    readonly locationId?: string
    readonly locationName?: string
    readonly isExterior?: boolean
    readonly acousticFloorCdb?: number
    readonly opaqueCells?: ReadonlyArray<{
        readonly q: number
        readonly r: number
        readonly s: number
    }>
    readonly acousticSourceCdb?: number
    readonly ambientNoiseFloorCdb?: number
}

export interface SpatialEventProofPacket {
    readonly eventSequence: number
    readonly tick: number
    readonly chronology: SpatialChronologyStamp
    readonly incidentReport: unknown
    readonly stageBrief: unknown
    readonly packetSha256: string
}

export default interface Receipt extends Model {
    idx: string
    totalPathReceiptsMinted: number
    totalPerceptReceiptsMinted: number
    totalDisplacementReceiptsMinted: number
    lastMintedTimestamp: number
}
