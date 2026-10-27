import { Action } from '../99.core/interface/action.interface'
import LogisticBit from './fce/logistic.bit'

// Logistic actions

export const INIT_LOGISTIC = '[Logistic action] Init Logistic'
export class InitLogistic implements Action {
    readonly type = INIT_LOGISTIC
    constructor(public bale: LogisticBit) {}
}

export const UPDATE_LOGISTIC = '[Logistic action] Update Logistic'
export class UpdateLogistic implements Action {
    readonly type = UPDATE_LOGISTIC
    constructor(public bale: LogisticBit) {}
}

export type Actions = InitLogistic | UpdateLogistic
