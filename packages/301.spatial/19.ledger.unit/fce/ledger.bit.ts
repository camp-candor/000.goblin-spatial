import type {
    SpatialAuditQuadruple,
    SpatialLedgerEntry,
    LineageVerificationResult,
} from './ledger.interface.js'
import type { SpatialQueryType } from '../../14.port.unit/fce/port.interface.js'

export interface LedgerPayload {
    readonly queryType?: SpatialQueryType
    readonly tickNumber?: number
    readonly streamId?: string
    readonly auditQuadruple?: SpatialAuditQuadruple
    readonly entry?: SpatialLedgerEntry
    readonly verificationResult?: LineageVerificationResult
    readonly error?: string
}

export default interface LedgerBit<TDat = LedgerPayload> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { ldgBit: Partial<LedgerBit<TDat>> }) => void
}
