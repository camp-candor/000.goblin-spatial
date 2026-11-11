import type {
    BatchQueryEnvelope,
    BatchExecutionResult,
} from './collect.interface.js'
import type { SpatialExecutionContext } from '../../14.port.unit/fce/port.interface.js'

export interface CollectPayload {
    readonly envelope?: BatchQueryEnvelope
    readonly context?: SpatialExecutionContext
    readonly result?: BatchExecutionResult
    readonly error?: string
}

export default interface CollectBit<TDat = CollectPayload> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { cltBit: Partial<CollectBit<TDat>> }) => void
}
