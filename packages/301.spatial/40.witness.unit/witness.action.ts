import { Action } from '../99.core/interface/action.interface'
import WitnessBit from './fce/witness.bit'

// Witness actions

export const INIT_WITNESS = '[Witness action] Init Witness'
export class InitWitness implements Action {
    readonly type = INIT_WITNESS
    constructor(public bale: WitnessBit) {}
}

export const UPDATE_WITNESS = '[Witness action] Update Witness'
export class UpdateWitness implements Action {
    readonly type = UPDATE_WITNESS
    constructor(public bale: WitnessBit) {}
}

export type Actions = InitWitness | UpdateWitness
