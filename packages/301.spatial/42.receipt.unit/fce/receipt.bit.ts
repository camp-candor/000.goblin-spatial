import type {
    PathReceipt,
    PerceptCandidate,
    DisplacementReceipt,
} from './receipt.interface.js'

export interface ReceiptPayload {
    readonly pathReceipt?: PathReceipt
    readonly perceptCandidate?: PerceptCandidate
    readonly displacementReceipt?: DisplacementReceipt
    readonly error?: string
}

export default interface ReceiptBit<TDat = ReceiptPayload> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { rcpBit: Partial<ReceiptBit<TDat>> }) => void
}
