import { Action } from '../99.core/interface/action.interface'
import TypesBit from './fce/types.bit'

// Types actions

export const INIT_TYPES = '[Types action] Init Types'
export class InitTypes implements Action {
    readonly type = INIT_TYPES
    constructor(public bale: TypesBit) {}
}

export const UPDATE_TYPES = '[Types action] Update Types'
export class UpdateTypes implements Action {
    readonly type = UPDATE_TYPES
    constructor(public bale: TypesBit) {}
}

export type Actions = InitTypes | UpdateTypes
