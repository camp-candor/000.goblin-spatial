import { Action } from '../99.core/interface/action.interface'
import VerbsBit from './fce/verbs.bit'

// Verbs actions

export const INIT_VERBS = '[Verbs action] Init Verbs'
export class InitVerbs implements Action {
    readonly type = INIT_VERBS
    constructor(public bale: VerbsBit) {}
}

export const UPDATE_VERBS = '[Verbs action] Update Verbs'
export class UpdateVerbs implements Action {
    readonly type = UPDATE_VERBS
    constructor(public bale: VerbsBit) {}
}

export type Actions = InitVerbs | UpdateVerbs
