import { Action } from '../99.core/interface/action.interface'
import LawsBit from './fce/laws.bit'

// Laws actions

export const INIT_LAWS = '[Laws action] Init Laws'
export class InitLaws implements Action {
    readonly type = INIT_LAWS
    constructor(public bale: LawsBit) {}
}

export const UPDATE_LAWS = '[Laws action] Update Laws'
export class UpdateLaws implements Action {
    readonly type = UPDATE_LAWS
    constructor(public bale: LawsBit) {}
}

export type Actions = InitLaws | UpdateLaws
