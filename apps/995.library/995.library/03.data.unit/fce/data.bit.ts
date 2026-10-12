export default interface DataBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: (result: { datBit: Partial<DataBit> }) => void
}
