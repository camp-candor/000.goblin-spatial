import { Action } from '../99.core/interface/action.interface'
import OriginBit from './fce/origin.bit'

// Origin actions

export const INIT_ORIGIN = '[Origin action] Init Origin'
export class InitOrigin implements Action {
    readonly type = INIT_ORIGIN
    constructor(public bale: OriginBit) {}
}

export const UPDATE_ORIGIN = '[Origin action] Update Origin'
export class UpdateOrigin implements Action {
    readonly type = UPDATE_ORIGIN
    constructor(public bale: OriginBit) {}
}

export type Actions = InitOrigin | UpdateOrigin
