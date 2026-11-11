import type { MenuMode } from './menu.interface.js'

export interface MenuPayload {
    readonly mode?: MenuMode
    readonly choice?: string
    readonly message?: string
    readonly error?: string
}

export default interface MenuBit<TDat = MenuPayload> {
    idx: string
    src?: string
    lst?: readonly string[]
    val?: number
    dat?: TDat
    slv?: (result: { mnuBit: Partial<MenuBit<TDat>> }) => void
}
