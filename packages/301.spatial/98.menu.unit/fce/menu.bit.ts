import type { MenuMode } from './menu.interface.js'

export interface MenuPayload {
    readonly mode?: MenuMode
    readonly choice?: string
    readonly message?: string
    readonly error?: string
    readonly opticalProof?: any
    readonly acousticProof?: any
    readonly [key: string]: any
}

export default interface MenuBit<TDat = MenuPayload> {
    idx: string
    src?: string
    lst?: readonly string[]
    val?: number
    dat?: TDat
    slv?: (result: { mnuBit: Partial<MenuBit<TDat>> }) => void
}
