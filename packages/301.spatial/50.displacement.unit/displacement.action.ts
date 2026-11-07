import { Action } from '../99.core/interface/action.interface'
import DisplacementBit from './fce/displacement.bit'

// Displacement actions

export const INIT_DISPLACEMENT = '[Displacement action] Init Displacement'
export class InitDisplacement implements Action {
    readonly type = INIT_DISPLACEMENT
    constructor(public bale: DisplacementBit) {}
}

export const UPDATE_DISPLACEMENT = '[Displacement action] Update Displacement'
export class UpdateDisplacement implements Action {
    readonly type = UPDATE_DISPLACEMENT
    constructor(public bale: DisplacementBit) {}
}

export type Actions = InitDisplacement | UpdateDisplacement
