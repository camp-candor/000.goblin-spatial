import type {
    SpatialExecutionContext,
    SynchronousExecutionReceipt,
    ScrubbedSpatialQuery,
} from './port.interface.js'

export interface PortPayload {
    readonly query?: unknown
    readonly scrubbedQuery?: ScrubbedSpatialQuery
    readonly context?: SpatialExecutionContext
    readonly receipt?: SynchronousExecutionReceipt
    readonly envelopeLimit?: number
    readonly kernelVersion?: string
    readonly error?: string
}

export default interface PortBit<TDat = PortPayload> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { prtBit: Partial<PortBit<TDat>> }) => void
}
