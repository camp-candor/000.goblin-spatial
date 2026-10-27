import { Action } from '../99.core/interface/action.interface'
import IntentBit from './fce/intent.bit'

// Intent actions

export const INIT_INTENT = '[Intent action] Init Intent'
export class InitIntent implements Action {
    readonly type = INIT_INTENT
    constructor(public bale: IntentBit) {}
}

export const UPDATE_INTENT = '[Intent action] Update Intent'
export class UpdateIntent implements Action {
    readonly type = UPDATE_INTENT
    constructor(public bale: IntentBit) {}
}

export type Actions = InitIntent | UpdateIntent
