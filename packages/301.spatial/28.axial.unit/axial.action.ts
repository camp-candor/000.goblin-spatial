import { Action } from '../99.core/interface/action.interface'
import AxialBit from './fce/axial.bit'

// Axial actions

export const INIT_AXIAL = '[Axial action] Init Axial'
export class InitAxial implements Action {
    readonly type = INIT_AXIAL
    constructor(public bale: AxialBit) {}
}

export const UPDATE_AXIAL = '[Axial action] Update Axial'
export class UpdateAxial implements Action {
    readonly type = UPDATE_AXIAL
    constructor(public bale: AxialBit) {}
}

export type Actions = InitAxial | UpdateAxial
