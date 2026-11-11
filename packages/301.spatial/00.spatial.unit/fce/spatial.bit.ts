import type {
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
} from '../../14.port.unit/fce/port.interface.js'

export interface SpatialPayload {
    readonly rawQuery?: unknown
    readonly context?: SpatialExecutionContext
    readonly receipt?: SynchronousExecutionReceipt
    readonly error?: string
}

export default interface SpatialBit<TDat = SpatialPayload> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { sptBit: Partial<SpatialBit<TDat>> }) => void
}
